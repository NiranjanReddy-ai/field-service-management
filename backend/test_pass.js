const { Pool } = require('pg');

const passwords = ['postgres', 'admin', 'password', '1234', '123456', 'root', 'admin123', ''];
const user = 'postgres';
const host = 'localhost';
const port = 5432;
const database = 'postgres'; // Standard default DB to connect to

async function testConnection() {
    console.log('🔍 Testing PostgreSQL Credentials...');

    for (const pass of passwords) {
        const pool = new Pool({
            user,
            host,
            database,
            password: pass,
            port,
        });

        try {
            const client = await pool.connect();
            console.log(`\n✅ SUCCES! Connected with password: "${pass}"`);
            client.release();
            await pool.end();
            process.exit(0); // Success code
        } catch (err) {
            process.stdout.write(`❌ Failed: "${pass}" `);
            await pool.end();
        }
    }
    console.log('\n\n❌ All common passwords failed.');
    process.exit(1);
}

testConnection();
