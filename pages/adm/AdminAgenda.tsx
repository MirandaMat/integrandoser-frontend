// src/pages/adm/AdminAgenda.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import axios from 'axios';
import { io } from 'socket.io-client';
import '../../styles/Agenda.css';
import { FiCalendar, FiClock, FiPlus, FiSave, FiSearch, FiEdit, FiTrash2, FiDownload, FiSettings, FiX, FiCheck } from 'react-icons/fi';
import AppointmentModal from './AppointmentModal';
import { generateICSContent } from '../../utils/calendarUtils';


const socket = io('http://localhost:3001', {
    auth: {
        token: localStorage.getItem('token')
    }
});


// --- COMPONENTE DO MODAL DE GERENCIAMENTO DE HORÁRIOS ---
const AvailableSlotsModal = ({ isOpen, onClose, api }) => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [currentValues, setCurrentValues] = useState({ start_time: '', end_time: '' });

    const fetchSlots = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const response = await api.get('/availability/admin');
            setSlots(response.data);
        } catch (error) {
            console.error("Erro ao buscar horários", error);
        } finally {
            setLoading(false);
        }
    }, [isOpen, api]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    const handleDelete = async (slotId) => {
        if (window.confirm('Tem certeza que deseja excluir este horário?')) {
            try {
                await api.delete(`/availability/${slotId}`);
                fetchSlots();
            } catch (error) {
                alert(error.response?.data?.message || 'Falha ao excluir horário.');
            }
        }
    };

    const handleEdit = (slot) => {
        setEditingSlotId(slot.id);
        // Formato esperado pelo input datetime-local: YYYY-MM-DDTHH:mm
        const formatForInput = (dateStr) => new Date(dateStr).toISOString().slice(0, 16);
        setCurrentValues({
            start_time: formatForInput(slot.start_time),
            end_time: formatForInput(slot.end_time),
        });
    };

    const handleSave = async (slotId) => {
        try {
            await api.patch(`/availability/${slotId}`, {
                start_time: currentValues.start_time,
                end_time: currentValues.end_time,
            });
            setEditingSlotId(null);
            fetchSlots();
        } catch (error) {
            alert(error.response?.data?.message || 'Falha ao salvar o horário.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="user-preview-modal-overlay" onClick={onClose}>
            <div className="user-preview-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2>Gerenciar Horários Disponíveis</h2>
                    <button onClick={onClose} className="modal-close-btn"><FiX size={24}/></button>
                </div>
                <div className="modal-body">
                    {loading ? <p>Carregando horários...</p> : (
                        <ul className="slots-list">
                            {slots.map(slot => (
                                <li key={slot.id} className="slot-item">
                                    {editingSlotId === slot.id ? (
                                        <div className="slot-edit-form">
                                            <input type="datetime-local" value={currentValues.start_time} onChange={e => setCurrentValues({...currentValues, start_time: e.target.value })}/>
                                            <input type="datetime-local" value={currentValues.end_time} onChange={e => setCurrentValues({...currentValues, end_time: e.target.value })}/>
                                        </div>
                                    ) : (
                                        <div className="slot-item-info">
                                            <span className="slot-time">
                                                {new Date(slot.start_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} - {new Date(slot.end_time).toLocaleTimeString('pt-BR', { timeStyle: 'short' })}
                                            </span>
                                            <span className={`slot-status ${slot.is_booked ? 'agendado' : 'disponivel'}`}>
                                                {slot.is_booked ? 'Agendado' : 'Disponível'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="slot-item-actions">
                                        {editingSlotId === slot.id ? (
                                            <>
                                                <button className="action-btn-triagem confirm" onClick={() => handleSave(slot.id)}><FiCheck/> Salvar</button>
                                                <button className="action-btn-triagem delete" onClick={() => setEditingSlotId(null)}><FiX/> Cancelar</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="action-btn-triagem edit" onClick={() => handleEdit(slot)} disabled={slot.is_booked}><FiEdit/> Editar</button>
                                                <button className="action-btn-triagem delete" onClick={() => handleDelete(slot.id)} disabled={slot.is_booked}><FiTrash2/> Excluir</button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PARA GERENCIAR A DISPONIBILIDADE DO ADMIN ---
const AvailabilityManager = ({ api, onAvailabilityAdded, onManageSlotsClick }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('18:00');
    const [duration, setDuration] = useState(50);
    const [interval, setInterval] = useState(10);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerateSlots = async () => {
        setIsSaving(true);
        const slots = [];
        let currentTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        while (currentTime < endDateTime) {
            const slotEnd = new Date(currentTime.getTime() + duration * 60000);
            if (slotEnd > endDateTime) break;
            
            slots.push({
                start_time: currentTime.toISOString(),
                end_time: slotEnd.toISOString(),
            });
            
            currentTime = new Date(slotEnd.getTime() + interval * 60000);
        }

        if (slots.length > 0) {
            try {
                await api.post('/availability', { slots });
                alert(`${slots.length} horários foram adicionados com sucesso!`);
                if (onAvailabilityAdded) onAvailabilityAdded();
            } catch (error) {
                console.error("Erro ao adicionar horários", error);
                alert('Falha ao adicionar horários.');
            }
        } else {
            alert('Nenhum horário foi gerado com as configurações fornecidas.');
        }
        setIsSaving(false);
    };

    return (
        <div className="availability-manager">
            <div className="form-grid">
                {/* CAMPO DE DATA */}
                <div className="form-group">
                    <label htmlFor="availability-date">Data</label>
                    <div className="input-with-icon">
                        <input id="availability-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                        <FiCalendar className="input-icon" />
                    </div>
                </div>
                {/* CAMPO DE INÍCIO */}
                <div className="form-group">
                    <label htmlFor="availability-start-time">Início</label>
                    <div className="input-with-icon">
                        <input id="availability-start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        <FiClock className="input-icon" />
                    </div>
                </div>
                {/* CAMPO DE FIM */}
                <div className="form-group">
                    <label htmlFor="availability-end-time">Fim</label>
                    <div className="input-with-icon">
                        <input id="availability-end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        <FiClock className="input-icon" />
                    </div>
                </div>
                {/* Campos de Duração e Intervalo */}
                <div className="form-group">
                    <label>Duração (min)</label>
                    <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
                </div>
                <div className="form-group">
                    <label>Intervalo (min)</label>
                    <input type="number" value={interval} onChange={e => setInterval(parseInt(e.target.value))} />
                </div>
            </div>
            <div className="availability-actions">
                <button className="btn-new-user" onClick={handleGenerateSlots} disabled={isSaving}>
                    <FiSave /> {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="btn-new-user secondary" onClick={onManageSlotsClick}>
                    <FiSettings /> Meus Horários
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA DE AGENDA ---
const AdminAgenda = () => {
    const [appointments, setAppointments] = useState([]);
    const [futureAppointments, setFutureAppointments] = useState([]);
    const [modalData, setModalData] = useState({ professionals: [], patients: [], companies: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);
    
    const token = useMemo(() => localStorage.getItem('token'), []);
    
    const apiAgenda = useMemo(() => axios.create({ baseURL: 'http://localhost:3001/api/agenda', headers: { 'Authorization': `Bearer ${token}` } }), [token]);
    const apiScheduling = useMemo(() => axios.create({ baseURL: 'http://localhost:3001/api/scheduling', headers: { 'Authorization': `Bearer ${token}` } }), [token]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [appointmentsRes, modalDataRes, futureAppointmentsRes] = await Promise.all([
                apiAgenda.get('/all-appointments'),
                apiAgenda.get('/users-for-agenda'),
                apiAgenda.get('/future-appointments')
            ]);
            
            setAppointments(appointmentsRes.data);
            setModalData(modalDataRes.data);
            setFutureAppointments(futureAppointmentsRes.data);
        } catch (err: any) {
            setError(err.message || 'Falha ao carregar dados da agenda.');
        } finally {
            setLoading(false);
        }
    }, [apiAgenda]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    useEffect(() => {
        const handleStatusChange = () => {
            console.log("Recebido evento 'appointmentStatusChanged', atualizando agenda...");
            fetchData();
        };

        socket.on('appointmentStatusChanged', handleStatusChange);

        return () => {
            socket.off('appointmentStatusChanged', handleStatusChange);
        };
    }, [fetchData]);


    const filteredAppointments = useMemo(() => {
        const filtered = appointments.filter((app: any) =>
            app.professional_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return [...filtered].sort((a: any, b: any) => 
            new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()
        );
    }, [searchTerm, appointments]);

    const handleOpenModalForCreate = () => {
        setEditingAppointment(null);
        setModalOpen(true);
    };

    const handleOpenModalForEdit = (appointment: any) => {
        setEditingAppointment(appointment);
        setModalOpen(true);
    };
    
    const handleSaveAppointment = async (appointmentData: any) => {
        const isEditing = !!editingAppointment;
        const url = isEditing ? `/appointments/${editingAppointment.id}` : `/create-appointment`;
        const method = isEditing ? 'put' : 'post';

        try {
            await apiAgenda({ method, url, data: appointmentData });
            setModalOpen(false);
            fetchData();
        } catch(err: any) {
            alert(err.response?.data?.message || 'Falha ao salvar agendamento');
        }
    };

    const handleDelete = async (appointmentId: string) => {
        if (window.confirm('Tem certeza que deseja remover este agendamento?')) {
            try {
                await apiAgenda.delete(`/appointments/${appointmentId}`);
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Falha ao remover agendamento');
            }
        }
    };

    const handleAddToCalendar = (appointment: any) => {
        const icsContent = generateICSContent(appointment);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `agendamento-${appointment.patient_name}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveAppointment}
                professionals={modalData.professionals}
                patients={modalData.patients}
                companies={modalData.companies}
                initialData={editingAppointment}
            />

            <AvailableSlotsModal 
                isOpen={isSlotsModalOpen}
                onClose={() => setIsSlotsModalOpen(false)}
                api={apiScheduling}
            />
            <div className="admin-header">
                <h1>Agenda</h1>
            </div>
            <div className="management-section">
                <div className="management-header">
                    <h2>Disponibilidade para Triagem</h2>
                    
                </div>
                <AvailabilityManager 
                    api={apiScheduling} 
                    onAvailabilityAdded={fetchData}
                    onManageSlotsClick={() => setIsSlotsModalOpen(true)} // Passa a função para o componente
                />
            </div>

            <div className="management-section future-appointments" style={{marginTop: '32px'}}>
                <div className="management-header">
                    <h2> Próximos Atendimentos</h2>
                </div>
                {loading ? <p>Carregando...</p> : (
                    <div className="future-appointments-list">
                        {futureAppointments.length > 0 ? futureAppointments.map((app: any) => (
                            <div key={app.id} className="future-appointment-item">
                                <img src={app.professional_photo ? `http://localhost:3001/${app.professional_photo}` : '/assets/default-avatar.png'} alt={app.professional_name} />
                                <div className="future-appointment-info">
                                    <strong>{app.professional_name}</strong>
                                    <span>com {app.patient_name}</span>
                                    <span>{new Date(app.appointment_time).toLocaleString('pt-BR', {day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'})}</span>
                                </div>
                            </div>
                        )) : <p>Nenhum atendimento futuro agendado.</p>}
                    </div>
                )}
            </div>
            
            <div className="management-section" style={{marginTop: '32px'}}>
                <div className="management-header">
                    <h2>Agendamentos</h2>
                    <div className="header-actions">
                        <div className="search-bar">
                            <FiSearch className="search-icon"/>
                            <input type="text" className="search-input" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        {/* Nova div para agrupar os botões */}
                        <div className="header-button-group">
                            <Link to="/admin/calendario" className="btn-new-user secondary">
                                <FiCalendar /> Calendário
                            </Link>
                            <button className="btn-new-user" onClick={handleOpenModalForCreate}>
                                <FiPlus /> Agendar
                            </button>
                        </div>
                    </div>
                </div>
                
                {loading ? <p>Carregando...</p> : (
                    <div className="admin-agenda-grid-modern">
                        {filteredAppointments.map((app: any) => (
                            <div key={app.id} className={`admin-appointment-card ${app.is_pending_review ? 'pending-review' : ''}`}>
                                <div className="card-header">
                                    <span className={`status-badge ${(app.status || 'agendada').toLowerCase().replace('ú', 'u')}`}>
                                        {app.status || 'Agendada'}
                                    </span>
                                </div>
                                <div className="card-participants">
                                    <div className="participant">
                                        <img src={app.professional_photo ? `http://localhost:3001/${app.professional_photo}` : '/assets/default-avatar.png'} alt={app.professional_name} />
                                        <div className="participant-info"><span>Profissional</span><strong>{app.professional_name}</strong></div>
                                    </div>
                                    <div className="participant">
                                        <img src={app.patient_photo ? `http://localhost:3001/${app.patient_photo}` : '/assets/default-avatar.png'} alt={app.patient_name} />
                                        <div className="participant-info"><span>Paciente</span><strong>{app.patient_name}</strong></div>
                                    </div>
                                </div>
                                <div className="card-details">
                                    <p><FiCalendar /> {new Date(app.appointment_time).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                                </div>
                                <div className="card-actions">
                                    <button className="action-btn" onClick={() => handleAddToCalendar(app)}>
                                        <FiDownload /> Calendário
                                    </button>
                                    <button className="action-btn edit-btn" onClick={() => handleOpenModalForEdit(app)}><FiEdit /> Editar</button>
                                    <button className="action-btn delete-btn" onClick={() => handleDelete(app.id)}><FiTrash2 /> Remover</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default AdminAgenda;