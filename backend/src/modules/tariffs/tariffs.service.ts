import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './entities/tariff.entity';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffsRepository: Repository<Tariff>,
  ) {}

  async findAll(): Promise<Tariff[]> {
    return this.tariffsRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Tariff | null> {
    return this.tariffsRepository.findOne({ where: { id } });
  }

  async create(tariffData: Partial<Tariff>): Promise<Tariff> {
    const tariff = this.tariffsRepository.create(tariffData);
    return this.tariffsRepository.save(tariff);
  }
}
