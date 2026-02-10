
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TechnicianProvider } from './context/TechnicianContext';
import { Layout } from './components/Layout';
import { MobileLayout } from './layouts/MobileLayout';
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { Technicians } from './pages/Technicians';
import { MapView } from './pages/MapView';
import { Login } from './pages/Login';
import { TechHome } from './pages/mobile/TechHome';

// Protected Route Component
const ProtectedRoute = ({ allowedRole }: { allowedRole?: 'admin' | 'technician' }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div className="loading-screen" style={{ color: 'white' }}>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'admin' ? '/dashboard' : '/tech/home'} replace />;
    }

    return <Outlet />;
};

function App() {
    return (
        <AuthProvider>
            <TechnicianProvider>
                <Router>
                    <Routes>
                        {/* Public Route */}
                        <Route path="/login" element={<Login />} />

                        {/* Root Redirect */}
                        <Route path="/" element={<ProtectedRoute />} >
                            <Route index element={<Navigate to="/dashboard" replace />} />
                        </Route>

                        {/* Admin Routes */}
                        <Route element={<ProtectedRoute allowedRole="admin" />}>
                            <Route path="/" element={<Layout />}>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="tickets" element={<Tickets />} />
                                <Route path="technicians" element={<Technicians />} />
                                <Route path="map" element={<MapView />} />
                            </Route>
                        </Route>

                        {/* Technician mobile Routes */}
                        <Route element={<ProtectedRoute allowedRole="technician" />}>
                            <Route path="/tech" element={<MobileLayout />}>
                                <Route index element={<Navigate to="home" replace />} />
                                <Route path="home" element={<TechHome />} />
                                <Route path="schedule" element={<div style={{ padding: '2rem', color: 'white' }}>Schedule View</div>} />
                                <Route path="map" element={<div style={{ padding: '2rem', color: 'white' }}>Route View</div>} />
                                <Route path="profile" element={<div style={{ padding: '2rem', color: 'white' }}>Profile View</div>} />
                            </Route>
                        </Route>

                    </Routes>
                </Router>
            </TechnicianProvider>
        </AuthProvider>
    );
}

export default App;
