import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import '../styles/Admin.css';
import UserProfileModal from '../pages/adm/UserProfileModal';

// Icons
import { FiHome, FiUsers, FiDollarSign, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { IoCalendarOutline } from "react-icons/io5";
import { TiMessages } from "react-icons/ti";
import { FaUsersViewfinder } from "react-icons/fa6";
import { CgWebsite } from "react-icons/cg";
import { RiDashboardHorizontalFill } from "react-icons/ri";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({  
      email_login: 'Carregando...', 
      nome: 'Carregando...', 
      imagem_url: '',
      name: 'Carregando...',
      role: ''
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const fetchProfileForLayout = useCallback(async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        const response = await fetch('http://localhost:3001/api/profile/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setProfileData({ ...data, name: data.nome || data.nome_empresa });
        } else {
             setProfileData({ email_login: 'Erro', nome: 'Erro', name: 'Erro', imagem_url: '', role: '' });
        }
    } catch (error) {
        console.error("Falha ao buscar perfil para o layout:", error);
        setProfileData({ email_login: 'Erro', nome: 'Erro de conexão', name: 'Erro', imagem_url: '', role: '' });
    }
  }, [navigate]);


  // 2. useEffect unificado para carregar dados e configurar listeners
  useEffect(() => {
    // Busca os dados do perfil quando o componente é montado
    fetchProfileForLayout();

    // Define a função que será chamada pelo evento 'profileUpdated'
    const handleProfileUpdate = () => {
      console.log('Evento profileUpdated recebido. Atualizando dados do layout...');
      fetchProfileForLayout();
    };

    // Adiciona o listener para o evento personalizado
    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Adiciona o listener para fechar o dropdown ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Função de limpeza: remove os listeners quando o componente for desmontado
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchProfileForLayout]); // A dependência agora é a função memorizada


  const handleEditProfile = () => {
    setProfileModalOpen(false); // Fecha o modal de preview
    navigate('/admin/profile'); // Navega para a página de edição completa
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  
  // Constrói a URL completa da imagem, adicionando um timestamp para evitar problemas de cache
  const imageUrl = profileData.imagem_url 
    ? `http://localhost:3001/${profileData.imagem_url}?t=${new Date().getTime()}`
    : '/assets/default-avatar.jpg';

  return (
    <>
      <UserProfileModal 
        user={profileData}
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onEdit={handleEditProfile}
      />
      <div className="admin-dashboard-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-header">
            <img src="/full.png" alt="Logo" className="sidebar-logo"/>
          </div>
          <nav className="admin-nav-menu">
            <ul>
              <li><NavLink to="/admin/dashboard" end><RiDashboardHorizontalFill /> Dashboard</NavLink></li>
              <li><NavLink to="/admin/users"><FiUsers /> Usuários</NavLink></li>
              <li><NavLink to="/#"><TiMessages />Mensagens</NavLink></li>
              <li><NavLink to="/#"><IoCalendarOutline /> Agenda</NavLink></li>
              <li><NavLink to="/admin/finances"><FiDollarSign /> Financeiro</NavLink></li>
              <li><NavLink to="/#"><FaUsersViewfinder /> Triagem</NavLink></li>
              <li><NavLink to="/#"><CgWebsite /> Meu Site</NavLink></li>
            </ul>
          </nav>
        </aside>

        <main className="admin-content">
          <header className="admin-header">
            <div></div> 
            
            <div className="profile-section">
              <button className="profile-button" onClick={() => setProfileOpen(prev => !prev)} ref={profileButtonRef}>
                <div className="profile-wrapper">
                  <img src={imageUrl} alt="Perfil" className="profile-image" />
                </div>
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown" ref={dropdownRef} onMouseLeave={() => setProfileOpen(false)}>
                  <div className="dropdown-user-info">
                    <h4>{profileData.name || 'Usuário'}</h4>
                    <p>{profileData.email_login}</p>
                  </div>
                  <ul className="dropdown-menu">
                    <li><button onClick={() => { setProfileModalOpen(true); setProfileOpen(false); }}><FiUser /> Ver Perfil</button></li>
                    <li><NavLink to="/admin/settings" onClick={() => setProfileOpen(false)}><FiSettings /> Configurações</NavLink></li>
                    <li><button onClick={handleLogout}><FiLogOut /> Sair</button></li>
                  </ul>
                </div>
              )}
            </div>

          </header>
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default AdminLayout;