import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChargeSessionsService } from './charge-sessions.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateChargeSessionDto } from './dto/create-charge-session.dto';

@ApiTags('charge-sessions')
@ApiBearerAuth()
@Controller('charge-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChargeSessionsController {
  constructor(
    private readonly chargeSessionsService: ChargeSessionsService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Get all charge sessions' })
  @ApiResponse({ status: 200, description: 'Returns all charge sessions' })
  findAll() {
    return this.chargeSessionsService.findAll();
  }

  @Get('my-sessions')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get all charge sessions for current driver' })
  @ApiResponse({ status: 200, description: 'Returns driver sessions' })
  async findMySessions(@CurrentUser() user: any) {
    const vehicles = await this.vehiclesService.findByAssignedDriver(user.id);
    const vehicleIds = vehicles.map(v => v.id);
    return this.chargeSessionsService.findByVehicleIds(vehicleIds);
  }

  @Get('pending/vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get pending charge sessions for vehicle' })
  @ApiResponse({ status: 200, description: 'Returns pending sessions' })
  findPendingByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.chargeSessionsService.findPendingByVehicleId(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get charge session by ID' })
  @ApiResponse({ status: 200, description: 'Returns charge session details' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  findOne(@Param('id') id: string) {
    return this.chargeSessionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create new charge session' })
  @ApiResponse({ status: 201, description: 'Charge session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(
    @Body() createChargeSessionDto: CreateChargeSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.chargeSessionsService.create(createChargeSessionDto, user.id);
  }
}
