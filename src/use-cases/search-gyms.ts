import { Gym } from '@prisma/client'

import { GymsRepository } from '@/repositories/gyms-repository'

interface SerchGymsUseCaseRequest {
  query: string
  page: number
}

interface SerchGymsUseCaseResponse {
  gyms: Gym[]
}

export class SearchGymsUseCase {
  constructor(private gymsRepository: GymsRepository) {}

  async execute({
    query,
    page,
  }: SerchGymsUseCaseRequest): Promise<SerchGymsUseCaseResponse> {
    const gyms = await this.gymsRepository.searchMany(query, page)

    return {
      gyms,
    }
  }
}
