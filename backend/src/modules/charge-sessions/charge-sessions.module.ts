import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ChargeSession } from './entities/charge-session.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ChargeSessionsService } from './charge-sessions.service';
import { ChargeSessionsController } from './charge-sessions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargeSession, Notification]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [ChargeSessionsController],
  providers: [ChargeSessionsService],
  exports: [ChargeSessionsService],
})
export class ChargeSessionsModule {}
