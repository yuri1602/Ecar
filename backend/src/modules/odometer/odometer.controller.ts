import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OdometerService } from './odometer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('odometer')
@ApiBearerAuth()
@Controller('odometer')
@UseGuards(JwtAuthGuard)
export class OdometerController {
  constructor(private readonly odometerService: OdometerService) {}

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get odometer readings for vehicle' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.odometerService.findByVehicleId(vehicleId);
  }

  @Get('vehicle/:vehicleId/latest')
  @ApiOperation({ summary: 'Get latest odometer reading for vehicle' })
  findLatest(@Param('vehicleId') vehicleId: string) {
    return this.odometerService.findLatestByVehicleId(vehicleId);
  }
}
