-- =============================================
-- GK ENTERPRISES SCHEMA SETUP
-- RUN THIS IN PGADMIN QUERY TOOL
-- =============================================

-- 1. Create Schema "GK enterprises"
CREATE SCHEMA IF NOT EXISTS "GK enterprises";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS "GK enterprises".users (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'technician')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Technicians Table
CREATE TABLE IF NOT EXISTS "GK enterprises".technicians (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES "GK enterprises".users(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    status VARCHAR(20) CHECK (status IN ('online', 'busy', 'offline')) DEFAULT 'offline',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Tickets Table
CREATE TABLE IF NOT EXISTS "GK enterprises".tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    address VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('open', 'assigned', 'in_progress', 'completed')) DEFAULT 'open',
    technician_id INT REFERENCES "GK enterprises".users(id),
    scheduled_time TIMESTAMP,
    description TEXT
);

-- 5. Create Trip Logs Table (For Travel Stats)
CREATE TABLE IF NOT EXISTS "GK enterprises".trip_logs (
    id SERIAL PRIMARY KEY,
    technician_id INT REFERENCES "GK enterprises".users(id),
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    distance_km DECIMAL(10, 2),
    travel_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Insert Users (5 Technicians + 1 Admin)
INSERT INTO "GK enterprises".users (emp_id, name, password, role) VALUES 
('ADM001', 'GK Admin', 'admin123', 'admin'),
('TECH001', 'Rajesh Kumar', 'tech123', 'technician'),
('TECH002', 'Suresh Reddy', 'tech123', 'technician'),
('TECH003', 'Anil Singh', 'tech123', 'technician'),
('TECH004', 'Vikram Patel', 'tech123', 'technician'),
('TECH005', 'Manoj Sharma', 'tech123', 'technician')
ON CONFLICT (emp_id) DO NOTHING;

-- 7. Insert Technician Status
INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status) VALUES
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 12.9716, 77.5946, 'online'),  -- Bangalore
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH002'), 13.0827, 80.2707, 'busy'),    -- Chennai
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH003'), 17.3850, 78.4867, 'offline'), -- Hyderabad
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH004'), 19.0760, 72.8777, 'online'),  -- Mumbai
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH005'), 28.6139, 77.2090, 'busy');    -- Delhi

-- 8. Insert Sample Tickets (For Stats)
INSERT INTO "GK enterprises".tickets (ticket_number, customer_name, address, status, technician_id, description) VALUES
('TKT-1001', 'Infosys Campus', 'Electronics City, Bangalore', 'in_progress', (SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Network Maintenance'),
('TKT-1002', 'Wipro Office', 'Sarjapur, Bangalore', 'completed', (SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Server Install'),
('TKT-1003', 'TCS Sipcot', 'Siruseri, Chennai', 'assigned', (SELECT id FROM "GK enterprises".users WHERE emp_id='TECH002'), 'CCTV Repair'),
('TKT-1004', 'Hitech City Mall', 'Hyderabad', 'open', NULL, 'Wiring Check'),
('TKT-1005', 'Reliance HQ', 'BKC, Mumbai', 'completed', (SELECT id FROM "GK enterprises".users WHERE emp_id='TECH004'), 'Router Config'),
('TKT-1006', 'DLF CyberHub', 'Gurgaon', 'assigned', (SELECT id FROM "GK enterprises".users WHERE emp_id='TECH005'), 'Switch Replacement')
ON CONFLICT (ticket_number) DO NOTHING;

-- 9. Insert Trip Logs (For Travel Matrix)
INSERT INTO "GK enterprises".trip_logs (technician_id, from_location, to_location, distance_km, travel_date) VALUES
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Office', 'Infosys Campus', 15.2, CURRENT_DATE),
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Infosys Campus', 'Wipro Office', 8.5, CURRENT_DATE),
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH002'), 'Home', 'TCS Sipcot', 22.0, CURRENT_DATE),
((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH004'), 'Andheri', 'BKC', 12.0, CURRENT_DATE);

SELECT 'GK ENTERPRISES DB SETUP COMPLETE' as status;
