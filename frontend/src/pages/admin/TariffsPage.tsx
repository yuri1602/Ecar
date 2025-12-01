import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { tariffsApi } from '../../lib/api';
import { Tariff } from '../../types';
import { toast } from 'react-hot-toast';
import TariffFormModal from '../../components/tariffs/TariffFormModal';
import { formatNumber } from '../../lib/utils';

export default function TariffsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const queryClient = useQueryClient();

  const { data: tariffs = [], isLoading } = useQuery({
    queryKey: ['tariffs'],
    queryFn: tariffsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: tariffsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      toast.success('Тарифата е изтрита успешно');
    },
    onError: () => {
      toast.error('Грешка при изтриване на тарифата');
    },
  });

  const handleEdit = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете тази тарифа?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTariff(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Тарифи</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление на тарифи за зареждане
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добави тарифа
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Име
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Доставчик
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Цена за kWh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Валидност
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tariffs.map((tariff: Tariff) => (
              <tr key={tariff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">
                      {tariff.name}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tariff.provider || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatNumber(tariff.pricePerKwh)} {tariff.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tariff.validFrom && tariff.validTo ? (
                    <div>
                      <div>{new Date(tariff.validFrom).toLocaleDateString('bg-BG')}</div>
                      <div>до {new Date(tariff.validTo).toLocaleDateString('bg-BG')}</div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tariff.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tariff.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(tariff)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tariff.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tariffs.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Няма тарифи</h3>
            <p className="mt-1 text-sm text-gray-500">
              Започнете като добавите първата тарифа за зареждане.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <TariffFormModal
          tariff={editingTariff}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
