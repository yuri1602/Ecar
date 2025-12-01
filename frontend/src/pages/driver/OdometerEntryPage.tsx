import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gauge, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { ChargeSession, OdometerReading, CreateOdometerDto } from '../../types';
import { formatDateTime } from '../../lib/utils';
// import { useAuthStore } from '../../store/auth';

export default function OdometerEntryPage() {
  const queryClient = useQueryClient();
  // const { user } = useAuthStore();
  const [selectedSession, setSelectedSession] = useState<ChargeSession | null>(null);
  const [formData, setFormData] = useState({
    readingKm: '',
    notes: '',
  });

  // Fetch user's vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles/my-vehicles');
      return data;
    },
  });

  // Fetch pending sessions for user's vehicles
  const { data: pendingSessions = [], isLoading } = useQuery<ChargeSession[]>({
    queryKey: ['pending-sessions'],
    queryFn: async () => {
      const allSessions: ChargeSession[] = [];
      for (const vehicle of vehicles) {
        const { data } = await api.get(`/charge-sessions/pending/vehicle/${vehicle.id}`);
        allSessions.push(...data);
      }
      return allSessions;
    },
    enabled: vehicles.length > 0,
  });

  // Fetch latest odometer reading for selected vehicle
  const { data: latestReading } = useQuery<OdometerReading>({
    queryKey: ['latest-odometer', selectedSession?.vehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/odometer/vehicle/${selectedSession?.vehicleId}/latest`);
      return data;
    },
    enabled: !!selectedSession?.vehicleId,
  });

  // Create odometer reading mutation
  const createMutation = useMutation({
    mutationFn: async (odometerData: CreateOdometerDto) => {
      const { data } = await api.post('/odometer', odometerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['latest-odometer'] });
      setSelectedSession(null);
      setFormData({
        readingKm: '',
        notes: '',
      });
      alert('Одометърът е въведен успешно!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Грешка при въвеждане на одометър');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSession) {
      alert('Моля, изберете сесия за зареждане');
      return;
    }

    const readingKm = parseFloat(formData.readingKm);
    
    if (isNaN(readingKm) || readingKm <= 0) {
      alert('Моля, въведете валиден километраж');
      return;
    }

    if (latestReading && readingKm <= latestReading.readingKm) {
      alert(`Новият километраж (${readingKm} km) трябва да е по-голям от предишния (${latestReading.readingKm} km)`);
      return;
    }

    const maxDistance = 2000;
    if (latestReading) {
      const distance = readingKm - latestReading.readingKm;
      if (distance > maxDistance) {
        if (!confirm(`Разликата от ${distance} km изглежда много голяма. Сигурни ли сте?`)) {
          return;
        }
      }
    }

    createMutation.mutate({
      vehicleId: selectedSession.vehicleId,
      sessionId: selectedSession.id,
      readingKm,
      readingAt: new Date().toISOString(),
      notes: formData.notes,
    });
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Зареждане...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Въвеждане на одометър</h1>

      {pendingSessions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Няма чакащи зареждания</h2>
          <p className="text-gray-600">Всички зареждания имат въведен одометър</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Sessions List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Чакащи зареждания ({pendingSessions.length})
            </h2>
            <div className="space-y-3">
              {pendingSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 border rounded-lg transition ${
                    selectedSession?.id === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {session.vehicle?.registrationNo} - {session.vehicle?.make} {session.vehicle?.model}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {session.station?.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {formatDateTime(session.endedAt)}
                  </div>
                  <div className="text-sm font-medium text-blue-600 mt-2">
                    {session.kwhCharged} kWh
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Odometer Entry Form */}
          <div className="bg-white shadow rounded-lg p-6">
            {selectedSession ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-blue-500" />
                  Въведи километраж
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Автомобил:</span>{' '}
                    {selectedSession.vehicle?.make} {selectedSession.vehicle?.model}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Зареждане:</span>{' '}
                    {formatDateTime(selectedSession.endedAt)}
                  </div>
                  {latestReading && (
                    <div className="text-sm text-gray-700 mt-3 pt-3 border-t border-blue-200">
                      <span className="font-medium">Последен километраж:</span>{' '}
                      <span className="text-lg font-bold text-blue-600">
                        {latestReading.readingKm.toLocaleString()} km
                      </span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Километраж *
                    </label>
                    <input
                      type="number"
                      value={formData.readingKm}
                      onChange={(e) => setFormData({ ...formData, readingKm: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={latestReading ? `> ${latestReading.readingKm}` : 'Въведи километри'}
                      min={latestReading ? latestReading.readingKm + 1 : 0}
                      step="1"
                      required
                      disabled={createMutation.isPending}
                    />
                    {latestReading && formData.readingKm && (
                      <p className="text-sm text-gray-600 mt-1">
                        Разлика: {(parseFloat(formData.readingKm) - latestReading.readingKm).toFixed(0)} km
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Бележки
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Допълнителни бележки..."
                      disabled={createMutation.isPending}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Запазване...' : 'Запази километраж'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-12">
                <Gauge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Избери зареждане от списъка вляво</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
