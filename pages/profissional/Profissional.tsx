// src/pages/profissional/Profissional.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowRight, FiUser, FiCalendar, FiDollarSign, FiMessageSquare, FiAlertTriangle, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import '../../styles/dashboard.css';

// --- Interfaces de Tipagem ---
interface Appointment {
  id: number;
  appointment_time: string;
  patient_name: string;
  patient_photo?: string;
}
interface ActivityData {
    date: string;
    count: number;
}

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


const ProfissionalDashboard = () => {
    const navigate = useNavigate();
    const token = useMemo(() => localStorage.getItem('token'), []);
    const api = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api/users', // Base para a API de usuários/dashboard
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);
     const apiAgenda = useMemo(() => axios.create({
        baseURL: 'http://localhost:3001/api/agenda',
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);

    const [professionalName, setProfessionalName] = useState('');
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
    const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]); // NOVO
    const [netRevenue, setNetRevenue] = useState(0);
    const [stats, setStats] = useState({ activePatients: 0, newMessages: 0 });
    const [sessionsActivity, setSessionsActivity] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false); // NOVO
    const [selectedPending, setSelectedPending] = useState<Appointment | null>(null); // NOVO

    const loadDashboardData = async () => {
        try {
            const { data } = await api.get('/my-dashboard/professional');
            setProfessionalName(data.professionalName || 'Profissional');
            setUpcomingAppointments(data.upcomingAppointments || []);
            setPendingAppointments(data.pendingAppointments || []); // NOVO
            setNetRevenue(data.netRevenue || 0);
            setStats({ activePatients: data.activePatients || 0, newMessages: data.newMessages || 0 });
            
            const formattedActivity = data.sessionsActivity.map((item: any) => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }));
            setSessionsActivity(formattedActivity);
            
            // NOVO: Lógica para abrir o modal se houver pendências
            if (data.pendingAppointments && data.pendingAppointments.length > 0) {
                setSelectedPending(data.pendingAppointments[0]); // Seleciona a primeira pendência
                setIsPendingModalOpen(true);
            }

        } catch (err: any) {
            setError('Não foi possível carregar os dados do dashboard. ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!token) navigate('/login');
        else loadDashboardData();
    }, [token, navigate]);

    // NOVO: Função para lidar com a mudança de status do modal
    const handlePendingStatusChange = async (appointmentId, newStatus) => {
        try {
            await apiAgenda.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
            setIsPendingModalOpen(false); // Fecha o modal
            setSelectedPending(null);
            // Recarrega os dados para atualizar a interface
            setLoading(true);
            await loadDashboardData();
        } catch (err: any) {
            alert('Falha ao atualizar o status. ' + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div className="loading-container">Carregando seu dashboard...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const nextAppointment = upcomingAppointments[0];
    const firstPending = pendingAppointments[0]; // Pega o primeiro pendente para exibir no card fixo
    const firstName = professionalName.split(' ')[0];

    return (
        <>
            <PendingAppointmentModal 
                isOpen={isPendingModalOpen}
                onClose={() => setIsPendingModalOpen(false)}
                appointment={selectedPending}
                onStatusChange={handlePendingStatusChange}
            />

            <div className="dashboard-container">
                <div className="dashboard-grid">
                    <div className={`dashboard-widget widget-welcome ${firstPending ? 'pending-review' : ''}`}>
                        <div>
                            <h2>Olá, {firstName}!</h2>
                            <p className="welcome-text">
                                {firstPending ? 'Você tem uma sessão pendente de confirmação.' : 'Aqui está o resumo da sua jornada hoje.'}
                            </p>
                        </div>
                        {/* Exibe o agendamento pendente com prioridade */}
                        {firstPending ? (
                            <div className="next-appointment-details pending">
                                <img src={firstPending.patient_photo ? `http://localhost:3001/${firstPending.patient_photo}` : '/assets/default-avatar.png'} alt={firstPending.patient_name} />
                                <div className="next-appointment-info">
                                    <span>PENDENTE DE AÇÃO</span>
                                    <strong>{firstPending.patient_name}</strong>
                                    <span>{new Date(firstPending.appointment_time).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        ) : nextAppointment ? (
                            <div className="next-appointment-details">
                                <img src={nextAppointment.patient_photo ? `http://localhost:3001/${nextAppointment.patient_photo}` : '/assets/default-avatar.png'} alt={nextAppointment.patient_name}/>
                                <div className="next-appointment-info">
                                    <span>Próximo Atendimento</span>
                                    <strong>{nextAppointment.patient_name}</strong>
                                    <span>{new Date(nextAppointment.appointment_time).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}</span>
                                </div>
                            </div>
                        ) : (
                             <div className="next-appointment-details">
                                <FiCalendar size={48} />
                                <div className="next-appointment-info">
                                    <strong>Nenhum atendimento futuro</strong>
                                    <span>Aproveite para organizar suas notas!</span>
                                </div>
                            </div>
                        )}
                        <Link to="/professional/agenda" className="btn-agenda">
                            Ver Agenda Completa <FiArrowRight />
                        </Link>
                    </div>

                    {/* --- KPIs e Gráfico (sem alterações) --- */}
                    <div id="kpi-messages" className="dashboard-widget widget-kpi">
                        <div className="kpi-icon"><FiMessageSquare /></div>
                        <div className="kpi-value">{stats.newMessages}</div>
                        <div className="kpi-label">Novas Mensagens</div>
                        <Link to="/professional/messages" className="btn-kpi">Ver Mensagens</Link>
                    </div>

                    <div id="kpi-dreams" className="dashboard-widget widget-kpi">
                        <div className="kpi-icon"><FiUser /></div>
                        <div className="kpi-value">{stats.activePatients}</div>
                        <div className="kpi-label">Pacientes Ativos</div>
                        <Link to="/professional/pacientes" className="btn-kpi">Gerenciar Pacientes</Link>
                    </div>

                    <div id="kpi-finance" className="dashboard-widget widget-kpi">
                        <div className="kpi-icon"><FiDollarSign /></div>
                        <div className="kpi-value">{netRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                        <div className="kpi-label">Faturamento Líquido (Mês)</div>
                        <Link to="/professional/financeiro" className="btn-kpi">Ver Finanças</Link>
                    </div>

                    <div className="dashboard-widget widget-chart">
                        <h3>Atividade das Sessões (Últimos 30 dias)</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sessionsActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#f5f3ff' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} labelFormatter={(label) => `Dia: ${label}`} formatter={(value) => [`${value} sessões`, null]} />
                                    <Bar dataKey="count" fill="#8B5CF6" name="Sessões" barSize={20} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfissionalDashboard;