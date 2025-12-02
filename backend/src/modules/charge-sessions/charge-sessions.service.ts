import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ChargeSession, SessionStatus } from './entities/charge-session.entity';
import { CreateChargeSessionDto } from './dto/create-charge-session.dto';
import { Notification } from '../notifications/entities/notification.entity';
import { User } from '../users/entities/user.entity';

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
      relations: ['vehicle', 'station', 'tariff', 'chargeCard'],
      order: { startedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ChargeSession> {
    const session = await this.chargeSessionsRepository.findOne({
      where: { id },
      relations: [
        'vehicle', 
        'station', 
        'tariff', 
        'chargeCard', 
        'vehicle.userVehicles', 
        'vehicle.userVehicles.user',
        'vehicle.assignedDriver'
      ],
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
      relations: ['vehicle', 'station', 'chargeCard'],
      order: { startedAt: 'DESC' },
    });
  }

  async findByVehicleIds(vehicleIds: string[]): Promise<ChargeSession[]> {
    if (vehicleIds.length === 0) {
      return [];
    }
    return this.chargeSessionsRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.vehicle', 'vehicle')
      .leftJoinAndSelect('session.station', 'station')
      .leftJoinAndSelect('session.tariff', 'tariff')
      .leftJoinAndSelect('session.chargeCard', 'chargeCard')
      .where('session.vehicleId IN (:...vehicleIds)', { vehicleIds })
      .orderBy('session.startedAt', 'DESC')
      .getMany();
  }

  async create(createChargeSessionDto: CreateChargeSessionDto, createdById: string): Promise<ChargeSession> {
    // Validate that either vehicleId or chargeCardId is provided
    if (!createChargeSessionDto.vehicleId && !createChargeSessionDto.chargeCardId) {
      throw new BadRequestException('Either vehicleId or chargeCardId must be provided');
    }

    // If chargeCardId is provided, get the vehicle from the card
    let vehicleId = createChargeSessionDto.vehicleId;
    if (createChargeSessionDto.chargeCardId && !vehicleId) {
      const cardRepo = this.chargeSessionsRepository.manager.getRepository('ChargeCard');
      const card = await cardRepo.findOne({
        where: { id: createChargeSessionDto.chargeCardId },
        relations: ['vehicle'],
      });
      if (!card) {
        throw new NotFoundException('Charge card not found');
      }
      if (!card.vehicleId) {
        throw new BadRequestException('Charge card is not assigned to any vehicle');
      }
      vehicleId = card.vehicleId;
    }

    // Validate that endedAt is after startedAt
    const startedAt = new Date(createChargeSessionDto.startedAt);
    const endedAt = new Date(createChargeSessionDto.endedAt);
    if (endedAt <= startedAt) {
      throw new BadRequestException('End time must be after start time');
    }

    // Create the charge session
    const session = this.chargeSessionsRepository.create({
      ...createChargeSessionDto,
      vehicleId,
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
    console.log(`[ChargeSessionsService] Checking for drivers to notify for session ${session.id}`);
    
    if (!session.vehicle) {
      console.log('[ChargeSessionsService] No vehicle found');
      return;
    }

    const drivers: User[] = [];

    // 1. Check for directly assigned driver
    if (session.vehicle.assignedDriver && session.vehicle.assignedDriver.isActive) {
      drivers.push(session.vehicle.assignedDriver);
    }

    // 2. Check for drivers in userVehicles
    if (session.vehicle.userVehicles) {
      const additionalDrivers = session.vehicle.userVehicles
        .map((uv) => uv.user)
        .filter(user => user && user.isActive);
      drivers.push(...additionalDrivers);
    }

    // Deduplicate drivers by ID
    const uniqueDrivers = Array.from(new Map(drivers.map(d => [d.id, d])).values());

    console.log(`[ChargeSessionsService] Found ${uniqueDrivers.length} active users assigned to vehicle ${session.vehicle.registrationNo}`);

    if (uniqueDrivers.length === 0) {
      console.log('[ChargeSessionsService] No active drivers found to notify');
      return;
    }

    for (const driver of uniqueDrivers) {
      console.log(`[ChargeSessionsService] Queuing notification for ${driver.email}`);
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
