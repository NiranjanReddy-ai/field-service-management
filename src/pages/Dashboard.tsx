import React, { useEffect, useState } from 'react';
import {
    Users,
    Ticket,
    CheckCircle,
    Clock,
    ArrowUpRight,
    MoreHorizontal
} from 'lucide-react';
import { TechnicianStats } from '../components/TechnicianStats';
import './Dashboard.css';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    icon: React.ElementType;
    color: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => (
    <div className="card stat-card">
        <div className="stat-header">
            <span className="stat-title">{title}</span>
            <div className={`icon-box ${color}`}>
                <Icon size={20} />
            </div>
        </div>
        <div className="stat-body">
            <h3 className="stat-value">{value}</h3>
            <div className="stat-change flex-center">
                <ArrowUpRight size={14} className="success-text" />
                <span className="success-text">{change}%</span>
                <span className="text-muted">vs last month</span>
            </div>
        </div>
    </div>
);

export const Dashboard = () => {
    const [stats, setStats] = useState({ activeTickets: 0, activeTechs: 0, completedJobs: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="dashboard-container">
            <div className="stats-grid">
                <StatCard
                    title="Total Tickets"
                    value={stats.activeTickets.toString()}
                    change="12.5"
                    icon={Ticket}
                    color="blue"
                />
                <StatCard
                    title="Technicians Online"
                    value={stats.activeTechs.toString()}
                    change="5.2"
                    icon={Users}
                    color="indigo"
                />
                <StatCard
                    title="Completed Jobs"
                    value={stats.completedJobs.toString()}
                    change="8.1"
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="Avg Response Time"
                    value="45m"
                    change="-2.4"
                    icon={Clock}
                    color="amber"
                />
            </div>

            <div className="dashboard-content-grid">

                <TechnicianStats />

                <div className="card overview-card">
                    <div className="card-header">
                        <h3>Weekly Ticket Overview</h3>
                        <button className="icon-btn"><MoreHorizontal size={20} /></button>
                    </div>
                    <div className="chart-placeholder flex-center">
                        <div className="bar-chart">
                            {[40, 65, 35, 85, 50, 70, 45].map((h, i) => (
                                <div key={i} className="bar-wrapper">
                                    <div className="bar" style={{ height: `${h}%` }}></div>
                                    <span className="label">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card recent-activity-card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <button className="view-all-btn">View All</button>
                    </div>
                    <div className="activity-list">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="activity-item">
                                <div className="activity-icon">
                                    <CheckCircle size={16} />
                                </div>
                                <div className="activity-details">
                                    <span className="activity-text"><strong>John Doe</strong> completed ticket #2024-{100 + i}</span>
                                    <span className="activity-time">{i * 15} mins ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
