
import { TechnicianStats } from '../components/TechnicianStats';
import { Users } from 'lucide-react';

export const Technicians = () => {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Technician Management</h1>
                    <p className="text-muted">Monitor technician performance and travel logs</p>
                </div>
                <div className="action-button">
                    <Users size={20} />
                    <span>Manage Team</span>
                </div>
            </div>

            {/* Reusing the Stats Component as the main view for now */}
            <div style={{ marginTop: '1.5rem' }}>
                <TechnicianStats />
            </div>
        </div>
    );
};
