import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Battery, AlertCircle, TrendingUp, DollarSign, Zap, Users, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../../lib/api';
import { Vehicle, ChargeSession, Station, User } from '../../types';
import { formatNumber } from '../../lib/utils';

export default function DashboardPage() {
  // Fetch all data
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: sessions = [] } = useQuery<ChargeSession[]>({
    queryKey: ['charge-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/charge-sessions');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data } = await api.get('/stations');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculate statistics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const pendingSessions = sessions.filter(s => s.status === 'pending_odometer').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalEnergy = sessions.reduce((sum, s) => sum + (Number(s.kwhCharged) || 0), 0);
  const totalCost = sessions.reduce((sum, s) => sum + (Number(s.priceTotal) || 0), 0);
  const activeStations = stations.filter(s => s.isActive).length;
  const activeDrivers = users.filter(u => u.role === 'driver' && u.isActive).length;

  // This month statistics
  const now = new Date();
  const thisMonthSessions = sessions.filter(s => {
    const sessionDate = new Date(s.createdAt);
    return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
  });
  const thisMonthEnergy = thisMonthSessions.reduce((sum, s) => sum + (Number(s.kwhCharged) || 0), 0);
  const thisMonthCost = thisMonthSessions.reduce((sum, s) => sum + (Number(s.priceTotal) || 0), 0);

  // Average efficiency
  const avgKwhPerSession = sessions.length > 0 ? totalEnergy / sessions.length : 0;
  const avgCostPerSession = sessions.length > 0 ? totalCost / sessions.length : 0;

  // Recent activity
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Vehicles needing attention
  const vehiclesNeedingAttention = vehicles.filter(v => 
    v.status === 'maintenance' || 
    sessions.filter(s => s.vehicleId === v.id && s.status === 'pending_odometer').length > 0
  );

  // Chart data - Energy over time (last 30 days)
  const energyChartData = React.useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dayMap = new Map<string, number>();
    
    sessions
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
  }, [sessions]);

  // Chart data - Cost over time (last 30 days)
  const costChartData = React.useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dayMap = new Map<string, number>();
    
    sessions
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
  }, [sessions]);

  // Chart data - Sessions by vehicle
  const sessionsByVehicle = React.useMemo(() => {
    const vehicleMap = new Map<string, number>();
    
    sessions.forEach(session => {
      if (session.vehicle?.registrationNo) {
        const regNo = session.vehicle.registrationNo;
        vehicleMap.set(regNo, (vehicleMap.get(regNo) || 0) + 1);
      }
    });

    return Array.from(vehicleMap.entries())
      .map(([vehicle, count]) => ({ vehicle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 vehicles
  }, [sessions]);

  // Chart data - Sessions by station
  const sessionsByStation = React.useMemo(() => {
    const stationMap = new Map<string, number>();
    
    sessions.forEach(session => {
      if (session.station?.name) {
        const name = session.station.name;
        stationMap.set(name, (stationMap.get(name) || 0) + 1);
      }
    });

    return Array.from(stationMap.entries())
      .map(([station, count]) => ({ station, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 stations
  }, [sessions]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Табло за управление</h1>
        <p className="text-gray-600 mt-1">Преглед на флота и зареждания</p>
      </div>

      {/* Alert for pending actions */}
      {pendingSessions > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-yellow-800 font-medium">
                {pendingSessions} зареждан{pendingSessions === 1 ? 'е' : 'ия'} чака{pendingSessions === 1 ? '' : 'т'} километраж
              </h3>
              <p className="text-yellow-700 text-sm">Шофьорите трябва да въведат показания на одометъра</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium opacity-90">Активни автомобили</div>
            <Car className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-4xl font-bold mb-1">{activeVehicles}</div>
          <div className="text-sm opacity-80">
            {maintenanceVehicles > 0 && `+${maintenanceVehicles} на поддръжка`}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium opacity-90">Общо зареждания</div>
            <Battery className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-4xl font-bold mb-1">{sessions.length}</div>
          <div className="text-sm opacity-80">{completedSessions} завършени</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium opacity-90">Обща енергия</div>
            <Zap className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-4xl font-bold mb-1">{formatNumber(totalEnergy, 0)}</div>
          <div className="text-sm opacity-80">kWh заредени</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium opacity-90">Обща стойност</div>
            <DollarSign className="w-6 h-6 opacity-80" />
          </div>
          <div className="text-4xl font-bold mb-1">{formatNumber(totalCost, 0)}</div>
          <div className="text-sm opacity-80">BGN</div>
        </div>
      </div>

      {/* Secondary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Този месец</div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{thisMonthSessions.length}</div>
          <div className="text-sm text-gray-600">{formatNumber(thisMonthEnergy, 1)} kWh</div>
          <div className="text-sm text-gray-600">{formatNumber(thisMonthCost, 2)} BGN</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Средно на зареждане</div>
            <Battery className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{formatNumber(avgKwhPerSession, 1)}</div>
          <div className="text-sm text-gray-600">kWh средно</div>
          <div className="text-sm text-gray-600">{formatNumber(avgCostPerSession, 2)} BGN средно</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Станции</div>
            <MapPin className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{activeStations}</div>
          <div className="text-sm text-gray-600">Активни станции</div>
          <div className="text-sm text-gray-600">{stations.length} общо</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Шофьори</div>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{activeDrivers}</div>
          <div className="text-sm text-gray-600">Активни шофьори</div>
          <div className="text-sm text-gray-600">{users.filter(u => u.role === 'driver').length} общо</div>
        </div>
      </div>

      {/* Charts Section */}
      {sessions.length > 0 && (
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
            {/* Sessions by Vehicle */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Зареждания по автомобил
                </h2>
              </div>
              <div className="p-6">
                {sessionsByVehicle.length > 0 ? (
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
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    Няма данни за показване
                  </div>
                )}
              </div>
            </div>

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
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Последна активност</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentSessions.length === 0 ? (
              <div className="p-8 text-center">
                <Battery className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Няма зареждания</p>
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.vehicle?.registrationNo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.station?.name}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                      session.status === 'pending_odometer' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.status === 'completed' ? 'Завършено' :
                       session.status === 'pending_odometer' ? 'Чака одометър' : 'Отказано'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>{formatNumber(session.kwhCharged)} kWh</div>
                    <div className="text-right">{formatNumber(session.priceTotal)} {session.currency}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Vehicles Needing Attention */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Автомобили изискващи внимание
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {vehiclesNeedingAttention.length === 0 ? (
              <div className="p-8 text-center">
                <Car className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-600 font-medium">Всичко е наред!</p>
                <p className="text-gray-600 text-sm mt-1">Няма автомобили изискващи внимание</p>
              </div>
            ) : (
              vehiclesNeedingAttention.map((vehicle) => {
                const pendingForVehicle = sessions.filter(
                  s => s.vehicleId === vehicle.id && s.status === 'pending_odometer'
                ).length;
                
                return (
                  <div key={vehicle.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-gray-900">
                          {vehicle.registrationNo}
                        </div>
                        <div className="text-sm text-gray-600">
                          {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {vehicle.status === 'maintenance' ? 'Поддръжка' : 'Активен'}
                      </span>
                    </div>
                    {pendingForVehicle > 0 && (
                      <div className="text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                        {pendingForVehicle} чакащ{pendingForVehicle === 1 ? 'о' : 'и'} зареждан{pendingForVehicle === 1 ? 'е' : 'ия'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
