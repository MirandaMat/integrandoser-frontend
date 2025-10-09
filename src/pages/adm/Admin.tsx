// src/pages/adm/Admin.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Admin.css';
import '../../styles/dashboard.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
    FiMessageSquare, 
    FiCalendar, 
    FiClock, 
    FiAlertCircle, 
    FiPlus, 
    FiEdit2, 
    FiHeart, 
    FiUsers,
    FiDollarSign,
    FiInbox,
    FiTrendingUp,
    FiBriefcase, // Ícone para Sessão
    FiClipboard, // Ícone para Triagem
    FiArrowRight
} from 'react-icons/fi';
import UserProfileModal from '../../components/UserProfileModal';

// --- Registro do Chart.js ---
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- Componentes de Widgets ---

const KpiCard = ({ icon, title, value, link, className = '' }) => (
    // O Link agora envolve todo o card, tornando-o clicável
    <Link to={link || '#'} className={`dashboard-widget widget-kpi ${className}`}>
        <div>
            <div className="kpi-icon">{icon}</div>
            <div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-title">{title}</div>
            </div>
        </div>
        {/* O botão foi removido para a versão mobile, mas o Link o substitui 
        <span className="btn-kpi-mobile-indicator">
            Ver detalhes <FiArrowRight />
        </span>
        */}
    </Link>
);

const TriagemWidget = ({ pending, confirmation, scheduled }) => (
    // O Link também envolve todo o card de Triagem
    <Link to="/admin/triagem" className="dashboard-widget triage-widget">
        <h3> Triagem</h3>
        <div className="triage-widget-content">
            <div className="triage-stat-item">
                <span className="triage-label">Pendentes</span>
                <span className="triage-value">{pending}</span>
            </div>
            <div className="triage-stat-item">
                <span className="triage-label">Aguardando Confirmação</span>
                <span className="triage-value">{confirmation}</span>
            </div>
            <div className="triage-stat-item">
                <span className="triage-label">Reuniões Agendadas</span>
                <span className="triage-value">{scheduled}</span>
            </div>
        </div>
    </Link>
);

const RecentBlogsWidget = ({ posts }) => (
    <div className="dashboard-widget list-widget recent-blogs-widget">
        <div className="site-mgnt-header">
            <h3> Últimos Blogs</h3>
            <Link to="/admin/content" className="widget-link small"><FiPlus /> Novo Blog</Link>
        </div>
        {posts && posts.length > 0 ? (
            <ul className="widget-list-cards">
                {posts.map(post => (
                    <li key={post.id} className="widget-card-item">
                        <img
                            src={post.image_url ? `${apiUrl}/${post.image_url}` : '/assets/default-blog.png'}
                            alt={post.title}
                            className="widget-card-image"
                            onError={(e) => { e.currentTarget.src = '/assets/default-blog.png'; }}
                        />
                        <div className="widget-card-body">
                            <h4>{post.title}</h4>
                            <p className="widget-card-excerpt">{post.excerpt}</p>
                            <div className="widget-card-author">
                                <FiHeart style={{ color: '#ef4444' }} />
                                <span>{post.likes || 0}</span>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
             <div className="empty-list-message">
                <p>Nenhum blog postado.</p>
            </div>
        )}
    </div>
);

const FeaturedProfessionalsWidget = ({ professionals, onProfessionalClick }) => (
    <div className="dashboard-widget list-widget featured-professionals-widget">
        <div className="site-mgnt-header">
            <h3> Profissionais em Destaque</h3>
            <Link to="/admin/users" className="widget-link small"><FiPlus /> Ver Todos</Link>
        </div>
        <div className="professionals-grid">
            {professionals && professionals.map(prof => (
                <div key={prof.id} className="professional-card" onClick={() => onProfessionalClick(prof.user_id)}>
                    <img
                        src={prof.imagem_url ? `${apiUrl}/${prof.imagem_url}` : '/assets/default-avatar.png'}
                        alt={prof.nome}
                        onError={(e) => { e.currentTarget.src = '/assets/default-avatar.png'; }}
                    />
                    <span>{prof.nome}</span>
                </div>
            ))}
        </div>
    </div>
);

// ===================================================================
// --- NOVO WIDGET UNIFICADO: AGENDA DO DIA ---
// ===================================================================
const TodaysAgendaWidget = ({ events }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const listRef = useRef(null);
    const currentEventRef = useRef(null);

    useEffect(() => {
        // Timer para atualizar a hora e o estado visual a cada minuto
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Efeito de rolagem para o evento atual ou o próximo a acontecer
        if (currentEventRef.current) {
            currentEventRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [events, currentTime]); // Roda quando os eventos mudam ou a hora atualiza

    const getEventStatus = (eventTime) => {
        const eventDate = new Date(eventTime);
        const nextHour = new Date(eventDate.getTime() + 60 * 60 * 1000); // Duração de 1h para o evento ser "atual"
        
        if (currentTime > nextHour) return 'is-past';
        if (currentTime >= eventDate && currentTime <= nextHour) return 'is-current';
        return 'is-future';
    };

    // Encontra o primeiro evento futuro ou atual para atribuir a ref de rolagem
    const firstUpcomingEventIndex = events.findIndex(event => getEventStatus(event.event_time) !== 'is-past');

    return (
        <div className="dashboard-widget todays-agenda-widget">
            <div className="agenda-header">
                <h3>Agenda do Dia</h3>
                <Link to="/admin/agenda" className="widget-link">
                    Ver Minha Agenda <FiArrowRight />
                </Link>
            </div>
            <div className="agenda-list-container" ref={listRef}>
                {events && events.length > 0 ? (
                    <ul className="agenda-list">
                        {events.map((event, index) => {
                            const status = getEventStatus(event.event_time);
                            // A ref é atribuída ao primeiro evento que não está no passado
                            const refToSet = (index === firstUpcomingEventIndex) ? currentEventRef : null;

                            return (
                                <li key={event.id} className={`agenda-item ${status}`} ref={refToSet}>
                                    <div className="agenda-time">
                                        {new Date(event.event_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={`agenda-details ${event.type.toLowerCase()}`}>
                                        <div className="agenda-icon">
                                            {event.type === 'Sessão' ? <FiBriefcase /> : <FiClipboard />}
                                        </div>
                                        <div>
                                            <strong>{event.type === 'Sessão' ? 'Sessão de Atendimento' : 'Reunião de Triagem'}</strong>
                                            <span>{event.type === 'Sessão' ? `${event.main_person} e ${event.secondary_person}` : `${event.main_person} (${event.secondary_person})`}</span>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="empty-list-message">
                        <FiCalendar />
                        <p>Nenhum evento agendado para hoje.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Componente Principal do Dashboard ---
const AdmDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    const token = useMemo(() => localStorage.getItem('token'), []);
    const apiUsers = useMemo(() => axios.create({
        baseURL: `${apiUrl}/api/users`,
        headers: { 'Authorization': `Bearer ${token}` }
    }), [token]);

    const processUserChartData = (data) => {
        if (!data || data.length === 0) return null;
        const labels = [...new Set(data.map(item => item.month))].sort();
        const roles = ['PACIENTE', 'PROFISSIONAL', 'EMPRESA'];
        const roleColors = {
            PROFISSIONAL: { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.3)' },
            PACIENTE: { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.3)' },
            EMPRESA: { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.3)' },
        };
        const datasets = roles.map(role => ({
            label: role,
            data: labels.map(label => data.find(d => d.month === label && d.role === role)?.count || 0),
            borderColor: roleColors[role].border,
            backgroundColor: roleColors[role].bg,
            fill: true,
            tension: 0.4,
        }));
        return { labels, datasets };
    };
    
    const processRevenueChartData = (data) => {
        if (!data || data.length === 0) return null;
        const labels = data.map(item => item.month);
        const revenueData = data.map(item => item.totalRevenue);
        
        return {
            labels,
            datasets: [{
                label: 'Faturamento Bruto',
                data: revenueData,
                borderColor: '#10B981', // Verde
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                fill: true,
                tension: 0.4,
            }]
        };
    };

    const fetchData = useCallback(async () => {
        try {
            const response = await apiUsers.get('/dashboard/admin-stats');
            setDashboardData(response.data);
        } catch (error) {
            console.error("Falha ao buscar dados do dashboard", error);
        } finally {
            setLoading(false);
        }
    }, [apiUsers]);

    useEffect(() => {
        fetchData();
        // Atualiza a cada 10 minutos
        const interval = setInterval(fetchData, 600000); 
        return () => clearInterval(interval);
    }, [fetchData]);
    
    const handleOpenModal = async (userId) => {
        setIsLoadingProfile(true);
        setIsModalOpen(true);
        try {
            const response = await apiUsers.get(`/${userId}`);
            setSelectedUser(response.data);
        } catch (error) {
            console.error("Erro ao buscar detalhes do profissional:", error);
            setIsModalOpen(false); 
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleEditUser = (userToEdit) => {
        handleCloseModal();
        navigate(`/admin/users?edit=${userToEdit.id}`);
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' }, title: { display: false } },
        scales: { y: { beginAtZero: true } }
    };

    const userChartData = useMemo(() => dashboardData ? processUserChartData(dashboardData.growthStats) : null, [dashboardData]);
    const revenueChartData = useMemo(() => dashboardData ? processRevenueChartData(dashboardData.annualRevenueData) : null, [dashboardData]);


    if (loading || !dashboardData) return <div>Carregando dashboard...</div>;

    return (
        <>
            <div className="admin-header">
                <h1>Painel do Administrador</h1>
            </div>
            
            <div className="admin-dashboard-grid-v2">
                
                {/* Widgets de KPI - Linha 1 */}
                <KpiCard
                    icon={<FiDollarSign />}
                    title="Faturamento do Mês"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.kpis.monthlyRevenue || 0)}
                    link="/admin/financeiro"
                    linkText="Ver Detalhes"
                    className="kpi-revenue-widget"
                />
                
                <KpiCard
                    icon={<FiInbox />}
                    title="Cobranças Pendentes"
                    value={dashboardData.kpis.pendingInvoices}
                    link="/admin/financeiro"
                    linkText="Ver Faturas"
                    className="kpi-invoices-widget"
                />
                <KpiCard
                    icon={<FiMessageSquare />}
                    title="Mensagens Não Lidas"
                    value={dashboardData.kpis.unreadMessages}
                    link="/admin/messages" 
                    linkText="Ver Mensagens"
                    className="kpi-messages-widget"
                />
                <TriagemWidget
                    pending={dashboardData.kpis.pendingTriage}
                    confirmation={dashboardData.kpis.pendingConfirmation}
                    scheduled={dashboardData.kpis.scheduledMeetings}
                />
                
                {/* Gráficos - Linha 2 */}
                <div className="dashboard-widget chart-widget">
                    <h3> Novos Usuários</h3>
                    <div className="chart-container">
                        {userChartData && <Line options={chartOptions} data={userChartData} />}
                    </div>
                </div>
                
                <div className="dashboard-widget chart-widget revenue-chart-widget">
                    <h3> Faturamento Bruto Anual</h3>
                    <div className="chart-container">
                        {revenueChartData && <Line options={chartOptions} data={revenueChartData} />}
                    </div>
                </div>

                {/* Agenda e Blogs - Linha 3 */}
                <TodaysAgendaWidget events={dashboardData.agenda.todaysAgenda || []} />
                <RecentBlogsWidget posts={dashboardData.siteContent.latestBlogs || []} apiUrl={apiUrl} />
                
                {/* Profissionais em Destaque - Linha 4 */}
                <FeaturedProfessionalsWidget
                    professionals={dashboardData.siteContent.featuredProfessionals || []}
                    onProfessionalClick={handleOpenModal}
                    apiUrl={apiUrl}
                />
            </div>
            
            <UserProfileModal
                isOpen={isModalOpen}
                user={selectedUser}
                onClose={handleCloseModal}
                onEdit={handleEditUser}
                isLoading={isLoadingProfile}
            />
        </>
    );
};

export default AdmDashboard;