import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOdometerDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001', description: 'Vehicle ID' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Charge session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 45250, description: 'Odometer reading in kilometers' })
  @IsNumber()
  @Min(0)
  readingKm: number;

  @ApiProperty({ example: '2024-11-29T12:35:00Z', description: 'Time of reading' })
  @IsDateString()
  @IsNotEmpty()
  readingAt: string;

  @ApiPropertyOptional({ example: 'Reading after charge session', description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
