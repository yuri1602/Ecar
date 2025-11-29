# План за внедряване

## 🎯 Обща стратегия

Проектът ще се развие на етапи с фокус върху доставяне на работещи функционалности бързо и итеративно. Всеки етап добавя стойност и може да се ползва самостоятелно.

## 📅 Roadmap Overview

```
MVP (4-6 седмици) ─────► v1.0 (2-3 седмици) ─────► v2.0 (4-6 седмици)
      │                        │                          │
      │                        │                          │
  Основни                Подобрения               Автоматизация
  функции                и филтри                 и интеграции
```

---

## 🚀 MVP (Minimum Viable Product) - Седмици 1-6

### Цел
Работеща система за ръчно въвеждане на зарядни сесии, нотификации към шофьори за одометър и базови отчети.

### Sprint 1: Foundation (Седмици 1-2)

#### Week 1: Инфраструктура и база данни

**Задачи:**
- [ ] Setup на development environment
  - [ ] Инсталация на PostgreSQL 14
  - [ ] Инсталация на Redis
  - [ ] Setup на Git repository
  - [ ] Създаване на docker-compose за локална разработка

- [ ] Database схема
  - [ ] Създаване на всички таблици (users, vehicles, charge_sessions, и т.н.)
  - [ ] Seed данни за тестване
  - [ ] Database migrations setup (TypeORM/Prisma)
  - [ ] Индекси и constraints

- [ ] Backend scaffold
  - [ ] NestJS проект setup
  - [ ] Конфигурация (env variables)
  - [ ] Database connection
  - [ ] Logger setup (Winston)
  - [ ] Error handling middleware

**Deliverables:**
- ✅ Работеща база данни с всички таблици
- ✅ Backend skeleton с основна структура
- ✅ Docker Compose за локална среда

#### Week 2: Authentication & User Management

**Задачи:**
- [ ] Authentication
  - [ ] JWT token generation/validation
  - [ ] Login endpoint
  - [ ] Logout endpoint
  - [ ] Password hashing (bcrypt)
  - [ ] Refresh token mechanism

- [ ] User Management
  - [ ] CRUD операции за потребители
  - [ ] RBAC middleware
  - [ ] Permission checking
  - [ ] Seed admin user

- [ ] API Documentation
  - [ ] Swagger/OpenAPI setup
  - [ ] Документация на auth endpoints

**Deliverables:**
- ✅ Работеща автентификация
- ✅ RBAC система
- ✅ API документация

**Testing:**
```bash
# Login test
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecar.local","password":"admin123"}'

# Expected: { "accessToken": "...", "refreshToken": "...", "user": {...} }
```

---

### Sprint 2: Core Functionality (Седмици 3-4)

#### Week 3: Vehicle & Session Management

**Задачи:**
- [ ] Vehicle Management
  - [ ] CRUD endpoints за автомобили
  - [ ] Валидации
  - [ ] User-Vehicle assignments
  - [ ] Списък с филтри

- [ ] Charge Session Management
  - [ ] Create session endpoint
  - [ ] Валидации (дати, kWh, цена)
  - [ ] Намиране на последен одометър
  - [ ] Update/Delete session
  - [ ] List sessions с филтри

- [ ] Базова логика за одометър
  - [ ] Запис на одометър показание
  - [ ] Изчисляване на разходи (kWh/100km, лв/100km)
  - [ ] Обновяване на session status

**Deliverables:**
- ✅ CRUD за автомобили
- ✅ CRUD за сесии
- ✅ Базова одометър логика

**Testing:**
```bash
# Create vehicle
POST /api/vehicles
{
  "registrationNo": "CA1234AB",
  "make": "Tesla",
  "model": "Model 3",
  "year": 2022,
  "batteryCapacityKwh": 75.0
}

# Create charge session
POST /api/charge-sessions
{
  "vehicleId": "...",
  "startedAt": "2025-11-27T14:30:00Z",
  "endedAt": "2025-11-27T15:45:00Z",
  "kwhCharged": 45.5,
  "priceTotal": 18.20
}
```

#### Week 4: Notification System

**Задачи:**
- [ ] Email Service
  - [ ] SMTP configuration (Nodemailer)
  - [ ] Email templates (Handlebars)
  - [ ] Send email function
  - [ ] Test email sending

- [ ] Notification System
  - [ ] Notification model и CRUD
  - [ ] Create notification on session creation
  - [ ] Queue system (BullMQ + Redis)
  - [ ] Worker process за изпращане

- [ ] Odometer Entry Logic
  - [ ] Link generation за одометър форма
  - [ ] API endpoint за одометър въвеждане
  - [ ] Автоматично изчисляване при запис
  - [ ] Session status update

**Deliverables:**
- ✅ Email нотификации
- ✅ Job queue система
- ✅ Одометър entry flow

**Testing:**
```bash
# Test notification flow
1. Create session → Email изпратен
2. Check notification status in DB
3. Open email link
4. Submit odometer reading
5. Verify calculations
```

---

### Sprint 3: Frontend & Integration (Седмици 5-6)

#### Week 5: Frontend Setup & Admin Panel

**Задачи:**
- [ ] Frontend Project Setup
  - [ ] Vite + React + TypeScript
  - [ ] Tailwind CSS + shadcn/ui
  - [ ] React Router setup
  - [ ] API client (axios + React Query)
  - [ ] Auth context & protected routes

- [ ] Admin Panel - Part 1
  - [ ] Login page
  - [ ] Dashboard layout (header, sidebar)
  - [ ] Vehicles list page
  - [ ] Vehicle create/edit form
  - [ ] Sessions list page

- [ ] Admin Panel - Part 2
  - [ ] Create session form
  - [ ] Session detail view
  - [ ] Basic dashboard KPIs
  - [ ] User management (basic)

**Deliverables:**
- ✅ Работещ frontend skeleton
- ✅ Admin login и dashboard
- ✅ CRUD за автомобили и сесии

#### Week 6: Driver Portal & Testing

**Задачи:**
- [ ] Driver Portal
  - [ ] Driver dashboard
  - [ ] Pending odometers list
  - [ ] Odometer entry form
  - [ ] Success screen с резултати
  - [ ] Vehicle history view

- [ ] Mobile Optimization
  - [ ] Responsive design за всички страници
  - [ ] Touch-friendly forms
  - [ ] Mobile navigation

- [ ] Integration & Testing
  - [ ] End-to-end тестване на flow-овете
  - [ ] Bug fixing
  - [ ] Performance optimization
  - [ ] User acceptance testing (UAT)

**Deliverables:**
- ✅ Функционален driver portal
- ✅ Mobile-friendly UI
- ✅ Тествана и работеща система

---

### MVP Deployment Checklist

```
Infrastructure:
[ ] VM с Ubuntu Server 22.04 LTS
[ ] Docker & Docker Compose инсталирани
[ ] PostgreSQL 14 container
[ ] Redis container
[ ] Nginx reverse proxy
[ ] SSL сертификат (Let's Encrypt или self-signed за LAN)

Application:
[ ] Backend build и deploy
[ ] Frontend build и deploy
[ ] Environment variables конфигурирани
[ ] Database migrations изпълнени
[ ] Seed данни заредени

Services:
[ ] SMTP сървър конфигуриран
[ ] Email templates проверени
[ ] Worker process стартиран
[ ] Cron jobs за reminders

Monitoring:
[ ] Application logs
[ ] Health check endpoint
[ ] Basic error tracking

Documentation:
[ ] User manual за админи
[ ] User manual за шофьори
[ ] API документация
[ ] Deployment guide
```

---

## 📈 v1.0 - Подобрения (Седмици 7-9)

### Цел
Подобряване на потребителското изживяване, разширени филтри и отчети, автоматични напомняния.

### Features:

#### 1. Автоматични напомняния (Седмица 7)
- [ ] Cron job за проверка на pending одометри
- [ ] First reminder (24h)
- [ ] Second reminder (48h)
- [ ] Escalation към fleet manager (72h)
- [ ] Email templates за напомняния
- [ ] Dashboard widget за admins

**Success Criteria:**
- ✅ Напомняния изпращат се автоматично
- ✅ Admins виждат алерти за стари pending

#### 2. Разширени отчети и експорт (Седмица 8)
- [ ] Филтри по период, автомобил, шофьор, станция
- [ ] Агрегирани данни:
  - [ ] По автомобил
  - [ ] По шофьор
  - [ ] По месец
  - [ ] По станция
- [ ] Визуализации (charts):
  - [ ] Line chart за разход
  - [ ] Bar chart за цени
  - [ ] Pie chart за разпределение
- [ ] Експорт в Excel/CSV
- [ ] Scheduled reports (опция)

**Success Criteria:**
- ✅ Детайлни филтри и visualization
- ✅ Експорт работи за всички отчети

#### 3. Station & Tariff Management (Седмица 9)
- [ ] CRUD за станции
- [ ] CRUD за тарифи
- [ ] Автоматично изчисляване на цена от тарифа
- [ ] История на тарифи
- [ ] Валидация на цени спрямо тарифи

**Success Criteria:**
- ✅ Пълно управление на станции и тарифи
- ✅ Автоматично ценообразуване

---

## 🚀 v2.0 - Автоматизация и интеграции (Седмици 10-15)

### Цел
Интеграция с външни charging платформи, advanced analytics, mobile app.

### Features:

#### 1. Charging Platform Integration (Седмици 10-11)
- [ ] API integration с популярна платформа (напр. ChargePoint, EVN)
- [ ] Автоматично импортиране на сесии
- [ ] Sync на станции и тарифи
- [ ] Webhook за real-time updates
- [ ] Conflict resolution (ръчни vs автоматични сесии)

**Success Criteria:**
- ✅ Автоматично създаване на сесии от платформата
- ✅ Синхронизация без дублиране

#### 2. Advanced Analytics & BI (Седмица 12)
- [ ] Predictive analytics:
  - [ ] Прогноза за разходи
  - [ ] Оптимални време за зареждане
  - [ ] Battery health tracking
- [ ] Comparative analytics:
  - [ ] Сравнение между автомобили
  - [ ] Benchmark спрямо индустриални стандарти
- [ ] Custom dashboards
- [ ] Scheduled email reports

**Success Criteria:**
- ✅ Advanced metrics и прогнози
- ✅ Scheduled reports

#### 3. Mobile App (Седмици 13-15)
- [ ] React Native / Flutter app
- [ ] Push notifications
- [ ] Offline support
- [ ] Camera за снимка на одометър (OCR)
- [ ] QR code scanning за бърз одометър entry
- [ ] Location tracking (optional)

**Success Criteria:**
- ✅ Native mobile app за iOS/Android
- ✅ Push notifications работят
- ✅ OCR за одометър

#### 4. Multi-tenancy (Седмица 15)
- [ ] Support за множество организации
- [ ] Separate databases или schema per tenant
- [ ] Tenant admin роля
- [ ] Billing integration (опция)

**Success Criteria:**
- ✅ Една инсталация обслужва множество компании

---

## 📊 Development Process

### Agile Methodology

```
Sprint Planning (Week Start):
  ├─ Review priorities
  ├─ Estimate tasks
  ├─ Assign responsibilities
  └─ Define success criteria

Daily Standups (15 min):
  ├─ What did I do yesterday?
  ├─ What will I do today?
  └─ Any blockers?

Sprint Review (Week End):
  ├─ Demo completed features
  ├─ Stakeholder feedback
  └─ Update backlog

Sprint Retrospective:
  ├─ What went well?
  ├─ What can improve?
  └─ Action items
```

### Git Workflow

```
main (production)
  └─ develop (staging)
      ├─ feature/vehicle-management
      ├─ feature/notification-system
      ├─ feature/driver-portal
      └─ bugfix/odometer-validation

Branch naming:
  - feature/<feature-name>
  - bugfix/<bug-name>
  - hotfix/<critical-fix>

Commit messages:
  - feat: Add vehicle CRUD endpoints
  - fix: Correct odometer calculation
  - docs: Update API documentation
  - refactor: Improve notification service
  - test: Add unit tests for session service
```

### Code Review Process

```
1. Developer creates PR
2. Automated checks run:
   ├─ Linting (ESLint)
   ├─ Type checking (TypeScript)
   ├─ Unit tests
   └─ Build verification

3. Peer review (1-2 reviewers)
   ├─ Code quality
   ├─ Architecture alignment
   ├─ Security considerations
   └─ Test coverage

4. Approval → Merge to develop
5. CI/CD → Deploy to staging
6. QA testing
7. Merge to main → Deploy to production
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Example: Odometer calculation test
describe('OdometerService', () => {
  it('should calculate kWh per 100km correctly', () => {
    const result = calculateKwhPer100km(45.5, 200);
    expect(result).toBe(22.75);
  });

  it('should throw error if distance is zero', () => {
    expect(() => calculateKwhPer100km(45.5, 0))
      .toThrow('Distance must be greater than zero');
  });
});

// Target: 80% code coverage
```

### Integration Tests
```typescript
describe('Charge Session Flow', () => {
  it('should create session and send notification', async () => {
    const session = await request(app)
      .post('/api/charge-sessions')
      .send(mockSessionData)
      .expect(201);

    const notification = await db.notifications.findFirst({
      where: { sessionId: session.body.id }
    });

    expect(notification).toBeDefined();
    expect(notification.status).toBe('queued');
  });
});
```

### E2E Tests (Playwright)
```typescript
test('Admin creates session and driver enters odometer', async ({ page }) => {
  // 1. Admin login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Create session
  await page.goto('/admin/sessions/new');
  await page.selectOption('[name="vehicleId"]', 'vehicle-1');
  // ... fill form
  await page.click('button:has-text("Запази")');

  // 3. Driver opens odometer link
  const odometerLink = await getOdometerLinkFromEmail();
  await page.goto(odometerLink);

  // 4. Enter odometer
  await page.fill('[name="currentKm"]', '45434');
  await page.click('button:has-text("Запази")');

  // 5. Verify success
  await expect(page.locator('text=Успешно')).toBeVisible();
});
```

---

## 📦 Deployment

### Staging Environment

```yaml
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/ecar_staging
REDIS_URL=redis://staging-redis:6379
APP_URL=https://staging.ecar.company.local
SMTP_HOST=smtp-test.company.local
LOG_LEVEL=debug
```

### Production Environment

```yaml
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/ecar
REDIS_URL=redis://prod-redis:6379
APP_URL=https://ecar.company.local
SMTP_HOST=smtp.company.local
LOG_LEVEL=info

# Security
JWT_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>
BCRYPT_ROUNDS=12

# Monitoring
SENTRY_DSN=<sentry-dsn>
```

### CI/CD Pipeline (GitHub Actions example)

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          ssh deploy@staging-server "cd /app && \
            git pull origin develop && \
            docker-compose down && \
            docker-compose up -d --build"

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh deploy@prod-server "cd /app && \
            git pull origin main && \
            docker-compose down && \
            docker-compose up -d --build"
```

---

## 📚 Documentation Deliverables

### For Development Team
- [x] Architecture documentation (този файл)
- [x] Database schema documentation
- [x] API documentation (Swagger)
- [ ] Setup guide
- [ ] Contributing guidelines

### For Users
- [ ] Admin user manual
  - [ ] Как да създам автомобил
  - [ ] Как да създам зареждане
  - [ ] Как да преглеждам отчети
  - [ ] Как да управлявам потребители

- [ ] Driver user manual
  - [ ] Как да вход в системата
  - [ ] Как да въведа одометър
  - [ ] Как да прегледам история

- [ ] FAQ
- [ ] Troubleshooting guide

### For Ops Team
- [ ] Deployment guide
- [ ] Backup & restore procedures
- [ ] Monitoring setup
- [ ] Incident response playbook

---

## 🎯 Success Metrics

### MVP Success Criteria
- ✅ 100% от зарежданията се въвеждат в системата
- ✅ 90%+ от одометрите се въвеждат в рамките на 48 часа
- ✅ 0 critical bugs след 1 седмица production
- ✅ <2 секунди load time за всички страници
- ✅ Email delivery rate >95%

### v1.0 Success Criteria
- ✅ Напомнянията намаляват pending одометри с 30%
- ✅ Admins използват отчетите поне 3 пъти седмично
- ✅ Export функцията се използва редовно

### v2.0 Success Criteria
- ✅ >50% от сесиите идват автоматично от платформата
- ✅ Mobile app adoption >70% от шофьорите
- ✅ OCR accuracy >90%

---

## 📞 Support & Maintenance

### Support Channels
- **Email:** support@ecar.company.local
- **Internal chat:** #ecar-support
- **Documentation:** https://docs.ecar.company.local

### Maintenance Windows
- **Scheduled:** Всяка неделя 02:00-04:00
- **Emergency:** Когато е необходимо (с предизвестие)

### SLA Targets
- **Uptime:** 99.5% (≈3.65 часа downtime/месец)
- **Response time:** <500ms за 95% от заявките
- **Support response:** <4 часа за critical issues

---

## ✅ Final Checklist за MVP Launch

```
Technical:
[ ] Всички features от MVP са имплементирани
[ ] Unit tests coverage >70%
[ ] Integration tests минават успешно
[ ] E2E tests минават успешно
[ ] Security audit завършен
[ ] Performance testing завършено
[ ] Database backups автоматизирани

Documentation:
[ ] User manuals готови
[ ] API documentation публикувана
[ ] Deployment guide готов
[ ] Runbook за инциденти готов

Training:
[ ] Admin training проведен
[ ] Driver training проведен
[ ] Support team обучен

Launch:
[ ] Production environment готова
[ ] Monitoring setup завършен
[ ] SSL certificates инсталирани
[ ] Email система работи
[ ] Backups тествани
[ ] Rollback plan готов

Go-Live:
[ ] Communication изпратена до всички users
[ ] Support team на standby
[ ] Monitoring активен
[ ] First day incident log

Post-Launch (First Week):
[ ] Daily check-ins с users
[ ] Bug tracking и prioritization
[ ] Performance monitoring
[ ] Feedback collection
```

---

**Системата е готова за развитие! Успех при внедряването! 🚀**
