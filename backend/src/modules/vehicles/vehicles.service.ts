import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(UserVehicle)
    private userVehiclesRepository: Repository<UserVehicle>,
  ) {}

  async findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      relations: ['assignedDriver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAssignedDriver(driverId: string): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: { assignedDriverId: driverId },
      relations: ['assignedDriver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOne({ 
      where: { id },
      relations: ['assignedDriver'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle;
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    const userVehicles = await this.userVehiclesRepository.find({
      where: { userId },
      relations: ['vehicle'],
    });
    return userVehicles.map((uv) => uv.vehicle);
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Check if registration number already exists
    const existingVehicle = await this.vehiclesRepository.findOne({
      where: { registrationNo: createVehicleDto.registrationNo },
    });
    if (existingVehicle) {
      throw new ConflictException(
        `Vehicle with registration number ${createVehicleDto.registrationNo} already exists`,
      );
    }

    const vehicle = this.vehiclesRepository.create(createVehicleDto);
    return this.vehiclesRepository.save(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    // Check if registration number is being changed and if it conflicts
    if (
      updateVehicleDto.registrationNo &&
      updateVehicleDto.registrationNo !== vehicle.registrationNo
    ) {
      const existingVehicle = await this.vehiclesRepository.findOne({
        where: { registrationNo: updateVehicleDto.registrationNo },
      });
      if (existingVehicle) {
        throw new ConflictException(
          `Vehicle with registration number ${updateVehicleDto.registrationNo} already exists`,
        );
      }
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehiclesRepository.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.findOne(id);

    // Check if vehicle has any associated charge sessions
    const hasChargeSessions = await this.vehiclesRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('charge_sessions', 'session')
      .where('session.vehicle_id = :vehicleId', { vehicleId: id })
      .getRawOne();

    if (parseInt(hasChargeSessions.count) > 0) {
      // If has sessions, mark as retired instead of deleting
      vehicle.status = VehicleStatus.RETIRED;
      await this.vehiclesRepository.save(vehicle);
    } else {
      // If no sessions, can safely delete
      await this.vehiclesRepository.remove(vehicle);
    }
  }

  async assignUserToVehicle(
    userId: string,
    vehicleId: string,
    role: string = 'driver',
  ): Promise<UserVehicle> {
    // Check if assignment already exists
    const existing = await this.userVehiclesRepository.findOne({
      where: { userId, vehicleId },
    });
    if (existing) {
      throw new ConflictException('User is already assigned to this vehicle');
    }

    const assignment = this.userVehiclesRepository.create({
      user: { id: userId } as any,
      vehicle: { id: vehicleId } as any,
      roleOnVehicle: role as any,
    });
    return this.userVehiclesRepository.save(assignment);
  }

  async removeUserFromVehicle(userId: string, vehicleId: string): Promise<void> {
    const assignment = await this.userVehiclesRepository.findOne({
      where: { userId, vehicleId },
    });
    if (!assignment) {
      throw new NotFoundException('User assignment not found');
    }
    await this.userVehiclesRepository.remove(assignment);
  }
}
