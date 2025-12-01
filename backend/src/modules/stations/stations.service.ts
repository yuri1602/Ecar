import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Station } from './entities/station.entity';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
  ) {}

  async findAll(): Promise<Station[]> {
    return this.stationsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Station> {
    const station = await this.stationsRepository.findOne({ where: { id } });
    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return station;
  }

  async create(createStationDto: CreateStationDto): Promise<Station> {
    const station = this.stationsRepository.create(createStationDto);
    return this.stationsRepository.save(station);
  }

  async update(id: string, updateStationDto: UpdateStationDto): Promise<Station> {
    const station = await this.findOne(id);
    Object.assign(station, updateStationDto);
    return this.stationsRepository.save(station);
  }

  async remove(id: string): Promise<void> {
    const station = await this.findOne(id);
    await this.stationsRepository.remove(station);
  }
}
