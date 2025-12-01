import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTariffDto {
  @ApiProperty({ example: 'EVN Standard 2025', description: 'Tariff name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'EVN', description: 'Provider name' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 0.5, description: 'Price per kWh (can be 0 for free charging)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKwh?: number;

  @ApiPropertyOptional({ example: 'BGN', description: 'Currency code', default: 'BGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Valid from date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Valid until date' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ example: 'peak', description: 'Time of day (peak/off-peak/all-day)' })
  @IsOptional()
  @IsString()
  timeOfDay?: string;

  @ApiPropertyOptional({ example: true, description: 'Tariff active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Standard pricing for 2025', description: 'Tariff description' })
  @IsOptional()
  @IsString()
  description?: string;
}
