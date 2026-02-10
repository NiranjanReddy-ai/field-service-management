const { pool } = require('./config/db');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting PostgreSQL Database Seeding (Schema: admin)...');

        // 1. Create Schema
        await pool.query('CREATE SCHEMA IF NOT EXISTS admin;');
        console.log('✅ Schema "admin" Created (or exists)');

        // 2. Create Users Table in 'admin' schema
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin.users (
                id SERIAL PRIMARY KEY,
                emp_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) CHECK (role IN ('admin', 'technician')) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ admin.users Table Created');

        // 3. Create Technicians Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin.technicians (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES admin.users(id) ON DELETE CASCADE,
                lat DECIMAL(10, 8),
                lng DECIMAL(11, 8),
                status VARCHAR(20) CHECK (status IN ('online', 'busy', 'offline')) DEFAULT 'offline',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ admin.technicians Table Created');

        // 4. Create Tickets Table
        await pool.query(`
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
        `);
        console.log('✅ admin.tickets Table Created');

        // 5. Insert Dummy Users
        const usersData = [
            ['ADM001', 'System Admin', 'admin123', 'admin'],
            ['TECH001', 'John Doe', 'tech123', 'technician'],
            ['TECH002', 'Sarah Smith', 'tech123', 'technician'],
            ['TECH003', 'Mike Johnson', 'tech123', 'technician']
        ];

        for (const user of usersData) {
            await pool.query(
                `INSERT INTO admin.users (emp_id, name, password, role) VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (emp_id) DO NOTHING`,
                user
            );
        }
        console.log('✅ Dummy Users Inserted into admin.users');

        // 6. Insert Dummy Technician Status
        await pool.query(`
            INSERT INTO admin.technicians (user_id, lat, lng, status)
            SELECT id, 40.7128, -74.0060, 'online' FROM admin.users WHERE emp_id = 'TECH001'
            AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);
        `);
        await pool.query(`
            INSERT INTO admin.technicians (user_id, lat, lng, status)
            SELECT id, 40.7282, -73.9942, 'busy' FROM admin.users WHERE emp_id = 'TECH002'
             AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);
        `);
        await pool.query(`
            INSERT INTO admin.technicians (user_id, lat, lng, status)
            SELECT id, 40.7589, -73.9851, 'offline' FROM admin.users WHERE emp_id = 'TECH003'
             AND NOT EXISTS (SELECT 1 FROM admin.technicians WHERE user_id = admin.users.id);
        `);
        console.log('✅ Dummy Technician Status Inserted');

        // 7. Insert Dummy Tickets
        const ticketsData = [
            ['JOB-8821', 'TechStart Inc', '123 Innovation Dr, New York, NY', 'in_progress', 'TECH001', 'Server rack maintenance'],
            ['JOB-8824', 'Global Logistics', '45 Warehouse Blvd, Brooklyn, NY', 'assigned', 'TECH002', 'CCTV Camera repair'],
            ['JOB-9001', 'Downtown Coffee', '88 Main St, New York, NY', 'open', null, 'WiFi Access Point installation'],
            ['JOB-9002', 'City Library', '10 Park Ave, New York, NY', 'completed', 'TECH001', 'Router Replacement']
        ];

        for (const ticket of ticketsData) {
            const [ticketNum, cust, addr, status, techEmpId, desc] = ticket;
            // Get tech id
            let techId = null;
            if (techEmpId) {
                const res = await pool.query('SELECT id FROM admin.users WHERE emp_id = $1', [techEmpId]);
                if (res.rows.length) techId = res.rows[0].id;
            }

            await pool.query(`
                INSERT INTO admin.tickets (ticket_number, customer_name, address, status, technician_id, scheduled_time, description)
                VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 day', $6)
                ON CONFLICT (ticket_number) DO NOTHING
            `, [ticketNum, cust, addr, status, techId, desc]);
        }

        console.log('✅ Dummy Tickets Inserted into admin.tickets');
        console.log('🎉 PostgreSQL Database Seeded Successfully (Schema: admin)!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDatabase();
