import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertCircle, Battery, Car, TrendingUp, Gauge, Clock, CheckCircle, Zap, DollarSign, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  // Fetch all charge sessions for statistics
  const { data: allSessions = [] } = useQuery<ChargeSession[]>({
    queryKey: ['charge-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/charge-sessions');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Filter only my sessions
  const mySessions = allSessions.filter(s => 
    vehicles.some(v => v.id === s.vehicleId)
  );
  const recentSessions = mySessions.slice(0, 5);

  // Calculate statistics
  const pendingCount = allPendingSessions.length;
  const totalVehicles = vehicles.length;
  const completedThisMonth = mySessions.filter(s => 
    s.status === 'completed' && 
    new Date(s.createdAt).getMonth() === new Date().getMonth()
  ).length;
  const totalEnergyThisMonth = mySessions
    .filter(s => new Date(s.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, s) => sum + (Number(s.kwhCharged) || 0), 0);

  // Chart data - Energy over time (last 30 days)
  const energyChartData = React.useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dayMap = new Map<string, number>();
    
    mySessions
      .filter(s => new Date(s.createdAt) >= last30Days)
      .forEach(session => {
        const date = new Date(session.createdAt).toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + Number(session.kwhCharged || 0));
      });

    return Array.from(dayMap.entries())
      .map(([date, kwh]) => ({
        date: new Date(date).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' }),
        kwh: Number(kwh.toFixed(2))
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14); // Last 14 days
  }, [mySessions]);

  // Chart data - Cost over time (last 30 days)
  const costChartData = React.useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dayMap = new Map<string, number>();
    
    mySessions
      .filter(s => new Date(s.createdAt) >= last30Days)
      .forEach(session => {
        const date = new Date(session.createdAt).toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + Number(session.priceTotal || 0));
      });

    return Array.from(dayMap.entries())
      .map(([date, cost]) => ({
        date: new Date(date).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' }),
        cost: Number(cost.toFixed(2))
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-14); // Last 14 days
  }, [mySessions]);

  // Chart data - Sessions by station
  const sessionsByStation = React.useMemo(() => {
    const stationMap = new Map<string, number>();
    
    mySessions.forEach(session => {
      if (session.station?.name) {
        const name = session.station.name;
        stationMap.set(name, (stationMap.get(name) || 0) + 1);
      }
    });

    return Array.from(stationMap.entries())
      .map(([station, count]) => ({ station, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 stations
  }, [mySessions]);

  // Chart data - Sessions by vehicle
  const sessionsByVehicle = React.useMemo(() => {
    const vehicleMap = new Map<string, number>();
    
    mySessions.forEach(session => {
      if (session.vehicle?.registrationNo) {
        const regNo = session.vehicle.registrationNo;
        vehicleMap.set(regNo, (vehicleMap.get(regNo) || 0) + 1);
      }
    });

    return Array.from(vehicleMap.entries())
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => b.count - a.count);
  }, [mySessions]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Добре дошли, {user?.fullName}!</h1>
        <p className="text-gray-600 mt-1">Преглед на вашите зареждания и автомобили</p>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Чакащи одометри</div>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
          <div className="text-sm text-gray-500 mt-1">Изискват действие</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Моите автомобили</div>
            <Car className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalVehicles}</div>
          <div className="text-sm text-gray-500 mt-1">Активни превозни средства</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Зареждания този месец</div>
            <Battery className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{completedThisMonth}</div>
          <div className="text-sm text-gray-500 mt-1">Завършени успешно</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Енергия този месец</div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(totalEnergyThisMonth, 1)}</div>
          <div className="text-sm text-gray-500 mt-1">kWh заредени</div>
        </div>
      </div>

      {/* Charts Section */}
      {mySessions.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Energy Chart */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Енергия последните 14 дни
                </h2>
              </div>
              <div className="p-6">
                {energyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={energyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="kwh" stroke="#8B5CF6" strokeWidth={2} name="kWh" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    Няма данни за показване
                  </div>
                )}
              </div>
            </div>

            {/* Cost Chart */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  Разходи последните 14 дни
                </h2>
              </div>
              <div className="p-6">
                {costChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cost" fill="#F59E0B" name="BGN" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    Няма данни за показване
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sessions by Station */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Зареждания по станция
                </h2>
              </div>
              <div className="p-6">
                {sessionsByStation.length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={sessionsByStation}
                          dataKey="count"
                          nameKey="station"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {sessionsByStation.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {sessionsByStation.map((item, index) => (
                        <div key={item.station} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.station}: <span className="font-semibold">{item.count}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    Няма данни за показване
                  </div>
                )}
              </div>
            </div>

            {/* Sessions by Vehicle */}
            {sessionsByVehicle.length > 1 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    Зареждания по автомобил
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie
                          data={sessionsByVehicle}
                          dataKey="count"
                          nameKey="vehicle"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {sessionsByVehicle.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {sessionsByVehicle.map((item, index) => (
                        <div key={item.vehicle} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">
                            {item.vehicle}: <span className="font-semibold">{item.count}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Statistics */}
            {sessionsByVehicle.length === 1 && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Обобщена статистика
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Общо зареждания</span>
                      <span className="text-2xl font-bold text-gray-900">{mySessions.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Обща енергия</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {formatNumber(mySessions.reduce((sum, s) => sum + Number(s.kwhCharged || 0), 0), 1)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Общи разходи</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {formatNumber(mySessions.reduce((sum, s) => sum + Number(s.priceTotal || 0), 0), 2)} BGN
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Средна цена/kWh</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatNumber(
                          mySessions.reduce((sum, s) => sum + Number(s.priceTotal || 0), 0) / 
                          mySessions.reduce((sum, s) => sum + Number(s.kwhCharged || 0), 0),
                          2
                        )} BGN
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
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

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Последна активност
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <Battery className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Няма зареждания все още</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.vehicle?.registrationNo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.station?.name}
                      </div>
                    </div>
                    {session.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>{formatDateTime(session.endedAt)}</div>
                    <div className="text-right">
                      {formatNumber(session.kwhCharged)} kWh • {formatNumber(session.priceTotal)} {session.currency}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
