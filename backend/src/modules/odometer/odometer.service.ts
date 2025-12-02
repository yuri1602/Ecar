import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdometerReading } from './entities/odometer-reading.entity';
import { ChargeSession, SessionStatus } from '../charge-sessions/entities/charge-session.entity';
import { CreateOdometerDto } from './dto/create-odometer.dto';

@Injectable()
export class OdometerService {
  constructor(
    @InjectRepository(OdometerReading)
    private odometerRepository: Repository<OdometerReading>,
    @InjectRepository(ChargeSession)
    private chargeSessionRepository: Repository<ChargeSession>,
  ) {}

  async findAll(): Promise<OdometerReading[]> {
    return this.odometerRepository.find({
      order: { readingAt: 'DESC' },
      relations: ['vehicle', 'session'],
    });
  }

  async findByVehicleId(vehicleId: string): Promise<OdometerReading[]> {
    return this.odometerRepository.find({
      where: { vehicleId },
      order: { readingAt: 'DESC' },
      relations: ['vehicle', 'session'],
    });
  }

  async findLatestByVehicleId(vehicleId: string): Promise<OdometerReading | null> {
    return this.odometerRepository.findOne({
      where: { vehicleId },
      order: { readingAt: 'DESC' },
    });
  }

  async create(createOdometerDto: CreateOdometerDto): Promise<OdometerReading> {
    const { vehicleId, sessionId, readingKm, readingAt, enteredBy, notes } = createOdometerDto;

    // Verify charge session exists and is pending if sessionId is provided
    if (sessionId) {
      const session = await this.chargeSessionRepository.findOne({
        where: { id: sessionId },
        relations: ['vehicle'],
      });

      if (!session) {
        throw new NotFoundException(`Charge session with ID ${sessionId} not found`);
      }

      if (session.status !== SessionStatus.PENDING_ODOMETER) {
        throw new BadRequestException(
          `Charge session ${sessionId} is not pending odometer entry (status: ${session.status})`,
        );
      }

      if (session.vehicleId !== vehicleId) {
        throw new BadRequestException('Session vehicle ID does not match provided vehicle ID');
      }
    }

    // Get the latest odometer reading for this vehicle
    const latestReading = await this.findLatestByVehicleId(vehicleId);

    // Validate that new reading is greater than previous
    // Only enforce strict validation for session-based readings (automated/driver flow)
    // Manual entries (no sessionId) are treated as corrections/admin overrides
    if (sessionId && latestReading && readingKm <= latestReading.readingKm) {
      throw new BadRequestException(
        `New odometer reading (${readingKm} km) must be greater than previous reading (${latestReading.readingKm} km)`,
      );
    }

    // Validate that distance is reasonable (max 2000km by default)
    const maxDistance = parseInt(process.env.MAX_ODOMETER_DISTANCE_KM || '2000', 10);
    if (sessionId && latestReading) {
      const distance = readingKm - latestReading.readingKm;
      if (distance > maxDistance) {
        throw new BadRequestException(
          `Distance between readings (${distance} km) exceeds maximum allowed (${maxDistance} km). Please verify the reading.`,
        );
      }
    }

    // Create odometer reading (triggers will calculate consumption metrics)
    const odometer = this.odometerRepository.create({
      vehicleId,
      sessionId,
      readingKm,
      readingAt: new Date(readingAt),
      enteredBy,
      notes,
    });
    const savedOdometer = await this.odometerRepository.save(odometer);

    // The database trigger will automatically update the session status to 'completed'
    // But we'll do it explicitly here for clarity
    if (sessionId) {
      await this.chargeSessionRepository.update(sessionId, {
        status: SessionStatus.COMPLETED,
      });
    }

    // Return the odometer reading with calculated fields
    const result = await this.odometerRepository.findOne({
      where: { id: savedOdometer.id },
      relations: ['vehicle', 'session', 'session.station'],
    });
    if (!result) {
      throw new NotFoundException('Failed to retrieve created odometer reading');
    }
    return result;
  }
}
