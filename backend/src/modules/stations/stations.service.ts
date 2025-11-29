import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from './entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationsRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Station | null> {
    return this.stationsRepository.findOne({ where: { id } });
  }

  async create(stationData: Partial<Station>): Promise<Station> {
    const station = this.stationsRepository.create(stationData);
    return this.stationsRepository.save(station);
  }
}
