import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Battery,
  Calendar,
  Gauge,
  Zap,
  TrendingUp,
  DollarSign,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Vehicle, ChargeSession, OdometerReading } from '../../types';

export default function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch vehicle details
  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles/${id}`);
      return data;
    },
  });

  // Fetch charge sessions for this vehicle
  const { data: chargeSessions = [] } = useQuery<ChargeSession[]>({
    queryKey: ['chargeSessions', id],
    queryFn: async () => {
      const { data } = await api.get('/charge-sessions');
      return data.filter((session: ChargeSession) => session.vehicleId === id);
    },
  });

  // Fetch odometer readings for this vehicle
  const { data: odometerReadings = [] } = useQuery<OdometerReading[]>({
    queryKey: ['odometer', id],
    queryFn: async () => {
      const { data } = await api.get(`/odometer/vehicle/${id}`);
      return data;
    },
  });

  if (vehicleLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Зареждане...</div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Автомобилът не е намерен</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const completedSessions = chargeSessions.filter((s) => s.status === 'completed');
  const totalEnergy = completedSessions.reduce((sum, s) => sum + (Number(s.kwhCharged) || 0), 0);
  const totalCost = completedSessions.reduce((sum, s) => sum + (Number(s.priceTotal) || 0), 0);
  const avgEnergyPerSession = completedSessions.length > 0 ? totalEnergy / completedSessions.length : 0;
  const avgCostPerSession = completedSessions.length > 0 ? totalCost / completedSessions.length : 0;

  const latestOdometer = odometerReadings[0];
  const oldestOdometer = odometerReadings[odometerReadings.length - 1];
  const totalDistance = latestOdometer && oldestOdometer
    ? Number(latestOdometer.readingKm) - Number(oldestOdometer.readingKm)
    : 0;

  const avgConsumption = totalDistance > 0 ? (totalEnergy / totalDistance) * 100 : 0;
  const avgCostPer100km = totalDistance > 0 ? (totalCost / totalDistance) * 100 : 0;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      active: 'Активен',
      maintenance: 'Поддръжка',
      retired: 'Извън експлоатация',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/vehicles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад към автомобили
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="text-xl font-semibold">{vehicle.registrationNo}</span>
              {getStatusBadge(vehicle.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">Година</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{vehicle.year}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Battery className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">Батерия</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{vehicle.batteryCapacityKwh} kWh</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Gauge className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">Километраж</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {latestOdometer ? `${latestOdometer.readingKm.toLocaleString()} км` : '-'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-sm text-gray-600">Водач</div>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {vehicle.assignedDriver ? vehicle.assignedDriver.fullName : 'Неприсвоен'}
          </div>
        </div>
      </div>

      {/* Current Odometer Card */}
      {latestOdometer && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90 mb-1">Моментен километраж</div>
              <div className="text-4xl font-bold">{latestOdometer.readingKm.toLocaleString()} км</div>
              <div className="text-sm opacity-90 mt-2">
                Последна актуализация: {formatDate(latestOdometer.readingAt)}
              </div>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <Gauge className="w-12 h-12" />
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Energy Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Енергия
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Общо заредена</div>
              <div className="text-2xl font-bold text-gray-900">{totalEnergy.toFixed(2)} kWh</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Средно на зареждане</div>
              <div className="text-xl font-semibold text-gray-900">{avgEnergyPerSession.toFixed(2)} kWh</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Брой зареждания</div>
              <div className="text-xl font-semibold text-gray-900">{completedSessions.length}</div>
            </div>
          </div>
        </div>

        {/* Cost Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Разходи
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Общо разходи</div>
              <div className="text-2xl font-bold text-gray-900">{totalCost.toFixed(2)} лв</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Средно на зареждане</div>
              <div className="text-xl font-semibold text-gray-900">{avgCostPerSession.toFixed(2)} лв</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Цена на 100 км</div>
              <div className="text-xl font-semibold text-gray-900">
                {avgCostPer100km > 0 ? `${avgCostPer100km.toFixed(2)} лв` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Ефективност
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Изминати км</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalDistance > 0 ? totalDistance.toLocaleString() : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Разход на 100 км</div>
              <div className="text-xl font-semibold text-gray-900">
                {avgConsumption > 0 ? `${avgConsumption.toFixed(2)} kWh` : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Брой отчети</div>
              <div className="text-xl font-semibold text-gray-900">{odometerReadings.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-gray-600" />
            Основна информация
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">VIN номер:</span>
              <span className="text-sm font-medium text-gray-900">{vehicle.vin || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Цвят:</span>
              <span className="text-sm font-medium text-gray-900">{vehicle.color || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Дата на покупка:</span>
              <span className="text-sm font-medium text-gray-900">
                {vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString('bg-BG') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Покупна цена:</span>
              <span className="text-sm font-medium text-gray-900">
                {vehicle.purchasePrice ? `${vehicle.purchasePrice.toLocaleString()} лв` : '-'}
              </span>
            </div>
            {vehicle.notes && (
              <div className="pt-3 border-t">
                <span className="text-sm text-gray-600">Бележки:</span>
                <p className="text-sm text-gray-900 mt-1">{vehicle.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            Последна активност
          </h3>
          <div className="space-y-4">
            {completedSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                <div className="p-2 bg-blue-50 rounded">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {session.station?.name || 'Неизвестна станция'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(session.startedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{Number(session.kwhCharged).toFixed(2)} kWh</p>
                      <p className="text-xs text-gray-500">{Number(session.priceTotal || 0).toFixed(2)} лв</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {completedSessions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Няма записи за зареждания</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Odometer Readings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-600" />
          Последни одометърни отчети
        </h3>
        {odometerReadings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Километраж</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Разстояние</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Разход</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена/100км</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Бележки</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {odometerReadings.slice(0, 10).map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(reading.readingAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {reading.readingKm.toLocaleString()} км
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.distanceFromPreviousKm ? `${Number(reading.distanceFromPreviousKm).toFixed(0)} км` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.kwhPer100km ? `${Number(reading.kwhPer100km).toFixed(2)} kWh` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {reading.costPer100km ? `${Number(reading.costPer100km).toFixed(2)} лв` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{reading.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">Няма одометърни отчети</p>
        )}
      </div>
    </div>
  );
}
