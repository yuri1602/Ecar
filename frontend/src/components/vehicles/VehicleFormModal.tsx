import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Vehicle, CreateVehicleDto, User } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../lib/api';

interface VehicleFormModalProps {
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSubmit: (data: CreateVehicleDto, initialOdometer?: number) => void;
  isSubmitting: boolean;
}

export default function VehicleFormModal({ vehicle, onClose, onSubmit, isSubmitting }: VehicleFormModalProps) {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const drivers = users.filter(u => u.role === 'driver');

  const [formData, setFormData] = useState<CreateVehicleDto>({
    registrationNo: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    batteryCapacityKwh: 0,
    vin: '',
    color: '',
    status: 'active',
    purchaseDate: '',
    notes: '',
    assignedDriverId: '',
  });

  const [initialOdometer, setInitialOdometer] = useState<number>(0);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registrationNo: vehicle.registrationNo,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        batteryCapacityKwh: vehicle.batteryCapacityKwh,
        vin: vehicle.vin || '',
        color: vehicle.color || '',
        status: vehicle.status,
        purchaseDate: vehicle.purchaseDate || '',
        notes: vehicle.notes || '',
        assignedDriverId: vehicle.assignedDriverId || '',
      });
    }
  }, [vehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.registrationNo.trim()) {
      alert('Моля, въведете регистрационен номер');
      return;
    }
    if (!formData.make.trim()) {
      alert('Моля, въведете марка');
      return;
    }
    if (!formData.model.trim()) {
      alert('Моля, въведете модел');
      return;
    }
    if (formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
      alert('Моля, въведете валидна година');
      return;
    }
    if (formData.batteryCapacityKwh <= 0) {
      alert('Моля, въведете капацитет на батерията');
      return;
    }

    // Clean up formData - keep empty string for assignedDriverId to allow unassigning
    const cleanedData = {
      ...formData,
      assignedDriverId: formData.assignedDriverId,
    };

    // Pass initial odometer only when creating new vehicle
    onSubmit(cleanedData, !vehicle && initialOdometer > 0 ? initialOdometer : undefined);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {vehicle ? 'Редактиране на автомобил' : 'Нов автомобил'}
          </h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Регистрационен номер *
              </label>
              <input
                type="text"
                name="registrationNo"
                value={formData.registrationNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="CA1234AB"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VIN
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VIN1234567890001"
                maxLength={17}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Марка *
              </label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tesla"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Модел *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Model 3"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Година *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="2000"
                max={new Date().getFullYear() + 1}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Капацитет на батерията (kWh) *
              </label>
              <input
                type="number"
                name="batteryCapacityKwh"
                value={formData.batteryCapacityKwh}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
                min="0.1"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цвят
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Бяла"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="active">Активен</option>
                <option value="maintenance">Поддръжка</option>
                <option value="retired">Извън експлоатация</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Присвоен водач
              </label>
              <select
                name="assignedDriverId"
                value={formData.assignedDriverId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              >
                <option value="">-- Няма присвоен водач --</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName} ({driver.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата на закупуване
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            {!vehicle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Начални километри <span className="text-gray-500 text-xs">(опционално)</span>
                </label>
                <input
                  type="number"
                  value={initialOdometer}
                  onChange={(e) => setInitialOdometer(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="1"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Показанието на одометъра в момента на добавяне на автомобила
                </p>
              </div>
            )}
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
              {isSubmitting ? 'Запазване...' : vehicle ? 'Обнови' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
