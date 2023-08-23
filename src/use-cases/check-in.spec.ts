import { describe, afterEach, beforeEach, expect, it, vi } from 'vitest'

import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { CheckInUseCase } from './check-in'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { Decimal } from '@prisma/client/runtime/library'

let checkInsRepository: InMemoryCheckInsRepository
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('CheckIn Use Case', () => {
  beforeEach(() => {
    checkInsRepository = new InMemoryCheckInsRepository()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    gymsRepository.gyms.push({
      id: 'gym-01',
      title: 'Javascript Gym',
      description: '',
      phone: '',
      latitude: new Decimal(-22.911192),
      longitude: new Decimal(-43.6868376),
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
    ).rejects.toBeInstanceOf(Error)
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
    gymsRepository.gyms.push({
      id: 'gym-02',
      title: 'Javascript Gym 2',
      description: '',
      phone: '',
      latitude: new Decimal(-22.8824611),
      longitude: new Decimal(-43.6514674),
    })

    await expect(() =>
      sut.execute({
        gymId: 'gym-02',
        userId: 'user-01',
        userLatitude: -22.911192,
        userLongitude: -43.6868376,
      }),
    ).rejects.toBeInstanceOf(Error)
  })
})
