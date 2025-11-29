# ECar Fleet Management - Backend API

NestJS REST API за управление на флота от електрически автомобили.

## 🚀 Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 14+ (TypeORM)
- **Cache & Queue**: Redis 7+ (BullMQ)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/              # Shared utilities, guards, interceptors
│   │   └── entities/        # Shared entities (AuditLog)
│   ├── config/              # Configuration files
│   ├── modules/
│   │   ├── auth/            # Authentication (JWT, Local strategies)
│   │   │   ├── guards/      # Auth guards (JWT, Local, Roles)
│   │   │   ├── strategies/  # Passport strategies
│   │   │   └── decorators/  # Custom decorators (@CurrentUser, @Roles)
│   │   ├── users/           # User management
│   │   ├── vehicles/        # Vehicle management
│   │   ├── charge-sessions/ # Charge session management
│   │   ├── odometer/        # Odometer readings
│   │   ├── stations/        # Charging stations
│   │   ├── tariffs/         # Tariff management
│   │   ├── notifications/   # Notification system
│   │   └── analytics/       # Analytics & reports
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ecar_fleet
DATABASE_USER=ecar_user
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRATION=15m

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📦 Installation

```bash
npm install
```

## 🏃 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

API will be available at: `http://localhost:3000`

## 📚 API Documentation

Swagger documentation: `http://localhost:3000/api/docs`

## 🔐 Authentication

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ecar.local",
  "password": "Password123!"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@ecar.local",
    "fullName": "Системен Администратор",
    "role": "admin"
  }
}
```

### Using JWT Token

Add Authorization header to all protected requests:

```bash
Authorization: Bearer <access_token>
```

## 🗄️ Database

### Entities (TypeORM)

- **User**: System users (admin, fleet_manager, driver)
- **Vehicle**: Electric vehicles in fleet
- **UserVehicle**: User-to-vehicle assignments
- **Station**: Charging stations
- **Tariff**: Charging tariffs
- **ChargeSession**: Charging sessions
- **OdometerReading**: Odometer readings
- **Notification**: User notifications
- **AuditLog**: Audit trail

### Migrations

```bash
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🔑 RBAC (Role-Based Access Control)

### Roles

- **admin**: Full system access
- **fleet_manager**: Limited admin access (can't manage users)
- **driver**: Own data only (vehicles, odometer, notifications)

### Using Roles in Controllers

```typescript
@Get()
@Roles(UserRole.ADMIN, UserRole.FLEET_MANAGER)
@ApiOperation({ summary: 'Get all users' })
findAll() {
  return this.usersService.findAll();
}
```

## 🎯 Key Endpoints

### Auth
- `POST /api/auth/login` - Login with email/password

### Users
- `GET /api/users` - Get all users (admin, fleet_manager)
- `GET /api/users/:id` - Get user by ID

### Vehicles
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/my-vehicles` - Get user's assigned vehicles (driver)
- `GET /api/vehicles/:id` - Get vehicle by ID

### Charge Sessions
- `GET /api/charge-sessions` - Get all sessions (admin, fleet_manager)
- `GET /api/charge-sessions/:id` - Get session by ID
- `POST /api/charge-sessions` - Create new session (admin)

### Odometer
- `GET /api/odometer/vehicle/:vehicleId` - Get all readings for vehicle
- `GET /api/odometer/vehicle/:vehicleId/latest` - Get latest reading
- `POST /api/odometer` - Create odometer reading (driver)

### Stations
- `GET /api/stations` - Get all active stations
- `GET /api/stations/:id` - Get station by ID

### Tariffs
- `GET /api/tariffs` - Get all active tariffs
- `GET /api/tariffs/:id` - Get tariff by ID

### Notifications
- `GET /api/notifications/my-notifications` - Get user's notifications

### Analytics
- `GET /api/analytics/vehicle/:id/statistics` - Get vehicle statistics

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🛠️ Development

### Generate Module

```bash
nest generate module modules/module-name
nest generate controller modules/module-name
nest generate service modules/module-name
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## 📊 Default Test Accounts

```
Admin:
  Email: admin@ecar.local
  Password: Password123!
  Role: admin

Fleet Manager:
  Email: manager@ecar.local
  Password: Password123!
  Role: fleet_manager

Driver 1:
  Email: driver1@ecar.local
  Password: Password123!
  Role: driver

Driver 2:
  Email: driver2@ecar.local
  Password: Password123!
  Role: driver
```

**Note**: Change default passwords in production!

## 🔄 Business Logic Flow

### 1. Admin Creates Charge Session

```
Admin → POST /charge-sessions
  ↓
Create session with status='pending_odometer'
  ↓
Trigger notification to assigned drivers
  ↓
Queue email job in Redis (BullMQ)
```

### 2. Driver Enters Odometer

```
Driver → POST /odometer
  ↓
Create odometer reading
  ↓
Calculate consumption (kWh/100km, BGN/100km) via DB trigger
  ↓
Update session status to 'completed'
```

### 3. Automated Reminders

```
Cron job (every hour)
  ↓
Check sessions pending > 24/48/72 hours
  ↓
Queue reminder emails
  ↓
Send via Nodemailer
```

## 🚦 Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 License

Private - ECar Fleet Management System
