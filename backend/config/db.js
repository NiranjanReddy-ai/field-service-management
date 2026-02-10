const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'field_service_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

const connectDB = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL Database Connected Successfully!');
        return true;
    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('   -> Check if PostgreSQL is running on port ' + (process.env.DB_PORT || 5432));
        }
        if (err.code === '28P01') {
            console.error('   -> Auth failed. Check DB_USER and DB_PASSWORD in backend/.env');
        }
        if (err.code === '3D000') {
            console.error(`   -> Database "${process.env.DB_NAME}" does not exist. Please create it using pgAdmin.`);
        }
        return false;
    }
};

module.exports = { pool, connectDB };
