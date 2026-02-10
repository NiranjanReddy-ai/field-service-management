import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Calendar, Map, User } from 'lucide-react';
import './MobileLayout.css';

export const MobileLayout: React.FC = () => {
    return (
        <div className="mobile-app">
            <main className="mobile-content">
                <Outlet />
            </main>

            <nav className="mobile-nav glass">
                <NavLink to="/tech/home" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={22} />
                    <span>Jobs</span>
                </NavLink>
                <NavLink to="/tech/schedule" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Calendar size={22} />
                    <span>Schedule</span>
                </NavLink>
                <NavLink to="/tech/map" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <Map size={22} />
                    <span>Route</span>
                </NavLink>
                <NavLink to="/tech/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                    <User size={22} />
                    <span>Profile</span>
                </NavLink>
            </nav>
        </div>
    );
};
