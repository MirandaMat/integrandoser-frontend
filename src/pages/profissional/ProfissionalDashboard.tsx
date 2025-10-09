// src/pages/profissional/ProfissionalDashboard.tsx
import { useState, useEffect } from 'react';
import '../../styles/Admin.css'; // Reutilizando estilos

// Componente StatCard continua o mesmo
const StatCard = ({ title, value, change, isPositive }) => (
  <div className="stat-card">
    <span className="stat-card-title">{title}</span>
    <span className="stat-card-value">{value}</span>
    {/* A lógica de 'change' pode ser aprimorada no futuro para comparar com o período anterior */}
    <span className={`stat-card-change ${isPositive ? 'positive' : 'negative'}`}>{change}</span>
  </div>
);

const ProfissionalDashboard = () => {
  const [stats, setStats] = useState({
    activePatients: 0,
    weeklySessions: 0,
    newMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/agenda/my-dashboard/professional`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Não foi possível carregar as estatísticas.');
        }
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <p>Carregando seu dashboard...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <>
      <div className="admin-header">
        <h1>Olá, Profissional! Bem-vindo(a) de kkkvolta!</h1>
        <p>Este é o resumo da sua atividade profissional na plataforma.</p>
      </div>

      <div className="stats-grid">
        <StatCard title="Pacientes Ativos" value={stats.activePatients} change="+0" isPositive={true} />
        <StatCard title="Sessões na Semana" value={stats.weeklySessions} change="+0" isPositive={true} />
        <StatCard title="Novas Mensagens" value={stats.newMessages} change={`+${stats.newMessages}`} isPositive={true} />
        {/* O rendimento mensal pode ser calculado no futuro se houver um campo de valor por sessão */}
        <StatCard title="Rendimento Mensal" value="R$ 3.450" change="-5.2%" isPositive={false} />
      </div>
    </>
  );
};

export default ProfissionalDashboard;