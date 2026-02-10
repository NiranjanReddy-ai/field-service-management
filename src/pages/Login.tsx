import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Briefcase, ArrowRight, Smartphone } from 'lucide-react';
import './Login.css';

export const Login = () => {
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const success = await login(empId, password);

        if (success) {
            // Navigation happens in App.tsx based on role, but we can force it here too for clarity
            if (empId.startsWith('TECH')) {
                navigate('/tech/home');
            } else {
                navigate('/dashboard');
            }
        } else {
            setError('Invalid credentials. Try TECH001 / tech123');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="logo-icon-lg flex-center">
                        <Briefcase size={32} color="white" />
                    </div>
                    <h1>FieldMaster</h1>
                    <p className="subtitle">Operational Command Center</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Employee ID</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="e.g. TECH001"
                                value={empId}
                                onChange={(e) => setEmpId(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="helper-text">
                        <small>Demo: Admin (ADM001/admin123) | Tech (TECH001/tech123)</small>
                    </div>

                    <button type="submit" className="login-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Authenticating...' : (
                            <>
                                <span>Login</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mobile-pill">
                    <Smartphone size={14} />
                    <span>Mobile Optimized for Technicians</span>
                </div>
            </div>
        </div>
    );
};
