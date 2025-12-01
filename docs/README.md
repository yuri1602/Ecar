# ECar Fleet Management System - Документация

## 📚 Съдържание

Това е пълна архитектурна и техническа документация за системата за управление на електромобилен автопарк.

### Документи

1. **[Архитектура](./01_ARCHITECTURE.md)**
   - Системна архитектура и компоненти
   - Технологичен стек (Node.js/NestJS, React, PostgreSQL)
   - Deployment архитектура
   - API дизайн

2. **[База данни](./02_DATABASE_SCHEMA.md)**
   - ER модел и връзки
   - SQL схема (PostgreSQL)
   - Таблици, индекси, тригери
   - Views и помощни функции
   - Seed данни

3. **[Бизнес логика](./03_BUSINESS_LOGIC.md)**
   - Създаване на зарядна сесия
   - Въвеждане на одометър
   - Изчисляване на разходи (kWh/100km, лв/100km)
   - Формули и SQL заявки за отчети
   - Бизнес правила и валидации

4. **[Нотификации](./04_NOTIFICATIONS.md)**
   - Нотификационна архитектура
   - Email templates (Handlebars)
   - Job queue (BullMQ + Redis)
   - Автоматични напомняния
   - Псевдокод и имплементация

5. **[UI/UX Спецификация](./05_UI_UX_SPECIFICATION.md)**
   - Design principles
   - Admin panel wireframes
   - Driver portal дизайн
   - Mobile optimization
   - Component library

6. **[Сигурност и RBAC](./06_SECURITY_RBAC.md)**
   - Authentication (JWT, OIDC)
   - Role-Based Access Control
   - Permissions и ограничения
   - Audit trail
   - GDPR compliance
   - Security best practices

7. **[План за внедряване](./07_IMPLEMENTATION_PLAN.md)**
   - MVP roadmap (6 седмици)
   - v1.0 features (3 седмици)
   - v2.0 vision (6 седмици)
   - Agile процес
   - Testing strategy
   - Deployment checklist

## 🎯 Цел на системата

Системата управлява флот от електромобили, като:
- Администраторите ръчно въвеждат зарядни сесии
- Шофьорите получават нотификация и въвеждат одометър
- Системата автоматично изчислява разход (kWh/100km, лв/100km)
- Генерира подробни отчети и аналитика

## 🚀 Quick Start

### Предпоставки
- Node.js 20 LTS
- PostgreSQL 14+
- Redis 7+
- SMTP сървър (за email нотификации)

### Инсталация

```bash
# Clone repository
git clone <repo-url>
cd ecar

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Database setup
npm run migration:run
npm run seed

# Start backend
npm run start:dev

# Frontend setup (separate terminal)
cd ../frontend
npm install
cp .env.example .env
# Edit .env with backend URL

# Start frontend
npm run dev
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Access:
# - Frontend: http://localhost:3001
# - Backend API: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

## 👥 Роли и права

### Admin
- Пълен достъп до всички функции
- Управление на потребители, автомобили, станции
- Създаване и редакция на зарядни сесии
- Достъп до всички отчети и audit logs

### Fleet Manager
- Управление на автомобили и зарядни сесии
- Преглед на отчети и експорт
- Одобряване на одометър показания
- Без права за user management и settings

### Driver
- Преглед на свои автомобили
- Въвеждане на одометър за свои зарядни сесии
- Преглед на своя история и разходи
- Ограничен достъп само до свои данни

## 📊 Основни процеси

### 1. Създаване на зареждане (Admin)
```
Admin → Нова сесия → Избор автомобил → Въвеждане kWh, цена
  ↓
Системата намира последен одометър
  ↓
Създава нотификация → Изпраща email до шофьор
  ↓
Сесията е в статус "pending_odometer"
```

### 2. Въвеждане на одометър (Driver)
```
Шофьор получава email → Отваря линк
  ↓
Вижда последни известни километри
  ↓
Въвежда текущи километри
  ↓
Системата изчислява:
  - Изминати километри
  - kWh/100km
  - лв/100km
  ↓
Сесията става "completed"
```

## 📈 KPI и метрики

### Оперативни
- Брой зарядни сесии на ден/месец
- Брой pending одометри
- Време за въвеждане на одометър (среден)
- Email delivery rate

### Бизнес
- Общ разход за флота (лв)
- Обща енергия (kWh)
- Общо изминати километри
- Среден разход по автомобил (kWh/100km, лв/100km)
- Разход по шофьор, станция, период

## 🔧 Технологии

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS
- **Database:** PostgreSQL 14+
- **Cache/Queue:** Redis 7+
- **ORM:** TypeORM / Prisma
- **Authentication:** JWT + Passport.js
- **Email:** Nodemailer
- **Jobs:** BullMQ

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui (Radix + Tailwind)
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

### Infrastructure
- **Reverse Proxy:** Nginx
- **Containerization:** Docker + Docker Compose
- **Process Manager:** PM2 (optional)

## 🛡️ Сигурност

- JWT tokens (Access 15 мин, Refresh 7 дни)
- RBAC с granular permissions
- Rate limiting на endpoints
- Input validation и sanitization
- SQL injection prevention (ORM)
- XSS prevention (CSP headers)
- Audit trail за всички критични действия
- GDPR compliance (data export, deletion)

## 📞 Поддръжка

### Логове
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Audit logs: Database таблица `audit_logs`

### Monitoring Endpoints
- Health: `GET /health`
- Metrics: `GET /metrics` (Prometheus format)
- API Docs: `GET /api/docs` (Swagger)

### Backup
- Database: Автоматичен backup всеки ден в 03:00
- Audit logs: Архивиране след 90 дни
- Retention: 7 години

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Proprietary - Internal use only

## 📧 Контакти

- **Email:** support@ecar.company.local
- **Documentation:** https://docs.ecar.company.local
- **Issue Tracker:** https://jira.company.local/projects/ECAR

---

**Изготвено:** Ноември 2025  
**Версия:** 1.0  
**Автори:** ECar Development Team



Ето стъпките за стартиране на ECar Fleet Management System:

🚀 Стартиране на проекта
1. Стартирай Docker контейнерите (PostgreSQL, Redis, pgAdmin)
2. Стартирай Backend (NestJS)
Backend ще стартира на: http://localhost:3000

3. Стартирай Frontend (React + Vite)
Frontend ще стартира на: http://localhost:5173

4. Отвори приложението в браузър
Отвори: http://localhost:5173

👤 Тестови акаунти
Всички имат парола: Password123!

Admin: admin@ecar.local
Fleet Manager: manager@ecar.local
Driver 1: driver1@ecar.local
Driver 2: driver2@ecar.local
🔍 Допълнителни инструменти
Swagger API Docs: http://localhost:3000/api/docs
pgAdmin: http://localhost:5050 (admin@admin.com / admin)
Redis Commander: http://localhost:8081
🛑 Спиране на проекта
Важно: Уверете се, че Docker Desktop работи преди да стартирате проекта!