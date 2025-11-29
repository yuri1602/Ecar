-- ════════════════════════════════════════════════════════════════════════════
-- ECar Fleet Management System - Seed Data
-- Initial data for development and testing
-- ════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- SEED: Users
-- Password for all: "Password123!" (hashed with bcrypt, 10 rounds)
-- ============================================================================

INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@ecar.local', '$2b$10$YourHashedPasswordHere1', 'Системен Администратор', '+359888111222', 'admin', true),
    ('00000000-0000-0000-0000-000000000002', 'manager@ecar.local', '$2b$10$YourHashedPasswordHere2', 'Иван Петров', '+359888222333', 'fleet_manager', true),
    ('00000000-0000-0000-0000-000000000003', 'driver1@ecar.local', '$2b$10$YourHashedPasswordHere3', 'Георги Стоянов', '+359888333444', 'driver', true),
    ('00000000-0000-0000-0000-000000000004', 'driver2@ecar.local', '$2b$10$YourHashedPasswordHere4', 'Мария Димитрова', '+359888444555', 'driver', true)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE users IS 'Default password for all users: Password123!';

-- ============================================================================
-- SEED: Vehicles
-- ============================================================================

INSERT INTO vehicles (id, registration_no, make, model, year, battery_capacity_kwh, vin, color, status, purchase_date) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CA1234AB', 'Tesla', 'Model 3', 2022, 75.0, 'VIN1234567890001', 'Бяла', 'active', '2022-03-15'),
    ('10000000-0000-0000-0000-000000000002', 'CA5678CD', 'Nissan', 'Leaf', 2021, 40.0, 'VIN1234567890002', 'Синя', 'active', '2021-06-20'),
    ('10000000-0000-0000-0000-000000000003', 'CA9012EF', 'Volkswagen', 'ID.4', 2023, 82.0, 'VIN1234567890003', 'Сива', 'active', '2023-01-10'),
    ('10000000-0000-0000-0000-000000000004', 'CA3456GH', 'BMW', 'iX3', 2022, 80.0, 'VIN1234567890004', 'Черна', 'maintenance', '2022-09-05')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: User-Vehicle Assignments
-- ============================================================================

INSERT INTO user_vehicles (user_id, vehicle_id, role_on_vehicle, assigned_at) VALUES
    -- Георги Стоянов - primary driver на Tesla Model 3
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'primary_driver', NOW() - INTERVAL '60 days'),
    -- Георги Стоянов - driver на Nissan Leaf (споделен автомобил)
    ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'driver', NOW() - INTERVAL '45 days'),
    -- Мария Димитрова - primary driver на VW ID.4
    ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'primary_driver', NOW() - INTERVAL '30 days'),
    -- Мария Димитрова - driver на Nissan Leaf (споделен автомобил)
    ('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'driver', NOW() - INTERVAL '45 days')
ON CONFLICT (user_id, vehicle_id) DO NOTHING;

-- ============================================================================
-- SEED: Charging Stations
-- ============================================================================

INSERT INTO stations (id, name, location, address, latitude, longitude, provider, power_kw, connector_types, is_active) VALUES
    ('20000000-0000-0000-0000-000000000001', 'ЕВН София Център', 'София, бул. Витоша', 'бул. Витоша 100, София', 42.6977, 23.3219, 'EVN', 50.0, ARRAY['Type2', 'CCS'], true),
    ('20000000-0000-0000-0000-000000000002', 'Petrol EV - Младост', 'София, ж.к. Младост', 'бул. Александър Малинов 51, София', 42.6505, 23.3798, 'Petrol', 22.0, ARRAY['Type2'], true),
    ('20000000-0000-0000-0000-000000000003', 'Shell Recharge - Драгалевци', 'София, Драгалевци', 'бул. България 102, София', 42.6455, 23.2795, 'Shell', 150.0, ARRAY['CCS', 'CHAdeMO'], true),
    ('20000000-0000-0000-0000-000000000004', 'Kaufland - Люлин', 'София, Люлин', 'бул. Панчо Владигеров 78, София', 42.7147, 23.2548, 'Kaufland', 11.0, ARRAY['Type2'], true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: Tariffs
-- ============================================================================

INSERT INTO tariffs (id, name, provider, price_per_kwh, currency, valid_from, valid_until, time_of_day, is_active, description) VALUES
    ('30000000-0000-0000-0000-000000000001', 'Стандартна тарифа 2025', 'EVN', 0.40, 'BGN', '2025-01-01', '2025-12-31', 'all-day', true, 'Стандартна дневна и нощна тарифа'),
    ('30000000-0000-0000-0000-000000000002', 'Petrol Premium', 'Petrol', 0.45, 'BGN', '2025-01-01', '2025-12-31', 'all-day', true, 'Premium тарифа в Petrol станции'),
    ('30000000-0000-0000-0000-000000000003', 'Shell Fast Charge', 'Shell', 0.55, 'BGN', '2025-01-01', '2025-12-31', 'all-day', true, 'Бързо зареждане Shell'),
    ('30000000-0000-0000-0000-000000000004', 'Kaufland Basic', 'Kaufland', 0.35, 'BGN', '2025-01-01', '2025-12-31', 'all-day', true, 'Базова тарифа в Kaufland паркинги')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: Historical Charge Sessions (Last 60 days)
-- ============================================================================

-- Session 1: Tesla Model 3 - 60 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '60 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '60 days' + INTERVAL '15 hours 30 minutes',
    52.5,
    21.00,
    0.40,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 1
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    44800,
    NOW() - INTERVAL '60 days' + INTERVAL '16 hours',
    '00000000-0000-0000-0000-000000000003',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 2: Tesla Model 3 - 45 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '45 days' + INTERVAL '9 hours',
    NOW() - INTERVAL '45 days' + INTERVAL '11 hours',
    48.0,
    21.60,
    0.45,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 2
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    45050,
    NOW() - INTERVAL '45 days' + INTERVAL '12 hours',
    '00000000-0000-0000-0000-000000000003',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 3: Tesla Model 3 - 30 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '30 days' + INTERVAL '18 hours',
    NOW() - INTERVAL '30 days' + INTERVAL '19 hours',
    55.0,
    30.25,
    0.55,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 3
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000003',
    45280,
    NOW() - INTERVAL '30 days' + INTERVAL '20 hours',
    '00000000-0000-0000-0000-000000000003',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 4: Nissan Leaf - 35 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    NOW() - INTERVAL '35 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '35 days' + INTERVAL '10 hours',
    32.0,
    11.20,
    0.35,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 4
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000004',
    31900,
    NOW() - INTERVAL '35 days' + INTERVAL '11 hours',
    '00000000-0000-0000-0000-000000000004',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 5: VW ID.4 - 25 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '25 days' + INTERVAL '15 hours',
    NOW() - INTERVAL '25 days' + INTERVAL '17 hours',
    60.0,
    24.00,
    0.40,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 5
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000005',
    12300,
    NOW() - INTERVAL '25 days' + INTERVAL '18 hours',
    '00000000-0000-0000-0000-000000000004',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 6: Tesla Model 3 - 15 days ago (completed)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '15 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '15 days' + INTERVAL '12 hours',
    50.0,
    22.50,
    0.45,
    'completed',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Odometer for Session 6
INSERT INTO odometer_readings (vehicle_id, session_id, reading_km, reading_at, entered_by, is_verified)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000006',
    45520,
    NOW() - INTERVAL '15 days' + INTERVAL '13 hours',
    '00000000-0000-0000-0000-000000000003',
    true
) ON CONFLICT (vehicle_id, session_id) DO NOTHING;

-- Session 7: Tesla Model 3 - 2 days ago (PENDING - awaiting odometer!)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    NOW() - INTERVAL '2 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '15 hours 45 minutes',
    45.5,
    18.20,
    0.40,
    'pending_odometer',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Notification for pending session
INSERT INTO notifications (user_id, session_id, type, subject, body, status, created_at)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000007',
    'odometer_request',
    'Ново зареждане за CA1234AB - Въведете одометър',
    'Здравейте! Имате ново зареждане за автомобил Tesla Model 3 (CA1234AB). Последни известни километри: 45,520 км. Моля, въведете текущото показание на одометъра.',
    'sent',
    NOW() - INTERVAL '2 days' + INTERVAL '16 hours'
) ON CONFLICT DO NOTHING;

-- Session 8: Nissan Leaf - 5 days ago (PENDING - awaiting odometer!)
INSERT INTO charge_sessions (id, vehicle_id, station_id, tariff_id, started_at, ended_at, kwh_charged, price_total, price_per_kwh, status, created_by)
VALUES (
    '40000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    '30000000-0000-0000-0000-000000000004',
    NOW() - INTERVAL '5 days' + INTERVAL '8 hours',
    NOW() - INTERVAL '5 days' + INTERVAL '10 hours',
    35.0,
    12.25,
    0.35,
    'pending_odometer',
    '00000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Notifications for pending session (both drivers assigned to this vehicle)
INSERT INTO notifications (user_id, session_id, type, subject, body, status, created_at)
VALUES 
    (
        '00000000-0000-0000-0000-000000000003',
        '40000000-0000-0000-0000-000000000008',
        'odometer_request',
        'Ново зареждане за CA5678CD - Въведете одометър',
        'Здравейте! Имате ново зареждане за автомобил Nissan Leaf (CA5678CD). Последни известни километри: 31,900 км. Моля, въведете текущото показание на одометъра.',
        'sent',
        NOW() - INTERVAL '5 days' + INTERVAL '11 hours'
    ),
    (
        '00000000-0000-0000-0000-000000000004',
        '40000000-0000-0000-0000-000000000008',
        'odometer_request',
        'Ново зареждане за CA5678CD - Въведете одометър',
        'Здравейте! Имате ново зареждане за автомобил Nissan Leaf (CA5678CD). Последни известни километри: 31,900 км. Моля, въведете текущото показание на одометъра.',
        'sent',
        NOW() - INTERVAL '5 days' + INTERVAL '11 hours'
    )
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SEED DATA COMPLETE
-- ════════════════════════════════════════════════════════════════════════════

-- Summary of seeded data:
-- - 4 users (1 admin, 1 fleet_manager, 2 drivers)
-- - 4 vehicles (3 active, 1 in maintenance)
-- - 4 user-vehicle assignments
-- - 4 charging stations
-- - 4 tariffs
-- - 8 charge sessions (6 completed, 2 pending odometer)
-- - 6 odometer readings (for completed sessions)
-- - 3 notifications (for pending sessions)
