# Ръководство за внедряване в реална среда (Production Deployment)

## 🚀 Най-бързият начин (Автоматичен скрипт)

Подготвили сме автоматичен скрипт, който върши цялата работа вместо вас.

### Стъпка 1: Влезте в сървъра
Влезте във вашата Ubuntu машина чрез SSH:
```bash
ssh user@your-server-ip
```

### Стъпка 2: Изтеглете проекта
```bash
git clone <YOUR_REPO_URL> ecar
cd ecar
```

### Стъпка 3: Стартирайте инсталацията
Направете скрипта изпълним и го стартирайте:
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

Скриптът ще ви попита за:
1.  Домейн име (напр. `ecar.albena.bg`)
2.  Пароли за база данни и Redis
3.  SMTP парола
4.  Дали искате да инсталирате SSL сертификат (автоматично)

---

## 📋 Ръчно инсталиране (Детайли)

Ако предпочитате да направите нещата ръчно или искате да разберете какво прави скриптът, следвайте стъпките по-долу.

### Изисквания към сървъра

- **OS:** Ubuntu Server 22.04 LTS или по-нова
- **CPU:** 2 vCPU (минимум)
- **RAM:** 4 GB (препоръчително 8 GB)
- **Disk:** 40 GB SSD
- **Domain:** Валиден домейн (напр. `ecar.albena.bg`)
- **Network:** Отворени портове 80 (HTTP), 443 (HTTPS), 22 (SSH)

## 🏗️ Архитектура на внедряване

Ще използваме **Dockerized** подход за всички услуги, скрити зад **Nginx** Reverse Proxy на хоста за SSL терминация.

```
[Internet] -> [Nginx (Host) + SSL] -> [Docker Container: Frontend]
                                   -> [Docker Container: Backend]
                                   -> [Docker Container: Postgres]
                                   -> [Docker Container: Redis]
```

---

## 🚀 Стъпка 1: Подготовка на сървъра

Влезте в сървъра чрез SSH и изпълнете следните команди:

### 1.1. Обновяване на системата
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip ufw
```

### 1.2. Инсталиране на Docker & Docker Compose
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker packages:
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.3. Инсталиране на Nginx и Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 📦 Стъпка 2: Подготовка на приложението

### 2.1. Клониране на репозиторито
```bash
cd /opt
sudo mkdir ecar
sudo chown $USER:$USER ecar
git clone <YOUR_REPO_URL> ecar
cd ecar
```

### 2.2. Създаване на Dockerfiles

Тъй като в development средата няма Dockerfiles за продукция, създайте ги сега.

**Backend Dockerfile (`backend/Dockerfile`):**
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

# Важно: NestJS build-ва в dist/src/main.js, не dist/main.js
CMD ["npm", "run", "start:prod"]
```

**Забележка:** NestJS build процесът създава `dist/src/main.js`, затова използваме `npm run start:prod` скрипта, който автоматично търси правилния път.

**Frontend Dockerfile (`frontend/Dockerfile`):**
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

**Важни бележки за frontend build:**
- В `package.json` build скриптът е `"build": "tsc && vite build"`
- Ако възникнат проблеми с TypeScript компилацията, може да се премахне `tsc &&` и да се остави само `"build": "vite build"`, тъй като Vite вътрешно проверява TypeScript
- Multi-stage build минимизира финалния image размер

**Frontend Nginx Config (`frontend/nginx.conf`):**
```nginx
server {
    listen 80;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
}
```

### 2.3. Създаване на Production Docker Compose

Създайте файл `docker-compose.prod.yml` в главната директория:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: ecar-db
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    container_name: ecar-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  backend:
    build: ./backend
    container_name: ecar-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_SECURE: ${SMTP_SECURE}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      SMTP_FROM: ${SMTP_FROM}
      APP_URL: https://${DOMAIN_NAME}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build: ./frontend
    container_name: ecar-frontend
    ports:
      - "8080:80"
    restart: always

volumes:
  postgres_data:
  redis_data:
```

### 2.4. Конфигуриране на променливите (.env)

Създайте `.env` файл в главната директория:

```bash
nano .env
```

```ini
# Database
DB_NAME=ecar
DB_USER=ecar_prod
DB_PASSWORD=STRONG_PASSWORD_HERE

# Redis
REDIS_PASSWORD=STRONG_REDIS_PASSWORD

# Security
JWT_SECRET=VERY_LONG_RANDOM_STRING_HERE
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Domain
DOMAIN_NAME=ecar.albena.bg

# Email (SuperHosting)
SMTP_HOST=mail.albena.bg
SMTP_PORT=26
SMTP_SECURE=false
SMTP_USER=ecar@albena.bg
SMTP_PASSWORD=YOUR_EMAIL_PASSWORD
SMTP_FROM=ecar@albena.bg

# Application
NODE_ENV=production
PORT=3000

# Optional: For production monitoring
LOG_LEVEL=info
```

**Важни бележки:**
- Променете всички пароли с силни случайни стрингове
- За JWT_SECRET използвайте минимум 64 символа: `openssl rand -base64 64`
- SMTP_PORT=26 е специфичен за SuperHosting (стандартно е 587 или 465)
- Уверете се, че SMTP_SECURE=false за port 26

---

## 🌐 Стъпка 3: Стартиране на услугите

```bash
# Build and start containers
docker compose -f docker-compose.prod.yml up -d --build
```

Проверете дали всичко работи:
```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 🔒 Стъпка 4: Nginx Reverse Proxy & SSL

Настройте Nginx на хоста (Ubuntu), за да пренасочва трафика към Docker контейнерите.

### 4.1. Конфигурация на Nginx

Създайте конфигурационен файл:
```bash
sudo nano /etc/nginx/sites-available/ecar
```

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активирайте сайта:
```bash
sudo ln -s /etc/nginx/sites-available/ecar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.2. Инсталиране на SSL сертификат (Let's Encrypt)

```bash
sudo certbot --nginx -d ecar.albena.bg
```
Следвайте инструкциите на екрана. Certbot автоматично ще обнови Nginx конфигурацията за HTTPS.

---

## 🔄 Стъпка 5: Поддръжка и обновяване

### Обновяване на версията
За да качите нова версия на кода:

```bash
cd /opt/ecar
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

### Backup на базата данни
Създайте скрипт за backup `backup.sh`:

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec ecar-db pg_dump -U ecar_prod ecar > /opt/ecar/backups/db_$TIMESTAMP.sql
# Optional: Upload to S3 or external storage
```

Направете го изпълним и добавете в cron:
```bash
chmod +x backup.sh
crontab -e
# Add: 0 3 * * * /opt/ecar/backup.sh
```

---

## 🛠️ Troubleshooting

### Често срещани проблеми при build:

**1. Backend: "Cannot find module '/app/dist/main'"**
- Проблем: NestJS build-ва в `dist/src/main.js`, не в `dist/main.js`
- Решение: Използвайте `npm run start:prod` вместо директно `node dist/main.js`

**2. Frontend: "Permission denied" при tsc или vite**
- Проблем: В Alpine Linux node_modules/.bin файловете нямат execute права
- Решение: Добавете `RUN chmod -R 755 node_modules/.bin` след `npm ci`
- Алтернатива: Променете build script на `"build": "vite build"` без `tsc &&`

**3. "EACCES: permission denied" при npm install в Docker**
- Проблем: Права върху files в build context
- Решение: Уверете се, че всички файлове са readable за Docker daemon

**Проверка на логове:**
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

**Проверка на health status:**
```bash
docker compose -f docker-compose.prod.yml ps
```

**Rebuild на определен service:**
```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```

**Рестартиране на всичко:**
```bash
docker compose -f docker-compose.prod.yml restart
```

**Изтриване на всичко и пълен rebuild:**
```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```
