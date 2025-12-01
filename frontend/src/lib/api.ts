import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const vehiclesApi = {
  getAll: () => api.get('/vehicles').then(res => res.data),
  getOne: (id: string) => api.get(`/vehicles/${id}`).then(res => res.data),
  create: (data: any) => api.post('/vehicles', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/vehicles/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/vehicles/${id}`).then(res => res.data),
};

export const stationsApi = {
  getAll: () => api.get('/stations').then(res => res.data),
  getOne: (id: string) => api.get(`/stations/${id}`).then(res => res.data),
  create: (data: any) => api.post('/stations', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/stations/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/stations/${id}`).then(res => res.data),
};

export const tariffsApi = {
  getAll: () => api.get('/tariffs').then(res => res.data),
  getOne: (id: string) => api.get(`/tariffs/${id}`).then(res => res.data),
  create: (data: any) => api.post('/tariffs', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/tariffs/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/tariffs/${id}`).then(res => res.data),
};

export const chargeSessionsApi = {
  getAll: () => api.get('/charge-sessions').then(res => res.data),
  getOne: (id: string) => api.get(`/charge-sessions/${id}`).then(res => res.data),
  create: (data: any) => api.post('/charge-sessions', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/charge-sessions/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/charge-sessions/${id}`).then(res => res.data),
};

export const usersApi = {
  getAll: () => api.get('/users').then(res => res.data),
  getOne: (id: string) => api.get(`/users/${id}`).then(res => res.data),
  create: (data: any) => api.post('/users', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(res => res.data),
};

export const odometerApi = {
  getAll: () => api.get('/odometer').then(res => res.data),
  getByVehicle: (vehicleId: string) => api.get(`/odometer/vehicle/${vehicleId}`).then(res => res.data),
  create: (data: any) => api.post('/odometer', data).then(res => res.data),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard').then(res => res.data),
};

export const chargeCardsApi = {
  getAll: () => api.get('/charge-cards').then(res => res.data),
  getOne: (id: string) => api.get(`/charge-cards/${id}`).then(res => res.data),
  create: (data: any) => api.post('/charge-cards', data).then(res => res.data),
  update: (id: string, data: any) => api.patch(`/charge-cards/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/charge-cards/${id}`).then(res => res.data),
};

export { api };
export default api;
