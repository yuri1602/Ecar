# Миграция на данни (Development -> Production)

Тъй като `deploy.sh` създава чиста база данни, трябва ръчно да прехвърлите данните от вашата локална машина към сървъра.

## 1. Експорт на локалната база (Windows)

Отворете PowerShell във вашата проектна папка и изпълнете:

```powershell
# Създаване на папка за backups ако няма
if (!(Test-Path -Path "backups")) { New-Item -ItemType Directory -Path "backups" }

# Експорт на данните (пълен дъмп - schema + data)
docker exec ecar-db pg_dump -U ecar_user ecar > backups/production_ready.sql

# Или само данни без schema (ако schema-та се създава от TypeORM migrations)
docker exec ecar-db pg_dump -U ecar_user --data-only ecar > backups/data_only.sql
```

**Забележка:** Ако използвате TypeORM migrations за създаване на schema-та в production, 
използвайте `--data-only` вариант. В противен случай използвайте пълния дъмп.

## 2. Качване на файла на сървъра

Използвайте `scp` (Secure Copy), за да качите файла. Заменете `user@your-server-ip` с вашите данни.

```powershell
scp backups/production_ready.sql user@your-server-ip:/opt/ecar/backups/
```

*Забележка: Трябва да създадете папката `backups` на сървъра предварително или да качите в `/tmp`.*

## 3. Импорт на сървъра (Ubuntu)

Влезте в сървъра:

```bash
ssh albena@10.10.11.35
cd /opt/ecar
```

Спрете backend-а временно, за да няма конфликти:
```bash
sudo docker compose -f docker-compose.prod.yml stop backend
```

Импортирайте базата:
```bash
# Копиране на файла в контейнера
docker cp backups/production_ready.sql ecar-db:/tmp/dump.sql

# Вариант 1: Изтриване и пълна замяна (ВНИМАНИЕ: Губите всички данни!)
docker exec ecar-db psql -U ecar_prod -d postgres -c "DROP DATABASE IF EXISTS ecar;"
docker exec ecar-db psql -U ecar_prod -d postgres -c "CREATE DATABASE ecar;"
docker exec -i ecar-db psql -U ecar_prod -d ecar -f /tmp/dump.sql

# Вариант 2: Импорт само на данни (ако schema вече съществува)
docker exec -i ecar-db psql -U ecar_prod -d ecar -f /tmp/dump.sql
```

Проверете импорта:
```bash
# Влезте в PostgreSQL контейнера
docker exec -it ecar-db psql -U ecar_prod -d ecar

# Проверете таблиците
\dt

# Проверете броя записи
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM vehicles;

# Излезте
\q
```

Стартирайте backend-а отново:
```bash
sudo docker compose -f docker-compose.prod.yml start backend
```

Проверете логовете:
```bash
sudo docker compose -f docker-compose.prod.yml logs -f backend
```

## 4. Проверка

Влезте в pgAdmin или използвайте API, за да видите дали потребителите и колите са там.
