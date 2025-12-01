import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChargeCardsService } from './charge-cards.service';
import { CreateChargeCardDto, UpdateChargeCardDto } from './dto/charge-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('charge-cards')
@ApiBearerAuth()
@Controller('charge-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChargeCardsController {
  constructor(private readonly chargeCardsService: ChargeCardsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Create a new charge card' })
  create(@Body() createChargeCardDto: CreateChargeCardDto) {
    return this.chargeCardsService.create(createChargeCardDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all charge cards' })
  findAll() {
    return this.chargeCardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get charge card by ID' })
  findOne(@Param('id') id: string) {
    return this.chargeCardsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Update a charge card' })
  update(@Param('id') id: string, @Body() updateChargeCardDto: UpdateChargeCardDto) {
    return this.chargeCardsService.update(id, updateChargeCardDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
  @ApiOperation({ summary: 'Delete a charge card' })
  remove(@Param('id') id: string) {
    return this.chargeCardsService.remove(id);
  }
}
