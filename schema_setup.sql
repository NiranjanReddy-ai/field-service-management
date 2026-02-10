-- =============================================
-- FIELD SERVICE MANAGEMENT INITIALIZATION SCRIPT (UPDATED)
-- RUN THIS IN PGADMIN QUERY TOOL
-- =============================================

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS admin;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS admin.users (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'technician')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Technicians Table
CREATE TABLE IF NOT EXISTS admin.technicians (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES admin.users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    status VARCHAR(20) CHECK (status IN ('online', 'busy', 'offline')) DEFAULT 'offline',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Tickets Table
CREATE TABLE IF NOT EXISTS admin.tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    address VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('open', 'assigned', 'in_progress', 'completed')) DEFAULT 'open',
    technician_id INT REFERENCES admin.users(id),
    scheduled_time TIMESTAMP,
    description TEXT
);

-- 5. NEW: Create Trip Logs Table (For Travel Stats)
CREATE TABLE IF NOT EXISTS admin.trip_logs (
    id SERIAL PRIMARY KEY,
    technician_id INT REFERENCES admin.users(id),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    distance_km DECIMAL(10, 2),
    travel_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Insert Users
INSERT INTO admin.users (emp_id, name, password, role) VALUES 
('ADM001', 'System Admin', 'admin123', 'admin'),
('TECH001', 'John Doe', 'tech123', 'technician'),
('TECH002', 'Sarah Smith', 'tech123', 'technician'),
('TECH003', 'Mike Johnson', 'tech123', 'technician')
ON CONFLICT (emp_id) DO NOTHING;

-- 7. Insert Technician Status
INSERT INTO admin.technicians (user_id, lat, lng, status)
SELECT id, 40.7128, -74.0060, 'online' FROM admin.users WHERE emp_id = 'TECH001'
AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);

INSERT INTO admin.technicians (user_id, lat, lng, status)
SELECT id, 40.7282, -73.9942, 'busy' FROM admin.users WHERE emp_id = 'TECH002'
AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);

INSERT INTO admin.technicians (user_id, lat, lng, status)
SELECT id, 40.7589, -73.9851, 'offline' FROM admin.users WHERE emp_id = 'TECH003'
AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);

-- 8. Insert Tickets
INSERT INTO admin.tickets (ticket_number, customer_name, address, status, technician_id, scheduled_time, description)
VALUES 
('JOB-8821', 'TechStart Inc', '123 Innovation Dr, New York, NY', 'in_progress', (SELECT id FROM admin.users WHERE emp_id='TECH001'), NOW() + INTERVAL '2 hours', 'Server rack maintenance'),
('JOB-8824', 'Global Logistics', '45 Warehouse Blvd, Brooklyn, NY', 'assigned', (SELECT id FROM admin.users WHERE emp_id='TECH002'), NOW() + INTERVAL '5 hours', 'CCTV Camera repair'),
('JOB-9001', 'Downtown Coffee', '88 Main St, New York, NY', 'open', NULL, NOW() + INTERVAL '1 day', 'WiFi Access Point installation'),
('JOB-9002', 'City Library', '10 Park Ave, New York, NY', 'completed', (SELECT id FROM admin.users WHERE emp_id='TECH001'), NOW() - INTERVAL '2 hours', 'Router Replacement')
ON CONFLICT (ticket_number) DO NOTHING;

-- 9. Insert Trip Logs (Sample Data for Stats)
-- John Doe (TECH001) Data
INSERT INTO admin.trip_logs (technician_id, from_location, to_location, distance_km, travel_date)
VALUES 
-- Today's Trips
((SELECT id FROM admin.users WHERE emp_id='TECH001'), 'Office', '123 Innovation Dr', 12.5, CURRENT_DATE),
((SELECT id FROM admin.users WHERE emp_id='TECH001'), '123 Innovation Dr', '10 Park Ave', 5.2, CURRENT_DATE),
-- Yesterday
((SELECT id FROM admin.users WHERE emp_id='TECH001'), 'Office', '88 Main St', 8.5, CURRENT_DATE - INTERVAL '1 day'),
((SELECT id FROM admin.users WHERE emp_id='TECH001'), '88 Main St', 'Warehouse', 15.0, CURRENT_DATE - INTERVAL '1 day'),
-- Past Month Data (Random samples for Avg Calc)
((SELECT id FROM admin.users WHERE emp_id='TECH001'), 'Loc A', 'Loc B', 22.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM admin.users WHERE emp_id='TECH001'), 'Loc B', 'Loc C', 18.5, CURRENT_DATE - INTERVAL '10 days'),
((SELECT id FROM admin.users WHERE emp_id='TECH001'), 'Loc C', 'Loc D', 10.0, CURRENT_DATE - INTERVAL '15 days');

-- Sarah Doe (TECH002) Data
INSERT INTO admin.trip_logs (technician_id, from_location, to_location, distance_km, travel_date)
VALUES 
((SELECT id FROM admin.users WHERE emp_id='TECH002'), 'Home', '45 Warehouse Blvd', 8.0, CURRENT_DATE),
((SELECT id FROM admin.users WHERE emp_id='TECH002'), '45 Warehouse Blvd', 'Site B', 11.2, CURRENT_DATE - INTERVAL '2 days');


SELECT 'DATABASE RE-SEEDED WITH TRAVEL STATS' as status;
