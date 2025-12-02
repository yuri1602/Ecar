import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OdometerService } from './odometer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateOdometerDto } from './dto/create-odometer.dto';

@ApiTags('odometer')
@ApiBearerAuth()
@Controller('odometer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OdometerController {
  constructor(private readonly odometerService: OdometerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all odometer readings' })
  @ApiResponse({ status: 200, description: 'Returns all odometer readings' })
  findAll() {
    return this.odometerService.findAll();
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get odometer readings for vehicle' })
  @ApiResponse({ status: 200, description: 'Returns all odometer readings for vehicle' })
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.odometerService.findByVehicleId(vehicleId);
  }

  @Get('vehicle/:vehicleId/latest')
  @ApiOperation({ summary: 'Get latest odometer reading for vehicle' })
  @ApiResponse({ status: 200, description: 'Returns latest odometer reading' })
  findLatest(@Param('vehicleId') vehicleId: string) {
    return this.odometerService.findLatestByVehicleId(vehicleId);
  }

  @Post()
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create new odometer reading' })
  @ApiResponse({ status: 201, description: 'Odometer reading created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid reading or validation failed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  create(@Body() createOdometerDto: CreateOdometerDto, @CurrentUser() user: any) {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    createOdometerDto.enteredBy = user.id;
    return this.odometerService.create(createOdometerDto);
  }
}
