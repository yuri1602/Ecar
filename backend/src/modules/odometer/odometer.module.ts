import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OdometerReading } from './entities/odometer-reading.entity';
import { ChargeSession } from '../charge-sessions/entities/charge-session.entity';
import { OdometerService } from './odometer.service';
import { OdometerController } from './odometer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OdometerReading, ChargeSession])],
  controllers: [OdometerController],
  providers: [OdometerService],
  exports: [OdometerService],
})
export class OdometerModule {}
