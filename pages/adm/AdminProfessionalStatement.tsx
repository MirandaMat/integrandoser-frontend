import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../../styles/Finance.css';
import { FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';

const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="stat-card-title">{title}</span>
      {icon}
    </div>
    <span className="stat-card-value">{value}</span>
  </div>
);

const AdminProfessionalStatement = () => {
  const { professionalId } = useParams<{ professionalId: string }>();
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!professionalId) return;

    const fetchStatement = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:3001/api/finance/professional-statement/${professionalId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar detalhamento financeiro do profissional.');
        const data = await response.json();
        setStatement(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [professionalId]);

  if (loading) return <p>Carregando detalhamento do profissional...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!statement) return <p>Nenhum dado encontrado para este profissional.</p>;
  
  // Calcula o total de comissão com base nas sessões pendentes
  const totalPendingCommission = statement.sessions.reduce((acc, s) => acc + (parseFloat(s.session_value) * 0.25), 0);

  return (
    <>
      <div className="admin-header">
        {/* Título corrigido para refletir o conteúdo */}
        <h1>Faturamento Pendente de {statement.professional?.nome}</h1>
        <Link to="/admin/financeiro" className="btn-cancel">&larr; Voltar</Link>
      </div>

      <div className="stats-grid">
        <StatCard title="Total de Comissão a Faturar" value={totalPendingCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<FiDollarSign size={24} color="#f59e0b"/>} />
        <StatCard title="Sessões Pendentes" value={statement.sessions.length.toString()} icon={<FiCalendar size={24}/>} />
        <StatCard title="Nível do Profissional" value={statement.professional?.level} icon={<FiUser size={24}/>}/>
      </div>

      <div className="management-section">
        <div className="management-header">
            {/* Título da tabela corrigido */}
            <h2>Sessões Pendentes</h2>
        </div>
        {/* Tabela única e simplificada */}
        <table className="user-table">
          <thead>
            <tr><th>Data da Sessão</th><th>Paciente</th><th>Valor (R$)</th><th>Comissão (25%)</th></tr>
          </thead>
          <tbody>
            {statement.sessions.map((s, index) => (
              <tr key={index}>
                <td>{new Date(s.appointment_time).toLocaleDateString('pt-BR')}</td>
                <td>{s.patient_name}</td>
                <td>{parseFloat(s.session_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className='text-positive'>
                  {(parseFloat(s.session_value) * 0.25).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
            {statement.sessions.length === 0 && <tr><td colSpan={4}>Nenhuma sessão pendente de faturamento para este profissional.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminProfessionalStatement;