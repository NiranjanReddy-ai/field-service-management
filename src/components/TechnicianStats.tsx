import React, { useEffect, useState } from 'react';
import {
    Activity,
    MapPin,
    Calendar,
    TrendingUp,
    Trash2,
    Plus,
    X
} from 'lucide-react';
import './TechnicianStats.css';
import { TripHistoryModal } from './TripHistoryModal';

interface TechTravelStat {
    id: string;
    name: string;
    todayKm: string;
    monthlyTotalKm: string;
    lastTrip: string;
    performance: number;
    counts: {
        total: number;
        completed: number;
        pending: number;
    };
}

export const TechnicianStats = () => {
    const [stats, setStats] = useState<TechTravelStat[]>([]);
    const [selectedTech, setSelectedTech] = useState<{ name: string, id: string } | null>(null);
    const [history, setHistory] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Add Tech State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTech, setNewTech] = useState({ name: '', empId: '', password: 'default123' });

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/technician-stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching tech stats:", error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRowClick = async (tech: TechTravelStat) => {
        try {
            const res = await fetch(`http://localhost:3001/api/trips/${tech.id}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
                setSelectedTech({ name: tech.name, id: tech.id });
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to remove this technician?')) return;

        try {
            await fetch(`http://localhost:3001/api/technicians/${id}`, { method: 'DELETE' });
            fetchStats(); // Refresh
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleAddTech = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/technicians', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTech)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setNewTech({ name: '', empId: '', password: 'default123' });
                fetchStats();
            } else {
                alert('Failed to add. ID might be duplicate.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="card tech-stats-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={20} className="text-muted" />
                        <h3>Technician Team</h3>
                    </div>
                    <button className="btn-primary-sm" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={16} /> Add Tech
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="tech-stats-table">
                        <thead>
                            <tr>
                                <th>Technician</th>
                                <th>Performance</th>
                                <th style={{ textAlign: 'center' }}>Overall Jobs</th>
                                <th style={{ textAlign: 'center' }}>Pending</th>
                                <th style={{ textAlign: 'center' }}>Completed</th>
                                <th>Today's Travel</th>
                                <th>Monthly Travel</th>
                                <th>Last Trip</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map(tech => (
                                <tr key={tech.id} onClick={() => handleRowClick(tech)} className="clickable-row">
                                    <td className="font-medium">
                                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
                                            <div className="avatar-circle">{tech.name.charAt(0)}</div>
                                            <div>
                                                <div>{tech.name}</div>
                                                <small className="text-muted">{tech.id}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={`stat-pill ${tech.performance < 80 ? 'red' : 'green'}`}>
                                            <TrendingUp size={12} />
                                            {tech.performance}%
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{tech.counts.total}</td>
                                    <td style={{ textAlign: 'center', color: '#fbbf24' }}>{tech.counts.pending}</td>
                                    <td style={{ textAlign: 'center', color: '#34d399' }}>{tech.counts.completed}</td>
                                    <td>
                                        <div className="stat-pill blue">
                                            <MapPin size={12} />
                                            {tech.todayKm} km
                                        </div>
                                    </td>
                                    <td>
                                        <div className="stat-pill gray">
                                            <Calendar size={12} />
                                            {tech.monthlyTotalKm} km
                                        </div>
                                    </td>
                                    <td className="text-muted text-sm">{tech.lastTrip}</td>
                                    <td>
                                        <button
                                            className="icon-btn-danger"
                                            onClick={(e) => handleDelete(e, tech.id)}
                                            title="Delete Technician"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center text-muted">Loading stats...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Tech Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Add New Technician</h3>
                            <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleAddTech} className="add-tech-form">
                                <div className="form-group">
                                    <label>Employee ID</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. TECH009"
                                        value={newTech.empId}
                                        onChange={e => setNewTech({ ...newTech, empId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={newTech.name}
                                        onChange={e => setNewTech({ ...newTech, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="text"
                                        placeholder="Enter password"
                                        value={newTech.password}
                                        onChange={e => setNewTech({ ...newTech, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="modal-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Create Account</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {selectedTech && (
                <TripHistoryModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    technicianName={selectedTech.name}
                    trips={history}
                />
            )}
        </>
    );
};
