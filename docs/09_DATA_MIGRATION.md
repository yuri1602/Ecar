# Миграция на данни (Development -> Production)

Тъй като `deploy.sh` създава чиста база данни, трябва ръчно да прехвърлите данните от вашата локална машина към сървъра.

## 1. Експорт на локалната база (Windows)

Отворете PowerShell във вашата проектна папка и изпълнете:

```powershell
# Създаване на папка за backups ако няма
mkdir -p backups

# Експорт на данните (само data, без схема, защото схемата се създава от TypeORM)
# Или пълен дъмп (препоръчително за пълно копие)
docker exec ecar-db pg_dump -U ecar_user ecar > backups/production_ready.sql
```

## 2. Качване на файла на сървъра

Използвайте `scp` (Secure Copy), за да качите файла. Заменете `user@your-server-ip` с вашите данни.

```powershell
scp backups/production_ready.sql user@your-server-ip:/opt/ecar/backups/
```

*Забележка: Трябва да създадете папката `backups` на сървъра предварително или да качите в `/tmp`.*

## 3. Импорт на сървъра (Ubuntu)

Влезте в сървъра:

```bash
ssh user@your-server-ip
cd /opt/ecar
```

Спрете backend-а временно, за да няма конфликти:
```bash
docker compose -f docker-compose.prod.yml stop backend
```

Импортирайте базата:
```bash
# Копиране на файла в контейнера (ако не е mount-нат volume)
docker cp backups/production_ready.sql ecar-db:/tmp/dump.sql

# Изтриване на текущата база и създаване на нова (за чисто)
docker exec ecar-db psql -U ecar_prod -d postgres -c "DROP DATABASE ecar;"
docker exec ecar-db psql -U ecar_prod -d postgres -c "CREATE DATABASE ecar;"

# Импорт
docker exec ecar-db psql -U ecar_prod -d ecar -f /tmp/dump.sql
```

Стартирайте backend-а отново:
```bash
docker compose -f docker-compose.prod.yml start backend
```

## 4. Проверка

Влезте в pgAdmin или използвайте API, за да видите дали потребителите и колите са там.
