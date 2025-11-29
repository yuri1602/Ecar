# База данни - ER модел и SQL схема

## 🗂️ ER Диаграма (текстово представяне)

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │───┐
│ email        │   │
│ password_hash│   │
│ full_name    │   │
│ role         │   │
│ is_active    │   │
│ created_at   │   │
│ updated_at   │   │
└──────────────┘   │
                   │
                   │ 1:N
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ user_vehicles    │  │   audit_logs     │
├──────────────────┤  ├──────────────────┤
│ id (PK)          │  │ id (PK)          │
│ user_id (FK)     │  │ user_id (FK)     │
│ vehicle_id (FK)  │  │ action           │
│ role_on_vehicle  │  │ entity_type      │
│ assigned_at      │  │ entity_id        │
│ assigned_until   │  │ changes          │
└─────────┬────────┘  │ ip_address       │
          │           │ created_at       │
          │           └──────────────────┘
          │
          │ N:1
          │
          ▼
┌──────────────────┐
│    vehicles      │
├──────────────────┤
│ id (PK)          │───┐
│ registration_no  │   │
│ make             │   │
│ model            │   │
│ year             │   │
│ battery_capacity │   │
│ vin              │   │
│ status           │   │
│ purchase_date    │   │
│ created_at       │   │
│ updated_at       │   │
└──────────────────┘   │
                       │
                       │ 1:N
                       │
         ┌─────────────┴───────────────┐
         │                             │
         ▼                             ▼
┌──────────────────────┐     ┌──────────────────────┐
│  charge_sessions     │     │  odometer_readings   │
├──────────────────────┤     ├──────────────────────┤
│ id (PK)              │──┐  │ id (PK)              │
│ vehicle_id (FK)      │  │  │ vehicle_id (FK)      │
│ station_id (FK)      │  │  │ session_id (FK, null)│
│ tariff_id (FK, null) │  │  │ reading_km           │
│ started_at           │  │  │ reading_at           │
│ ended_at             │  │  │ entered_by (FK)      │
│ kwh_charged          │  │  │ is_verified          │
│ price_total          │  │  │ notes                │
│ price_per_kwh        │  │  │ created_at           │
│ currency             │  │  └──────────────────────┘
│ status               │  │           ▲
│ notes                │  │           │
│ created_by (FK)      │  │           │ N:1 (optional)
│ created_at           │  │           │
│ updated_at           │  └───────────┘
└──────┬───────────────┘
       │
       │ N:1
       │
       ▼
┌──────────────────┐        ┌──────────────────┐
│    stations      │        │     tariffs      │
├──────────────────┤        ├──────────────────┤
│ id (PK)          │        │ id (PK)          │
│ name             │        │ name             │
│ location         │        │ provider         │
│ address          │        │ price_per_kwh    │
│ latitude         │        │ currency         │
│ longitude        │        │ valid_from       │
│ provider         │        │ valid_until      │
│ power_kw         │        │ time_of_day      │
│ connector_types  │        │ is_active        │
│ is_active        │        │ created_at       │
│ created_at       │        │ updated_at       │
│ updated_at       │        └──────────────────┘
└──────────────────┘                  ▲
         ▲                            │
         │                            │
         └────────────────────────────┘
                    N:1 (optional)

┌──────────────────────┐
│   notifications      │
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │
│ session_id (FK)      │
│ type                 │
│ subject              │
│ body                 │
│ status               │
│ sent_at              │
│ seen_at              │
│ metadata             │
│ created_at           │
└──────────────────────┘
```

## 📋 SQL схема (PostgreSQL)

### 1. Таблица `users`

```sql
-- Потребители на системата
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'fleet_manager', 'driver')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'Потребители на системата';
COMMENT ON COLUMN users.role IS 'admin, fleet_manager или driver';
```

### 2. Таблица `vehicles`

```sql
-- Електромобили
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_no VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    battery_capacity_kwh DECIMAL(6,2) NOT NULL CHECK (battery_capacity_kwh > 0),
    vin VARCHAR(17) UNIQUE,
    color VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_registration_no ON vehicles(registration_no);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);

COMMENT ON TABLE vehicles IS 'Електромобили във флота';
COMMENT ON COLUMN vehicles.battery_capacity_kwh IS 'Капацитет на батерията в kWh';
```

### 3. Таблица `user_vehicles`

```sql
-- Връзка потребители - автомобили (кой отговаря за кой автомобил)
CREATE TABLE user_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    role_on_vehicle VARCHAR(50) NOT NULL DEFAULT 'driver' CHECK (role_on_vehicle IN ('primary_driver', 'driver', 'responsible')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_until TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, vehicle_id)
);

CREATE INDEX idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX idx_user_vehicles_vehicle_id ON user_vehicles(vehicle_id);
CREATE INDEX idx_user_vehicles_active ON user_vehicles(user_id, vehicle_id) WHERE assigned_until IS NULL OR assigned_until > NOW();

COMMENT ON TABLE user_vehicles IS 'Връзка между потребители и автомобили - кой шофьор отговаря за кой автомобил';
COMMENT ON COLUMN user_vehicles.role_on_vehicle IS 'Ролята на потребителя за конкретния автомобил';
```

### 4. Таблица `stations`

```sql
-- Зарядни станции
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    provider VARCHAR(100),
    power_kw DECIMAL(6,2),
    connector_types TEXT[], -- Array of connector types: ['Type2', 'CCS', 'CHAdeMO']
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_name ON stations(name);
CREATE INDEX idx_stations_provider ON stations(provider);
CREATE INDEX idx_stations_is_active ON stations(is_active);
CREATE INDEX idx_stations_location ON stations USING GIST(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE stations IS 'Зарядни станции';
COMMENT ON COLUMN stations.connector_types IS 'Типове конектори на станцията';
```

### 5. Таблица `tariffs`

```sql
-- Тарифи за зареждане
CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100),
    price_per_kwh DECIMAL(8,4) NOT NULL CHECK (price_per_kwh >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BGN',
    valid_from DATE NOT NULL,
    valid_until DATE,
    time_of_day VARCHAR(50), -- 'peak', 'off-peak', 'all-day'
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tariffs_provider ON tariffs(provider);
CREATE INDEX idx_tariffs_is_active ON tariffs(is_active);
CREATE INDEX idx_tariffs_valid_dates ON tariffs(valid_from, valid_until);

COMMENT ON TABLE tariffs IS 'Тарифи за зареждане';
COMMENT ON COLUMN tariffs.time_of_day IS 'Времеви период на деня - пикови, извънпикови или целодневни часове';
```

### 6. Таблица `charge_sessions`

```sql
-- Зарядни сесии (ръчно въведени)
CREATE TABLE charge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    tariff_id UUID REFERENCES tariffs(id) ON DELETE SET NULL,
    
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    kwh_charged DECIMAL(8,3) NOT NULL CHECK (kwh_charged >= 0),
    
    price_total DECIMAL(10,2) NOT NULL CHECK (price_total >= 0),
    price_per_kwh DECIMAL(8,4),
    currency VARCHAR(3) NOT NULL DEFAULT 'BGN',
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending_odometer' CHECK (status IN ('pending_odometer', 'completed', 'cancelled')),
    
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CHECK (ended_at >= started_at),
    CHECK (kwh_charged > 0 OR status = 'cancelled')
);

CREATE INDEX idx_charge_sessions_vehicle_id ON charge_sessions(vehicle_id);
CREATE INDEX idx_charge_sessions_station_id ON charge_sessions(station_id);
CREATE INDEX idx_charge_sessions_status ON charge_sessions(status);
CREATE INDEX idx_charge_sessions_started_at ON charge_sessions(started_at DESC);
CREATE INDEX idx_charge_sessions_created_by ON charge_sessions(created_by);
CREATE INDEX idx_charge_sessions_pending ON charge_sessions(vehicle_id, status) WHERE status = 'pending_odometer';

COMMENT ON TABLE charge_sessions IS 'Зарядни сесии - ръчно въведени от администратори';
COMMENT ON COLUMN charge_sessions.status IS 'pending_odometer - чака въвеждане на одометър, completed - завършена, cancelled - отказана';
COMMENT ON COLUMN charge_sessions.kwh_charged IS 'Заредени kWh';
COMMENT ON COLUMN charge_sessions.price_total IS 'Обща цена с ДДС';
```

### 7. Таблица `odometer_readings`

```sql
-- Показания на километраж
CREATE TABLE odometer_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES charge_sessions(id) ON DELETE SET NULL,
    
    reading_km INTEGER NOT NULL CHECK (reading_km >= 0),
    reading_at TIMESTAMPTZ NOT NULL,
    
    entered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    
    distance_from_previous_km INTEGER,
    kwh_per_100km DECIMAL(6,2),
    cost_per_100km DECIMAL(8,2),
    
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(vehicle_id, session_id)
);

CREATE INDEX idx_odometer_vehicle_id ON odometer_readings(vehicle_id);
CREATE INDEX idx_odometer_session_id ON odometer_readings(session_id);
CREATE INDEX idx_odometer_reading_at ON odometer_readings(vehicle_id, reading_at DESC);
CREATE INDEX idx_odometer_entered_by ON odometer_readings(entered_by);

COMMENT ON TABLE odometer_readings IS 'Показания на одометъра за всеки автомобил';
COMMENT ON COLUMN odometer_readings.distance_from_previous_km IS 'Изминати километри от предишното показание';
COMMENT ON COLUMN odometer_readings.kwh_per_100km IS 'Разход kWh на 100 км';
COMMENT ON COLUMN odometer_readings.cost_per_100km IS 'Разход лв. на 100 км';
```

### 8. Таблица `notifications`

```sql
-- Нотификации
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES charge_sessions(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL CHECK (type IN ('odometer_request', 'odometer_reminder', 'report_ready', 'system')),
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'seen')),
    
    sent_at TIMESTAMPTZ,
    seen_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    
    metadata JSONB, -- Допълнителни данни (напр. template variables, retry count)
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_session_id ON notifications(session_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_queued ON notifications(status, created_at) WHERE status = 'queued';

COMMENT ON TABLE notifications IS 'Нотификации към потребители';
COMMENT ON COLUMN notifications.type IS 'Тип нотификация: odometer_request, odometer_reminder, report_ready, system';
COMMENT ON COLUMN notifications.metadata IS 'JSON данни - променливи за шаблона, брой опити и др.';
```

### 9. Таблица `audit_logs`

```sql
-- Одит логове
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'create_session', 'update_session', 'enter_odometer', etc.
    entity_type VARCHAR(100), -- 'user', 'vehicle', 'charge_session', 'odometer_reading'
    entity_id UUID,
    
    changes JSONB, -- Промените преди/след
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Одит логове за всички критични действия';
COMMENT ON COLUMN audit_logs.changes IS 'JSON обект с промените - преди и след';
```

## 🔧 Допълнителни функции и тригери

### Функция за автоматично обновяване на `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Прилагане на функцията към нужните таблици
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charge_sessions_updated_at BEFORE UPDATE ON charge_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Функция за автоматично изчисляване на разходи при одометър

```sql
CREATE OR REPLACE FUNCTION calculate_consumption_metrics()
RETURNS TRIGGER AS $$
DECLARE
    prev_reading RECORD;
    session_rec RECORD;
BEGIN
    -- Намираме предишното показание за същия автомобил
    SELECT reading_km, reading_at INTO prev_reading
    FROM odometer_readings
    WHERE vehicle_id = NEW.vehicle_id
      AND reading_at < NEW.reading_at
      AND id != NEW.id
    ORDER BY reading_at DESC
    LIMIT 1;
    
    -- Ако има предишно показание, изчисляваме дистанцията
    IF prev_reading IS NOT NULL THEN
        NEW.distance_from_previous_km := NEW.reading_km - prev_reading.reading_km;
        
        -- Ако е свързано със сесия, изчисляваме разходите
        IF NEW.session_id IS NOT NULL AND NEW.distance_from_previous_km > 0 THEN
            SELECT kwh_charged, price_total INTO session_rec
            FROM charge_sessions
            WHERE id = NEW.session_id;
            
            IF session_rec IS NOT NULL THEN
                NEW.kwh_per_100km := (session_rec.kwh_charged / NEW.distance_from_previous_km) * 100;
                NEW.cost_per_100km := (session_rec.price_total / NEW.distance_from_previous_km) * 100;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_consumption
    BEFORE INSERT OR UPDATE ON odometer_readings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_consumption_metrics();
```

### Функция за автоматично обновяване на статус на сесия

```sql
CREATE OR REPLACE FUNCTION update_session_status_on_odometer()
RETURNS TRIGGER AS $$
BEGIN
    -- Когато се въведе одометър за сесия, сесията става completed
    IF NEW.session_id IS NOT NULL THEN
        UPDATE charge_sessions
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = NEW.session_id
          AND status = 'pending_odometer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_status
    AFTER INSERT ON odometer_readings
    FOR EACH ROW
    EXECUTE FUNCTION update_session_status_on_odometer();
```

## 📊 Помощни Views за отчети

### View: Последни одометър показания за всеки автомобил

```sql
CREATE OR REPLACE VIEW v_latest_odometer AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    reading_km,
    reading_at,
    entered_by
FROM odometer_readings
ORDER BY vehicle_id, reading_at DESC;

COMMENT ON VIEW v_latest_odometer IS 'Последни одометър показания за всеки автомобил';
```

### View: Завършени сесии с пълни данни

```sql
CREATE OR REPLACE VIEW v_completed_sessions AS
SELECT
    cs.id,
    cs.vehicle_id,
    v.registration_no,
    v.make,
    v.model,
    cs.started_at,
    cs.ended_at,
    cs.kwh_charged,
    cs.price_total,
    cs.currency,
    s.name AS station_name,
    s.location AS station_location,
    od.reading_km,
    od.distance_from_previous_km,
    od.kwh_per_100km,
    od.cost_per_100km,
    u.full_name AS entered_by_name
FROM charge_sessions cs
JOIN vehicles v ON cs.vehicle_id = v.id
LEFT JOIN stations s ON cs.station_id = s.id
LEFT JOIN odometer_readings od ON cs.id = od.session_id
LEFT JOIN users u ON od.entered_by = u.id
WHERE cs.status = 'completed';

COMMENT ON VIEW v_completed_sessions IS 'Завършени зарядни сесии с всички данни';
```

### View: Агрегати по автомобил

```sql
CREATE OR REPLACE VIEW v_vehicle_statistics AS
SELECT
    v.id AS vehicle_id,
    v.registration_no,
    v.make,
    v.model,
    COUNT(cs.id) AS total_sessions,
    SUM(cs.kwh_charged) AS total_kwh,
    SUM(cs.price_total) AS total_cost,
    SUM(od.distance_from_previous_km) AS total_distance_km,
    AVG(od.kwh_per_100km) AS avg_kwh_per_100km,
    AVG(od.cost_per_100km) AS avg_cost_per_100km,
    MAX(cs.started_at) AS last_charge_at
FROM vehicles v
LEFT JOIN charge_sessions cs ON v.id = cs.vehicle_id AND cs.status = 'completed'
LEFT JOIN odometer_readings od ON cs.id = od.session_id
GROUP BY v.id, v.registration_no, v.make, v.model;

COMMENT ON VIEW v_vehicle_statistics IS 'Агрегирани статистики по автомобил';
```

## 🌱 Seed данни за тестване

```sql
-- Seed: Admin потребител
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin@ecar.local', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'Системен Администратор', 'admin'),
    ('00000000-0000-0000-0000-000000000002', 'manager@ecar.local', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'Иван Петров', 'fleet_manager'),
    ('00000000-0000-0000-0000-000000000003', 'driver1@ecar.local', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'Георги Стоянов', 'driver');

-- Seed: Примерни автомобили
INSERT INTO vehicles (id, registration_no, make, model, year, battery_capacity_kwh, status)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'CA1234AB', 'Tesla', 'Model 3', 2022, 75.0, 'active'),
    ('10000000-0000-0000-0000-000000000002', 'CA5678CD', 'Nissan', 'Leaf', 2021, 40.0, 'active'),
    ('10000000-0000-0000-0000-000000000003', 'CA9012EF', 'Volkswagen', 'ID.4', 2023, 82.0, 'active');

-- Seed: User-Vehicle assignments
INSERT INTO user_vehicles (user_id, vehicle_id, role_on_vehicle)
VALUES
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'primary_driver'),
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'driver');

-- Seed: Примерна станция
INSERT INTO stations (id, name, location, provider, power_kw, is_active)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'ЕВН София Център', 'София, бул. Витоша', 'EVN', 50.0, true),
    ('20000000-0000-0000-0000-000000000002', 'Petrol EV - Младост', 'София, ж.к. Младост', 'Petrol', 22.0, true);

-- Seed: Примерна тарифа
INSERT INTO tariffs (id, name, provider, price_per_kwh, valid_from, is_active)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'Стандартна тарифа 2025', 'EVN', 0.40, '2025-01-01', true);
```

## 📈 Индекси за производителност

```sql
-- Composite индекси за често използвани заявки
CREATE INDEX idx_charge_sessions_vehicle_started ON charge_sessions(vehicle_id, started_at DESC);
CREATE INDEX idx_odometer_vehicle_reading_at ON odometer_readings(vehicle_id, reading_at DESC);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status, created_at DESC);

-- Partial индекси за активни записи
CREATE INDEX idx_vehicles_active ON vehicles(id) WHERE status = 'active';
CREATE INDEX idx_tariffs_active ON tariffs(id, price_per_kwh) WHERE is_active = true;
CREATE INDEX idx_sessions_pending ON charge_sessions(vehicle_id, created_at DESC) WHERE status = 'pending_odometer';
```

## 🔍 Примерни заявки

### Намиране на последното показание за автомобил

```sql
SELECT reading_km, reading_at
FROM odometer_readings
WHERE vehicle_id = '10000000-0000-0000-0000-000000000001'
ORDER BY reading_at DESC
LIMIT 1;
```

### Всички pending сесии за даден шофьор

```sql
SELECT 
    cs.id,
    v.registration_no,
    v.make,
    v.model,
    cs.started_at,
    cs.kwh_charged,
    (SELECT reading_km FROM v_latest_odometer WHERE vehicle_id = v.id) AS last_known_km
FROM charge_sessions cs
JOIN vehicles v ON cs.vehicle_id = v.id
JOIN user_vehicles uv ON v.id = uv.vehicle_id
WHERE uv.user_id = '00000000-0000-0000-0000-000000000003'
  AND cs.status = 'pending_odometer'
  AND (uv.assigned_until IS NULL OR uv.assigned_until > NOW())
ORDER BY cs.started_at DESC;
```

### Агрегирани данни за период

```sql
SELECT
    v.registration_no,
    COUNT(cs.id) AS sessions_count,
    SUM(cs.kwh_charged) AS total_kwh,
    SUM(cs.price_total) AS total_cost,
    SUM(od.distance_from_previous_km) AS total_km,
    AVG(od.kwh_per_100km) AS avg_consumption,
    AVG(od.cost_per_100km) AS avg_cost_per_100km
FROM vehicles v
LEFT JOIN charge_sessions cs ON v.id = cs.vehicle_id
    AND cs.status = 'completed'
    AND cs.started_at BETWEEN '2025-01-01' AND '2025-12-31'
LEFT JOIN odometer_readings od ON cs.id = od.session_id
WHERE v.status = 'active'
GROUP BY v.id, v.registration_no
ORDER BY total_cost DESC;
```

---

**Следваща стъпка:** Бизнес логика и алгоритми
