import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { User, CreateUserDto } from '../../types';
import { toast } from 'react-hot-toast';

interface UserFormModalProps {
  user?: User | null;
  onClose: () => void;
}

export default function UserFormModal({ user, onClose }: UserFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    fullName: '',
    phone: '',
    role: 'driver',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || '',
        role: user.role,
        password: '', // Password not shown when editing
      });
    }
  }, [user]);

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Потребителят е създаден успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при създаване на потребителя');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: Partial<CreateUserDto> }) =>
      usersApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Потребителят е обновен успешно');
      onClose();
    },
    onError: () => {
      toast.error('Грешка при обновяване на потребителя');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      // When editing, only send changed fields
      const payload: Partial<CreateUserDto> = {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        role: formData.role,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      updateMutation.mutate({ id: user.id, payload });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            {user ? 'Редактиране на потребител' : 'Добавяне на потребител'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пълно име <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роля <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="driver">Шофьор</option>
              <option value="fleet_manager">Мениджър на флот</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Парола {!user && <span className="text-red-500">*</span>}
              {user && <span className="text-gray-500 text-xs ml-2">(оставете празно за без промяна)</span>}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={user ? '********' : 'Минимум 8 символа'}
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
              {user ? 'Обнови' : 'Създай'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
