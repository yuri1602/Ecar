import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ChargeSession, SessionStatus } from './entities/charge-session.entity';
import { CreateChargeSessionDto } from './dto/create-charge-session.dto';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class ChargeSessionsService {
  constructor(
    @InjectRepository(ChargeSession)
    private chargeSessionsRepository: Repository<ChargeSession>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  async findAll(): Promise<ChargeSession[]> {
    return this.chargeSessionsRepository.find({
      relations: ['vehicle', 'station', 'tariff'],
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ChargeSession> {
    const session = await this.chargeSessionsRepository.findOne({
      where: { id },
      relations: ['vehicle', 'station', 'tariff', 'vehicle.userVehicles', 'vehicle.userVehicles.user'],
    });
    if (!session) {
      throw new NotFoundException(`Charge session with ID ${id} not found`);
    }
    return session;
  }

  async findPendingByVehicleId(vehicleId: string): Promise<ChargeSession[]> {
    return this.chargeSessionsRepository.find({
      where: {
        vehicleId,
        status: SessionStatus.PENDING_ODOMETER,
      },
      relations: ['vehicle', 'station'],
      order: { startedAt: 'DESC' },
    });
  }

  async create(createChargeSessionDto: CreateChargeSessionDto, createdById: string): Promise<ChargeSession> {
    // Validate that endedAt is after startedAt
    const startedAt = new Date(createChargeSessionDto.startedAt);
    const endedAt = new Date(createChargeSessionDto.endedAt);
    if (endedAt <= startedAt) {
      throw new BadRequestException('End time must be after start time');
    }

    // Create the charge session
    const session = this.chargeSessionsRepository.create({
      ...createChargeSessionDto,
      status: SessionStatus.PENDING_ODOMETER,
      createdBy: createdById,
    });
    const savedSession = await this.chargeSessionsRepository.save(session);

    // Load full session with relations
    const fullSession = await this.findOne(savedSession.id);

    // Create notification for assigned drivers
    await this.createOdometerNotifications(fullSession);

    return fullSession;
  }

  private async createOdometerNotifications(session: ChargeSession): Promise<void> {
    const drivers = session.vehicle.userVehicles
      ?.filter((uv) => uv.user.role === 'driver')
      .map((uv) => uv.user);

    if (!drivers || drivers.length === 0) {
      return;
    }

    for (const driver of drivers) {
      const notification = new Notification();
      notification.userId = driver.id;
      notification.sessionId = session.id;
      notification.type = 'odometer_request' as any;
      notification.subject = 'Одометър: Нужно въвеждане';
      notification.body = `Моля, въведете одометър за ${session.vehicle.make} ${session.vehicle.model} (${session.vehicle.registrationNo}) след зареждане на ${session.station.name}.`;
      notification.status = 'queued' as any;
      await this.notificationRepository.save(notification);

      // Queue email notification
      await this.notificationsQueue.add('send-email', {
        notificationId: notification.id,
        userId: driver.id,
        email: driver.email,
        type: 'odometer_request',
        sessionId: session.id,
      });
    }
  }

  async update(id: string, sessionData: Partial<ChargeSession>): Promise<ChargeSession> {
    const session = await this.findOne(id);
    Object.assign(session, sessionData);
    return this.chargeSessionsRepository.save(session);
  }
}
