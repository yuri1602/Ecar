import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { tariffsApi } from '../../lib/api';
import { Tariff, CreateTariffDto } from '../../types';
import { toast } from 'react-hot-toast';

interface TariffFormModalProps {
  tariff?: Tariff | null;
  onClose: () => void;
}

export default function TariffFormModal({ tariff, onClose }: TariffFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTariffDto>({
    name: '',
    provider: '',
    pricePerKwh: 0,
    currency: 'BGN',
    validFrom: '',
    validTo: '',
    isActive: true,
  });

  useEffect(() => {
    if (tariff) {
      setFormData({
        name: tariff.name,
        provider: tariff.provider || '',
        pricePerKwh: tariff.pricePerKwh,
        currency: tariff.currency || 'BGN',
        validFrom: tariff.validFrom ? tariff.validFrom.split('T')[0] : '',
        validTo: tariff.validTo ? tariff.validTo.split('T')[0] : '',
        isActive: tariff.isActive,
      });
    }
  }, [tariff]);

  const createMutation = useMutation({
    mutationFn: tariffsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      toast.success('Тарифата е създадена успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при създаване на тарифата');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateTariffDto }) =>
      tariffsApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] });
      toast.success('Тарифата е обновена успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при обновяване на тарифата');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tariff) {
      updateMutation.mutate({ id: tariff.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {tariff ? 'Редактиране на тарифа' : 'Добавяне на тарифа'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Име <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена за kWh <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="pricePerKwh"
                value={formData.pricePerKwh}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валута
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BGN">BGN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валидна от
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валидна до
              </label>
              <input
                type="date"
                name="validTo"
                value={formData.validTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {tariff ? 'Обнови' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
