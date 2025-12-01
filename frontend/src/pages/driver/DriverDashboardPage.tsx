import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Battery, Car, Gauge, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { ChargeSession, Vehicle } from '../../types';
import { formatDateTime, formatNumber } from '../../lib/utils';
import { useAuthStore } from '../../store/auth';

export default function DriverDashboardPage() {
  const { user } = useAuthStore();

  // Fetch user's vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles/my-vehicles');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch pending sessions for all user's vehicles
  const { data: allPendingSessions = [] } = useQuery<ChargeSession[]>({
    queryKey: ['my-pending-sessions'],
    queryFn: async () => {
      const allSessions: ChargeSession[] = [];
      for (const vehicle of vehicles) {
        const { data } = await api.get(`/charge-sessions/pending/vehicle/${vehicle.id}`);
        allSessions.push(...data);
      }
      return allSessions;
    },
    enabled: vehicles.length > 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const pendingCount = allPendingSessions.length;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Добре дошли, {user?.fullName}!</h1>
        <p className="text-gray-600 mt-1">Въведете километраж за завършени зареждания</p>
      </div>

      {/* Alert for pending odometer readings */}
      {pendingCount > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-800 font-medium mb-1">
                Имате {pendingCount} зареждан{pendingCount === 1 ? 'е' : 'ия'}, чакащ{pendingCount === 1 ? 'о' : 'и'} километраж
              </h3>
              <p className="text-yellow-700 text-sm mb-3">
                Моля, въведете показанията на одометъра, за да завършите процеса на зареждане.
              </p>
              <Link
                to="/odometer"
                className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm font-medium"
              >
                <Gauge className="w-4 h-4" />
                Въведи километраж
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* No pending sessions message */}
      {pendingCount === 0 && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <Battery className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-green-800 font-medium mb-1">
                Няма чакащи зареждания
              </h3>
              <p className="text-green-700 text-sm">
                Всички зареждания са завършени с въведен километраж.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Sessions */}
        {allPendingSessions.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-yellow-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                Чакащи зареждания
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allPendingSessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.vehicle?.registrationNo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.vehicle?.make} {session.vehicle?.model}
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Чака одометър
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(session.endedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      {formatNumber(session.kwhCharged)} kWh
                    </div>
                  </div>
                  <Link
                    to="/odometer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Gauge className="w-4 h-4" />
                    Въведи километраж →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Vehicles */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-gray-600" />
              Моите автомобили
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Няма назначени автомобили</p>
              </div>
            ) : (
              vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {vehicle.registrationNo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status === 'active' ? 'Активен' :
                       vehicle.status === 'maintenance' ? 'Поддръжка' : 'Спрян'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Battery className="w-3 h-3 inline mr-1" />
                    {vehicle.batteryCapacityKwh} kWh капацитет
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
