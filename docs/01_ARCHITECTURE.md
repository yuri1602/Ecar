# Архитектура на системата за управление на електромобилен автопарк

## 📐 Референтна архитектура

### Преглед на системата

```
┌─────────────────────────────────────────────────────────────┐
│                     USERS / CLIENTS                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Admin      │  │ Fleet Manager │  │   Driver     │     │
│  │   Desktop    │  │    Desktop    │  │   Mobile     │     │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘     │
│         │                 │                   │             │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    WEB/REVERSE PROXY LAYER                  │
│                     (Nginx / Traefik)                       │
│                   - SSL Termination                         │
│                   - Static Assets                           │
│                   - Load Balancing                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│   FRONTEND (SPA)     │      │   BACKEND API        │
│   ---------------    │      │   -------------      │
│   - React/Vue.js     │      │   - Node.js/NestJS   │
│   - TypeScript       │      │   OR                 │
│   - Tailwind CSS     │      │   - .NET Core        │
│   - React Query      │      │   OR                 │
│                      │      │   - Python/FastAPI   │
│   Pages:             │      │                      │
│   • Admin Dashboard  │      │   Modules:           │
│   • Vehicle Mgmt     │      │   • Auth & RBAC      │
│   • Session Entry    │      │   • Vehicle Service  │
│   • Driver Portal    │◄────►│   • Session Service  │
│   • Odometer Entry   │      │   • Odometer Service │
│   • Reports/Export   │      │   • Notification Svc │
│                      │      │   • Analytics        │
└──────────────────────┘      │   • Export Service   │
                              └──────────┬───────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
        ┌────────────────────┐  ┌──────────────┐  ┌──────────────────┐
        │   DATABASE         │  │   WORKER     │  │  NOTIFICATION    │
        │   PostgreSQL 14+   │  │   QUEUE      │  │  SERVICE         │
        │                    │  │              │  │                  │
        │   Tables:          │  │  - BullMQ    │  │  - Email (SMTP)  │
        │   • users          │  │  - Redis     │  │  - SMS (future)  │
        │   • vehicles       │  │              │  │  - Push (future) │
        │   • charge_sessions│  │  Jobs:       │  │                  │
        │   • odometer_read..│  │  • Send      │  │  Templates:      │
        │   • user_vehicles  │  │    notific.. │  │  • New charge    │
        │   • stations       │  │  • Reminders │  │  • Reminders     │
        │   • tariffs        │  │  • Reports   │  │  • Reports       │
        │   • notifications  │  │              │  │                  │
        │   • audit_logs     │  │              │  │                  │
        │                    │  └──────────────┘  └──────────────────┘
        └────────────────────┘
                    │
                    ▼
        ┌────────────────────┐
        │   BACKUP/STORAGE   │
        │   - Daily backups  │
        │   - Audit archives │
        │   - Export files   │
        └────────────────────┘
```

## 🛠️ Технологичен стек

### Препоръчителна имплементация

#### Option A: Node.js Stack (Препоръчителна за бързо внедряване)

**Backend:**
- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS (модулна архитектура, вграден TypeScript, dependency injection)
- **API Style:** REST (OpenAPI/Swagger документация)
- **ORM:** TypeORM / Prisma
- **Validation:** class-validator, class-transformer
- **Authentication:** Passport.js (Local + OIDC стратегии)
- **Job Queue:** BullMQ + Redis
- **Email:** Nodemailer

**Frontend:**
- **Framework:** React 18+ с TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts / Chart.js
- **Tables:** TanStack Table
- **Routing:** React Router v6

**Database:**
- PostgreSQL 14+
- Redis (за кеш и job queue)

**Infrastructure:**
- **Web Server:** Nginx (reverse proxy, static files)
- **Process Manager:** PM2
- **Container (optional):** Docker + Docker Compose

#### Option B: .NET Stack (За enterprise среда)

**Backend:**
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- MediatR (CQRS pattern)
- FluentValidation
- Hangfire (background jobs)

**Frontend:** Същото като Option A

#### Option C: Python Stack (За data science интеграции)

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- Pydantic
- Celery + Redis
- Python-JOSE (JWT)

**Frontend:** Същото като Option A

## 🏗️ Модулна архитектура на Backend

```
ecar-backend/
├── src/
│   ├── auth/                    # Authentication & Authorization
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── local.strategy.ts
│   │   │   └── oidc.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── decorators/
│   │       └── roles.decorator.ts
│   │
│   ├── users/                   # User Management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/user.entity.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── vehicles/                # Vehicle Management
│   │   ├── vehicles.controller.ts
│   │   ├── vehicles.service.ts
│   │   ├── entities/vehicle.entity.ts
│   │   └── dto/
│   │
│   ├── charge-sessions/         # Charging Session Management
│   │   ├── charge-sessions.controller.ts
│   │   ├── charge-sessions.service.ts
│   │   ├── entities/charge-session.entity.ts
│   │   └── dto/
│   │
│   ├── odometer/                # Odometer Management
│   │   ├── odometer.controller.ts
│   │   ├── odometer.service.ts
│   │   ├── entities/odometer-reading.entity.ts
│   │   └── dto/
│   │
│   ├── notifications/           # Notification Service
│   │   ├── notifications.service.ts
│   │   ├── email.service.ts
│   │   ├── templates/
│   │   │   ├── new-charge.hbs
│   │   │   └── odometer-reminder.hbs
│   │   └── entities/notification.entity.ts
│   │
│   ├── analytics/               # Analytics & Reporting
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   └── dto/
│   │       ├── consumption-report.dto.ts
│   │       └── cost-report.dto.ts
│   │
│   ├── stations/                # Charging Stations
│   │   ├── stations.controller.ts
│   │   ├── stations.service.ts
│   │   └── entities/station.entity.ts
│   │
│   ├── tariffs/                 # Tariff Management
│   │   ├── tariffs.controller.ts
│   │   ├── tariffs.service.ts
│   │   └── entities/tariff.entity.ts
│   │
│   ├── audit/                   # Audit Trail
│   │   ├── audit.service.ts
│   │   ├── audit.interceptor.ts
│   │   └── entities/audit-log.entity.ts
│   │
│   ├── jobs/                    # Background Jobs
│   │   ├── jobs.module.ts
│   │   ├── notification.processor.ts
│   │   ├── reminder.processor.ts
│   │   └── report.processor.ts
│   │
│   ├── common/                  # Shared Code
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   │
│   ├── config/                  # Configuration
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   └── email.config.ts
│   │
│   └── main.ts
│
├── test/
├── migrations/
├── seeders/
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🌐 Frontend структура

```
ecar-frontend/
├── src/
│   ├── app/                     # App Setup
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── features/                # Feature Modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   └── api/
│   │   │       └── authApi.ts
│   │   │
│   │   ├── vehicles/
│   │   │   ├── components/
│   │   │   │   ├── VehicleList.tsx
│   │   │   │   ├── VehicleForm.tsx
│   │   │   │   └── VehicleCard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useVehicles.ts
│   │   │   └── pages/
│   │   │       ├── VehiclesPage.tsx
│   │   │       └── VehicleDetailsPage.tsx
│   │   │
│   │   ├── charging/
│   │   │   ├── components/
│   │   │   │   ├── SessionList.tsx
│   │   │   │   ├── SessionForm.tsx
│   │   │   │   └── OdometerForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChargeSessions.ts
│   │   │   │   └── useOdometerEntry.ts
│   │   │   └── pages/
│   │   │       ├── AdminSessionsPage.tsx
│   │   │       ├── DriverSessionsPage.tsx
│   │   │       └── OdometerEntryPage.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── ConsumptionChart.tsx
│   │   │   │   └── CostChart.tsx
│   │   │   └── pages/
│   │   │       ├── AdminDashboard.tsx
│   │   │       └── DriverDashboard.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── components/
│   │   │   │   ├── ReportFilters.tsx
│   │   │   │   ├── ReportTable.tsx
│   │   │   │   └── ExportButton.tsx
│   │   │   └── pages/
│   │   │       └── ReportsPage.tsx
│   │   │
│   │   └── admin/
│   │       ├── components/
│   │       │   ├── UserManagement.tsx
│   │       │   └── SystemSettings.tsx
│   │       └── pages/
│   │           └── AdminPanel.tsx
│   │
│   ├── shared/                  # Shared Components
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── forms/
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   └── Select.tsx
│   │   │   └── common/
│   │   │       ├── Loading.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   └── utils/
│   │       ├── format.ts
│   │       ├── validation.ts
│   │       └── api-client.ts
│   │
│   ├── lib/                     # Core Libraries
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   └── auth.ts
│   │
│   ├── types/                   # TypeScript Types
│   │   ├── api.types.ts
│   │   ├── entities.types.ts
│   │   └── common.types.ts
│   │
│   ├── config/
│   │   └── constants.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   └── styles/
│       ├── globals.css
│       └── variables.css
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔒 Authentication & Authorization

### Опции за Auth

#### Вариант 1: Локални акаунти (MVP)
- **JWT tokens** (Access + Refresh)
- **Password hashing:** bcrypt/argon2
- **Session management:** Redis (за refresh tokens)
- **Password policy:** минимум 8 символа, сложност

#### Вариант 2: OIDC/SSO (Enterprise)
- **Providers:** Azure AD, Keycloak, Auth0
- **Protocol:** OAuth 2.0 + OpenID Connect
- **Fallback:** Локални акаунти за emergency access

### RBAC модел

```typescript
enum Role {
  ADMIN = 'admin',
  FLEET_MANAGER = 'fleet_manager',
  DRIVER = 'driver'
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'vehicles', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'charge_sessions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'odometer', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create'] },
    { resource: 'stations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tariffs', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit_logs', actions: ['read'] }
  ],
  
  [Role.FLEET_MANAGER]: [
    { resource: 'users', actions: ['read'] },
    { resource: 'vehicles', actions: ['read', 'update'] },
    { resource: 'charge_sessions', actions: ['create', 'read', 'update'] },
    { resource: 'odometer', actions: ['read', 'update'] },
    { resource: 'reports', actions: ['read', 'create'] },
    { resource: 'stations', actions: ['read'] },
    { resource: 'tariffs', actions: ['read'] }
  ],
  
  [Role.DRIVER]: [
    { resource: 'vehicles', actions: ['read'] }, // само assigned
    { resource: 'charge_sessions', actions: ['read'] }, // само свои
    { resource: 'odometer', actions: ['create', 'update'] }, // само свои
    { resource: 'reports', actions: ['read'] } // само свои
  ]
};
```

## 📡 API Design

### REST API Endpoints

```
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# Users
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/:id/vehicles

# Vehicles
GET    /api/v1/vehicles
POST   /api/v1/vehicles
GET    /api/v1/vehicles/:id
PATCH  /api/v1/vehicles/:id
DELETE /api/v1/vehicles/:id
GET    /api/v1/vehicles/:id/sessions
GET    /api/v1/vehicles/:id/odometer-history
GET    /api/v1/vehicles/:id/analytics

# Charge Sessions
GET    /api/v1/charge-sessions
POST   /api/v1/charge-sessions
GET    /api/v1/charge-sessions/:id
PATCH  /api/v1/charge-sessions/:id
DELETE /api/v1/charge-sessions/:id
GET    /api/v1/charge-sessions/pending-odometer
POST   /api/v1/charge-sessions/:id/complete
POST   /api/v1/charge-sessions/:id/cancel

# Odometer
GET    /api/v1/odometer/readings
POST   /api/v1/odometer/readings
GET    /api/v1/odometer/readings/:id
GET    /api/v1/odometer/vehicle/:vehicleId/latest
POST   /api/v1/odometer/submit/:sessionId

# Stations
GET    /api/v1/stations
POST   /api/v1/stations
GET    /api/v1/stations/:id
PATCH  /api/v1/stations/:id
DELETE /api/v1/stations/:id

# Tariffs
GET    /api/v1/tariffs
POST   /api/v1/tariffs
GET    /api/v1/tariffs/:id
PATCH  /api/v1/tariffs/:id
DELETE /api/v1/tariffs/:id

# Analytics & Reports
GET    /api/v1/analytics/consumption
GET    /api/v1/analytics/costs
GET    /api/v1/analytics/vehicles/:id/summary
GET    /api/v1/analytics/fleet-summary
POST   /api/v1/reports/export

# Notifications
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/mark-seen

# Audit
GET    /api/v1/audit/logs
GET    /api/v1/audit/logs/:id
```

### API Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-11-27T10:30:00Z",
    "requestId": "uuid"
  }
}

// Paginated Response
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8,
    "timestamp": "2025-11-27T10:30:00Z"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "kwh",
        "message": "Must be a positive number"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-27T10:30:00Z",
    "requestId": "uuid"
  }
}
```

## 🚀 Deployment Architecture

### Локална VM конфигурация

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: ecar-db
    environment:
      POSTGRES_DB: ecar
      POSTGRES_USER: ecar_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis (Cache & Queue)
  redis:
    image: redis:7-alpine
    container_name: ecar-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Backend API
  api:
    build: ./backend
    container_name: ecar-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://ecar_user:${DB_PASSWORD}@postgres:5432/ecar
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
    restart: unless-stopped

  # Background Worker
  worker:
    build: ./backend
    container_name: ecar-worker
    command: npm run worker
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://ecar_user:${DB_PASSWORD}@postgres:5432/ecar
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Frontend
  frontend:
    build: ./frontend
    container_name: ecar-frontend
    volumes:
      - frontend_dist:/usr/share/nginx/html
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ecar-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - frontend_dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  frontend_dist:
```

### Nginx конфигурация

```nginx
# nginx.conf
upstream api_backend {
    server api:3000;
}

server {
    listen 80;
    server_name ecar.company.local;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ecar.company.local;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend SPA
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

## 📊 Monitoring & Observability

### Logging
- **Format:** JSON structured logs
- **Levels:** DEBUG, INFO, WARN, ERROR
- **Output:** stdout + файл ротация (logrotate)
- **Library:** Winston (Node.js) / Serilog (.NET) / structlog (Python)

### Metrics (Базово)
- Брой активни потребители
- Брой сесии на ден
- Брой pending одометри
- API response times
- Database connection pool status

### Alerts
- Неуспешни нотификации > 10 за 1 час
- Database connection errors
- Disk space < 20%
- Pending одометри > 48 часа

---

**Следваща стъпка:** ER модел и SQL схема
