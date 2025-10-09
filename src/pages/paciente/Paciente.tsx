// src/pages/paciente/Paciente.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiBookOpen, FiDollarSign } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import '../../styles/dashboard.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Parsea uma data no formato 'AAAA-MM-DD' como UTC para evitar inconsistências de fuso horário.
 */
const parseDateAsUTC = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Prepara os dados para o gráfico de forma segura e simplificada.
 */
const processChartData = (apiData: { date: string; count: number }[]) => {
    // A lógica foi simplificada, pois agora confiamos que `item.date` é uma string.
    const dataMap = new Map(apiData.map(item => [item.date, item.count]));

    const thirtyDaysData = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - i);
        const formattedDate = date.toISOString().split('T')[0];

        thirtyDaysData.push({
            date: formattedDate,
            count: dataMap.get(formattedDate) || 0,
        });
    }
    return thirtyDaysData;
};

const PacienteDashboard = () => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = useMemo(() => localStorage.getItem('token'), []);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${apiUrl}/api/users/my-dashboard/patient`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao carregar dados do dashboard.');
                const data = await response.json();

                data.dreamActivity = processChartData(data.dreamActivity || []);
                setDashboardData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [token]);

    // O resto do componente (JSX) permanece o mesmo...
    if (loading) return <p>Carregando seu dashboard...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="dashboard-container">
            <div className="admin-header">
                <div>
                    <h1>Olá, {dashboardData?.patientName || 'Paciente'}!</h1>
                    <p>Este é o seu portal de bem-estar. Acompanhe seu progresso.</p>
                </div>
            </div>
            <div className="dashboard-grid">
                 <div className="dashboard-widget widget-welcome">
                    <div>
                        <h2 className="welcome-title">Minha Sessão</h2>
                        <p className="welcome-text">Estamos felizes em te ver. Continue sua jornada de autoconhecimento.</p>
                    </div>
                    {dashboardData.nextAppointment ? (
                        <div className="next-appointment-details">
                            <img src={dashboardData.nextAppointment.professional_photo ? `${apiUrl}/${dashboardData.nextAppointment.professional_photo}` : '/assets/default-avatar.png'} alt="Foto do profissional" />
                            <div className="next-appointment-info">
                                <span>Sua Próxima Sessão</span>
                                <strong>com {dashboardData.nextAppointment.professional_name}</strong>
                                <span>{new Date(dashboardData.nextAppointment.appointment_time).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</span>
                            </div>
                        </div>
                    ) : (
                        <p>Nenhuma sessão futura agendada no momento.</p>
                    )}
                    <a href="#" className="btn-agenda" onClick={() => navigate('/paciente/agenda')}>Ver Agenda Completa</a>
                </div>
                <div id="kpi-messages" className="dashboard-widget widget-kpi">
                    <FiMessageSquare className="kpi-icon" />
                    <div>
                        <div className="kpi-value">{dashboardData.unreadMessages}</div>
                        <div className="kpi-label">Mensagens não lidas</div>
                    </div>
                    <a href="#" className="btn-kpi" onClick={() => navigate('/paciente/messages')}>Acessar Mensagens</a>
                </div>
                <div id="kpi-dreams" className="dashboard-widget widget-kpi">
                    <FiBookOpen className="kpi-icon" />
                    <div>
                        <div className="kpi-value">{dashboardData.dreamStats.count}</div>
                        <div className="kpi-label">Registros no Diário</div>
                    </div>
                    <a href="#" className="btn-kpi" onClick={() => navigate('/paciente/diario')}>Acessar Diário</a>
                </div>
                <div id="kpi-finance" className="dashboard-widget widget-kpi">
                    <FiDollarSign className="kpi-icon" />
                    <div>
                        <div className="kpi-value">{dashboardData.pendingInvoices.count}</div>
                        <div className="kpi-label">Faturas Pendentes</div>
                    </div>
                    <a href="#" className="btn-kpi" onClick={() => navigate('/paciente/financeiro')}>Ver Financeiro</a>
                </div>
                
                <div className="dashboard-widget widget-chart">
                    <h3>Atividade no Diário (Últimos 30 dias)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dashboardData.dreamActivity} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(tick) => {
                                    const date = parseDateAsUTC(tick);
                                    return date.toLocaleDateString('pt-BR', {
                                        timeZone: 'UTC',
                                        day: '2-digit',
                                        month: '2-digit'
                                    });
                                }}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                                labelFormatter={(label) => {
                                    const date = parseDateAsUTC(label);
                                    return date.toLocaleDateString('pt-BR', {
                                        timeZone: 'UTC',
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    });
                                }}
                            />
                            <Bar dataKey="count" fill="#8B5CF6" name="Registros" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PacienteDashboard;