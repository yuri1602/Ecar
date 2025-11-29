import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { UserVehicle } from './entities/user-vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(UserVehicle)
    private userVehiclesRepository: Repository<UserVehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepository.find();
  }

  async findOne(id: string): Promise<Vehicle | null> {
    return this.vehiclesRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    const userVehicles = await this.userVehiclesRepository.find({
      where: { userId },
      relations: ['vehicle'],
    });
    return userVehicles.map((uv) => uv.vehicle);
  }

  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.vehiclesRepository.create(vehicleData);
    return this.vehiclesRepository.save(vehicle);
  }

  async update(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle | null> {
    await this.vehiclesRepository.update(id, vehicleData);
    return this.findOne(id);
  }
}
