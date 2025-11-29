-- ════════════════════════════════════════════════════════════════════════════
-- ECar Fleet Management System - Database Schema
-- PostgreSQL 14+
-- ════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- TABLE: users
-- Description: System users (admins, fleet managers, drivers)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON COLUMN users.role IS 'User role: admin, fleet_manager, or driver';

-- ============================================================================
-- TABLE: vehicles
-- Description: Electric vehicles in the fleet
-- ============================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

COMMENT ON TABLE vehicles IS 'Electric vehicles in the fleet';
COMMENT ON COLUMN vehicles.battery_capacity_kwh IS 'Battery capacity in kWh';

-- ============================================================================
-- TABLE: user_vehicles
-- Description: Assignment of users to vehicles
-- ============================================================================

CREATE TABLE user_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_user_vehicles_active ON user_vehicles(user_id, vehicle_id) 
    WHERE assigned_until IS NULL OR assigned_until > NOW();

COMMENT ON TABLE user_vehicles IS 'Assignment of users to vehicles';
COMMENT ON COLUMN user_vehicles.role_on_vehicle IS 'User role for this specific vehicle';

-- ============================================================================
-- TABLE: stations
-- Description: Charging stations
-- ============================================================================

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    provider VARCHAR(100),
    power_kw DECIMAL(6,2),
    connector_types TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stations_name ON stations(name);
CREATE INDEX idx_stations_provider ON stations(provider);
CREATE INDEX idx_stations_is_active ON stations(is_active);
CREATE INDEX idx_stations_location ON stations USING GIST(ll_to_earth(latitude, longitude)) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE stations IS 'Charging stations';
COMMENT ON COLUMN stations.connector_types IS 'Array of connector types: Type2, CCS, CHAdeMO';

-- ============================================================================
-- TABLE: tariffs
-- Description: Charging tariffs and pricing
-- ============================================================================

CREATE TABLE tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100),
    price_per_kwh DECIMAL(8,4) NOT NULL CHECK (price_per_kwh >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BGN',
    valid_from DATE NOT NULL,
    valid_until DATE,
    time_of_day VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tariffs_provider ON tariffs(provider);
CREATE INDEX idx_tariffs_is_active ON tariffs(is_active);
CREATE INDEX idx_tariffs_valid_dates ON tariffs(valid_from, valid_until);

COMMENT ON TABLE tariffs IS 'Charging tariffs and pricing';
COMMENT ON COLUMN tariffs.time_of_day IS 'Time of day: peak, off-peak, or all-day';

-- ============================================================================
-- TABLE: charge_sessions
-- Description: Charging sessions (manually entered)
-- ============================================================================

CREATE TABLE charge_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
    tariff_id UUID REFERENCES tariffs(id) ON DELETE SET NULL,
    
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    kwh_charged DECIMAL(8,3) NOT NULL CHECK (kwh_charged >= 0),
    
    price_total DECIMAL(10,2) NOT NULL CHECK (price_total >= 0),
    price_per_kwh DECIMAL(8,4),
    currency VARCHAR(3) NOT NULL DEFAULT 'BGN',
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending_odometer' 
        CHECK (status IN ('pending_odometer', 'completed', 'cancelled')),
    
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
CREATE INDEX idx_charge_sessions_pending ON charge_sessions(vehicle_id, status) 
    WHERE status = 'pending_odometer';
CREATE INDEX idx_charge_sessions_vehicle_started ON charge_sessions(vehicle_id, started_at DESC);

COMMENT ON TABLE charge_sessions IS 'Charging sessions - manually entered by administrators';
COMMENT ON COLUMN charge_sessions.status IS 'pending_odometer - awaiting odometer, completed - finished, cancelled - cancelled';
COMMENT ON COLUMN charge_sessions.kwh_charged IS 'Charged kWh';
COMMENT ON COLUMN charge_sessions.price_total IS 'Total price including VAT';

-- ============================================================================
-- TABLE: odometer_readings
-- Description: Odometer readings for vehicles
-- ============================================================================

CREATE TABLE odometer_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

COMMENT ON TABLE odometer_readings IS 'Odometer readings for vehicles';
COMMENT ON COLUMN odometer_readings.distance_from_previous_km IS 'Distance traveled since previous reading';
COMMENT ON COLUMN odometer_readings.kwh_per_100km IS 'Energy consumption per 100 km';
COMMENT ON COLUMN odometer_readings.cost_per_100km IS 'Cost per 100 km in BGN';

-- ============================================================================
-- TABLE: notifications
-- Description: Notifications to users
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_session_id ON notifications(session_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_queued ON notifications(status, created_at) WHERE status = 'queued';

COMMENT ON TABLE notifications IS 'Notifications to users';
COMMENT ON COLUMN notifications.type IS 'Notification type: odometer_request, odometer_reminder, report_ready, system';
COMMENT ON COLUMN notifications.metadata IS 'JSON data - template variables, retry count, etc.';

-- ============================================================================
-- TABLE: audit_logs
-- Description: Audit trail for all critical actions
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    
    changes JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit trail for all critical actions';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with changes - before and after';

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGERS AND FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- Function: Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at 
    BEFORE UPDATE ON stations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariffs_updated_at 
    BEFORE UPDATE ON tariffs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charge_sessions_updated_at 
    BEFORE UPDATE ON charge_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate consumption metrics for odometer readings
CREATE OR REPLACE FUNCTION calculate_consumption_metrics()
RETURNS TRIGGER AS $$
DECLARE
    prev_reading RECORD;
    session_rec RECORD;
BEGIN
    -- Find previous odometer reading for the same vehicle
    SELECT reading_km, reading_at INTO prev_reading
    FROM odometer_readings
    WHERE vehicle_id = NEW.vehicle_id
      AND reading_at < NEW.reading_at
      AND id != NEW.id
    ORDER BY reading_at DESC
    LIMIT 1;
    
    -- Calculate distance if previous reading exists
    IF prev_reading IS NOT NULL THEN
        NEW.distance_from_previous_km := NEW.reading_km - prev_reading.reading_km;
        
        -- Calculate consumption if linked to a session
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

-- Function: Update session status when odometer is entered
CREATE OR REPLACE FUNCTION update_session_status_on_odometer()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session status to completed when odometer is entered
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

-- ════════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ════════════════════════════════════════════════════════════════════════════

-- View: Latest odometer readings per vehicle
CREATE OR REPLACE VIEW v_latest_odometer AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    reading_km,
    reading_at,
    entered_by
FROM odometer_readings
ORDER BY vehicle_id, reading_at DESC;

COMMENT ON VIEW v_latest_odometer IS 'Latest odometer reading for each vehicle';

-- View: Completed sessions with full details
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

COMMENT ON VIEW v_completed_sessions IS 'Completed charging sessions with all details';

-- View: Vehicle statistics
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

COMMENT ON VIEW v_vehicle_statistics IS 'Aggregated statistics per vehicle';

-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
-- ════════════════════════════════════════════════════════════════════════════
