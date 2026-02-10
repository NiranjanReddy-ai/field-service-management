const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'root',
    port: 5432,
});

async function seed() {
    console.log('🌱 Starting GK Enterprises Seeding...');

    try {
        // 1. Create Database if not exists
        const dbName = 'field_service_db';
        const res = await pool.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
        if (res.rows.length === 0) {
            console.log(`Creating database ${dbName}...`);
            await pool.query(`CREATE DATABASE "${dbName}"`);
        } else {
            console.log(`Database ${dbName} exists.`);
        }
        await pool.end();

        // 2. Connect to the actual database
        const dbPool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'field_service_db',
            password: 'root',
            port: 5432,
        });

        console.log('🔌 Connected to field_service_db.');

        // 3. Create Schema "GK enterprises"
        await dbPool.query('CREATE SCHEMA IF NOT EXISTS "GK enterprises";');
        console.log('✅ Schema "GK enterprises" ensured.');

        // 4. Create Tables
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS "GK enterprises".users (
                id SERIAL PRIMARY KEY,
                emp_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('admin', 'technician')) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS "GK enterprises".technicians (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES "GK enterprises".users(id) ON DELETE CASCADE,
                lat DECIMAL(10, 8),
                lng DECIMAL(11, 8),
                status VARCHAR(20) CHECK (status IN ('online', 'busy', 'offline')) DEFAULT 'offline',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await dbPool.query(`
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
        `);

        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS "GK enterprises".trip_logs (
                id SERIAL PRIMARY KEY,
                technician_id INT REFERENCES "GK enterprises".users(id),
                from_location VARCHAR(255),
                to_location VARCHAR(255),
                distance_km DECIMAL(10, 2),
                travel_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tables created.');

        // 5. Insert Users
        console.log('👤 Inserting Users...');
        // Default password for all is 'default123'
        await dbPool.query(`
            INSERT INTO "GK enterprises".users (emp_id, name, password, role) VALUES 
            ('ADM001', 'GK Admin', 'default123', 'admin'),
            ('TECH001', 'Rajesh Kumar', 'default123', 'technician'),
            ('TECH002', 'Suresh Reddy', 'default123', 'technician'),
            ('TECH003', 'Anil Singh', 'default123', 'technician'),
            ('TECH004', 'Vikram Patel', 'default123', 'technician'),
            ('TECH005', 'Manoj Sharma', 'default123', 'technician')
            ON CONFLICT (emp_id) DO UPDATE SET password = 'default123'; 
        `);

        // 6. Insert Technician Status
        console.log('📍 Inserting Locations...');
        // We use a helper function or direct queries. Since SQL subqueries in VALUES are tricky in simple string execution if not careful, we'll do separate blocks or a smarter query.
        // Using common table expression or direct INSERT-SELECT
        await dbPool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            SELECT id, 12.9716, 77.5946, 'online' FROM "GK enterprises".users WHERE emp_id = 'TECH001'
            AND NOT EXISTS (SELECT 1 FROM "GK enterprises".technicians WHERE user_id = (SELECT id FROM "GK enterprises".users WHERE emp_id = 'TECH001'));
        `);
        await dbPool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            SELECT id, 13.0827, 80.2707, 'busy' FROM "GK enterprises".users WHERE emp_id = 'TECH002'
            AND NOT EXISTS (SELECT 1 FROM "GK enterprises".technicians WHERE user_id = (SELECT id FROM "GK enterprises".users WHERE emp_id = 'TECH002'));
        `);
        await dbPool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            SELECT id, 17.3850, 78.4867, 'offline' FROM "GK enterprises".users WHERE emp_id = 'TECH003'
            AND NOT EXISTS (SELECT 1 FROM "GK enterprises".technicians WHERE user_id = (SELECT id FROM "GK enterprises".users WHERE emp_id = 'TECH003'));
        `);
        await dbPool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            SELECT id, 19.0760, 72.8777, 'online' FROM "GK enterprises".users WHERE emp_id = 'TECH004'
            AND NOT EXISTS (SELECT 1 FROM "GK enterprises".technicians WHERE user_id = (SELECT id FROM "GK enterprises".users WHERE emp_id = 'TECH004'));
        `);
        await dbPool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            SELECT id, 28.6139, 77.2090, 'busy' FROM "GK enterprises".users WHERE emp_id = 'TECH005'
            AND NOT EXISTS (SELECT 1 FROM "GK enterprises".technicians WHERE user_id = (SELECT id FROM "GK enterprises".users WHERE emp_id = 'TECH005'));
        `);

        // 7. Insert Tickets
        console.log('🎫 Inserting Tickets...');
        const tickets = [
            ['TKT-1001', 'Infosys Campus', 'Electronics City, Bangalore', 'in_progress', 'TECH001', 'Network Maintenance'],
            ['TKT-1002', 'Wipro Office', 'Sarjapur, Bangalore', 'completed', 'TECH001', 'Server Install'],
            ['TKT-1003', 'TCS Sipcot', 'Siruseri, Chennai', 'assigned', 'TECH002', 'CCTV Repair'],
            ['TKT-1004', 'Hitech City Mall', 'Hyderabad', 'open', null, 'Wiring Check'],
            ['TKT-1005', 'Reliance HQ', 'BKC, Mumbai', 'completed', 'TECH004', 'Router Config'],
            ['TKT-1006', 'DLF CyberHub', 'Gurgaon', 'assigned', 'TECH005', 'Switch Replacement']
        ];

        for (const t of tickets) {
            let techIdQuery = "NULL";
            if (t[4]) {
                techIdQuery = `(SELECT id FROM "GK enterprises".users WHERE emp_id='${t[4]}')`;
            }

            await dbPool.query(`
                INSERT INTO "GK enterprises".tickets (ticket_number, customer_name, address, status, technician_id, description)
                VALUES ('${t[0]}', '${t[1]}', '${t[2]}', '${t[3]}', ${techIdQuery}, '${t[5]}')
                ON CONFLICT (ticket_number) DO NOTHING;
            `);
        }

        // 8. Trip Logs
        console.log('🚚 Inserting Trip Logs...');
        // Tech 1 Logs
        await dbPool.query(`
            INSERT INTO "GK enterprises".trip_logs (technician_id, from_location, to_location, distance_km, travel_date)
            VALUES 
            ((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Office', 'Infosys Campus', 15.2, CURRENT_DATE),
            ((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH001'), 'Infosys Campus', 'Wipro Office', 8.5, CURRENT_DATE)
        `);
        // Tech 2 Logs
        await dbPool.query(`
            INSERT INTO "GK enterprises".trip_logs (technician_id, from_location, to_location, distance_km, travel_date)
            VALUES 
            ((SELECT id FROM "GK enterprises".users WHERE emp_id='TECH002'), 'Home', 'TCS Sipcot', 22.0, CURRENT_DATE)
        `);

        console.log('✅ SEEDING COMPLETE!');
        await dbPool.end();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    }
}

seed();
