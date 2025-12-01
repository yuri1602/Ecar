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
    validUntil: '',
    timeOfDay: '',
    isActive: true,
    description: '',
  });

  useEffect(() => {
    if (tariff) {
      setFormData({
        name: tariff.name,
        provider: tariff.provider || '',
        pricePerKwh: tariff.pricePerKwh,
        currency: tariff.currency || 'BGN',
        validFrom: tariff.validFrom ? tariff.validFrom.split('T')[0] : '',
        validUntil: tariff.validUntil ? tariff.validUntil.split('T')[0] : '',
        timeOfDay: tariff.timeOfDay || '',
        isActive: tariff.isActive,
        description: tariff.description || '',
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
    
    // Clean up the data - convert empty strings to undefined, ensure pricePerKwh is a number or undefined
    const cleanData: CreateTariffDto = {
      ...formData,
      pricePerKwh: formData.pricePerKwh || formData.pricePerKwh === 0 ? Number(formData.pricePerKwh) : undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      provider: formData.provider || undefined,
      timeOfDay: formData.timeOfDay || undefined,
      description: formData.description || undefined,
    };
    
    if (tariff) {
      updateMutation.mutate({ id: tariff.id, payload: cleanData });
    } else {
      createMutation.mutate(cleanData);
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
                Цена за kWh <span className="text-gray-500 text-xs">(може да е 0 за безплатно зареждане)</span>
              </label>
              <input
                type="number"
                name="pricePerKwh"
                value={formData.pricePerKwh}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
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
                Валидна от <span className="text-gray-500 text-xs">(опционално)</span>
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
                Валидна до <span className="text-gray-500 text-xs">(опционално)</span>
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Период на деня <span className="text-gray-500 text-xs">(опционално)</span>
            </label>
            <select
              name="timeOfDay"
              value={formData.timeOfDay}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Избери...</option>
              <option value="all-day">Целодневна</option>
              <option value="peak">Пикови часове</option>
              <option value="off-peak">Извън пикови часове</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание <span className="text-gray-500 text-xs">(опционално)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Добавете описание на тарифата..."
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
