# ECar Fleet Management - Frontend

React 18 + Vite + TypeScript frontend за системата за управление на електрически автомобили.

## 🚀 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📁 Project Structure

```
frontend/
├── src/
│   ├── lib/              # Utilities
│   │   ├── api.ts        # Axios instance with interceptors
│   │   └── utils.ts      # Helper functions (cn, formatDate, etc.)
│   ├── store/            # Zustand stores
│   │   └── auth.ts       # Authentication state
│   ├── layouts/          # Layout components
│   │   ├── AdminLayout.tsx    # Admin/Fleet Manager layout
│   │   └── DriverLayout.tsx   # Driver layout
│   ├── pages/            # Page components
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── admin/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── VehiclesPage.tsx
│   │   │   └── ChargeSessionsPage.tsx
│   │   └── driver/
│   │       ├── DriverDashboardPage.tsx
│   │       └── OdometerEntryPage.tsx
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles + Tailwind
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## 🔧 Environment Setup

Vite proxy configuration in `vite.config.ts` forwards `/api` requests to backend:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 📦 Installation

```bash
npm install
```

## 🏃 Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

Frontend will be available at: `http://localhost:5173`

## 🔐 Authentication Flow

1. User enters credentials on `/login`
2. Frontend calls `POST /api/auth/login`
3. Backend returns JWT token + user data
4. Token stored in Zustand store (persisted to localStorage)
5. All API requests include `Authorization: Bearer <token>` header
6. On 401 response → automatic logout and redirect to `/login`

### Test Credentials

```
Admin:
  email: admin@ecar.local
  password: Password123!

Fleet Manager:
  email: manager@ecar.local
  password: Password123!

Driver:
  email: driver1@ecar.local
  password: Password123!
```

## 🎨 UI Design

### Color Palette (Tailwind)

- **Primary**: Blue (`blue-600`, `blue-700`)
- **Background**: Gray (`gray-50`, `gray-100`)
- **Text**: Gray (`gray-700`, `gray-900`)
- **Success**: Green
- **Danger**: Red

### Components

- **Buttons**: `bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2`
- **Cards**: `bg-white shadow rounded-lg p-6`
- **Inputs**: `border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500`

## 🛣️ Routing

### Admin/Fleet Manager Routes

- `/` - Dashboard
- `/vehicles` - Vehicle list
- `/charge-sessions` - Charge sessions list
- `/charge-sessions/new` - Create new session
- `/stations` - Charging stations
- `/tariffs` - Tariffs management
- `/users` - User management (admin only)
- `/analytics` - Reports and analytics

### Driver Routes

- `/` - My charge sessions (pending odometer)
- `/odometer` - Enter odometer reading
- `/odometer/:sessionId` - Enter odometer for specific session
- `/history` - Charge history
- `/vehicles` - My vehicles

## 📡 API Integration

### API Client (`src/lib/api.ts`)

Axios instance with:
- Base URL: `/api`
- Auto JWT token injection
- Auto logout on 401 errors

Example usage:

```typescript
import api from '@/lib/api';

// GET request
const vehicles = await api.get('/vehicles');

// POST request
const session = await api.post('/charge-sessions', {
  vehicleId: 'uuid',
  stationId: 'uuid',
  startedAt: new Date(),
  endedAt: new Date(),
  kwhCharged: 50.0,
  priceTotal: 20.0,
});
```

### TanStack Query Hooks

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['vehicles'],
  queryFn: () => api.get('/vehicles').then(res => res.data),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (sessionData) => api.post('/charge-sessions', sessionData),
  onSuccess: () => {
    queryClient.invalidateQueries(['charge-sessions']);
  },
});
```

## 📱 Responsive Design

- **Mobile**: `< 640px` - Single column, stacked navigation
- **Tablet**: `640px - 1024px` - Two columns
- **Desktop**: `> 1024px` - Full layout with sidebar

## 🧩 Component Examples

### Button Component

```typescript
<button
  className="inline-flex items-center px-4 py-2 border border-transparent 
             text-sm font-medium rounded-md text-white bg-blue-600 
             hover:bg-blue-700 focus:outline-none focus:ring-2 
             focus:ring-offset-2 focus:ring-blue-500"
>
  <Plus className="h-4 w-4 mr-2" />
  Добави зареждане
</button>
```

### Card Component

```typescript
<div className="bg-white shadow rounded-lg p-6">
  <h3 className="text-lg font-medium text-gray-900 mb-4">
    Последни зареждания
  </h3>
  <div className="space-y-3">
    {/* Card content */}
  </div>
</div>
```

### Form Input

```typescript
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email адрес
  </label>
  <input
    type="email"
    className="w-full px-4 py-2 border border-gray-300 rounded-md 
               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="email@example.com"
  />
</div>
```

## 🔄 State Management

### Zustand Store (Authentication)

```typescript
const { user, token, isAuthenticated, login, logout } = useAuthStore();

// Login
login('jwt-token-here', {
  id: 'uuid',
  email: 'user@example.com',
  fullName: 'John Doe',
  role: 'admin',
});

// Logout
logout();
```

### TanStack Query (Server State)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

## 🚧 Development Status

### ✅ Sprint 1 - Completed
- Project setup (Vite + React + TypeScript)
- Tailwind CSS configuration
- Authentication flow
- Basic routing structure
- Admin & Driver layouts
- Login page
- API client with interceptors
- State management setup

### 🔄 Sprint 2 - Coming Next
- Vehicle management UI
- Charge session creation form
- Odometer entry form
- Notifications system
- Analytics dashboard
- Reports generation

## 🧪 Testing

```bash
# Unit tests (to be added)
npm run test

# E2E tests (to be added)
npm run test:e2e
```

## 🔧 Build & Deploy

```bash
# Build for production
npm run build

# Output: dist/
# - Optimized bundle
# - Assets with hash in filename
# - index.html entry point
```

Deploy `dist/` folder to:
- Nginx
- Apache
- Netlify
- Vercel
- CloudFlare Pages

### Nginx Configuration

```nginx
server {
  listen 80;
  server_name fleet.example.com;
  root /var/www/ecar-fleet/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## 📝 License

Private - ECar Fleet Management System
