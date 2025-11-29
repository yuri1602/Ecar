import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({ example: 'CA1234AB', description: 'Vehicle registration number' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  registrationNo: string;

  @ApiProperty({ example: 'Tesla', description: 'Vehicle manufacturer' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  make: string;

  @ApiProperty({ example: 'Model 3', description: 'Vehicle model' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  model: string;

  @ApiProperty({ example: 2022, description: 'Manufacturing year' })
  @IsNumber()
  @Min(2000)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 75.0, description: 'Battery capacity in kWh' })
  @IsNumber()
  @Min(0.1)
  batteryCapacityKwh: number;

  @ApiPropertyOptional({ example: 'VIN1234567890001', description: 'Vehicle Identification Number' })
  @IsOptional()
  @IsString()
  @Length(1, 17)
  vin?: string;

  @ApiPropertyOptional({ example: 'Бяла', description: 'Vehicle color' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  color?: string;

  @ApiPropertyOptional({ enum: VehicleStatus, example: 'active', description: 'Vehicle status' })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: '2022-03-15', description: 'Purchase date' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 'Additional notes', description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
