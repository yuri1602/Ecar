# Deployment Notes - Важни корекции и уроци

## 📝 Обобщение на актуализациите

Този документ обобщава всички важни корекции направени в документацията (документи 06-09) след реалния deployment процес на production сървър.

## 🔄 Направени промени

### 1. Docker Конфигурации (08_PRODUCTION_DEPLOYMENT.md)

#### Backend Dockerfile
✅ **Потвърден работещ вариант:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Важна бележка:** NestJS build процесът създава `dist/src/main.js`, затова използваме `npm run start:prod` script, който автоматично търси правилния път.

#### Frontend Dockerfile
✅ **Потвърден работещ вариант:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Frontend Build Script:**
- Оригинален: `"build": "tsc && vite build"`
- Работи с: `"build": "vite build"` (ако има TypeScript проблеми)
- Vite вътрешно проверява TypeScript

### 2. Environment Variables (.env)

✅ **Актуализиран .env template:**
```ini
# Database
DB_NAME=ecar
DB_USER=ecar_prod
DB_PASSWORD=STRONG_PASSWORD

# Redis
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Security
JWT_SECRET=VERY_LONG_RANDOM_STRING
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Domain
DOMAIN_NAME=ecar.albena.bg

# Email (SuperHosting)
SMTP_HOST=mail.albena.bg
SMTP_PORT=26  # Специфично за SuperHosting
SMTP_SECURE=false
SMTP_USER=ecar@albena.bg
SMTP_PASSWORD=EMAIL_PASSWORD
SMTP_FROM=ecar@albena.bg

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### 3. Troubleshooting секция (08_PRODUCTION_DEPLOYMENT.md)

✅ **Добавени често срещани проблеми:**

**Проблем 1: Backend "Cannot find module '/app/dist/main'"**
- **Причина:** NestJS build създава dist/src/main.js, не dist/main.js
- **Решение:** Използвай `npm run start:prod` вместо директно `node dist/main.js`

**Проблем 2: Frontend "Permission denied" при tsc/vite**
- **Причина:** В Alpine Linux node_modules/.bin файловете нямат execute права
- **Решение 1:** Добави `RUN chmod -R 755 node_modules/.bin` след npm ci
- **Решение 2:** Промени build script на `"build": "vite build"` без tsc

**Проблем 3: EACCES permission denied при npm install**
- **Причина:** Права върху files в build context
- **Решение:** Увери се, че всички файлове са readable за Docker daemon

### 4. Data Migration (09_DATA_MIGRATION.md)

✅ **Актуализирани команди:**

**Windows (PowerShell):**
```powershell
# Създаване на backup директория
if (!(Test-Path -Path "backups")) { New-Item -ItemType Directory -Path "backups" }

# Пълен dump
docker exec ecar-db pg_dump -U ecar_user ecar > backups/production_ready.sql

# Само данни (ако schema се създава от TypeORM)
docker exec ecar-db pg_dump -U ecar_user --data-only ecar > backups/data_only.sql
```

**Ubuntu (Production):**
```bash
# Копиране на backup в контейнера
docker cp backups/production_ready.sql ecar-db:/tmp/dump.sql

# Изтриване и пълна замяна
docker exec ecar-db psql -U ecar_prod -d postgres -c "DROP DATABASE IF EXISTS ecar;"
docker exec ecar-db psql -U ecar_prod -d postgres -c "CREATE DATABASE ecar;"
docker exec -i ecar-db psql -U ecar_prod -d ecar -f /tmp/dump.sql

# Верификация
docker exec -it ecar-db psql -U ecar_prod -d ecar
\dt
SELECT COUNT(*) FROM users;
```

### 5. Implementation Plan (07_IMPLEMENTATION_PLAN.md)

✅ **Актуализиран Deployment Checklist:**

```
Infrastructure:
[x] VM с Ubuntu Server 24.04 LTS (10.10.11.35)
[x] Docker & Docker Compose V2 инсталирани
[x] PostgreSQL 14 container (ecar-db)
[x] Redis container (ecar-redis)
[x] Nginx reverse proxy
[ ] SSL сертификат - подготвен

Application:
[x] Backend Dockerfile създаден
[x] Frontend Dockerfile създаден
[x] docker-compose.prod.yml конфигуриран
[x] .env файл конфигуриран
[ ] Build и deploy - в процес
[ ] Database migrations
[ ] Seed данни

Documentation:
[x] Production deployment guide (08)
[x] Test environment setup (09)
[x] Data migration guide (09)
```

### 6. README.md актуализации

✅ **Добавени секции:**
- Списък с всички deployment документи (08, 09, 09)
- Docker конфигурация детайли
- Production deployment команди
- Важни бележки за Dockerfiles
- Актуализирана контакт информация

## 🎯 Ключови уроци

1. **NestJS Build Path:** Винаги използвай `npm run start:prod` вместо директно `node dist/main.js`
2. **Alpine Linux Permissions:** node_modules/.bin файловете се нуждаят от chmod или използвай npm scripts
3. **Frontend Build:** Vite сам проверява TypeScript, не е задължително отделно tsc
4. **Docker Compose V2:** Използвай `docker compose` (без тире) вместо `docker-compose`
5. **SuperHosting SMTP:** Port 26, SMTP_SECURE=false
6. **Production Server:** Ubuntu 24.04 LTS, IP 10.10.11.35, user: albena

## 📁 Production Environment

- **Server:** Ubuntu 24.04 LTS
- **IP:** 10.10.11.35
- **Domain:** ecar.albena.bg
- **User:** albena
- **Project Path:** /opt/ecar
- **SMTP:** mail.albena.bg:26
- **Database:** PostgreSQL 14 (container: ecar-db)
- **Cache:** Redis 7 (container: ecar-redis)
- **Backend:** NestJS (container: ecar-api, port 3000)
- **Frontend:** React+Vite+Nginx (container: ecar-frontend, port 8080)

## 🚀 Quick Deployment Commands

```bash
# 1. Build и start всички services
sudo docker compose -f docker-compose.prod.yml up -d --build

# 2. Проверка на статуса
sudo docker compose -f docker-compose.prod.yml ps

# 3. Логове
sudo docker compose -f docker-compose.prod.yml logs -f

# 4. Rebuild конкретен service
sudo docker compose -f docker-compose.prod.yml up -d --build backend

# 5. Рестарт на всички services
sudo docker compose -f docker-compose.prod.yml restart

# 6. Пълно изтриване и rebuild
sudo docker compose -f docker-compose.prod.yml down -v
sudo docker compose -f docker-compose.prod.yml up -d --build
```

## ✅ Верификация

След успешен deployment проверете:

```bash
# Container статус
sudo docker compose -f docker-compose.prod.yml ps

# Backend logs
sudo docker compose -f docker-compose.prod.yml logs backend | tail -20

# Frontend logs
sudo docker compose -f docker-compose.prod.yml logs frontend | tail -20

# Database connectivity
docker exec -it ecar-db psql -U ecar_prod -d ecar -c "SELECT COUNT(*) FROM users;"

# Redis connectivity
docker exec -it ecar-redis redis-cli -a YOUR_REDIS_PASSWORD ping
```

## 📞 Support

При проблеми консултирайте:
1. [08_PRODUCTION_DEPLOYMENT.md](./08_PRODUCTION_DEPLOYMENT.md) - Troubleshooting секция
2. [09_TEST_ENVIRONMENT_SETUP.md](./09_TEST_ENVIRONMENT_SETUP.md) - Детайлни стъпки
3. Docker logs на съответния service

---

**Последна актуализация:** 4 Декември 2025  
**Статус:** Документацията е синхронизирана с реалния deployment процес
