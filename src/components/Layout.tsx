import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    Users,
    Map,
    Settings,
    Bell,
    Search,
    Menu,
    X
} from 'lucide-react';
import './Layout.css';

export const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const getPageTitle = (pathname: string) => {
        switch (true) {
            case pathname.includes('dashboard'): return 'Dashboard';
            case pathname.includes('tickets'): return 'Ticket Management';
            case pathname.includes('technicians'): return 'Technician Tracking';
            case pathname.includes('map'): return 'Live Map';
            default: return 'Field Service';
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className={`sidebar glass ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <div className="logo-icon flex-center">
                            <LayoutDashboard size={24} color="white" />
                        </div>
                        {isSidebarOpen && <span className="logo-text">FieldMaster</span>}
                    </div>
                    <button className="toggle-btn" onClick={toggleSidebar}>
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        {isSidebarOpen && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Ticket size={20} />
                        {isSidebarOpen && <span>Tickets</span>}
                    </NavLink>
                    <NavLink to="/technicians" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        {isSidebarOpen && <span>Technicians</span>}
                    </NavLink>
                    <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Map size={20} />
                        {isSidebarOpen && <span>Live Map</span>}
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Settings size={20} />
                        {isSidebarOpen && <span>Settings</span>}
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                {/* Top Header */}
                <header className="top-header glass">
                    <div className="header-left">
                        <h1 className="page-title">{getPageTitle(location.pathname)}</h1>
                    </div>

                    <div className="header-right">
                        <div className="search-bar">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Search..." />
                        </div>

                        <button className="icon-btn">
                            <Bell size={20} />
                            <span className="badge">3</span>
                        </button>

                        <div className="user-profile">
                            <div className="avatar">AD</div>
                            <div className="user-info">
                                <span className="user-name">Admin User</span>
                                <span className="user-role">Dispatcher</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="content-scrollable">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
