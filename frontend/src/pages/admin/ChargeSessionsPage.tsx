import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Battery, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { ChargeSession, Vehicle, Station, Tariff } from '../../types';
import { formatDateTime, formatNumber } from '../../lib/utils';
import ChargeSessionFormModal from '../../components/charge-sessions/ChargeSessionFormModal';

export default function ChargeSessionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch charge sessions
  const { data: sessions = [], isLoading, error } = useQuery<ChargeSession[]>({
    queryKey: ['charge-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/charge-sessions');
      return data;
    },
  });

  // Fetch vehicles for form
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data;
    },
  });

  // Fetch stations for form
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data } = await api.get('/stations');
      return data;
    },
  });

  // Fetch tariffs for form
  const { data: tariffs = [] } = useQuery<Tariff[]>({
    queryKey: ['tariffs'],
    queryFn: async () => {
      const { data } = await api.get('/tariffs');
      return data;
    },
  });

  // Create charge session mutation
  const createMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const { data } = await api.post('/charge-sessions', sessionData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-sessions'] });
      setIsModalOpen(false);
      alert('Сесията за зареждане е създадена успешно!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Грешка при създаване на сесия');
    },
  });

  const handleSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending_odometer: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending_odometer: 'Чака одометър',
      completed: 'Завършено',
      cancelled: 'Отказано',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Грешка при зареждане</h3>
          <p className="text-red-600 text-sm">{(error as any)?.response?.data?.message || 'Възникна грешка при зареждане на данните'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Зареждания</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Ново зареждане
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Battery className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Няма записани зареждания</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Добави първо зареждане
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Автомобил
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Станция
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Период
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Енергия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {session.vehicle?.registrationNo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.vehicle?.make} {session.vehicle?.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.station?.name}</div>
                      <div className="text-sm text-gray-500">{session.station?.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(session.startedAt)}
                      </div>
                      <div className="text-sm text-gray-500">
                        до {formatDateTime(session.endedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(session.kwhCharged)} kWh
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(session.priceTotal)} {session.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(session.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ChargeSessionFormModal
          vehicles={vehicles}
          stations={stations}
          tariffs={tariffs}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      )}
    </div>
  );
}
