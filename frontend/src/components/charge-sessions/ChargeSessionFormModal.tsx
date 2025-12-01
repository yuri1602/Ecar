import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Vehicle, Station, Tariff, CreateChargeSessionDto, ChargeCard } from '../../types';
import { chargeCardsApi } from '../../lib/api';

interface ChargeSessionFormModalProps {
  vehicles: Vehicle[];
  stations: Station[];
  tariffs: Tariff[];
  onClose: () => void;
  onSubmit: (data: CreateChargeSessionDto) => void;
  isSubmitting: boolean;
}

export default function ChargeSessionFormModal({
  vehicles,
  stations,
  tariffs,
  onClose,
  onSubmit,
  isSubmitting,
}: ChargeSessionFormModalProps) {
  const [useCardEntry, setUseCardEntry] = useState(false);
  const [formData, setFormData] = useState<CreateChargeSessionDto>({
    vehicleId: '',
    chargeCardId: '',
    stationId: '',
    tariffId: '',
    startedAt: '',
    endedAt: '',
    kwhCharged: 0,
    priceTotal: 0,
    notes: '',
  });

  const { data: chargeCards = [] } = useQuery({
    queryKey: ['charge-cards'],
    queryFn: chargeCardsApi.getAll,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!useCardEntry && !formData.vehicleId) {
      alert('Моля, изберете автомобил');
      return;
    }
    if (useCardEntry && !formData.chargeCardId) {
      alert('Моля, изберете карта за зареждане');
      return;
    }
    if (!formData.stationId) {
      alert('Моля, изберете станция');
      return;
    }
    if (!formData.tariffId) {
      alert('Моля, изберете тарифа');
      return;
    }
    if (!formData.startedAt) {
      alert('Моля, въведете начало на зареждането');
      return;
    }
    if (!formData.endedAt) {
      alert('Моля, въведете край на зареждането');
      return;
    }
    if (new Date(formData.endedAt) <= new Date(formData.startedAt)) {
      alert('Крайната дата трябва да е след началната');
      return;
    }
    if (formData.kwhCharged <= 0) {
      alert('Моля, въведете заредена енергия');
      return;
    }
    if (formData.priceTotal < 0) {
      alert('Моля, въведете обща цена');
      return;
    }

    // Clean up empty strings to undefined for proper validation
    const cleanedData: CreateChargeSessionDto = {
      ...formData,
      vehicleId: formData.vehicleId || undefined,
      chargeCardId: formData.chargeCardId || undefined,
    };

    onSubmit(cleanedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // Auto-calculate price when tariff or kWh changes
  const handleKwhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kwhCharged = parseFloat(e.target.value) || 0;
    const selectedTariff = tariffs.find(t => t.id === formData.tariffId);
    
    setFormData(prev => ({
      ...prev,
      kwhCharged,
      priceTotal: selectedTariff ? kwhCharged * selectedTariff.pricePerKwh : prev.priceTotal,
    }));
  };

  const handleTariffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tariffId = e.target.value;
    const selectedTariff = tariffs.find(t => t.id === tariffId);
    
    setFormData(prev => ({
      ...prev,
      tariffId,
      priceTotal: selectedTariff && prev.kwhCharged > 0 
        ? prev.kwhCharged * selectedTariff.pricePerKwh 
        : prev.priceTotal,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Ново зареждане</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Toggle between Card and Vehicle selection */}
            <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCardEntry}
                  onChange={(e) => {
                    setUseCardEntry(e.target.checked);
                    setFormData(prev => ({
                      ...prev,
                      vehicleId: '',
                      chargeCardId: '',
                    }));
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Използвай номер на карта за зареждане
                </span>
              </label>
              <p className="mt-1 ml-6 text-xs text-gray-600">
                Автомобилът ще бъде определен автоматично според картата
              </p>
            </div>

            {useCardEntry ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Карта за зареждане *
                </label>
                <select
                  name="chargeCardId"
                  value={formData.chargeCardId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Избери карта</option>
                  {chargeCards.filter((c: ChargeCard) => c.isActive).map((card: ChargeCard) => (
                    <option key={card.id} value={card.id}>
                      {card.cardNumber} - {card.vehicle?.registrationNo} ({card.vehicle?.make} {card.vehicle?.model})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Автомобил *
                </label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Избери автомобил</option>
                  {vehicles.filter(v => v.status === 'active').map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNo} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Станция *
              </label>
              <select
                name="stationId"
                value={formData.stationId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Избери станция</option>
                {stations.filter(s => s.isActive).map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} - {station.location}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тарифа *
              </label>
              <select
                name="tariffId"
                value={formData.tariffId}
                onChange={handleTariffChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              >
                <option value="">Избери тарифа</option>
                {tariffs.filter(t => t.isActive).map((tariff) => (
                  <option key={tariff.id} value={tariff.id}>
                    {tariff.name} - {tariff.pricePerKwh} {tariff.currency}/kWh
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начало на зареждането *
              </label>
              <input
                type="datetime-local"
                name="startedAt"
                value={formData.startedAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Край на зареждането *
              </label>
              <input
                type="datetime-local"
                name="endedAt"
                value={formData.endedAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заредена енергия (kWh) *
              </label>
              <input
                type="number"
                name="kwhCharged"
                value={formData.kwhCharged}
                onChange={handleKwhChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.001"
                min="0.001"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Обща цена (BGN) *
              </label>
              <input
                type="number"
                name="priceTotal"
                value={formData.priceTotal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0"
                required
                disabled={isSubmitting}
              />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Допълнителни бележки..."
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={isSubmitting}
            >
              Отказ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Създаване...' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
