import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStationDto {
  @ApiProperty({ example: 'София Център - ЕВН', description: 'Station name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'София, България', description: 'Station location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'ул. Васил Левски 100, София', description: 'Station address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 42.6977, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 23.3219, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'EVN', description: 'Provider name' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 50, description: 'Charging power in kW' })
  @IsOptional()
  @IsNumber()
  powerKw?: number;

  @ApiPropertyOptional({ example: ['Type 2', 'CCS'], description: 'Connector types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  connectorTypes?: string[];

  @ApiPropertyOptional({ example: true, description: 'Station active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Fast charging station', description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
