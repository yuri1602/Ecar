import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { chargeCardsApi } from '../../lib/api';
import { ChargeCard } from '../../types';
import ChargeCardFormModal from '../../components/charge-cards/ChargeCardFormModal';

export default function ChargeCardsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ChargeCard | null>(null);
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['charge-cards'],
    queryFn: chargeCardsApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: chargeCardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-cards'] });
      toast.success('Картата е изтрита успешно');
    },
    onError: () => {
      toast.error('Грешка при изтриване на картата');
    },
  });

  const handleEdit = (card: ChargeCard) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете тази карта?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Карти за зареждане</h1>
          <p className="mt-1 text-sm text-gray-500">
            Управление на RFID карти за зареждане и връзката им с автомобили
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добави карта
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Номер на карта
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Автомобил
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Доставчик
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Бележки
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((card: ChargeCard) => (
              <tr key={card.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">
                      {card.cardNumber}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {card.vehicle ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {card.vehicle.registrationNo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {card.vehicle.make} {card.vehicle.model}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Не е присвоена</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {card.provider || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      card.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {card.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {card.notes || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(card)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cards.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Няма карти</h3>
            <p className="mt-1 text-sm text-gray-500">
              Започнете като добавите първата карта за зареждане.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ChargeCardFormModal
          card={editingCard}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
