import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('stations')
@ApiBearerAuth()
@Controller('stations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active stations' })
  findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID' })
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create a new station' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationsService.create(createStationDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Update station' })
  @ApiResponse({ status: 200, description: 'Station updated successfully' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  update(@Param('id') id: string, @Body() updateStationDto: UpdateStationDto) {
    return this.stationsService.update(id, updateStationDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete station' })
  @ApiResponse({ status: 204, description: 'Station deleted successfully' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async remove(@Param('id') id: string) {
    await this.stationsService.remove(id);
  }
}
