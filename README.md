# ECar Fleet Management System

Система за управление на електромобилен автопарк с отчитане на зареждания, километраж и разходи.

## 🚀 Quick Start

### Предпоставки

- Node.js 20 LTS
- Docker & Docker Compose
- Git

### Инсталация

1. **Clone repository**
```bash
git clone <repository-url>
cd Ecar
```

2. **Стартиране на инфраструктурата (PostgreSQL + Redis)**
```bash
docker-compose up -d postgres redis
```

3. **Backend setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migration:run

# Seed database
npm run seed

# Start development server
npm run start:dev
```

4. **Frontend setup** (в нов терминал)
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL

# Start development server
npm run dev
```

5. **Достъп до приложението**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- pgAdmin: http://localhost:5050
- Redis Commander: http://localhost:8081

### Default Login Credentials (MVP)

**Admin:**
- Email: `admin@ecar.local`
- Password: `Admin123!`

**Fleet Manager:**
- Email: `manager@ecar.local`
- Password: `Manager123!`

**Driver:**
- Email: `driver@ecar.local`
- Password: `Driver123!`

## 📁 Структура на проекта

```
Ecar/
├── backend/               # NestJS backend
├── frontend/              # React frontend
├── database/              # Database migrations & seeds
├── docs/                  # Пълна документация
├── docker-compose.yml     # Docker services
└── README.md
```

## 📚 Документация

Пълната архитектурна и техническа документация се намира в папка `docs/`:

- [Архитектура](./docs/01_ARCHITECTURE.md)
- [База данни](./docs/02_DATABASE_SCHEMA.md)
- [Бизнес логика](./docs/03_BUSINESS_LOGIC.md)
- [Нотификации](./docs/04_NOTIFICATIONS.md)
- [UI/UX](./docs/05_UI_UX_SPECIFICATION.md)
- [Сигурност](./docs/06_SECURITY_RBAC.md)
- [План за внедряване](./docs/07_IMPLEMENTATION_PLAN.md)
- [Production Deployment (Ubuntu)](./docs/08_PRODUCTION_DEPLOYMENT.md)
- [Миграция на данни](./docs/09_DATA_MIGRATION.md)

## 🛠️ Development

### Backend Commands

```bash
cd backend

# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Database
npm run migration:create   # Create new migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database

# Testing
npm run test               # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage

# Build
npm run build             # Production build
npm run start:prod        # Start production
```

### Frontend Commands

```bash
cd frontend

# Development
npm run dev               # Start dev server
npm run build             # Production build
npm run preview           # Preview production build

# Linting
npm run lint              # Run ESLint
npm run lint:fix          # Fix lint errors

# Testing
npm run test              # Run tests
```

## 🐳 Docker

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f [service-name]
```

### Rebuild services
```bash
docker-compose up -d --build
```

## 🔧 Environment Variables

Вижте `.env.example` за пълен списък на променливи. 

### SMTP Configuration (SuperHosting)
За да работят имейлите коректно през SuperHosting:
- **Host:** `mail.albena.bg`
- **Port:** `26` (Non-SSL/StartTLS)
- **Secure:** `false`
- **User:** `ecar@albena.bg`
- **Password:** (Use the specific app password)
- **From:** `ecar@albena.bg`

### Основни променливи:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key за JWT tokens

## 📊 Database Management

### pgAdmin
- URL: http://localhost:5050
- Email: `admin@ecar.local`
- Password: `admin`

### Connection в pgAdmin:
- Host: `postgres`
- Port: `5432`
- Database: `ecar`
- Username: `ecar_user`
- Password: `ecar_password_dev`

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:e2e         # E2E tests
npm run test:cov         # With coverage

# Frontend tests
cd frontend
npm run test
```

## 🚀 Deployment

Вижте [Implementation Plan](./docs/07_IMPLEMENTATION_PLAN.md) за детайлни инструкции за deployment.

### Production Build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve from dist/ folder
```

## 🤝 Contributing

1. Create feature branch from `develop`
2. Make changes
3. Write tests
4. Submit pull request

## 📝 License

Proprietary - Internal use only

## 📧 Support

- Email: support@ecar.company.local
- Documentation: ./docs/
- Issues: GitHub Issues

---

**Версия:** MVP 1.0  
**Дата:** Ноември 2025
