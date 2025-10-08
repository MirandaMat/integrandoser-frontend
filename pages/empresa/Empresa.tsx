import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiMessageSquare, FiFileText, FiArrowRight } from 'react-icons/fi';
import '../../styles/dashboard.css';
import '../../styles/Admin.css';

// Componente para os cards de estatísticas (KPIs)
const StatCard = ({ title, value, icon, linkTo, linkText }) => (
    // O componente Link agora envolve todo o card
    <Link to={linkTo || '#'} className="dashboard-widget widget-kpi">
        <div> 
            <div className="kpi-icon">{icon}</div>
            <div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-label">{title}</div>
            </div>
        </div>
        {/* O botão explícito foi removido */}
    </Link>
);

// Componente para a lista de sessões
const SessionListItem = ({ session }) => {
    const sessionDate = session.appointment_time ? new Date(session.appointment_time) : null;
    const formattedDate = sessionDate && !isNaN(sessionDate.getTime())
        ? sessionDate.toLocaleString('pt-BR', {
            month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
          })
        : 'Data inválida';

    return (
        <li className="session-list-item">
            <img 
                src={session.patient_photo ? `http://localhost:3001/${session.patient_photo}` : '/assets/default-avatar.png'} 
                alt={session.patient_name} 
            />
            <div className="session-info">
                <strong>{session.patient_name}</strong>
                <span>com {session.professional_name}</span>
            </div>
            <div className="session-time">
                {formattedDate}
            </div>
        </li>
    );
};

const EmpresaDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:3001/api/users/my-dashboard/company', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Não foi possível carregar os dados do dashboard.');
                }
                const dashboardData = await response.json();
                setData(dashboardData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <p>Carregando dashboard...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="dashboard-container">
            <div className="admin-header">
                {/* O nome da empresa agora é exibido dinamicamente */}
                <h1>Boas vindas, {data.companyName}</h1>

            </div>

            <div className="company-dashboard-grid">
                {/* Removi o widget de boas-vindas separado para simplificar o layout */}
                
                {/* --- Widgets de KPIs com Botões de Ação --- */}
                <StatCard 
                    title="Colaboradores Ativos" 
                    value={data.kpis.activeCollaborators} 
                    icon={<FiUsers />}
                    linkTo="/empresa/agenda"
                    linkText="Gerenciar"
                />
                <StatCard 
                    title="Sessões no Mês" 
                    value={data.kpis.sessionsThisMonth} 
                    icon={<FiCalendar />}
                    linkTo="/empresa/agenda"
                    linkText="Ver Agenda"
                />
                <StatCard 
                    title="Faturas Pendentes" 
                    value={data.kpis.pendingInvoices} 
                    icon={<FiFileText />}
                    linkTo="/empresa/financeiro"
                    linkText="Ver Faturas"
                />
                <StatCard 
                    title="Mensagens não lidas" 
                    value={data.kpis.unreadMessages} 
                    icon={<FiMessageSquare />}
                    linkTo="/empresa/messages"
                    linkText="Ver Mensagens"
                />

                {/* --- Widget de Próximas Sessões --- */}
                <div id="welcome-widget" className="dashboard-widget list-widget">
                    <h3>Próximas Sessões</h3>
                    {data.upcomingSessions.length > 0 ? (
                        <ul className="session-list">
                            {data.upcomingSessions.map((session, index) => (
                                <SessionListItem key={`upcoming-${index}`} session={session} />
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-list-message">Nenhuma sessão futura agendada.</p>
                    )}
                    <Link to="/empresa/agenda" className="widget-link">
                        Ver agenda completa <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EmpresaDashboard;