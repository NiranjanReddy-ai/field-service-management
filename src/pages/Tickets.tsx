import React, { useEffect, useState, useRef } from 'react';
import { FileText, MapPin, User, CheckCircle, Clock, AlertCircle, Upload, X, Plus, Download } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import * as XLSX from 'xlsx';

interface Ticket {
    ticket_number: string;
    customer_name: string;
    address: string;
    status: 'open' | 'assigned' | 'in_progress' | 'completed';
    description: string;
    technician_name: string | null;
    technician_id: string | null;
}

export const Tickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [technicians, setTechnicians] = useState<{ id: string, empId: string, name: string }[]>([]);

    // UI State
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

    // Form State
    const [newTicket, setNewTicket] = useState({
        customer_name: '',
        address: '',
        description: '',
        status: 'open',
        technician_id: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkStatus, setBulkStatus] = useState('');

    const fetchTickets = () => {
        fetch('http://localhost:3001/api/tickets')
            .then(res => res.json())
            .then(data => setTickets(data))
            .catch(err => console.error(err));
    };

    const fetchTechnicians = () => {
        fetch('http://localhost:3001/api/technicians')
            .then(res => res.json())
            .then(data => setTechnicians(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchTickets();
        fetchTechnicians();
    }, []);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...newTicket,
                technician_id: newTicket.technician_id || null
            };
            const res = await fetch('http://localhost:3001/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsNewTicketOpen(false);
                setNewTicket({ customer_name: '', address: '', description: '', status: 'open', technician_id: '' });
                fetchTickets();
            }
        } catch (error) {
            console.error(error);
        }
        setIsSubmitting(false);
    };

    const handleBulkUpload = async () => {
        if (!bulkFile) return;
        setBulkStatus('Processing...');

        try {
            const rows = await readXlsxFile(bulkFile);
            // Expected Format: Customer, Address, Description, Status, Technician ID
            const ticketsToUpload = rows.slice(1).map(row => ({
                customer_name: row[0],
                address: row[1],
                description: row[2],
                status: row[3]?.toString().toLowerCase() || 'open',
                technician_id: row[4] || null // Tech ID (e.g. TECH001) or null
            })).filter(t => t.customer_name && t.address);

            if (ticketsToUpload.length === 0) {
                setBulkStatus('No valid data found or file is empty.');
                return;
            }

            const res = await fetch('http://localhost:3001/api/tickets/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketsToUpload)
            });

            if (res.ok) {
                const data = await res.json();
                setBulkStatus(`Success! Uploaded ${data.count} tickets.`);
                setTimeout(() => {
                    setIsBulkUploadOpen(false);
                    setBulkStatus('');
                    setBulkFile(null);
                    fetchTickets();
                }, 1500);
            } else {
                setBulkStatus('Upload failed on server.');
            }
        } catch (error) {
            console.error(error);
            setBulkStatus('Error parsing file.');
        }
    };

    const handleStatusUpdate = async (ticketNumber: string, newStatus: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/tickets/${ticketNumber}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Optimistic update or refresh
                fetchTickets();
            }
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleAssignmentUpdate = async (ticketNumber: string, newTechId: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/tickets/${ticketNumber}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ technician_id: newTechId })
            });
            if (res.ok) {
                fetchTickets();
            }
        } catch (error) {
            console.error("Failed to update assignment", error);
        }
    };

    const handleDownloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(tickets);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
        XLSX.writeFile(workbook, "tickets_data.xlsx");
    };

    const getStatusBadge = (ticket: Ticket) => {
        const colorClass =
            ticket.status === 'completed' ? 'green' :
                ticket.status === 'in_progress' ? 'blue' :
                    ticket.status === 'assigned' ? 'yellow' : 'gray';

        return (
            <div className={`status-badge ${colorClass}`} style={{ padding: 0, overflow: 'hidden' }}>
                <select
                    value={ticket.status}
                    onChange={(e) => handleStatusUpdate(ticket.ticket_number, e.target.value)}
                    className="status-select"
                >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Service Tickets</h1>
                    <p className="text-muted">Manage and track all service requests</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" onClick={handleDownloadExcel}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn-secondary" onClick={() => setIsBulkUploadOpen(true)}>
                        <Upload size={16} /> Bulk Upload
                    </button>
                    <button className="btn-primary" onClick={() => setIsNewTicketOpen(true)}>
                        <Plus size={16} /> New Ticket
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="table-responsive">
                    <table className="tech-stats-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Customer</th>
                                <th>Description</th>
                                <th>Assigned To</th>
                                <th>Status</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.ticket_number}>
                                    <td className="font-mono text-muted">{ticket.ticket_number}</td>
                                    <td className="font-medium">{ticket.customer_name}</td>
                                    <td>{ticket.description}</td>
                                    <td>
                                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '0.4rem' }}>
                                            {ticket.technician_name && (
                                                <div className="avatar-xs" style={{ flexShrink: 0 }}>{ticket.technician_name.charAt(0)}</div>
                                            )}
                                            <select
                                                value={ticket.technician_id || ''}
                                                onChange={(e) => handleAssignmentUpdate(ticket.ticket_number, e.target.value)}
                                                className="assign-select"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: ticket.technician_id ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    maxWidth: '140px'
                                                }}
                                            >
                                                <option value="">Unassigned</option>
                                                {technicians.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.empId || t.id})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(ticket)}</td>
                                    <td className="text-sm text-muted">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <MapPin size={12} /> {ticket.address}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tickets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted">No tickets found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Ticket Modal */}
            {isNewTicketOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Create New Ticket</h3>
                            <button className="close-btn" onClick={() => setIsNewTicketOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleCreateTicket} className="add-tech-form">
                                <div className="form-group">
                                    <label>Customer Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Company or Contact Name"
                                        value={newTicket.customer_name}
                                        onChange={e => setNewTicket({ ...newTicket, customer_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Address / Location</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Address"
                                        value={newTicket.address}
                                        onChange={e => setNewTicket({ ...newTicket, address: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Issue details"
                                        value={newTicket.description}
                                        onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Assign To</label>
                                        <select
                                            value={newTicket.technician_id}
                                            onChange={e => setNewTicket({ ...newTicket, technician_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', background: 'white', border: '1px solid #ddd', borderRadius: '6px' }}
                                        >
                                            <option value="">Unassigned</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={newTicket.status}
                                            onChange={e => setNewTicket({ ...newTicket, status: e.target.value })}
                                            style={{ width: '100%', padding: '0.6rem', background: 'white', border: '1px solid #ddd', borderRadius: '6px' }}
                                        >
                                            <option value="open">Open</option>
                                            <option value="assigned">Assigned</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsNewTicketOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Creating...' : 'Create Ticket'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {isBulkUploadOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>Bulk Upload Tickets</h3>
                            <button className="close-btn" onClick={() => setIsBulkUploadOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="upload-area">
                                <FileText size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                                <p>Select an Excel file (.xlsx)</p>
                                <small className="text-muted" style={{ display: 'block', lineHeight: '1.4', marginTop: '0.5rem' }}>
                                    Format Columns:<br />
                                    1. Customer | 2. Address | 3. Description<br />
                                    4. Status (optional) | 5. Tech ID (optional)
                                </small>

                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                                    style={{ marginTop: '1rem' }}
                                />

                                {bulkStatus && <div className="status-msg" style={{ marginTop: '1rem', color: bulkStatus.includes('Success') ? 'var(--success)' : 'var(--warning)' }}>{bulkStatus}</div>}

                                <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                    <button className="btn-secondary" onClick={() => setIsBulkUploadOpen(false)}>Close</button>
                                    <button className="btn-primary" onClick={handleBulkUpload} disabled={!bulkFile}>
                                        <Upload size={16} /> Upload Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .avatar-xs {
                    width: 24px;
                    height: 24px;
                    background: #6366f1;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.6rem;
                    border-radius: 50px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
                .status-badge.green { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
                .status-badge.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
                .status-badge.yellow { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
                .status-badge.gray { background: rgba(156, 163, 175, 0.15); color: #d1d5db; border: 1px solid rgba(156, 163, 175, 0.2); }
                
                .status-select {
                    background: transparent;
                    border: none;
                    color: inherit;
                    font-size: inherit;
                    font-weight: inherit;
                    text-transform: inherit;
                    letter-spacing: inherit;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    outline: none;
                    width: 100%;
                }
                /* Hide default arrow in some browsers for cleaner look, or just accept it */
                 .status-select option {
                    background: var(--surface-dark);
                    color: var(--text-primary);
                }

                 .assign-select option {
                    background: var(--surface-dark);
                    color: var(--text-primary);
                }

                .font-mono { font-family: monospace; }
                .italic { font-style: italic; }

                .upload-area {
                    border: 2px dashed var(--glass-border);
                    padding: 2rem;
                    border-radius: var(--radius-lg);
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </div>
    );
};
