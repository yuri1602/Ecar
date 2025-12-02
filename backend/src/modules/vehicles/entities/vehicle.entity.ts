import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserVehicle } from './user-vehicle.entity';
import { User } from '../../users/entities/user.entity';

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'registration_no', unique: true, length: 20 })
  registrationNo: string;

  @Column({ length: 100 })
  make: string;

  @Column({ length: 100 })
  model: string;

  @Column({ type: 'integer' })
  year: number;

  @Column({ name: 'battery_capacity_kwh', type: 'decimal', precision: 6, scale: 2 })
  batteryCapacityKwh: number;

  @Column({ nullable: true, unique: true, length: 17 })
  vin: string;

  @Column({ nullable: true, length: 50 })
  color: string;

  @Column({
    type: 'varchar',
    enum: VehicleStatus,
    default: VehicleStatus.ACTIVE,
  })
  status: VehicleStatus;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchasePrice: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'assigned_driver_id', type: 'uuid', nullable: true })
  assignedDriverId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assigned_driver_id' })
  assignedDriver: User;

  @OneToMany(() => UserVehicle, (userVehicle) => userVehicle.vehicle)
  userVehicles: UserVehicle[];

  // Virtual property for charge sessions (will be loaded when needed)
  chargeSessions?: any[];
}
