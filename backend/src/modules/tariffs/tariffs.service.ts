import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tariff } from './entities/tariff.entity';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';

@Injectable()
export class TariffsService {
  constructor(
    @InjectRepository(Tariff)
    private tariffsRepository: Repository<Tariff>,
  ) {}

  async findAll(): Promise<Tariff[]> {
    return this.tariffsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Tariff> {
    const tariff = await this.tariffsRepository.findOne({ where: { id } });
    if (!tariff) {
      throw new NotFoundException(`Tariff with ID ${id} not found`);
    }
    return tariff;
  }

  async create(createTariffDto: CreateTariffDto): Promise<Tariff> {
    const tariff = this.tariffsRepository.create(createTariffDto);
    return this.tariffsRepository.save(tariff);
  }

  async update(id: string, updateTariffDto: UpdateTariffDto): Promise<Tariff> {
    const tariff = await this.findOne(id);
    Object.assign(tariff, updateTariffDto);
    return this.tariffsRepository.save(tariff);
  }

  async remove(id: string): Promise<void> {
    const tariff = await this.findOne(id);
    await this.tariffsRepository.remove(tariff);
  }
}
