import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getVehicleStatistics(vehicleId: string) {
    // Placeholder - will implement in Sprint 2
    return { message: 'Analytics coming soon' };
  }
}
