import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { chargeCardsApi, vehiclesApi } from '../../lib/api';
import { ChargeCard, CreateChargeCardDto, Vehicle } from '../../types';

interface ChargeCardFormModalProps {
  card?: ChargeCard | null;
  onClose: () => void;
}

export default function ChargeCardFormModal({ card, onClose }: ChargeCardFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateChargeCardDto>({
    cardNumber: '',
    vehicleId: '',
    provider: '',
    isActive: true,
    notes: '',
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  useEffect(() => {
    if (card) {
      setFormData({
        cardNumber: card.cardNumber,
        vehicleId: card.vehicleId,
        provider: card.provider || '',
        isActive: card.isActive,
        notes: card.notes || '',
      });
    }
  }, [card]);

  const createMutation = useMutation({
    mutationFn: chargeCardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-cards'] });
      toast.success('Картата е създадена успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при създаване на картата');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateChargeCardDto }) =>
      chargeCardsApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-cards'] });
      toast.success('Картата е обновена успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при обновяване на картата');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (card) {
      updateMutation.mutate({ id: card.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {card ? 'Редактиране на карта' : 'Добавяне на карта'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер на карта <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              required
              placeholder="напр. 1234567890123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              RFID номер на картата за зареждане
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Автомобил <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Изберете автомобил</option>
              {vehicles.map((vehicle: Vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNo} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Автомобилът, към който е присвоена тази карта
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Доставчик
              </label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                placeholder="напр. EVN, ЧЕЗ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                name="isActive"
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Активна</option>
                <option value="false">Неактивна</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Бележки
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Допълнителна информация..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {card ? 'Обнови' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
