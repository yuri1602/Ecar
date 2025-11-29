import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Station } from '../../stations/entities/station.entity';
import { Tariff } from '../../tariffs/entities/tariff.entity';
import { User } from '../../users/entities/user.entity';

export enum SessionStatus {
  PENDING_ODOMETER = 'pending_odometer',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('charge_sessions')
export class ChargeSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'station_id', nullable: true })
  stationId: string;

  @ManyToOne(() => Station, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'station_id' })
  station: Station;

  @Column({ name: 'tariff_id', nullable: true })
  tariffId: string;

  @ManyToOne(() => Tariff, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tariff_id' })
  tariff: Tariff;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz' })
  endedAt: Date;

  @Column({ name: 'kwh_charged', type: 'decimal', precision: 8, scale: 3 })
  kwhCharged: number;

  @Column({ name: 'price_total', type: 'decimal', precision: 10, scale: 2 })
  priceTotal: number;

  @Column({ name: 'price_per_kwh', type: 'decimal', precision: 8, scale: 4, nullable: true })
  pricePerKwh: number;

  @Column({ length: 3, default: 'BGN' })
  currency: string;

  @Column({
    type: 'varchar',
    enum: SessionStatus,
    default: SessionStatus.PENDING_ODOMETER,
  })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
