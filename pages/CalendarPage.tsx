// src/pages/CalendarPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
// CORREÇÃO: Adicionando 'isSameMonth' que estava faltando
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiCircle, FiClock, FiCalendar, FiEdit, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import '../styles/CalendarPage.css';

// Importa os modais necessários
import AppointmentModal from './adm/AppointmentModal';
import ProfisAppointmentModal from './profissional/ProfisAppointmentModal';

const socket = io('http://localhost:3001', {
    auth: { token: localStorage.getItem('token') }
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
            const response = await api.get('/scheduling/availability/admin');
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
                await api.delete(`/scheduling/availability/${slotId}`);
                fetchSlots();
            } catch (error: any) {
                alert(error.response?.data?.message || 'Falha ao excluir horário.');
            }
        }
    };

    const handleEdit = (slot) => {
        setEditingSlotId(slot.id);
        const formatForInput = (dateStr) => new Date(dateStr).toISOString().slice(0, 16);
        setCurrentValues({
            start_time: formatForInput(slot.start_time),
            end_time: formatForInput(slot.end_time),
        });
    };

    const handleSave = async (slotId) => {
        try {
            await api.patch(`/scheduling/availability/${slotId}`, {
                start_time: currentValues.start_time,
                end_time: currentValues.end_time,
            });
            setEditingSlotId(null);
            fetchSlots();
        } catch (error: any) {
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
                            {slots.length > 0 ? slots.map(slot => (
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
                            )) : <p>Nenhum horário de triagem disponível encontrado.</p>}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const CalendarPage = () => {
    const [profile, setProfile] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [modalData, setModalData] = useState({ professionals: [], patients: [], companies: [] });

    const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);

    const token = useMemo(() => localStorage.getItem('token'), []);
    

    const api = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api',
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);

    const fetchProfile = useCallback(async () => {
        try {
            const { data } = await api.get('/profile/me');
            setProfile(data);
        } catch (err) {
            console.error("Falha ao buscar perfil do usuário", err);
            setError("Não foi possível identificar seu perfil. Tente recarregar a página.");
        }
    }, [api]);

    const fetchData = useCallback(async () => {
        if (!profile?.role) return;
        try {
            const endpoint = profile.role === 'ADM' ? '/calendar/admin' : '/calendar/professional';
            const { data } = await api.get(endpoint);

            const allEvents = [
                ...data.appointments,
                ...data.screeningAppointments,
                ...data.availableSlots
            ].map(e => ({ ...e, start: parseISO(e.start) }));

            setEvents(allEvents);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao carregar o calendário.');
        } finally {
            setLoading(false);
        }
    }, [api, profile]);
    
    // Busca dados necessários para preencher o modal de edição
    const fetchModalData = useCallback(async () => {
        if (!profile) return;
        try {
            const endpoint = profile.role === 'ADM' ? '/agenda/users-for-agenda' : '/agenda/users-for-professional-agenda';
            const { data } = await api.get(endpoint);
            setModalData(data);
        } catch (err) {
            console.error("Falha ao carregar dados para o modal", err);
        }
    }, [api, profile]);

    useEffect(() => {
        setLoading(true);
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        if (profile) {
            Promise.all([fetchData(), fetchModalData()]);
            const handleUpdate = () => fetchData();
            socket.on('appointmentStatusChanged', handleUpdate);
            return () => { socket.off('appointmentStatusChanged', handleUpdate); };
        }
    }, [profile, fetchData, fetchModalData]);

    const handleEdit = (event: any) => {
        const fullEventData = events.find(e => e.id === event.id);
        if (!fullEventData) return;

        const initialData = {
            id: fullEventData.original_id,
            appointment_time: fullEventData.start,
            ...fullEventData
        };
        setEditingEvent(initialData);

        // LÓGICA PARA ABRIR O MODAL CORRETO
        if (event.type === 'consulta') {
            setIsModalOpen(true);
        } else if (event.type === 'triagem_disponivel') {
            // Apenas o Admin pode editar horários de triagem
            if (profile?.role === 'ADM') {
                setIsSlotsModalOpen(true);
            } else {
                alert("Apenas administradores podem editar horários de triagem.");
            }
        }
    };

    const handleDelete = async (event: any) => {
        if (!window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) return;

        let endpoint = '';
        switch(event.type) {
            case 'consulta':
                endpoint = profile.role === 'ADM' 
                    ? `/agenda/appointments/${event.original_id}` 
                    : `/agenda/professional/appointments/${event.original_id}`;
                break;
            case 'triagem_disponivel':
                endpoint = `/scheduling/availability/${event.original_id}`;
                break;
            case 'triagem':
                alert('Agendamentos de triagem não podem ser excluídos diretamente. Cancele pela página de Triagem.');
                return;
            default:
                alert('Tipo de evento desconhecido.');
                return;
        }

        try {
            await api.delete(endpoint);
            fetchData(); // Atualiza a lista de eventos
        } catch (err: any) {
            alert(err.response?.data?.message || 'Falha ao excluir evento.');
        }
    };

    const handleSaveAppointment = async (appointmentData: any) => {
        if (!editingEvent) return;
        try {
            let endpoint = '';
            // CORREÇÃO: Declaramos o método como 'put' ou 'patch'
            let method: 'put' | 'patch'; 

            if (editingEvent.type === 'consulta') {
                // CORREÇÃO: Para consultas, o método é 'put'
                method = 'put'; 
                endpoint = profile.role === 'ADM' 
                    ? `/agenda/appointments/${editingEvent.id}` 
                    : `/agenda/professional/appointments/${editingEvent.id}`;
            } else if (editingEvent.type === 'triagem_disponivel') {
                // Para disponibilidade, o método é 'patch'
                method = 'patch';
                endpoint = `/scheduling/availability/${editingEvent.id}`;
                appointmentData = {
                    start_time: appointmentData.appointment_time,
                    end_time: appointmentData.appointment_time
                };
            } else {
                throw new Error("Este tipo de evento não pode ser editado aqui.");
            }
            
            // A chamada da API agora usa a variável 'method' correta
            await api[method](endpoint, appointmentData);

            setIsModalOpen(false);
            setEditingEvent(null);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Falha ao salvar o agendamento.');
        }
    };
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayIndex = getDay(monthStart);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const eventsForSelectedDate = useMemo(() => 
        events
            .filter(event => isSameDay(event.start, selectedDate))
            .sort((a, b) => a.start.getTime() - b.start.getTime()),
        [events, selectedDate]
    );

    const renderHeader = () => (
        <div className="calendar-header">
            <button onClick={prevMonth} className="nav-btn"><FiChevronLeft /></button>
            <h2>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
            <button onClick={nextMonth} className="nav-btn"><FiChevronRight /></button>
        </div>
    );

    const renderDaysOfWeek = () => (
        <div className="days-of-week">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day}>{day}</div>)}
        </div>
    );

    const renderCells = () => {
        const blanks = Array(startingDayIndex).fill(null);
        const cells = [...blanks, ...daysInMonth];

        return (
            <div className="month-grid">
                {cells.map((day, i) => (
                    <div
                        key={i}
                        className={`day-cell ${!day || !isSameMonth(day, currentMonth) ? 'disabled' : ''} ${day && isSameDay(day, selectedDate) ? 'selected' : ''} ${day && isSameDay(day, new Date()) && !isSameDay(day, selectedDate) ? 'today' : ''}`}
                        onClick={() => day && isSameMonth(day, currentMonth) && setSelectedDate(day)}
                    >
                        {day && isSameMonth(day, currentMonth) && (
                            <>
                                <span className="day-number">{format(day, 'd')}</span>
                                <div className="event-dots">
                                    {events.some(e => isSameDay(e.start, day) && e.type === 'consulta') && <FiCircle className="dot consulta" />}
                                    {events.some(e => isSameDay(e.start, day) && e.type === 'triagem') && <FiCircle className="dot triagem" />}
                                    {events.some(e => isSameDay(e.start, day) && e.type === 'triagem_disponivel') && <FiCircle className="dot disponivel" />}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderSchedule = () => {
        // Adiciona a lógica para verificar se o evento é passado
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

        return (
            <div className="schedule-view">
                <div className="schedule-header">
                    <h3>{format(selectedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</h3>
                </div>
                <div className="schedule-content">
                    {loading ? <p>Carregando...</p> : eventsForSelectedDate.length > 0 ? (
                        eventsForSelectedDate.map(event => {
                            // Verifica se a data do evento é anterior a hoje
                            const isPast = event.start < today;

                            return (
                                // AQUI ESTÁ A MUDANÇA: adicionamos as classes type-${event.type} e is-past
                                <div key={event.id} className={`schedule-item type-${event.type} ${isPast ? 'is-past' : ''} status-${event.status?.toLowerCase().replace('ú', 'u')}`}>
                                    <div className="item-time">
                                        <FiClock />
                                        {format(event.start, 'HH:mm')}
                                    </div>
                                    <div className="item-details">
                                        <strong>{event.title}</strong>
                                        {event.patient_name && <span>com {event.patient_name}</span>}
                                        <span className={`item-status-badge status-badge-${event.status?.toLowerCase().replace('ú', 'u')}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                    {event.type !== 'triagem' && (
                                        <div className="schedule-item-actions">
                                            <button className="action-btn-calendar" title="Editar" onClick={() => handleEdit(event)}>
                                                <FiEdit />
                                            </button>
                                            <button className="action-btn-calendar delete" title="Excluir" onClick={() => handleDelete(event)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-events">
                            <FiCalendar />
                            <p>Nenhum evento para este dia.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (error) return <div className="error-message">{error}</div>;
    if (loading && !events.length) return <p>Carregando calendário...</p>;

    return (
        <>
            <div className="admin-header">
                <h1>Calendário</h1>
            </div>
            {profile?.role === 'ADM' ? (
                <AppointmentModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAppointment}
                    initialData={editingEvent}
                    professionals={modalData.professionals}
                    patients={modalData.patients}
                    companies={modalData.companies}
                />
            ) : (
                <ProfisAppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAppointment}
                    initialData={editingEvent}
                    isProfessionalView={true}
                    professionals={modalData.professionals}
                    patients={modalData.patients}
                    companies={modalData.companies}
                />
            )}

            {profile?.role === 'ADM' && (
                <AvailableSlotsModal 
                    isOpen={isSlotsModalOpen}
                    onClose={() => setIsSlotsModalOpen(false)}
                    api={api}
                />
            )}

            <div className="calendar-page-container">
                <div className="calendar-view">
                    {renderHeader()}
                    {renderDaysOfWeek()}
                    {renderCells()}
                </div>
                {renderSchedule()}
            </div>
        </>
    );
};

export default CalendarPage;