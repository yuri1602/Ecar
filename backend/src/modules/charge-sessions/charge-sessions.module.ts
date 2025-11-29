import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeSession } from './entities/charge-session.entity';
import { ChargeSessionsService } from './charge-sessions.service';
import { ChargeSessionsController } from './charge-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChargeSession])],
  controllers: [ChargeSessionsController],
  providers: [ChargeSessionsService],
  exports: [ChargeSessionsService],
})
export class ChargeSessionsModule {}
