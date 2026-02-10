import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TechnicianLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: 'online' | 'busy' | 'offline';
    lastUpdated: Date;
    jobId?: string;
}

interface TechnicianContextType {
    technicians: TechnicianLocation[];
    updateLocation: (id: string, lat: number, lng: number) => void;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

// Mock Data (Fallback)
const INITIAL_TECHS: TechnicianLocation[] = [
    { id: 'TECH001', name: 'John Doe', lat: 40.7128, lng: -74.0060, status: 'busy', lastUpdated: new Date(), jobId: 'JOB-8821' },
    { id: 'TECH002', name: 'Sarah Smith', lat: 40.7282, lng: -73.9942, status: 'online', lastUpdated: new Date() },
    { id: 'TECH003', name: 'Mike Johnson', lat: 40.7589, lng: -73.9851, status: 'offline', lastUpdated: new Date() },
];

export const TechnicianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [technicians, setTechnicians] = useState<TechnicianLocation[]>(INITIAL_TECHS);

    // Fetch from API
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/technicians');
                if (response.ok) {
                    const data = await response.json();
                    const parsedData = data.map((t: any) => ({
                        ...t,
                        lastUpdated: new Date(t.lastUpdated)
                    }));
                    // Only update if we have data to avoid flashing empty
                    if (parsedData.length > 0) setTechnicians(parsedData);
                }
            } catch (error) {
                console.error("Failed to fetch technicians:", error);
            }
        };

        fetchTechnicians();
        const interval = setInterval(fetchTechnicians, 2000); // Fast polling for demo

        return () => clearInterval(interval);
    }, []);

    const updateLocation = (id: string, lat: number, lng: number) => {
        setTechnicians(prev => prev.map(tech =>
            tech.id === id ? { ...tech, lat, lng, lastUpdated: new Date() } : tech
        ));
        // Ideally push to backend here too
    };

    return (
        <TechnicianContext.Provider value={{ technicians, updateLocation }}>
            {children}
        </TechnicianContext.Provider>
    );
};

export const useTechnicians = () => {
    const context = useContext(TechnicianContext);
    if (context === undefined) {
        throw new Error('useTechnicians must be used within a TechnicianProvider');
    }
    return context;
};
