import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChargeSessionsService } from './charge-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('charge-sessions')
@ApiBearerAuth()
@Controller('charge-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChargeSessionsController {
  constructor(private readonly chargeSessionsService: ChargeSessionsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Get all charge sessions' })
  findAll() {
    return this.chargeSessionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get charge session by ID' })
  findOne(@Param('id') id: string) {
    return this.chargeSessionsService.findOne(id);
  }
}
