import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTechnicians } from '../context/TechnicianContext';
import 'leaflet/dist/leaflet.css';
import { MapPin, User, Navigation } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet/React-Leaflet icon issues in Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export const MapView = () => {
    const { technicians } = useTechnicians();

    // Center map on the first active tech or default to NYC
    const center = { lat: 40.730610, lng: -73.935242 };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
            <div className="map-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <h2>Live Fleet Tracking</h2>
                <div className="map-stats" style={{ display: 'flex', gap: '1rem' }}>
                    <span className="badge-pill online">
                        <span className="dot"></span> {technicians.filter(t => t.status !== 'offline').length} Active
                    </span>
                </div>
            </div>

            <div className="map-wrapper" style={{ flex: 1, borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    {/* Dark Mode Tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    {technicians.map(tech => (
                        <Marker key={tech.id} position={[tech.lat, tech.lng]}>
                            <Popup>
                                <div className="tech-popup">
                                    <strong>{tech.name}</strong>
                                    <div className={`status-text ${tech.status}`}>{tech.status.toUpperCase()}</div>
                                    {tech.jobId && <div className="job-ref">On Job: {tech.jobId}</div>}
                                    <div className="time-ref">Updated: {tech.lastUpdated.toLocaleTimeString()}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};
