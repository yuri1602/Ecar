import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdometerReading } from './entities/odometer-reading.entity';

@Injectable()
export class OdometerService {
  constructor(
    @InjectRepository(OdometerReading)
    private odometerRepository: Repository<OdometerReading>,
  ) {}

  async findByVehicleId(vehicleId: string): Promise<OdometerReading[]> {
    return this.odometerRepository.find({
      where: { vehicleId },
      order: { readingAt: 'DESC' },
    });
  }

  async findLatestByVehicleId(vehicleId: string): Promise<OdometerReading | null> {
    return this.odometerRepository.findOne({
      where: { vehicleId },
      order: { readingAt: 'DESC' },
    });
  }

  async create(odometerData: Partial<OdometerReading>): Promise<OdometerReading> {
    const odometer = this.odometerRepository.create(odometerData);
    return this.odometerRepository.save(odometer);
  }
}
