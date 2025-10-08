// src/pages/paciente/PacienteAgenda.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiMessageSquare, FiDownload, FiUser } from 'react-icons/fi';
import '../../styles/Agenda.css';
import UserProfileModal from './UserProfileModal';
import { generateICSContent } from '../../utils/calendarUtils';

// --- Componente Reutilizável para o Card de Agendamento ---
const AppointmentCard = ({ appointment, onUserClick, onAddToCalendar, onSendMessage }) => (
    <div className="professional-session-card">
        <div className="card-main-content" onClick={() => onUserClick(appointment.professional_user_id)}>
            <img 
                src={appointment.professional_photo ? `http://localhost:3001/${appointment.professional_photo}` : '/assets/default-avatar.png'} 
                alt={appointment.professional_name} 
                className="user-avatar-large" 
            />
            <div className="card-info">
                <h4>{appointment.professional_name}</h4>
                <p><FiCalendar /> {new Date(appointment.appointment_time).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                <p><FiClock /> {new Date(appointment.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
        <div className="card-footer">
            <span className={`status-badge ${(appointment.status || 'agendada').toLowerCase().replace('ú', 'u')}`}>
                {appointment.status || 'Agendada'}
            </span>
            <div className="icon-actions">
                <button className="icon-btn" title="Ver Perfil do Profissional" onClick={() => onUserClick(appointment.professional_user_id)}>
                    <FiUser />
                </button>
                <button 
                    className="icon-btn" 
                    title="Enviar Mensagem" 
                    onClick={() => onSendMessage(appointment.professional_user_id)}
                >
                    <FiMessageSquare />
                </button>
                {appointment.status === 'Agendada' && (
                     <button className="icon-btn" title="Adicionar ao Calendário" onClick={() => onAddToCalendar(appointment)}>
                        <FiDownload />
                    </button>
                )}
            </div>
        </div>
    </div>
);

const PacienteAgenda = () => {
    const [sessoes, setSessoes] = useState([]);
    const [sessoesHoje, setSessoesHoje] = useState([]);
    const [sessoesFuturas, setSessoesFuturas] = useState([]);
    const [sessoesPassadas, setSessoesPassadas] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const token = useMemo(() => localStorage.getItem('token'), []);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessoes = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:3001/api/agenda/my-appointments/patient', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar agendamentos.');
                const data = await response.json();
                setSessoes(data);
            } catch (err: any) { setError(err.message); } 
            finally { setLoading(false); }
        };
        fetchSessoes();
    }, [token]);

    // Efeito para categorizar as sessões
    useEffect(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const sessoesDeHoje: any = [];
        const sessoesFuturas: any = [];
        const sessoesPassadas: any = [];

        sessoes.forEach((sessao: any) => {
            const dataSessao = new Date(sessao.appointment_time);
            dataSessao.setHours(0, 0, 0, 0);

            if (dataSessao.getTime() === hoje.getTime()) {
                sessoesDeHoje.push(sessao);
            } else if (dataSessao > hoje) {
                sessoesFuturas.push(sessao);
            } else {
                sessoesPassadas.push(sessao);
            }
        });
        
        // Ordena as sessões
        setSessoesHoje(sessoesDeHoje.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()));
        setSessoesFuturas(sessoesFuturas.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()));
        setSessoesPassadas(sessoesPassadas.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()));

    }, [sessoes]);
  
    const handleUserClick = async (userId: string) => {
        try {
            const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar perfil do profissional.');
            const userData = await response.json();
            setSelectedUser(userData);
            setModalOpen(true);
        } catch (error: any) { alert(error.message); }
    };

    const handleAddToCalendar = (appointment: any) => {
        const eventData = { ...appointment, patient_name: 'Você' };
        const icsContent = generateICSContent(eventData);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sessao-${appointment.professional_name}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSendMessage = (professionalUserId) => {
        navigate('/paciente/messages', { state: { recipientId: professionalUserId } });
    };

    if (loading) return <p>Carregando sua agenda...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <UserProfileModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} user={selectedUser} />
            <div className="admin-header">
                <h1>Minha Agenda</h1>
            </div>
            
            {/* --- SEÇÃO DE SESSÕES DE HOJE --- */}
            <div className="management-section">
                <div className="management-header">
                    <h2>Sessões de Hoje</h2>
                </div>
                <div className="professional-agenda-grid">
                    {sessoesHoje.length > 0 ? (
                        sessoesHoje.map((sessao: any) => (
                            <AppointmentCard key={sessao.id} appointment={sessao} onUserClick={handleUserClick} onAddToCalendar={handleAddToCalendar} onSendMessage={handleSendMessage} />
                        ))
                    ) : (
                        <p>Nenhuma sessão agendada para hoje.</p>
                    )}
                </div>
            </div>

            {/* --- SEÇÃO DE PRÓXIMAS SESSÕES --- */}
            <div className="management-section">
                <div className="management-header">
                    <h2>Próximas Sessões</h2>
                </div>
                <div className="professional-agenda-grid">
                     {sessoesFuturas.length > 0 ? (
                        sessoesFuturas.map((sessao: any) => (
                            <AppointmentCard key={sessao.id} appointment={sessao} onUserClick={handleUserClick} onAddToCalendar={handleAddToCalendar} onSendMessage={handleSendMessage} />
                        ))
                    ) : (
                        <p>Você não possui sessões futuras agendadas.</p>
                    )}
                </div>
            </div>

            {/* --- SEÇÃO DE HISTÓRICO --- */}
            <div className="management-section">
                <div className="management-header">
                    <h2>Histórico de Sessões</h2>
                </div>
                <div className="professional-agenda-grid">
                     {sessoesPassadas.length > 0 ? (
                        sessoesPassadas.map((sessao: any) => (
                            <AppointmentCard key={sessao.id} appointment={sessao} onUserClick={handleUserClick} onAddToCalendar={handleAddToCalendar} onSendMessage={handleSendMessage} />
                        ))
                    ) : (
                        <p>Seu histórico de sessões está vazio.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default PacienteAgenda;