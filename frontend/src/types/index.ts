export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'fleet_manager' | 'driver';
  isActive: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKwh: number;
  vin?: string;
  color?: string;
  status: 'active' | 'maintenance' | 'retired';
  purchaseDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  provider?: string;
  powerKw?: number;
  connectorTypes?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Tariff {
  id: string;
  name: string;
  provider?: string;
  pricePerKwh: number;
  currency: string;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ChargeSession {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  stationId: string;
  station?: Station;
  tariffId: string;
  tariff?: Tariff;
  startedAt: string;
  endedAt: string;
  kwhCharged: number;
  priceTotal: number;
  pricePerKwh?: number;
  currency: string;
  status: 'pending_odometer' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  creator?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OdometerReading {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  sessionId?: string;
  session?: ChargeSession;
  readingKm: number;
  readingAt: string;
  distanceFromPreviousKm?: number;
  kwhPer100km?: number;
  costPer100km?: number;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  sessionId?: string;
  type: 'odometer_request' | 'odometer_reminder' | 'report_ready' | 'system';
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'failed' | 'seen';
  sentAt?: string;
  seenAt?: string;
  createdAt: string;
}

export interface CreateVehicleDto {
  registrationNo: string;
  make: string;
  model: string;
  year: number;
  batteryCapacityKwh: number;
  vin?: string;
  color?: string;
  status?: 'active' | 'maintenance' | 'retired';
  purchaseDate?: string;
  notes?: string;
}

export interface CreateChargeSessionDto {
  vehicleId: string;
  stationId: string;
  tariffId: string;
  startedAt: string;
  endedAt: string;
  kwhCharged: number;
  priceTotal: number;
  notes?: string;
}

export interface CreateOdometerDto {
  vehicleId: string;
  sessionId: string;
  readingKm: number;
  readingAt: string;
  notes?: string;
}

export interface CreateStationDto {
  name: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  provider?: string;
  powerKw?: number;
  connectorTypes?: string[];
  isActive?: boolean;
}

export interface CreateTariffDto {
  name: string;
  provider?: string;
  pricePerKwh: number;
  currency?: string;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface CreateUserDto {
  email: string;
  fullName: string;
  phone?: string;
  role: 'admin' | 'fleet_manager' | 'driver';
  password: string;
}
