// src/pages/empresa/EmpresaAgenda.tsx
import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiHeart, FiUsers, FiUserX } from 'react-icons/fi';
import '../../styles/Agenda.css';
import UserProfileModal from './UserProfileModal'; 

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- Card para as seções de Sessões (Hoje, Futuras, Histórico) ---
const AppointmentCard = ({ sessao, onUserClick }) => (
  <div className="agenda-item-card">
    {/* ÁREA 1: STATUS (TOPO) */}
    <div className="card-status-header">
      <span className={`status-badge ${(sessao.status || 'agendada').toLowerCase().replace('ú', 'u')}`}>
        {sessao.status || 'Agendada'}
      </span>
    </div>

    {/* ÁREA 2: CONTEÚDO PRINCIPAL (COLABORADOR E PROFISSIONAL) */}
    <div className="card-user-content">
      <div className="user-info-item" onClick={() => onUserClick(sessao.patient_user_id)}>
        <img src={sessao.patient_photo ? `${apiUrl}/${sessao.patient_photo}` : '/assets/default-avatar.png'} alt={sessao.patient_name} className="user-avatar" />
        <div>
          <span className="user-role-label">Colaborador</span>
          <span className="user-name">{sessao.patient_name}</span>
        </div>
      </div>
      
      <div className="user-info-item" onClick={() => onUserClick(sessao.professional_user_id)}>
        <img src={sessao.professional_photo ? `${apiUrl}/${sessao.professional_photo}` : '/assets/default-avatar.png'} alt={sessao.professional_name} className="user-avatar" />
        <div>
          <span className="user-role-label">Atendido por</span>
          <span className="user-name">{sessao.professional_name}</span>
        </div>
      </div>
    </div>

    {/* ÁREA 3: DATA E HORA (RODAPÉ) */}
    <div className="card-datetime-footer">
      <div className="datetime-item">
        <FiCalendar />
        <span>{new Date(sessao.appointment_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="datetime-item">
        <FiClock />
        <span>{new Date(sessao.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  </div>
);


const EmpresaAgenda = () => {
  const [sessoes, setSessoes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [sessoesHoje, setSessoesHoje] = useState([]);
  const [sessoesFuturas, setSessoesFuturas] = useState([]);
  const [sessoesPassadas, setSessoesPassadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const appointmentsPromise = fetch(`${apiUrl}/api/agenda/my-appointments/company`, { headers });
        const assignmentsPromise = fetch(`${apiUrl}/api/agenda/company/collaborator-assignments`, { headers });
        const [appointmentsResponse, assignmentsResponse] = await Promise.all([appointmentsPromise, assignmentsPromise]);
        if (!appointmentsResponse.ok || !assignmentsResponse.ok) {
          throw new Error('Falha ao carregar os dados da agenda da empresa.');
        }
        const appointmentsData = await appointmentsResponse.json();
        const assignmentsData = await assignmentsResponse.json();
        setSessoes(appointmentsData);
        setColaboradores(assignmentsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  useEffect(() => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const sessoesDeHoje: any[] = [];
      const sessoesFuturas: any[] = [];
      const sessoesPassadas: any[] = [];
      sessoes.forEach((sessao: any) => {
          const dataSessao = new Date(sessao.appointment_time);
          dataSessao.setHours(0, 0, 0, 0);
          if (dataSessao.getTime() === hoje.getTime()) sessoesDeHoje.push(sessao);
          else if (dataSessao > hoje) sessoesFuturas.push(sessao);
          else sessoesPassadas.push(sessao);
      });
      setSessoesHoje(sessoesDeHoje.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()));
      setSessoesFuturas(sessoesFuturas.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()));
      setSessoesPassadas(sessoesPassadas.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()));
  }, [sessoes]);

  const handleUserClick = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar perfil do usuário.');
      const userData = await response.json();
      setSelectedUser(userData);
      setModalOpen(true);
    } catch (error: any) {
        alert(error.message);
    }
  };

  if (loading) return <p>Carregando agenda dos colaboradores...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <>
      <UserProfileModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} user={selectedUser} />
      <div className="admin-header">
        <h1>Agenda</h1>
      </div>

      <div className="management-section">
        <div className="management-header">
          <h2>Sessões de Hoje</h2>
        </div>
        <div className="agenda-list">
          {sessoesHoje.length > 0 ? sessoesHoje.map((sessao: any) => (
            <AppointmentCard key={sessao.id} sessao={sessao} onUserClick={handleUserClick} />
          )) : <p>Nenhuma sessão agendada para hoje.</p> }
        </div>
      </div>
      <div className="management-section">
        <div className="management-header">
          <h2>Próximas Sessões</h2>
        </div>
        <div className="agenda-list">
          {sessoesFuturas.length > 0 ? sessoesFuturas.map((sessao: any) => (
            <AppointmentCard key={sessao.id} sessao={sessao} onUserClick={handleUserClick} />
          )) : <p>Nenhuma sessão futura agendada para os colaboradores.</p>}
        </div>
      </div>
      <div className="management-section">
        <div className="management-header">
          <h2>Histórico de Sessões</h2>
        </div>
        <div className="agenda-list">
          {sessoesPassadas.length > 0 ? sessoesPassadas.map((sessao: any) => (
            <AppointmentCard key={sessao.id} sessao={sessao} onUserClick={handleUserClick} />
          )) : <p>O histórico de sessões está vazio.</p>}
        </div>
      </div>
    </>
  );
};

export default EmpresaAgenda;