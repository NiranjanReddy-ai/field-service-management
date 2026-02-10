import React from 'react';
import { X, MapPin, Calendar, Clock } from 'lucide-react';
import './TripHistoryModal.css';

interface Trip {
    from: string;
    to: string;
    distance: string;
    date: string;
    timestamp: string;
}

interface TripHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    technicianName: string;
    trips: Trip[];
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ isOpen, onClose, technicianName, trips }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>Travel History</h3>
                        <p className="text-muted">{technicianName}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {trips.length === 0 ? (
                        <div className="empty-state">
                            <MapPin size={40} className="text-muted" style={{ opacity: 0.5 }} />
                            <p>No travel records found.</p>
                        </div>
                    ) : (
                        <div className="timeline">
                            {trips.map((trip, index) => (
                                <div key={index} className="timeline-item">
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <div className="trip-header">
                                            <span className="trip-date">
                                                <Calendar size={12} /> {trip.date}
                                            </span>
                                            <span className="trip-dist">{trip.distance} km</span>
                                        </div>
                                        <div className="route-detail">
                                            <div className="route-point">
                                                <div className="dot start"></div>
                                                <span>{trip.from}</span>
                                            </div>
                                            <div className="route-line"></div>
                                            <div className="route-point">
                                                <div className="dot end"></div>
                                                <span>{trip.to}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
