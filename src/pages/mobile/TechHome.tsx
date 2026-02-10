import React from 'react';
import { MapPin, Calendar, Clock, ChevronRight, Navigation } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTechnicians } from '../../context/TechnicianContext';
import { useEffect, useState } from 'react';
import './TechHome.css';

const JobCard = ({ id, customer, address, time, status, type, onStatusUpdate }: any) => {
    const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
            case 'completed': return 'green';
            case 'in_progress': return 'blue';
            case 'assigned': return 'yellow';
            default: return 'gray';
        }
    };

    return (
        <div className="mobile-card">
            <div className="job-header">
                <span className="job-id">#{id}</span>
                <div className={`status-badge ${getStatusColor(status)}`} style={{ padding: 0 }}>
                    <select
                        value={status}
                        onChange={(e) => onStatusUpdate(id, e.target.value)}
                        className="status-select-mobile"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>
            <h3 className="customer-name">{customer}</h3>
            <div className="job-meta">
                <div className="meta-row">
                    <MapPin size={14} className="meta-icon" />
                    <span>{address}</span>
                </div>
                <div className="meta-row">
                    <Calendar size={14} className="meta-icon" />
                    <span>{time || 'Scheduled Today'}</span>
                </div>
            </div>
            <div className="job-footer">
                <span className="job-type">{type || 'Service'}</span>
                <button className="action-btn-sm">
                    View <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

export const TechHome = () => {
    const { user } = useAuth();
    const { updateLocation } = useTechnicians();
    const [stats, setStats] = useState<any>(null);
    const [tickets, setTickets] = useState<any[]>([]);

    const fetchTickets = () => {
        if (!user?.empId) return;
        fetch('http://localhost:3001/api/tickets')
            .then(res => res.json())
            .then(data => {
                // Filter tickets assigned to this technician
                const myTickets = data.filter((t: any) => t.technician_id === user.id && t.status !== 'completed');
                setTickets(myTickets);
            })
            .catch(err => console.error(err));
    };

    // Fetch stats and tickets
    useEffect(() => {
        if (!user?.empId) return;

        // Fetch Stats
        fetch(`http://localhost:3001/api/technicians/${user.empId}/stats`)
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error(err));

        // Fetch Tickets
        fetchTickets();
    }, [user]);

    const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Refresh tickets
                fetchTickets();
                // Also refresh stats as completed count might change
                fetch(`http://localhost:3001/api/technicians/${user.empId}/stats`)
                    .then(r => r.json())
                    .then(d => setStats(d));
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    // Location Tracking Logic
    useEffect(() => {
        if (!user || !user.empId) return;

        let watchId: number | null = null;
        let retryInterval: NodeJS.Timeout | null = null;

        const startWatching = () => {
            console.log("📍 Starting Location Watch...");
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    updateLocation(user.id, latitude, longitude);
                },
                (error) => {
                    console.error("❌ Location Error:", error.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        };

        const attemptAutoTurnOn = () => {
            console.log("🔄 Auto-retry: Attempting to 'Turn On' / Request Location...");
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("✅ Auto-retry Success!");
                    const { latitude, longitude } = position.coords;
                    updateLocation(user.id, latitude, longitude);
                },
                (error) => console.warn("⚠️ Auto-retry Failed:", error.message),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        };

        // 1. Start immediate watch
        startWatching();

        // 2. Set interval to force retry/refresh every 5 minutes (300,000 ms)
        // This covers cases where 'watchPosition' might have silently dropped or user re-enabled GPS
        retryInterval = setInterval(() => {
            attemptAutoTurnOn();
        }, 5 * 60 * 1000); // 5 Minutes

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
            if (retryInterval) clearInterval(retryInterval);
        };
    }, [user, updateLocation]);

    return (
        <div className="mobile-page">
            <header className="mobile-header">
                <div>
                    <h2 className="greeting">Hello, {(user?.name || 'Technician').split(' ')[0]}</h2>
                    <p className="sub-greeting">You have {tickets.length} active jobs</p>
                </div>
                <div className="header-avatar">{user?.name ? user.name.charAt(0) : 'T'}</div>
            </header>

            {/* Performance Card */}
            {stats && (
                <div className="stats-container" style={{ padding: '0 1.5rem', marginBottom: '1rem' }}>
                    <div className={`perf-card ${stats.performance < 80 ? 'perf-danger' : 'perf-good'}`}>
                        <div className="perf-val">
                            <Clock size={16} />
                            <span>Performance: {stats.performance}%</span>
                        </div>
                        <div className="perf-jobs">
                            {stats.completedJobs} Done / {stats.totalJobs} Total
                        </div>
                    </div>
                </div>
            )}

            {tickets.length > 0 && (
                <div className="next-job-banner">
                    <div className="banner-content">
                        <span className="banner-label">NEXT JOB</span>
                        <h3>{tickets[0].customer_name}</h3>
                        <div className="banner-action">
                            <Navigation size={14} />
                            <span>Navigate</span>
                        </div>
                    </div>
                </div>
            )}

            <section className="jobs-list">
                <h3 className="section-title">My Schedule</h3>
                {tickets.length === 0 ? (
                    <p className="text-center text-muted" style={{ padding: '2rem' }}>No active jobs assigned.</p>
                ) : (
                    tickets.map(ticket => (
                        <JobCard
                            key={ticket.ticket_number}
                            id={ticket.ticket_number}
                            customer={ticket.customer_name}
                            address={ticket.address}
                            time="Today"
                            status={ticket.status}
                            type={ticket.description}
                            onStatusUpdate={handleStatusUpdate}
                        />
                    ))
                )}
            </section>

            <style>{`
                .status-select-mobile {
                    background: transparent;
                    border: none;
                    color: inherit;
                    font-size: inherit;
                    font-weight: 600;
                    padding: 0.2rem 0.5rem;
                    outline: none;
                    width: 100%;
                }
                .status-select-mobile option {
                    background: #333;
                    color: white;
                }
            `}</style>
        </div>
    );
};
