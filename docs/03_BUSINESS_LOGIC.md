# Бизнес логика и алгоритми

## 📋 Основни процеси

### 1️⃣ Създаване на зарядна сесия (от администратор)

#### Flowchart

```
┌─────────────────────────────────────────────────┐
│ Admin отваря форма "Ново зареждане"             │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Избира автомобил от dropdown                    │
│ (показват се само активни автомобили)           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Въвежда данни:                                  │
│ • Дата и час на зареждане (started_at)          │
│ • Край на зареждане (ended_at)                  │
│ • kWh заредени                                  │
│ • Обща цена (BGN)                               │
│ • Станция (опция)                               │
│ • Тарифа (опция)                                │
│ • Бележки (опция)                               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Валидации:                                      │
│ ✓ ended_at >= started_at                        │
│ ✓ kwh_charged > 0                               │
│ ✓ price_total >= 0                              │
│ ✓ Дата не е в бъдещето                          │
└────────────────┬───────────────┬────────────────┘
                 │               │
            Невалидно        Валидно
                 │               │
                 ▼               ▼
     ┌────────────────┐  ┌─────────────────────────┐
     │ Показва грешки │  │ Записва в БД:           │
     └────────────────┘  │ • charge_sessions       │
                         │ • status =              │
                         │   'pending_odometer'    │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Намира последното       │
                         │ показание на одометъра  │
                         │ за този автомобил       │
                         │ (last_known_km)         │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Намира всички активни   │
                         │ потребители, свързани   │
                         │ с този автомобил        │
                         │ (user_vehicles)         │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ За всеки потребител:    │
                         │ • Създава notification  │
                         │   запис (status=queued) │
                         │ • Добавя job в опашка   │
                         │   за изпращане          │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Записва audit log:      │
                         │ • action: create_session│
                         │ • entity_id: session_id │
                         │ • user_id: admin_id     │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Показва съобщение:      │
                         │ "Зареждане създадено.   │
                         │  Нотификация изпратена."│
                         └─────────────────────────┘
```

#### Pseudocode

```typescript
async function createChargeSession(adminId: string, data: CreateSessionDTO): Promise<ChargeSession> {
  // 1. Валидиране на входните данни
  validateSessionData(data);
  
  // 2. Проверка дали автомобилът съществува и е активен
  const vehicle = await db.vehicles.findOne({
    where: { id: data.vehicleId, status: 'active' }
  });
  
  if (!vehicle) {
    throw new Error('Vehicle not found or inactive');
  }
  
  // 3. Намиране на последното одометър показание
  const lastOdometerReading = await db.odometerReadings.findOne({
    where: { vehicleId: vehicle.id },
    orderBy: { readingAt: 'DESC' }
  });
  
  const lastKnownKm = lastOdometerReading?.readingKm || 0;
  
  // 4. Изчисляване на цена за kWh (ако не е подадена)
  const pricePerKwh = data.tariffId 
    ? (await db.tariffs.findOne({ where: { id: data.tariffId } })).pricePerKwh
    : data.priceTotal / data.kwhCharged;
  
  // 5. Започване на транзакция
  const session = await db.transaction(async (trx) => {
    // Създаване на сесията
    const newSession = await trx.chargeSessions.create({
      data: {
        vehicleId: vehicle.id,
        stationId: data.stationId,
        tariffId: data.tariffId,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        kwhCharged: data.kwhCharged,
        priceTotal: data.priceTotal,
        pricePerKwh: pricePerKwh,
        currency: 'BGN',
        status: 'pending_odometer',
        notes: data.notes,
        createdBy: adminId
      }
    });
    
    // 6. Намиране на всички активни шофьори за този автомобил
    const assignedUsers = await trx.userVehicles.findMany({
      where: {
        vehicleId: vehicle.id,
        OR: [
          { assignedUntil: null },
          { assignedUntil: { gt: new Date() } }
        ]
      },
      include: { user: true }
    });
    
    // 7. Създаване на нотификации
    for (const assignment of assignedUsers) {
      await trx.notifications.create({
        data: {
          userId: assignment.userId,
          sessionId: newSession.id,
          type: 'odometer_request',
          subject: `Ново зареждане за ${vehicle.registrationNo}`,
          body: generateOdometerRequestBody(vehicle, newSession, lastKnownKm),
          status: 'queued',
          metadata: {
            vehicleId: vehicle.id,
            lastKnownKm: lastKnownKm,
            sessionId: newSession.id
          }
        }
      });
      
      // Добавяне в job queue за изпращане
      await jobQueue.add('send-notification', {
        userId: assignment.userId,
        sessionId: newSession.id,
        type: 'odometer_request'
      });
    }
    
    // 8. Audit log
    await trx.auditLogs.create({
      data: {
        userId: adminId,
        action: 'create_session',
        entityType: 'charge_session',
        entityId: newSession.id,
        changes: { created: newSession },
        ipAddress: getClientIp(),
        userAgent: getUserAgent()
      }
    });
    
    return newSession;
  });
  
  return session;
}

function generateOdometerRequestBody(vehicle: Vehicle, session: ChargeSession, lastKnownKm: number): string {
  return `
Здравейте,

Има ново зареждане за автомобил ${vehicle.make} ${vehicle.model} (${vehicle.registrationNo}).

📍 Данни за зареждането:
• Дата: ${formatDate(session.startedAt)}
• Заредени: ${session.kwhCharged} kWh
• Цена: ${session.priceTotal} лв.

📊 Последни известни километри: ${lastKnownKm} км

Моля, въведете текущото показание на одометъра, за да изчислим разхода.

👉 Въведете одометър: [LINK]

С уважение,
ЕCar Fleet System
  `.trim();
}
```

### 2️⃣ Въвеждане на одометър (от шофьор)

#### Flowchart

```
┌─────────────────────────────────────────────────┐
│ Шофьор получава email нотификация с линк        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Отваря линка → пренасочване към                 │
│ /driver/odometer-entry/:sessionId               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Зарежда се страница с информация:               │
│ • Автомобил (марка, модел, рег. номер)          │
│ • Дата на зареждане                             │
│ • kWh заредени                                  │
│ • Цена                                          │
│ • Последни известни километри                   │
│ • Поле за въвеждане на текущи километри         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Шофьорът въвежда: current_km                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│ Валидации (client-side):                        │
│ ✓ current_km > last_known_km                    │
│ ✓ current_km - last_known_km < MAX_DIFF (2000)  │
│ ✓ current_km е число                            │
└────────────────┬───────────────┬────────────────┘
                 │               │
            Невалидно        Валидно
                 │               │
                 ▼               ▼
     ┌────────────────┐  ┌─────────────────────────┐
     │ Показва грешки │  │ Изпраща POST заявка     │
     │ на полето      │  │ към API                 │
     └────────────────┘  └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Backend валидация:      │
                         │ • Проверка права        │
                         │ • Дубликат проверка     │
                         │ • Бизнес валидации      │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Записва в БД:           │
                         │ • odometer_readings     │
                         │ • reading_km            │
                         │ • reading_at = NOW()    │
                         │ • entered_by = user_id  │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Trigger автоматично:    │
                         │ • Изчислява distance    │
                         │ • Изчислява kWh/100km   │
                         │ • Изчислява лв./100km   │
                         │ • Обновява session      │
                         │   status = 'completed'  │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Обновява notification:  │
                         │ • status = 'seen'       │
                         │ • seen_at = NOW()       │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Audit log:              │
                         │ • action: enter_odometer│
                         │ • entity: reading       │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ Връща успешен резултат  │
                         │ с изчислените метрики   │
                         └──────────┬──────────────┘
                                    │
                                    ▼
                         ┌─────────────────────────┐
                         │ UI показва:             │
                         │ ✓ "Одометър записан"    │
                         │ • Изминати: X km        │
                         │ • Разход: Y kWh/100km   │
                         │ • Цена: Z лв./100km     │
                         └─────────────────────────┘
```

#### Pseudocode

```typescript
async function submitOdometerReading(
  userId: string,
  sessionId: string,
  currentKm: number
): Promise<OdometerReadingResult> {
  
  // 1. Намиране на сесията
  const session = await db.chargeSessions.findOne({
    where: { id: sessionId },
    include: { vehicle: true }
  });
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.status !== 'pending_odometer') {
    throw new Error('Session is not pending odometer reading');
  }
  
  // 2. Проверка дали потребителят има права за този автомобил
  const hasAccess = await db.userVehicles.exists({
    where: {
      userId: userId,
      vehicleId: session.vehicleId,
      OR: [
        { assignedUntil: null },
        { assignedUntil: { gt: new Date() } }
      ]
    }
  });
  
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this vehicle');
  }
  
  // 3. Проверка дали вече има одометър за тази сесия
  const existingReading = await db.odometerReadings.findOne({
    where: { sessionId: sessionId }
  });
  
  if (existingReading) {
    throw new Error('Odometer reading already submitted for this session');
  }
  
  // 4. Намиране на последното показание
  const previousReading = await db.odometerReadings.findOne({
    where: {
      vehicleId: session.vehicleId,
      readingAt: { lt: new Date() }
    },
    orderBy: { readingAt: 'DESC' }
  });
  
  const lastKnownKm = previousReading?.readingKm || 0;
  
  // 5. Валидации
  if (currentKm <= lastKnownKm) {
    throw new ValidationError(`Current km (${currentKm}) must be greater than last known km (${lastKnownKm})`);
  }
  
  const distance = currentKm - lastKnownKm;
  const MAX_REASONABLE_DISTANCE = 2000; // Конфигурируемо
  
  if (distance > MAX_REASONABLE_DISTANCE) {
    throw new ValidationError(
      `Distance (${distance} km) seems unreasonably high. ` +
      `Maximum allowed: ${MAX_REASONABLE_DISTANCE} km. ` +
      `Please verify the odometer reading.`
    );
  }
  
  // 6. Изчисляване на метрики
  const kwhPer100km = (session.kwhCharged / distance) * 100;
  const costPer100km = (session.priceTotal / distance) * 100;
  
  // 7. Транзакция
  const result = await db.transaction(async (trx) => {
    // Създаване на odometer reading
    const reading = await trx.odometerReadings.create({
      data: {
        vehicleId: session.vehicleId,
        sessionId: session.id,
        readingKm: currentKm,
        readingAt: new Date(),
        enteredBy: userId,
        isVerified: false, // Fleet manager може да верифицира после
        distanceFromPreviousKm: distance,
        kwhPer100km: kwhPer100km,
        costPer100km: costPer100km
      }
    });
    
    // Обновяване на сесията
    await trx.chargeSessions.update({
      where: { id: session.id },
      data: { status: 'completed' }
    });
    
    // Обновяване на нотификацията
    await trx.notifications.updateMany({
      where: {
        sessionId: session.id,
        userId: userId,
        type: 'odometer_request'
      },
      data: {
        status: 'seen',
        seenAt: new Date()
      }
    });
    
    // Audit log
    await trx.auditLogs.create({
      data: {
        userId: userId,
        action: 'enter_odometer',
        entityType: 'odometer_reading',
        entityId: reading.id,
        changes: {
          sessionId: session.id,
          vehicleId: session.vehicleId,
          readingKm: currentKm,
          distance: distance,
          kwhPer100km: kwhPer100km,
          costPer100km: costPer100km
        },
        ipAddress: getClientIp(),
        userAgent: getUserAgent()
      }
    });
    
    return reading;
  });
  
  return {
    success: true,
    reading: result,
    metrics: {
      distanceKm: distance,
      kwhPer100km: roundTo2Decimals(kwhPer100km),
      costPer100km: roundTo2Decimals(costPer100km),
      totalKwh: session.kwhCharged,
      totalCost: session.priceTotal
    }
  };
}
```

## 📊 Изчисляване на разход и KPI

### Формули

#### 1. Изминати километри между зарежданията

```
distance_km = current_odometer_km - previous_odometer_km
```

#### 2. Разход на енергия (kWh на 100 км)

```
kwh_per_100km = (kwh_charged / distance_km) × 100
```

**Пример:**
- Заредени: 45 kWh
- Изминати: 250 km
- Разход: (45 / 250) × 100 = **18 kWh/100km**

#### 3. Разход на пари (лв. на 100 км)

```
cost_per_100km = (price_total / distance_km) × 100
```

**Пример:**
- Цена: 18 лв.
- Изминати: 250 km
- Разход: (18 / 250) × 100 = **7.20 лв./100km**

#### 4. Средна цена за kWh

```
price_per_kwh = price_total / kwh_charged
```

#### 5. Агрегирани показатели за период

```sql
-- Общ разход за автомобил за период
SELECT
    v.registration_no,
    COUNT(cs.id) as total_sessions,
    SUM(cs.kwh_charged) as total_kwh,
    SUM(cs.price_total) as total_cost,
    SUM(od.distance_from_previous_km) as total_distance_km,
    
    -- Средно претеглен разход (правилен начин)
    CASE 
        WHEN SUM(od.distance_from_previous_km) > 0 
        THEN (SUM(cs.kwh_charged) / SUM(od.distance_from_previous_km)) * 100
        ELSE 0
    END as avg_kwh_per_100km,
    
    CASE 
        WHEN SUM(od.distance_from_previous_km) > 0 
        THEN (SUM(cs.price_total) / SUM(od.distance_from_previous_km)) * 100
        ELSE 0
    END as avg_cost_per_100km,
    
    -- Средна цена за kWh
    CASE 
        WHEN SUM(cs.kwh_charged) > 0 
        THEN SUM(cs.price_total) / SUM(cs.kwh_charged)
        ELSE 0
    END as avg_price_per_kwh

FROM vehicles v
LEFT JOIN charge_sessions cs ON v.id = cs.vehicle_id
    AND cs.status = 'completed'
    AND cs.started_at BETWEEN :start_date AND :end_date
LEFT JOIN odometer_readings od ON cs.id = od.session_id
WHERE v.status = 'active'
GROUP BY v.id, v.registration_no
ORDER BY total_cost DESC;
```

### SQL заявки за често използвани отчети

#### 1. Топ 5 автомобила по разход за месец

```sql
WITH monthly_stats AS (
    SELECT
        v.id,
        v.registration_no,
        v.make,
        v.model,
        SUM(cs.price_total) as total_cost,
        SUM(cs.kwh_charged) as total_kwh,
        SUM(od.distance_from_previous_km) as total_km,
        COUNT(cs.id) as session_count
    FROM vehicles v
    JOIN charge_sessions cs ON v.id = cs.vehicle_id
        AND cs.status = 'completed'
        AND DATE_TRUNC('month', cs.started_at) = DATE_TRUNC('month', CURRENT_DATE)
    JOIN odometer_readings od ON cs.id = od.session_id
    GROUP BY v.id, v.registration_no, v.make, v.model
)
SELECT
    registration_no,
    make || ' ' || model as vehicle,
    total_cost,
    total_kwh,
    total_km,
    session_count,
    ROUND((total_kwh / NULLIF(total_km, 0)) * 100, 2) as avg_kwh_per_100km,
    ROUND((total_cost / NULLIF(total_km, 0)) * 100, 2) as avg_cost_per_100km
FROM monthly_stats
ORDER BY total_cost DESC
LIMIT 5;
```

#### 2. Ефективност по шофьор

```sql
SELECT
    u.full_name,
    u.email,
    COUNT(DISTINCT uv.vehicle_id) as vehicles_count,
    COUNT(cs.id) as total_sessions,
    SUM(cs.price_total) as total_spent,
    SUM(od.distance_from_previous_km) as total_km_driven,
    AVG(od.kwh_per_100km) as avg_consumption
FROM users u
JOIN user_vehicles uv ON u.id = uv.user_id
JOIN charge_sessions cs ON uv.vehicle_id = cs.vehicle_id
    AND cs.status = 'completed'
    AND cs.started_at >= :start_date
JOIN odometer_readings od ON cs.id = od.session_id
    AND od.entered_by = u.id
WHERE u.role = 'driver'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_spent DESC;
```

#### 3. Сравнение месец-спрямо-месец (MoM)

```sql
WITH monthly_totals AS (
    SELECT
        DATE_TRUNC('month', cs.started_at) as month,
        COUNT(cs.id) as sessions,
        SUM(cs.price_total) as total_cost,
        SUM(cs.kwh_charged) as total_kwh,
        SUM(od.distance_from_previous_km) as total_km
    FROM charge_sessions cs
    LEFT JOIN odometer_readings od ON cs.id = od.session_id
    WHERE cs.status = 'completed'
        AND cs.started_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
    GROUP BY DATE_TRUNC('month', cs.started_at)
),
with_previous AS (
    SELECT
        month,
        sessions,
        total_cost,
        total_kwh,
        total_km,
        LAG(total_cost) OVER (ORDER BY month) as prev_month_cost,
        LAG(total_km) OVER (ORDER BY month) as prev_month_km
    FROM monthly_totals
)
SELECT
    TO_CHAR(month, 'YYYY-MM') as month,
    sessions,
    ROUND(total_cost, 2) as cost,
    ROUND(total_kwh, 2) as kwh,
    total_km as km,
    ROUND((total_cost / NULLIF(total_km, 0)) * 100, 2) as cost_per_100km,
    CASE
        WHEN prev_month_cost IS NOT NULL AND prev_month_cost > 0
        THEN ROUND(((total_cost - prev_month_cost) / prev_month_cost) * 100, 2)
        ELSE NULL
    END as cost_change_pct
FROM with_previous
ORDER BY month DESC;
```

#### 4. Pending одометри (за напомняния)

```sql
SELECT
    cs.id,
    cs.created_at,
    v.registration_no,
    v.make,
    v.model,
    cs.started_at as charge_date,
    cs.kwh_charged,
    cs.price_total,
    u.full_name as driver_name,
    u.email as driver_email,
    EXTRACT(EPOCH FROM (NOW() - cs.created_at)) / 3600 as hours_pending
FROM charge_sessions cs
JOIN vehicles v ON cs.vehicle_id = v.id
JOIN user_vehicles uv ON v.id = uv.vehicle_id
    AND (uv.assigned_until IS NULL OR uv.assigned_until > NOW())
JOIN users u ON uv.user_id = u.id
WHERE cs.status = 'pending_odometer'
ORDER BY cs.created_at ASC;
```

## 🔔 Бизнес правила

### Валидации при създаване на сесия

1. **Дати:**
   - `ended_at >= started_at`
   - `started_at` не е повече от 30 дни в миналото (конфигурируемо)
   - `started_at` не е в бъдещето

2. **kWh:**
   - `kwh_charged > 0`
   - `kwh_charged <= vehicle.battery_capacity_kwh * 1.2` (120% от капацитета - за зимни условия)

3. **Цена:**
   - `price_total >= 0`
   - Ако е подадена тарифа: проверка дали `price_total ≈ kwh_charged × tariff.price_per_kwh` (±10% толеранс)

4. **Автомобил:**
   - Автомобилът трябва да е `status = 'active'`
   - Автомобилът трябва да има поне един assigned потребител

### Валидации при въвеждане на одометър

1. **Километри:**
   - `current_km > last_known_km`
   - `current_km - last_known_km < MAX_DISTANCE` (напр. 2000 km)
   - `current_km - last_known_km >= MIN_DISTANCE` (напр. 1 km)

2. **Права:**
   - Потребителят трябва да е активен
   - Потребителят трябва да е свързан с автомобила в `user_vehicles`
   - `assigned_until` е NULL или в бъдещето

3. **Състояние:**
   - Сесията трябва да е `status = 'pending_odometer'`
   - Не трябва да съществува одометър за тази сесия (no duplicate)

### Бизнес алерти

1. **Висок разход:**
   - Ако `kwh_per_100km > 25` → флаг за проверка
   - Ако `cost_per_100km > 15 BGN` → флаг за проверка

2. **Неразумни данни:**
   - Ако изминати километри > 500 за една сесия → изисква одобрение от fleet manager
   - Ако разход < 5 kWh/100km → възможна грешка в данните

3. **Забавени одометри:**
   - След 24 часа без одометър → първо напомняне
   - След 48 часа без одометър → второ напомняне + нотификация до fleet manager
   - След 72 часа → ескалация до admin

---

**Следваща стъпка:** Нотификационна система
