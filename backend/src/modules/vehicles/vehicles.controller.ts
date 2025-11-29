import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'Returns all vehicles' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('my-vehicles')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get vehicles assigned to current user' })
  @ApiResponse({ status: 200, description: 'Returns user assigned vehicles' })
  findMyVehicles(@CurrentUser() user: any) {
    return this.vehiclesService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Returns vehicle details' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 409, description: 'Registration number already exists' })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 409, description: 'Registration number already exists' })
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete vehicle with charge sessions' })
  async remove(@Param('id') id: string) {
    await this.vehiclesService.remove(id);
  }

  @Post(':vehicleId/assign/:userId')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Assign user to vehicle' })
  @ApiResponse({ status: 201, description: 'User assigned to vehicle successfully' })
  @ApiResponse({ status: 409, description: 'User already assigned to vehicle' })
  assignUser(
    @Param('vehicleId') vehicleId: string,
    @Param('userId') userId: string,
    @Body('role') role?: string,
  ) {
    return this.vehiclesService.assignUserToVehicle(userId, vehicleId, role);
  }

  @Delete(':vehicleId/assign/:userId')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove user from vehicle' })
  @ApiResponse({ status: 204, description: 'User removed from vehicle successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async removeUser(
    @Param('vehicleId') vehicleId: string,
    @Param('userId') userId: string,
  ) {
    await this.vehiclesService.removeUserFromVehicle(userId, vehicleId);
  }
}
