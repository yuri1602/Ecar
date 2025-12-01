import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('tariffs')
@ApiBearerAuth()
@Controller('tariffs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active tariffs' })
  findAll() {
    return this.tariffsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tariff by ID' })
  findOne(@Param('id') id: string) {
    return this.tariffsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create a new tariff' })
  @ApiResponse({ status: 201, description: 'Tariff created successfully' })
  create(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffsService.create(createTariffDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Update tariff' })
  @ApiResponse({ status: 200, description: 'Tariff updated successfully' })
  @ApiResponse({ status: 404, description: 'Tariff not found' })
  update(@Param('id') id: string, @Body() updateTariffDto: UpdateTariffDto) {
    return this.tariffsService.update(id, updateTariffDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tariff' })
  @ApiResponse({ status: 204, description: 'Tariff deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tariff not found' })
  async remove(@Param('id') id: string) {
    await this.tariffsService.remove(id);
  }
}
