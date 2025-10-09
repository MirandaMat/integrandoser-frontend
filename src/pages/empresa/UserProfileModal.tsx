import { IoClose } from 'react-icons/io5';
import { FiEdit, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import '../../styles/Agenda.css';

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
  // A propriedade onEdit agora é opcional
  onEdit?: (user: User) => void;
}

const UserProfileModal = ({ user, isOpen, onClose, onEdit }: UserProfileModalProps) => {
  if (!isOpen || !user) return null;

  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const imageUrl = (user.imagem_url || user.profile?.imagem_url)
    ? `${apiUrl}/${user.imagem_url || user.profile.imagem_url}?t=${new Date().getTime()}`
    : '/assets/default-avatar.png';

  const handleEditClick = () => {
    // A função só será chamada se onEdit existir
    if (onEdit) {
      onEdit(user);
    }
  };

  const approaches = user.profile?.abordagem?.split(',').map(a => a.trim()).filter(Boolean) || [];
  const displayName = user.name || user.profile?.nome || user.profile?.nome_empresa || '(Nome não definido)';
  const loginEmail = user.email || user.email_login;

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
              {approaches.length > 0 && (
                <div className="modal-section">
                  <h3>Abordagens</h3>
                  <div className="modal-approaches">
                    {approaches.map((approach: string, index: number) => (
                      <span key={index} className="modal-approach-tag">{approach}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* CORREÇÃO: O botão só será renderizado se a prop 'onEdit' for passada */}
          {/* =================================================================== */}
          {onEdit && (
            <button className="modal-contact-btn" onClick={handleEditClick}>
              <FiEdit /> Editar Perfil Completo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;