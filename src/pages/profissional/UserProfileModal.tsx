import { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { FiEdit, FiPhone, FiMail, FiMapPin, FiRepeat, FiClock } from 'react-icons/fi';
import '../../styles/Agenda.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- Interfaces para Tipagem ---
interface UserProfileData {
  nome?: string;
  nome_empresa?: string;
  profissao?: string;
  especialidade?: string;
  telefone?: string;
  email?: string; 
  endereco?: string;
  cidade?: string;
  experiencia?: string;
  abordagem?: string;
  [key: string]: any;
}

interface User {
  id: string | number;
  name?: string; 
  email: string;
  email_login?: string;
  role: string;
  imagem_url?: string;
  profile: UserProfileData;
}

interface UserProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
  appointment?: any; 
}

const UserProfileModal = ({ user, isOpen, onClose, onEdit, appointment }: UserProfileModalProps) => {
  // NOVO ESTADO para os detalhes da série de agendamentos
  const [seriesDetails, setSeriesDetails] = useState<any>(null);
  const [loadingSeries, setLoadingSeries] = useState(false);

  useEffect(() => {
    // Limpa os detalhes da série sempre que o modal abrir ou o agendamento mudar
    setSeriesDetails(null);

    if (isOpen && appointment?.series_id) {
        const fetchSeriesDetails = async () => {
            setLoadingSeries(true);
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${apiUrl}/api/agenda/series/${appointment.series_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao buscar detalhes da série.');
                const data = await response.json();
                setSeriesDetails(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingSeries(false);
            }
        };
        fetchSeriesDetails();
    }
  }, [isOpen, appointment]);

  if (!isOpen || !user) return null;

  const imageUrl = (user.imagem_url || user.profile?.imagem_url)
    ? `${apiUrl}/${user.imagem_url || user.profile.imagem_url}?t=${new Date().getTime()}`
    : '/assets/default-avatar.png';

  const handleEditClick = () => {
    // A função só será chamada se onEdit existir
    if (onEdit) {
      onEdit(user);
    }
  };

  const displayName = user.profile?.nome || user.profile?.nome_empresa || '(Nome não definido)';
  const loginEmail = user.email;

  return (
    <div className="user-preview-modal-overlay" onClick={onClose}>
      <div className="user-preview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <IoClose size={24} />
        </button>
        <div className="modal-header">
          <div className="modal-image">
            <img src={imageUrl} alt={displayName} />
          </div>
          <div className="modal-header-content">
            <h2>{displayName}</h2>
            <p className="modal-specialty">{loginEmail}</p>
            <span className={`role-badge ${user.role?.toLowerCase()}`}>{user.role}</span>
          </div>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <h3>Contato e Localização</h3>
            <ul className="modal-details-list">
              {user.profile?.telefone && <li><FiPhone /> {user.profile.telefone}</li>}
              {user.profile?.email && <li><FiMail /> {user.profile.email}</li>}
              {user.profile?.endereco && <li><FiMapPin /> {user.profile.endereco}, {user.profile.cidade}</li>}
            </ul>
          </div>

          {user.role === 'PROFISSIONAL' && (
            <>
              {user.profile?.profissao && (
                <div className="modal-section">
                  <h3>Profissão</h3>
                  <p>{user.profile.profissao}</p>
                </div>
              )}
              {user.profile?.especialidade && (
                <div className="modal-section">
                  <h3>Especialidade</h3>
                  <p>{user.profile.especialidade}</p>
                </div>
              )}
              {user.profile?.experiencia && (
                <div className="modal-section">
                  <h3>Experiência</h3>
                  <p>{user.profile.experiencia}</p>
                </div>
              )}
              {appointment && (
                <div className="modal-section">
                  <h3>Detalhes do Atendimento</h3>
                  <ul className="modal-details-list">
                    <li>
                      <FiRepeat /> 
                      Frequência: <strong>{seriesDetails?.frequency || 'Evento Único'}</strong>
                    </li>
                    {loadingSeries ? (
                      <li>Carregando próximas sessões...</li>
                    ) : (
                      <>
                        {seriesDetails && seriesDetails.occurrences.length > 0 && (
                          <li>
                            <FiCalendar /> Próximas Sessões Agendadas:
                            <ul className="upcoming-sessions-list">
                              {seriesDetails.occurrences.slice(0, 4).map((occ: any) => (
                                <li key={occ.id}>
                                  <FiClock /> {new Date(occ.appointment_time).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </li>
                              ))}
                            </ul>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;