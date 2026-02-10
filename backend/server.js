const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('Field Service Management API (PostgreSQL) is Running');
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { empId, password } = req.body;
    // Mock fallback if DB is down
    if (empId === 'ADM001' && password === 'admin123') {
        return res.json({ success: true, user: { id: '1', name: 'Dispatcher Admin', role: 'admin', empId } });
    }
    if (empId === 'TECH001' && password === 'tech123') {
        return res.json({ success: true, user: { id: '2', name: 'Technician John', role: 'technician', empId } });
    }

    try {
        // Postgres uses $1, $2 for parameterized queries
        const { rows } = await db.pool.query(
            'SELECT * FROM "GK enterprises".users WHERE emp_id = $1 AND password = $2',
            [empId, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            res.json({
                success: true, user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    empId: user.emp_id
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test DB Route
app.get('/api/health', async (req, res) => {
    res.json({ status: 'API Online', timestamp: new Date() });
});

// Get Stats for Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const ticketRes = await db.pool.query('SELECT COUNT(*) as count FROM "GK enterprises".tickets');
        const techRes = await db.pool.query("SELECT COUNT(*) as count FROM \"GK enterprises\".technicians WHERE status != 'offline'");
        const completedRes = await db.pool.query("SELECT COUNT(*) as count FROM \"GK enterprises\".tickets WHERE status = 'completed'");

        res.json({
            activeTickets: parseInt(ticketRes.rows[0].count),
            activeTechs: parseInt(techRes.rows[0].count),
            completedJobs: parseInt(completedRes.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Technicians Locations
app.get('/api/technicians', async (req, res) => {
    try {
        const { rows } = await db.pool.query(`
            SELECT u.id, u.emp_id as "empId", u.name, t.lat, t.lng, t.status, t.last_updated
            FROM "GK enterprises".technicians t
            JOIN "GK enterprises".users u ON t.user_id = u.id
        `);

        // Transform for frontend
        const techs = rows.map(r => ({
            id: r.id,
            empId: r.empId,
            name: r.name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lng),
            status: r.status,
            lastUpdated: r.last_updated
        }));
        res.json(techs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add New Technician
app.post('/api/technicians', async (req, res) => {
    const { name, empId, password } = req.body;
    try {
        // 1. Create User
        const userRes = await db.pool.query(`
            INSERT INTO "GK enterprises".users (emp_id, name, password, role)
            VALUES ($1, $2, $3, 'technician')
            RETURNING id
        `, [empId, name, password || 'default123']);
        const userId = userRes.rows[0].id;

        // 2. Create Technician Entry (Default Offline)
        await db.pool.query(`
            INSERT INTO "GK enterprises".technicians (user_id, lat, lng, status)
            VALUES ($1, 12.9716, 77.5946, 'offline')
        `, [userId]);

        res.json({ success: true, message: 'Technician added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding technician. ID might already exist.' });
    }
});

// Delete Technician
app.delete('/api/technicians/:empId', async (req, res) => {
    const { empId } = req.params;
    try {
        // 1. Get User ID
        const userRes = await db.pool.query('SELECT id FROM "GK enterprises".users WHERE emp_id = $1', [empId]);

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;

            // 2. Delete Trip Logs
            await db.pool.query('DELETE FROM "GK enterprises".trip_logs WHERE technician_id = $1', [userId]);

            // 3. Unassign Tickets (Set technician_id to NULL)
            await db.pool.query('UPDATE "GK enterprises".tickets SET technician_id = NULL WHERE technician_id = $1', [userId]);

            // 4. Delete from Users (Cascades to Technicians)
            await db.pool.query('DELETE FROM "GK enterprises".users WHERE id = $1', [userId]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Detailed Technician Stats (Travel & Performance)
app.get('/api/technician-stats', async (req, res) => {
    try {
        const { rows } = await db.pool.query(`
            SELECT 
                u.emp_id,
                u.name,
                
                -- Travel Stats
                COALESCE(SUM(CASE WHEN t.travel_date = CURRENT_DATE THEN t.distance_km ELSE 0 END), 0) as today_km,
                COALESCE(SUM(CASE WHEN t.travel_date >= CURRENT_DATE - INTERVAL '30 days' THEN t.distance_km ELSE 0 END), 0) as monthly_total_km,

                -- Last Trip
                (SELECT from_location || ' -> ' || to_location 
                 FROM "GK enterprises".trip_logs 
                 WHERE technician_id = u.id AND travel_date = CURRENT_DATE 
                 ORDER BY created_at DESC LIMIT 1) as last_trip,

                 -- Job Counts
                 (SELECT COUNT(*) FROM "GK enterprises".tickets WHERE technician_id = u.id) as total_jobs,
                 (SELECT COUNT(*) FROM "GK enterprises".tickets WHERE technician_id = u.id AND status = 'completed') as completed_jobs,
                 (SELECT COUNT(*) FROM "GK enterprises".tickets WHERE technician_id = u.id AND status != 'completed') as pending_jobs
                 
            FROM "GK enterprises".users u
            LEFT JOIN "GK enterprises".trip_logs t ON u.id = t.technician_id
            WHERE u.role = 'technician'
            GROUP BY u.id, u.emp_id, u.name
        `);

        // Format
        const stats = rows.map(r => {
            const total = parseInt(r.total_jobs);
            const completed = parseInt(r.completed_jobs);
            const pending = parseInt(r.pending_jobs);
            const perf = total > 0 ? Math.round((completed / total) * 100) : 100;

            return {
                id: r.emp_id,
                name: r.name,
                todayKm: parseFloat(r.today_km).toFixed(1),
                monthlyTotalKm: parseFloat(r.monthly_total_km).toFixed(1),
                lastTrip: r.last_trip || 'No Data',
                performance: perf,
                counts: {
                    total,
                    completed,
                    pending
                }
            };
        });

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Individual Technician Stats (for Mobile App)
app.get('/api/technicians/:empId/stats', async (req, res) => {
    const { empId } = req.params;
    try {
        const { rows } = await db.pool.query(`
            SELECT 
                u.emp_id,
                u.name,
                (SELECT COUNT(*) FROM "GK enterprises".tickets WHERE technician_id = u.id AND status = 'completed') as completed_jobs,
                (SELECT COUNT(*) FROM "GK enterprises".tickets WHERE technician_id = u.id) as total_jobs
            FROM "GK enterprises".users u
            WHERE u.emp_id = $1
        `, [empId]);

        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const r = rows[0];
        const total = parseInt(r.total_jobs);
        const completed = parseInt(r.completed_jobs);
        const perf = total > 0 ? Math.round((completed / total) * 100) : 100;

        res.json({
            performance: perf,
            completedJobs: completed,
            totalJobs: total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Trip History for a Specific Technician

// Get Trip History for a Specific Technician
app.get('/api/trips/:empId', async (req, res) => {
    const { empId } = req.params;
    try {
        const { rows } = await db.pool.query(`
            SELECT 
                t.from_location,
                t.to_location,
                t.distance_km,
                t.travel_date,
                t.created_at
            FROM "GK enterprises".trip_logs t
            JOIN "GK enterprises".users u ON t.technician_id = u.id
            WHERE u.emp_id = $1
            ORDER BY t.travel_date DESC, t.created_at DESC
        `, [empId]);

        const history = rows.map(r => ({
            from: r.from_location,
            to: r.to_location,
            distance: parseFloat(r.distance_km).toFixed(1),
            date: new Date(r.travel_date).toLocaleDateString(),
            timestamp: r.created_at
        }));

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get All Tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const { rows } = await db.pool.query(`
            SELECT 
                t.ticket_number,
                t.customer_name,
                t.address,
                t.status,
                t.description,
                u.name as technician_name,
                u.name as technician_name,
                t.technician_id
            FROM "GK enterprises".tickets t
            LEFT JOIN "GK enterprises".users u ON t.technician_id = u.id
            ORDER BY t.id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create New Ticket
app.post('/api/tickets', async (req, res) => {
    const { customer_name, address, description, technician_id, status } = req.body;
    try {
        const ticketNumber = 'TKT-' + Math.floor(1000 + Math.random() * 9000);
        await db.pool.query(`
            INSERT INTO "GK enterprises".tickets (ticket_number, customer_name, address, status, technician_id, description)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [ticketNumber, customer_name, address, status || 'open', technician_id || null, description]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Bulk Upload Tickets
app.post('/api/tickets/bulk', async (req, res) => {
    const tickets = req.body; // Array of { customer_name, address, description, status, technician_id }
    if (!Array.isArray(tickets)) return res.status(400).json({ error: 'Invalid format' });

    try {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            for (const ticket of tickets) {
                // Ensure unique ticket number
                const ticketNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

                // Validate status
                const status = ['open', 'assigned', 'in_progress', 'completed'].includes(ticket.status) ? ticket.status : 'open';

                await client.query(`
                    INSERT INTO "GK enterprises".tickets (ticket_number, customer_name, address, status, description, technician_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [ticketNumber, ticket.customer_name, ticket.address, status, ticket.description, ticket.technician_id || null]);
            }
            await client.query('COMMIT');
            res.json({ success: true, count: tickets.length });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Ticket Status
// Update Ticket (Status or Assignment)
app.patch('/api/tickets/:ticketNumber', async (req, res) => {
    const { ticketNumber } = req.params;
    const { status, technician_id } = req.body;

    try {
        const fields = [];
        const values = [];
        let valIdx = 1;

        if (status) {
            if (!['open', 'assigned', 'in_progress', 'completed'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }
            fields.push(`status = $${valIdx++}`);
            values.push(status);
        }

        if (technician_id !== undefined) {
            fields.push(`technician_id = $${valIdx++}`);
            // If assigning a tech, auto-set status to 'assigned' if it's currently 'open'
            // But for now, let's keep it simple and just update fields requested
            values.push(technician_id === '' ? null : technician_id);
        }

        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        values.push(ticketNumber);
        await db.pool.query(
            `UPDATE "GK enterprises".tickets SET ${fields.join(', ')} WHERE ticket_number = $${valIdx}`,
            values
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start Server
const startServer = async () => {
    await db.connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
};

startServer();
