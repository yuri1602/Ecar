import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private notificationsQueue: Queue,
  ) {}

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(notificationData: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationsRepository.create(notificationData);
    const saved = await this.notificationsRepository.save(notification);

    // Queue notification for sending
    await this.notificationsQueue.add('send-email', {
      notificationId: saved.id,
    });

    return saved;
  }
}
