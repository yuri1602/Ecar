import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargeSession, SessionStatus } from './entities/charge-session.entity';

@Injectable()
export class ChargeSessionsService {
  constructor(
    @InjectRepository(ChargeSession)
    private chargeSessionsRepository: Repository<ChargeSession>,
  ) {}

  async findAll(): Promise<ChargeSession[]> {
    return this.chargeSessionsRepository.find({
      relations: ['vehicle', 'station', 'tariff'],
    });
  }

  async findOne(id: string): Promise<ChargeSession | null> {
    return this.chargeSessionsRepository.findOne({
      where: { id },
      relations: ['vehicle', 'station', 'tariff'],
    });
  }

  async findPendingByVehicleId(vehicleId: string): Promise<ChargeSession[]> {
    return this.chargeSessionsRepository.find({
      where: {
        vehicleId,
        status: SessionStatus.PENDING_ODOMETER,
      },
      relations: ['vehicle', 'station'],
    });
  }

  async create(sessionData: Partial<ChargeSession>): Promise<ChargeSession> {
    const session = this.chargeSessionsRepository.create(sessionData);
    return this.chargeSessionsRepository.save(session);
  }

  async update(id: string, sessionData: Partial<ChargeSession>): Promise<ChargeSession | null> {
    await this.chargeSessionsRepository.update(id, sessionData);
    return this.findOne(id);
  }
}
