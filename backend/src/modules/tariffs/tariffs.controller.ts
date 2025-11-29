import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
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
}
