import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Car, Search, Filter, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/api';
import { Vehicle, CreateVehicleDto } from '../../types';
import VehicleFormModal from '../../components/vehicles/VehicleFormModal';

export default function VehiclesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingVehicleOdometer, setEditingVehicleOdometer] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data;
    },
  });

  // Fetch all odometer readings
  const { data: odometerReadings = [] } = useQuery({
    queryKey: ['odometer'],
    queryFn: async () => {
      const { data } = await api.get('/odometer');
      return data;
    },
  });

  // Get last odometer reading for a vehicle
  const getLastOdometer = (vehicleId: string) => {
    const vehicleReadings = odometerReadings
      .filter((reading: any) => reading.vehicleId === vehicleId)
      .sort((a: any, b: any) => new Date(b.readingAt).getTime() - new Date(a.readingAt).getTime());
    
    const lastReading = vehicleReadings[0]?.readingKm;
    return lastReading !== undefined && lastReading !== null ? lastReading : '-';
  };

  // Create vehicle mutation
  const createMutation = useMutation({
    mutationFn: async ({ vehicleData, initialOdometer }: { vehicleData: CreateVehicleDto; initialOdometer?: number }) => {
      const { data: vehicle } = await api.post('/vehicles', vehicleData);
      
      // If initial odometer is provided, create odometer reading
      if (initialOdometer && initialOdometer > 0) {
        await api.post('/odometer', {
          vehicleId: vehicle.id,
          readingKm: initialOdometer,
          readingAt: new Date().toISOString(),
          notes: 'Начално показание при добавяне на автомобила',
        });
      }
      
      return vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['odometer'] });
      setIsModalOpen(false);
      toast.success('Автомобилът е създаден успешно!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Грешка при създаване на автомобил');
    },
  });

  // Update vehicle mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, odometer }: { id: string; data: Partial<CreateVehicleDto>; odometer?: number }) => {
      const response = await api.put(`/vehicles/${id}`, data);
      
      // If odometer is provided and different/new, add reading
      if (odometer !== undefined && odometer > 0) {
        // We don't check against previous because we want to allow corrections/updates
        // But maybe we should check if it's different to avoid spamming?
        // For now, let's just add it if provided.
        // Actually, let's check if it's different from current to avoid duplicates if user didn't change it
        const currentOdo = getLastOdometer(id);
        if (currentOdo !== odometer) {
             await api.post('/odometer', {
              vehicleId: id,
              readingKm: odometer,
              readingAt: new Date().toISOString(),
              notes: 'Ръчна корекция/обновяване от администратор',
            });
        }
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['odometer'] });
      setIsModalOpen(false);
      setEditingVehicle(null);
      toast.success('Автомобилът е обновен успешно!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Грешка при обновяване на автомобил');
    },
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/vehicles/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDeleteConfirm(null);
      toast.success('Автомобилът е премахнат успешно!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Грешка при премахване на автомобил');
      setDeleteConfirm(null);
    },
  });

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    const lastOdometer = getLastOdometer(vehicle.id);
    setEditingVehicleOdometer(typeof lastOdometer === 'number' ? lastOdometer : 0);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteMutation.mutate(id);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSubmit = (data: CreateVehicleDto, odometer?: number) => {
    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, data, odometer });
    } else {
      createMutation.mutate({ vehicleData: data, initialOdometer: odometer });
    }
  };

  // Filter and search vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = searchQuery === '' || 
        vehicle.registrationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      active: 'Активен',
      maintenance: 'Поддръжка',
      retired: 'Извън експлоатация',
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

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Автомобили</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Добави автомобил
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Търси по рег. номер, марка или модел..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="all">Всички статуси</option>
            <option value="active">Активни</option>
            <option value="maintenance">На поддръжка</option>
            <option value="retired">Извън експлоатация</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {vehicles.length === 0 ? 'Няма добавени автомобили' : 'Няма резултати от търсенето'}
            </p>
            {vehicles.length === 0 ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Добави първи автомобил
              </button>
            ) : (
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Изчисти филтрите
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-gray-50 border-b">
              <p className="text-sm text-gray-600">
                Показани {filteredVehicles.length} от {vehicles.length} автомобила
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Рег. номер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Автомобил
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Година
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Батерия
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Километраж
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Водач
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
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle.registrationNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.make} {vehicle.model}
                        </div>
                        {vehicle.color && (
                          <div className="text-sm text-gray-500">{vehicle.color}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.batteryCapacityKwh} kWh
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="font-medium">{getLastOdometer(vehicle.id)}</span>
                          {getLastOdometer(vehicle.id) !== '-' && <span className="ml-1 text-gray-500">км</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.assignedDriver ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{vehicle.assignedDriver.fullName}</div>
                            <div className="text-gray-500 text-xs">{vehicle.assignedDriver.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Неприсвоен</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(vehicle.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Виж детайли"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Редактирай"
                        >
                          <Pencil className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className={`${
                            deleteConfirm === vehicle.id
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title={deleteConfirm === vehicle.id ? 'Натисни отново за потвърждение' : 'Изтрий'}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <VehicleFormModal
          vehicle={editingVehicle}
          currentOdometer={editingVehicleOdometer}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
