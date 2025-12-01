import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsUUID, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargeSessionDto {
  @ApiPropertyOptional({ example: '10000000-0000-0000-0000-000000000001', description: 'Vehicle ID (required if no charge card)' })
  @ValidateIf((o) => !o.chargeCardId || o.vehicleId)
  @IsUUID('4', { message: 'vehicleId must be a valid UUID' })
  vehicleId?: string;

  @ApiPropertyOptional({ example: '40000000-0000-0000-0000-000000000001', description: 'Charge Card ID (required if no vehicle)' })
  @ValidateIf((o) => !o.vehicleId || o.chargeCardId)
  @IsUUID('4', { message: 'chargeCardId must be a valid UUID' })
  chargeCardId?: string;

  @ApiProperty({ example: '20000000-0000-0000-0000-000000000001', description: 'Station ID' })
  @IsUUID()
  @IsNotEmpty()
  stationId: string;

  @ApiProperty({ example: '30000000-0000-0000-0000-000000000001', description: 'Tariff ID' })
  @IsUUID()
  @IsNotEmpty()
  tariffId: string;

  @ApiProperty({ example: '2024-11-29T10:00:00Z', description: 'Charge start time' })
  @IsDateString()
  @IsNotEmpty()
  startedAt: string;

  @ApiProperty({ example: '2024-11-29T12:30:00Z', description: 'Charge end time' })
  @IsDateString()
  @IsNotEmpty()
  endedAt: string;

  @ApiProperty({ example: 45.5, description: 'kWh charged' })
  @IsNumber()
  @Min(0.01)
  kwhCharged: number;

  @ApiProperty({ example: 22.75, description: 'Total price in BGN' })
  @IsNumber()
  @Min(0)
  priceTotal: number;

  @ApiPropertyOptional({ example: 'Fast charge during lunch break', description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
