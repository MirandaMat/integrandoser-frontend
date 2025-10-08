// src/pages/profissional/ProfissionalAgenda.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'; 
import { io } from 'socket.io-client';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiChevronDown, FiDownload, FiPlus, FiEdit, FiTrash2, FiAlertTriangle, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import '../../styles/Agenda.css';
import UserProfileModal from './UserProfileModal';
import ProfisAppointmentModal from './ProfisAppointmentModal'; 
import { generateICSContent } from '../../utils/calendarUtils';

const token = localStorage.getItem('token');
const socket = io('http://localhost:3001', {
  auth: { token },
  transports: ['websocket', 'polling']
});

// --- COMPONENTE DE SELEÇÃO DE STATUS ---
const CustomStatusSelector = ({ currentStatus, appointmentId, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const options = ['Agendada', 'Concluída', 'Cancelada'];

    // Efeito para fechar o menu ao clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (status) => {
        onStatusChange(appointmentId, status);
        setIsOpen(false);
    };

    return (
        <div className="custom-status-selector" ref={dropdownRef}>
            <button 
                className={`status-trigger-btn status-badge ${(currentStatus || '').toLowerCase().replace('ú', 'u')}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{currentStatus}</span>
                <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="status-dropdown-menu">
                    {options.map(option => (
                        <button 
                            key={option} 
                            onClick={() => handleSelect(option)}
                            className={currentStatus === option ? 'active' : ''}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- NOVO MODAL PARA AGENDAMENTOS PENDENTES ---
const PendingAppointmentModal = ({ isOpen, onClose, appointment, onStatusChange }) => {
    if (!isOpen || !appointment) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pending-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <FiAlertTriangle className="pending-icon" />
                    <h2>Ação Necessária</h2>
                    <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                </div>
                <div className="modal-body">
                    <p>A sessão com <strong>{appointment.patient_name}</strong> em {new Date(appointment.appointment_time).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})} já passou. Por favor, atualize o status:</p>
                </div>
                <div className="modal-actions">
                    <button className="btn-action confirm" onClick={() => onStatusChange(appointment.id, 'Concluída')}>
                        <FiCheckCircle /> Marcar como Concluída
                    </button>
                    <button className="btn-action cancel" onClick={() => onStatusChange(appointment.id, 'Cancelada')}>
                        <FiXCircle /> Marcar como Cancelada
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProfissionalAgenda = () => {
    const [sessoes, setSessoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [professionalProfile, setProfessionalProfile] = useState<any>(null);

    // Estados para os modais
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isAppointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [modalData, setModalData] = useState({ professionals: [], patients: [], companies: [] });
    
    // NOVOS ESTADOS PARA O MODAL DE ALERTA
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [selectedPending, setSelectedPending] = useState<any | null>(null);

    const memoizedToken = useMemo(() => localStorage.getItem('token'), []);
    
    const apiAgenda = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api/agenda',
        headers: { 'Authorization': `Bearer ${memoizedToken}` }
    }), [memoizedToken]);

    const apiProfile = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api/profile',
        headers: { 'Authorization': `Bearer ${memoizedToken}` }
    }), [memoizedToken]);

    const fetchData = useCallback(async (showAlert = false) => {
        try {
            const sessoesRes = await apiAgenda.get('/my-appointments/professional');
            setSessoes(sessoesRes.data);

            // LÓGICA PARA ATIVAR O MODAL DE ALERTA
            if (showAlert) {
                const firstPending = sessoesRes.data.find(s => s.is_pending_review);
                if (firstPending) {
                    setSelectedPending(firstPending);
                    setIsPendingModalOpen(true);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao buscar dados da agenda.');
        }
    }, [apiAgenda]);

    const fetchModalData = useCallback(async () => {
        try {
            const { data } = await apiAgenda.get('/users-for-professional-agenda');
            setModalData(data);
        } catch (err) {
            console.error("Falha ao carregar dados para o modal de agendamento", err);
        }
    }, [apiAgenda]);

    const fetchProfile = useCallback(async () => {
        try {
            const { data } = await apiProfile.get('/me');
            setProfessionalProfile(data);
        } catch (err) {
            console.error("Falha ao buscar perfil do profissional", err);
            setProfessionalProfile({});
        }
    }, [apiProfile]);

    useEffect(() => {
        setLoading(true);
        // Passa 'true' para a primeira carga, indicando que o alerta pode ser exibido
        Promise.all([fetchData(true), fetchModalData(), fetchProfile()]).finally(() => {
            setLoading(false);
        });
    }, [fetchData, fetchModalData, fetchProfile]);

    useEffect(() => {
        const handleStatusChangeSocket = () => { fetchData(); };
        socket.on('appointmentStatusChanged', handleStatusChangeSocket);
        return () => { socket.off('appointmentStatusChanged', handleStatusChangeSocket); };
    }, [fetchData]);

    // FUNÇÃO PARA ATUALIZAR O STATUS (usada pelo select e pelo novo modal)
    const handleStatusChange = async (appointmentId: string, newStatus: string) => {
        try {
            await apiAgenda.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
            // Se a ação veio do modal, fecha ele
            if (isPendingModalOpen) {
                setIsPendingModalOpen(false);
                setSelectedPending(null);
            }
            fetchData(true); // Re-busca os dados e verifica se há mais pendências
        } catch (error: any) {
            alert(error.response?.data?.message || "Erro ao atualizar status.");
        }
    };

    const handleUserClick = async (userId: string, appointment: any) => {
        try {
            const response = await axios.get(`http://localhost:3001/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${memoizedToken}` }
            });
            setSelectedUser(response.data);
            setSelectedAppointment(appointment);
            setUserModalOpen(true);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Falha ao buscar perfil do paciente.');
        }
    };

    const handleSaveAppointment = async (appointmentData: any) => {
        const isEditing = !!editingAppointment;
        const url = isEditing 
            ? `/professional/appointments/${(editingAppointment as any).id}` 
            : '/professional/appointments';
        const method = isEditing ? 'put' : 'post';
        
        try {
            await apiAgenda({ method, url, data: appointmentData });
            setAppointmentModalOpen(false);
            setEditingAppointment(null);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Falha ao salvar o agendamento.');
            throw err; 
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingAppointment(null);
        setAppointmentModalOpen(true);
    };

    const handleOpenModalForEdit = (appointment: any) => {
        setEditingAppointment(appointment);
        setAppointmentModalOpen(true);
    };

    const handleDelete = async (appointmentId: string) => {
        if (window.confirm('Tem certeza que deseja remover este agendamento? A ação não pode ser desfeita.')) {
            try {
                await apiAgenda.delete(`/professional/appointments/${appointmentId}`);
                fetchData();
            } catch (err: any) {
                alert(err.response?.data?.message || 'Falha ao remover o agendamento.');
            }
        }
    };

    const handleAddToCalendar = (appointment: any) => {
        const icsContent = generateICSContent(appointment);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sessao-${appointment.patient_name}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // 1. Próximos Atendimentos (Agendados e no futuro, do mais próximo para o mais distante)
    const futureAppointments = useMemo(() => {
        return sessoes
            .filter(sessao => sessao.status === 'Agendada' && new Date(sessao.appointment_time) > new Date())
            .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    }, [sessoes]);

    // 2. Consultas Concluídas (do mais recente para o mais antigo, ordem vinda da API)
    const completedAppointments = useMemo(() => {
        return sessoes.filter(sessao => sessao.status === 'Concluída');
    }, [sessoes]);

    // 3. Minha Agenda (o que sobrou: Agendados no passado e Cancelados, do mais recente para o mais antigo)
    const mainAgendaAppointments = useMemo(() => {
        const futureIds = new Set(futureAppointments.map(a => a.id));
        return sessoes.filter(sessao => 
            sessao.status !== 'Concluída' && !futureIds.has(sessao.id)
        );
    }, [sessoes, futureAppointments]);


    if (loading) return <p>Carregando sua agenda...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <UserProfileModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} user={selectedUser} appointment={selectedAppointment} />
            <ProfisAppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setAppointmentModalOpen(false)} onSave={handleSaveAppointment} professionals={modalData.professionals} patients={modalData.patients} companies={modalData.companies} initialData={editingAppointment} isProfessionalView={true} />
            
            <PendingAppointmentModal 
                isOpen={isPendingModalOpen}
                onClose={() => setIsPendingModalOpen(false)}
                appointment={selectedPending}
                onStatusChange={handleStatusChange}
            />
            <div className="admin-header">
                <h1>Agenda</h1>
            </div>
            <div className="management-section">
                <div className="management-header">
                    <h2> Próximos Atendimentos</h2>
                </div>
                <div className="future-appointments-list">
                    {futureAppointments.length > 0 ? futureAppointments.map((app: any) => (
                        <div key={app.id} className="future-appointment-item">
                            <img src={app.patient_photo ? `http://localhost:3001/${app.patient_photo}` : '/assets/default-avatar.png'} alt={app.patient_name} />
                            <div className="future-appointment-info">
                                <strong>{app.patient_name}</strong>
                                <span>{new Date(app.appointment_time).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    )) : <p>Nenhum atendimento futuro agendado.</p>}
                </div>
            </div>

            <div className="management-section">
                <div className="management-header">
                    <h2>Minha Agenda</h2>
                    <div className="header-actions">
                        <div className="header-button-group">
                            <Link to="/professional/calendario" className="btn-new-user secondary">
                                <FiCalendar /> Calendário
                            </Link>
                            {professionalProfile?.level === 'Profissional Habilitado' && (
                                <Link className="btn-new-user" onClick={handleOpenModalForCreate}>
                                    <FiPlus /> Sessão
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                <div className="professional-agenda-grid">
                    {mainAgendaAppointments.length > 0 ? mainAgendaAppointments.map((sessao: any) => (
                        <div key={sessao.id} className={`professional-session-card ${sessao.is_pending_review ? 'pending-review' : ''}`}>
                            <div className="card-main-content" onClick={() => handleUserClick(sessao.patient_user_id, sessao)}>
                                <img src={sessao.patient_photo ? `http://localhost:3001/${sessao.patient_photo}` : '/assets/default-avatar.png'} alt={sessao.patient_name} className="user-avatar-large" />
                                <div className="card-info">
                                    <h4>{sessao.patient_name}</h4>
                                    <p><FiCalendar /> {new Date(sessao.appointment_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    <p><FiClock /> {new Date(sessao.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="card-footer">
                                <CustomStatusSelector 
                                    currentStatus={sessao.status}
                                    appointmentId={sessao.id}
                                    onStatusChange={handleStatusChange}
                                />
                                <div className="icon-actions">
                                    <button className="icon-btn" title="Editar Sessão" onClick={() => handleOpenModalForEdit(sessao)}><FiEdit /></button>
                                    <button className="icon-btn" title="Adicionar ao Calendário" onClick={() => handleAddToCalendar(sessao)}><FiDownload /></button>
                                    <button className="icon-btn danger" title="Remover Sessão" onClick={() => handleDelete(sessao.id)}><FiTrash2 /></button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p>Nenhum agendamento pendente ou cancelado para exibir.</p>
                    )}
                </div>
            </div>

            <div className="management-section">
                <div className="management-header">
                    <h2>Consultas Concluídas</h2>
                </div>
                <div className="professional-agenda-grid">
                    {completedAppointments.length > 0 ? completedAppointments.map((sessao: any) => (
                        <div key={sessao.id} className="professional-session-card">
                            <div className="card-main-content" onClick={() => handleUserClick(sessao.patient_user_id, sessao)}>
                                <img src={sessao.patient_photo ? `http://localhost:3001/${sessao.patient_photo}` : '/assets/default-avatar.png'} alt={sessao.patient_name} className="user-avatar-large" />
                                <div className="card-info">
                                    <h4>{sessao.patient_name}</h4>
                                    <p><FiCalendar /> {new Date(sessao.appointment_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    <p><FiClock /> {new Date(sessao.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <div className="card-footer">
                                <CustomStatusSelector 
                                    currentStatus={sessao.status}
                                    appointmentId={sessao.id}
                                    onStatusChange={handleStatusChange}
                                />
                                <div className="icon-actions">
                                    <button className="icon-btn" title="Editar Sessão" onClick={() => handleOpenModalForEdit(sessao)}><FiEdit /></button>
                                    <button className="icon-btn" title="Adicionar ao Calendário" onClick={() => handleAddToCalendar(sessao)}><FiDownload /></button>
                                    <button className="icon-btn danger" title="Remover Sessão" onClick={() => handleDelete(sessao.id)}><FiTrash2 /></button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p>Nenhuma consulta foi marcada como concluída ainda.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ProfissionalAgenda;