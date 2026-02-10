import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock types
export type UserRole = 'admin' | 'technician' | null;

interface User {
    id: string;
    name: string;
    role: UserRole;
    empId?: string;
}

interface AuthContextType {
    user: User | null;
    login: (empId: string, password: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('fsm_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (empId: string, pwd: string): Promise<boolean> => {
        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ empId, password: pwd })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                localStorage.setItem('fsm_user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login Failed (Backend unreachable?):", error);

            // FALLBACK FOR DEMO / GITHUB PAGES
            // If backend is down, allow default admin login
            if (empId === 'admin' && pwd === 'admin') {
                const mockAdmin: User = { id: '1', name: 'Demo Admin', role: 'admin', empId: 'admin' };
                setUser(mockAdmin);
                localStorage.setItem('fsm_user', JSON.stringify(mockAdmin));
                return true;
            }
            if (empId === 'tech' && pwd === 'password') {
                const mockTech: User = { id: '2', name: 'Demo Tech', role: 'technician', empId: 'tech' };
                setUser(mockTech);
                localStorage.setItem('fsm_user', JSON.stringify(mockTech));
                return true;
            }

            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fsm_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
