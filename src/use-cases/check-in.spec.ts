import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'

import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'

import { CheckInUseCase } from './check-in'
import { MaxNumberOfCheckinsError } from './errors/max-number-of-check-ins-error'
import { MaxDistanceError } from './errors/max-distance-error'

let checkInsRepository: InMemoryCheckInsRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('CheckIn Use Case', () => {
  beforeEach(async () => {
    checkInsRepository = new InMemoryCheckInsRepository()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    await gymsRepository.create({
      id: 'gym-01',
      title: 'Javascript Gym',
      description: '',
      phone: '',
      latitude: -22.911192,
      longitude: -43.6868376,
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to check in', async () => {
    const { checkIn } = await sut.execute({
      gymId: 'gym-01',
      userId: 'user-01',
      userLatitude: -22.911192,
      userLongitude: -43.6868376,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in twice on the same day', async () => {
    vi.setSystemTime(new Date(2023, 1, 20, 8, 0, 0)) // 2023/20/01 11AM

    await sut.execute({
      gymId: 'gym-01',
      userId: 'user-01',
      userLatitude: -22.911192,
      userLongitude: -43.6868376,
    })

    vi.setSystemTime(new Date(2023, 1, 20, 10, 0, 0)) // 2023/20/01 1PM

    await expect(() =>
      sut.execute({
        gymId: 'gym-01',
        userId: 'user-01',
        userLatitude: -22.911192,
        userLongitude: -43.6868376,
      }),
    ).rejects.toBeInstanceOf(MaxNumberOfCheckinsError)
  })

  it('should be able to check in different days', async () => {
    vi.setSystemTime(new Date(2023, 1, 20, 8, 0, 0)) // 2023/20/01 11AM

    await sut.execute({
      gymId: 'gym-01',
      userId: 'user-01',
      userLatitude: -22.911192,
      userLongitude: -43.6868376,
    })

    vi.setSystemTime(new Date(2023, 1, 21, 8, 0, 0)) // 2023/21/01 11AM

    const { checkIn } = await sut.execute({
      gymId: 'gym-01',
      userId: 'user-01',
      userLatitude: -22.911192,
      userLongitude: -43.6868376,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in on distant gym', async () => {
    await gymsRepository.create({
      id: 'gym-02',
      title: 'Javascript Gym 2',
      description: '',
      phone: '',
      latitude: -22.8824611,
      longitude: -43.6514674,
    })

    await expect(() =>
      sut.execute({
        gymId: 'gym-02',
        userId: 'user-01',
        userLatitude: -22.911192,
        userLongitude: -43.6868376,
      }),
    ).rejects.toBeInstanceOf(MaxDistanceError)
  })
})
