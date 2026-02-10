const { pool } = require('./config/db');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting Database Seeding...');

        // 1. Create Users Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                emp_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'technician') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users Table Created');

        // 2. Create Technicians Table (for location/status)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS technicians (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                lat DECIMAL(10, 8),
                lng DECIMAL(11, 8),
                status ENUM('online', 'busy', 'offline') DEFAULT 'offline',
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Technicians Table Created');

        // 3. Create Tickets Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_number VARCHAR(50) UNIQUE NOT NULL,
                customer_name VARCHAR(100),
                address VARCHAR(255),
                status ENUM('open', 'assigned', 'in_progress', 'completed') DEFAULT 'open',
                technician_id INT NULL,
                scheduled_time DATETIME,
                description TEXT,
                FOREIGN KEY (technician_id) REFERENCES users(id)
            )
        `);
        console.log('✅ Tickets Table Created');

        // 4. Insert Dummy Users
        // Note: In production, passwords should be hashed (e.g., bcrypt). Plain text for demo only as requested.
        await pool.query(`
            INSERT IGNORE INTO users (emp_id, name, password, role) VALUES 
            ('ADM001', 'System Admin', 'admin123', 'admin'),
            ('TECH001', 'John Doe', 'tech123', 'technician'),
            ('TECH002', 'Sarah Smith', 'tech123', 'technician'),
            ('TECH003', 'Mike Johnson', 'tech123', 'technician')
        `);
        console.log('✅ Dummy Users Inserted');

        // 5. Insert Dummy Technician Status (Linking to the inserted users)
        await pool.query(`
            INSERT INTO technicians (user_id, lat, lng, status)
            SELECT id, 40.7128, -74.0060, 'online' FROM users WHERE emp_id = 'TECH001'
            ON DUPLICATE KEY UPDATE status='online';
        `);
        await pool.query(`
            INSERT INTO technicians (user_id, lat, lng, status)
            SELECT id, 40.7282, -73.9942, 'busy' FROM users WHERE emp_id = 'TECH002'
            ON DUPLICATE KEY UPDATE status='busy';
        `);
        await pool.query(`
            INSERT INTO technicians (user_id, lat, lng, status)
            SELECT id, 40.7589, -73.9851, 'offline' FROM users WHERE emp_id = 'TECH003'
             ON DUPLICATE KEY UPDATE status='offline';
        `);
        console.log('✅ Dummy Technician Status Inserted');

        // 6. Insert Dummy Tickets
        await pool.query(`
            INSERT IGNORE INTO tickets (ticket_number, customer_name, address, status, technician_id, scheduled_time, description) VALUES 
            ('JOB-8821', 'TechStart Inc', '123 Innovation Dr, New York, NY', 'in_progress', (SELECT id FROM users WHERE emp_id='TECH001'), NOW() + INTERVAL 2 HOUR, 'Server rack maintenance'),
            ('JOB-8824', 'Global Logistics', '45 Warehouse Blvd, Brooklyn, NY', 'assigned', (SELECT id FROM users WHERE emp_id='TECH002'), NOW() + INTERVAL 5 HOUR, 'CCTV Camera repair'),
            ('JOB-9001', 'Downtown Coffee', '88 Main St, New York, NY', 'open', NULL, NOW() + INTERVAL 1 DAY, 'WiFi Access Point installation')
        `);
        console.log('✅ Dummy Tickets Inserted');

        console.log('🎉 Database Seeded Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDatabase();
