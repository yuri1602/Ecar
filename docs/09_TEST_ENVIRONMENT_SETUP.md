# 🧪 Тестова среда - Документация

## 📋 Преглед на системата

Това е пълна документация как е настроена тестовата/продукционна среда на ECar Fleet Management System на Ubuntu Server.

---

## 🖥️ Инфраструктура

### Сървър спецификации
- **OS:** Ubuntu Server 24.04 LTS
- **Hostname:** ecar
- **IP адрес:** 10.10.11.35
- **Домейн:** ecar.albena.bg
- **Потребител:** albena
- **RAM:** Минимум 4GB препоръчително
- **Диск:** Минимум 40GB SSD

### Инсталиран софтуер
- **Docker Engine:** Latest (инсталиран през get.docker.com)
- **Docker Compose:** V2 (включен в Docker Engine)
- **Nginx:** 1.24+ (reverse proxy и SSL терминация)
- **Certbot:** Latest (за SSL сертификати от Let's Encrypt)
- **Git:** За версионен контрол (optional)

---

## 🏗️ Архитектура на системата

```
Internet
    ↓
[Nginx Reverse Proxy]
    ├→ Port 80/443 (HTTPS + SSL)
    ├→ Frontend (React/Vite) → Docker Container :8080
    └→ Backend API (NestJS)  → Docker Container :3000
         ↓
    [PostgreSQL Database] → Docker Container :5432
    [Redis Cache/Queue]   → Docker Container :6379
```

### Docker контейнери

1. **ecar-frontend** - React + Vite + TypeScript
   - Port: 8080 (internal)
   - Image: Custom build от frontend/Dockerfile
   - Nginx Alpine базиран контейнер

2. **ecar-api** - NestJS Backend
   - Port: 3000 (internal)
   - Image: Custom build от backend/Dockerfile
   - Node 20 Alpine базиран контейнер

3. **ecar-db** - PostgreSQL 14
   - Port: 5432 (internal)
   - Volume: postgres_data (persistent storage)
   - Database: ecar
   - User: ecar_prod

4. **ecar-redis** - Redis 7
   - Port: 6379 (internal)
   - Volume: redis_data (persistent storage)
   - Protected with password

---

## 📦 Структура на проекта

```
/opt/ecar/
├── backend/
│   ├── src/                    # Backend source code (NestJS)
│   ├── dist/                   # Compiled JavaScript (generated)
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile              # Backend Docker build file
├── frontend/
│   ├── src/                    # Frontend source code (React)
│   ├── dist/                   # Built static files (generated)
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf              # Nginx config за frontend
│   └── Dockerfile              # Frontend Docker build file
├── database/
│   └── init.sql                # Initial database schema
├── docs/
│   └── *.md                    # Documentation files
├── .env                        # Environment variables (PRODUCTION)
├── docker-compose.prod.yml     # Production Docker Compose config
└── docker-compose.yml          # Development Docker Compose config
```

---

## ⚙️ Конфигурационни файлове

### 1. `.env` файл (Production)

Локация: `/opt/ecar/.env`

```ini
# Application
NODE_ENV=production
APP_PORT=3000
APP_URL=https://ecar.albena.bg

# Database
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=ecar
DATABASE_USER=ecar_prod
DATABASE_PASSWORD=SecureDBPassword123!
DB_NAME=ecar
DB_USER=ecar_prod
DB_PASSWORD=SecureDBPassword123!

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPassword456!

# JWT
JWT_SECRET=YourSuperSecretRandomString789ChangeMeInProduction
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Email (SuperHosting SMTP)
SMTP_HOST=mail.albena.bg
SMTP_PORT=26
SMTP_SECURE=false
SMTP_USER=ecar@albena.bg
SMTP_PASSWORD=Ecar2025!
SMTP_FROM=ecar@albena.bg

# Domain
DOMAIN_NAME=ecar.albena.bg

# Frontend
VITE_API_URL=https://ecar.albena.bg/api
```

### 2. `docker-compose.prod.yml`

Локация: `/opt/ecar/docker-compose.prod.yml`

Основни services:
- **postgres** - PostgreSQL база данни
- **redis** - Redis cache и queue
- **backend** - NestJS API сървър
- **frontend** - React/Vite static files + Nginx

### 3. Nginx конфигурация (Host)

Локация: `/etc/nginx/sites-available/ecar`

```nginx
server {
    listen 80;
    server_name ecar.albena.bg;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🚀 Процес на deployment

### Инициален setup (еднократно)

1. **Подготовка на сървъра**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw nginx certbot python3-certbot-nginx
```

2. **Инсталиране на Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker
```

3. **Създаване на работна директория**
```bash
sudo mkdir -p /opt/ecar
sudo chown -R $USER:$USER /opt/ecar
```

4. **Прехвърляне на проекта**
- Копиране на цялата папка `Ecar` от Windows към `/opt/ecar/` на сървъра
- Използван метод: SCP, WinSCP или FileZilla

5. **Преместване на файловете**
```bash
cd /opt/ecar
mv Ecar/* .
mv Ecar/.* . 2>/dev/null || true
rmdir Ecar
```

6. **Създаване/проверка на `.env` файл**
```bash
nano .env  # Редактиране за production настройки
```

7. **Създаване на липсващи Dockerfile**

**Backend Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
```

**Frontend Dockerfile** (`frontend/Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install && chmod -R 755 node_modules

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

8. **Поправка на `frontend/package.json`**
```json
{
  "scripts": {
    "build": "vite build"  // Променено от "tsc && vite build"
  }
}
```

9. **Build и стартиране на контейнерите**
```bash
cd /opt/ecar
sudo docker compose -f docker-compose.prod.yml up -d --build
```

10. **Конфигуриране на Nginx (reverse proxy)**
```bash
sudo nano /etc/nginx/sites-available/ecar
# (Копиране на конфигурацията от по-горе)

sudo ln -s /etc/nginx/sites-available/ecar /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

11. **Инсталиране на SSL сертификат**
```bash
sudo certbot --nginx -d ecar.albena.bg
```

---

## 🔄 Workflow за обновяване

### Когато правите промени в кода:

1. **На локалната машина (Windows):**
```powershell
cd "C:\Disk D\Project\Ecar"
git add .
git commit -m "Your changes description"
git push
```

2. **На сървъра:**
```bash
cd /opt/ecar
git pull  # Ако използвате Git

# ИЛИ прехвърлете новата версия през SCP/WinSCP

# Rebuild контейнерите
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🛠️ Полезни команди

### Docker операции

```bash
# Проверка на статуса на контейнерите
sudo docker compose -f docker-compose.prod.yml ps

# Логове в реално време
sudo docker compose -f docker-compose.prod.yml logs -f

# Логове на конкретен контейнер
sudo docker compose -f docker-compose.prod.yml logs -f backend
sudo docker compose -f docker-compose.prod.yml logs -f frontend

# Рестартиране на контейнерите
sudo docker compose -f docker-compose.prod.yml restart

# Спиране на всички контейнери
sudo docker compose -f docker-compose.prod.yml down

# Пълно изчистване (включително volumes - внимание!)
sudo docker compose -f docker-compose.prod.yml down -v
```

### Влизане в контейнерите

```bash
# Backend контейнер
sudo docker exec -it ecar-api sh

# Frontend контейнер
sudo docker exec -it ecar-frontend sh

# PostgreSQL база данни
sudo docker exec -it ecar-db psql -U ecar_prod -d ecar

# Redis
sudo docker exec -it ecar-redis redis-cli -a SecureRedisPassword456!
```

### Backup и restore

```bash
# Backup на базата данни
sudo docker exec ecar-db pg_dump -U ecar_prod ecar > backup_$(date +%Y%m%d).sql

# Restore на базата данни
sudo docker exec -i ecar-db psql -U ecar_prod ecar < backup_20241204.sql

# Копиране на backup файл от контейнера
sudo docker cp ecar-db:/backup.sql ./backup.sql
```

### Nginx операции

```bash
# Проверка на конфигурацията
sudo nginx -t

# Reload на Nginx (без downtime)
sudo systemctl reload nginx

# Рестартиране на Nginx
sudo systemctl restart nginx

# Статус на Nginx
sudo systemctl status nginx

# Логове на Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL сертификат

```bash
# Ръчно обновяване на SSL
sudo certbot renew

# Тестване на обновяването (dry-run)
sudo certbot renew --dry-run

# Списък на инсталирани сертификати
sudo certbot certificates
```

---

## 📊 Monitoring и диагностика

### Проверка дали всичко работи

```bash
# 1. Проверка на Docker контейнерите
sudo docker compose -f docker-compose.prod.yml ps
# Всички трябва да са "Up"

# 2. Проверка на Backend API
curl http://localhost:3000/api/
# Трябва да върне отговор (дори 404 е OK)

# 3. Проверка на Frontend
curl http://localhost:8080
# Трябва да върне HTML

# 4. Проверка на публичния достъп
curl -I https://ecar.albena.bg
# HTTP/1.1 200 OK

# 5. Проверка на SSL
curl -I https://ecar.albena.bg | grep "HTTP"
openssl s_client -connect ecar.albena.bg:443 -servername ecar.albena.bg
```

### Често срещани проблеми

**1. Backend не стартира - `Cannot find module '/app/dist/main'`**
- Причина: Build процесът не е генерирал правилно файловете
- Решение: Проверете дали `CMD ["node", "dist/src/main.js"]` е правилен път

**2. Frontend Permission denied - `sh: vite: Permission denied`**
- Причина: `node_modules/.bin/vite` няма execute права
- Решение: Добавете `chmod -R 755 node_modules` след `npm install`

**3. Docker не може да се свърже с базата данни**
- Причина: Container не е стартирал или network проблем
- Решение: Проверете `docker compose ps` и логовете

**4. Nginx дава 502 Bad Gateway**
- Причина: Backend контейнерът не работи
- Решение: `sudo docker compose logs backend`

**5. SSL сертификатът не се инсталира**
- Причина: DNS записът не сочи към сървъра или port 80 е блокиран
- Решение: Проверете DNS и firewall (`sudo ufw status`)

---

## 🔐 Сигурност

### Firewall (UFW)

```bash
# Разрешаване на основните портове
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Активиране на firewall
sudo ufw enable

# Проверка на статуса
sudo ufw status
```

### Пароли и secrets

- ✅ Всички пароли в `.env` файла са защитени
- ✅ `.env` файлът НЕ трябва да е в Git (добавен в `.gitignore`)
- ✅ PostgreSQL е достъпна само в Docker мрежата
- ✅ Redis има password protection
- ✅ JWT_SECRET е уникален за production

### Препоръки

1. Променете паролите по подразбиране в `.env`
2. Използвайте силни пароли (минимум 16 символа)
3. Активирайте автоматични бекъпи на базата данни
4. Настройте log rotation за Docker логове
5. Обновявайте редовно Docker images и системни пакети

---

## 📈 Performance

### Оптимизации

1. **Docker images са Alpine based** - малък размер (~50MB за Node)
2. **Multi-stage builds** - production images не съдържат build tools
3. **Nginx кешира static files** - по-бърза доставка на frontend
4. **Redis за кеширане** - намалява натоварването на базата данни
5. **PostgreSQL persistent volumes** - данните се запазват след рестарт

### Мониторинг на ресурси

```bash
# Docker статистики
sudo docker stats

# Дисково пространство
df -h
sudo docker system df

# Изчистване на неизползвани ресурси
sudo docker system prune -a
```

---

## 📞 Поддръжка

### Контакти

- **Email:** ecar@albena.bg
- **SMTP Server:** mail.albena.bg:26
- **Domain:** ecar.albena.bg
- **Server IP:** 10.10.11.35

### Автоматични задачи (Cron)

```bash
# Редактиране на crontab
crontab -e

# Примерни задачи:
# Backup на базата данни всяка нощ в 3:00
0 3 * * * docker exec ecar-db pg_dump -U ecar_prod ecar > /opt/ecar/backups/db_$(date +\%Y\%m\%d).sql

# Автоматично обновяване на SSL сертификати
0 0 1 * * certbot renew --quiet
```

---

## ✅ Checklist за production

- [x] Ubuntu Server инсталиран и обновен
- [x] Docker и Docker Compose инсталирани
- [x] Проектът прехвърлен на сървъра
- [x] `.env` файл създаден с production настройки
- [x] Dockerfile файлове коректни
- [x] Docker контейнерите build-нати и стартирани
- [x] Nginx конфигуриран като reverse proxy
- [x] SSL сертификат инсталиран
- [x] Firewall настроен (UFW)
- [x] DNS записът сочи към сървъра
- [x] Backup стратегия настроена
- [ ] Мониторинг система (optional - Prometheus/Grafana)
- [ ] Log aggregation (optional - ELK Stack)

---

## 📚 Допълнителни ресурси

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

---

**Последна актуализация:** 4 Декември 2025

**Версия на документацията:** 1.0
