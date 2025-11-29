import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ChargeSession } from '../../charge-sessions/entities/charge-session.entity';
import { User } from '../../users/entities/user.entity';

@Entity('odometer_readings')
export class OdometerReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @ManyToOne(() => ChargeSession, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session: ChargeSession;

  @Column({ name: 'reading_km', type: 'integer' })
  readingKm: number;

  @Column({ name: 'reading_at', type: 'timestamptz' })
  readingAt: Date;

  @Column({ name: 'entered_by' })
  enteredBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entered_by' })
  enteredByUser: User;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'distance_from_previous_km', type: 'integer', nullable: true })
  distanceFromPreviousKm: number;

  @Column({ name: 'kwh_per_100km', type: 'decimal', precision: 6, scale: 2, nullable: true })
  kwhPer100km: number;

  @Column({ name: 'cost_per_100km', type: 'decimal', precision: 8, scale: 2, nullable: true })
  costPer100km: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
