// src/layout/GeneralLayout.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import '../styles/general.css';
import { useNotifications } from '../components/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  FiUsers, FiDollarSign, FiLogOut, FiSettings, FiUser, FiBell, FiMenu, FiX
} from 'react-icons/fi';
import { IoCalendarOutline } from "react-icons/io5";
import { TiMessages } from "react-icons/ti";
import { FaUsersViewfinder, FaBookMedical } from "react-icons/fa6";
import { CgWebsite } from "react-icons/cg";
import { RiDashboardHorizontalFill } from "react-icons/ri";
import NotificationIcon from '../components/NotificationIcon';
import SettingsPage from '../pages/SettingsPage';

interface NavItem {
  to: string;
  icon: JSX.Element;
  label: string;
}

const menuItems: { [key: string]: NavItem[] } = {
  ADM: [
    { to: "/admin/dashboard", icon: <RiDashboardHorizontalFill />, label: "Dashboard" },
    { to: "/admin/users", icon: <FiUsers />, label: "Usuários" },
    { to: "/admin/messages", icon: <TiMessages />, label: "Mensagens" },
    { to: "/admin/agenda", icon: <IoCalendarOutline />, label: "Agenda" },
    { to: "/admin/calendario", icon: <IoCalendarOutline />, label: "Calendário" },
    { to: "/admin/financeiro", icon: <FiDollarSign />, label: "Financeiro" },
    { to: "/admin/triagem", icon: <FaUsersViewfinder />, label: "Triagem" },
    { to: "/admin/content", icon: <CgWebsite />, label: "Gerenciar Site" },
  ],
  PROFISSIONAL: [
    { to: "/professional/dashboard", icon: <RiDashboardHorizontalFill />, label: "Dashboard" },
    { to: "/professional/pacientes", icon: <FiUsers />, label: "Pacientes" },
    { to: "/professional/agenda", icon: <IoCalendarOutline />, label: "Agenda" },
    { to: "/professional/calendario", icon: <IoCalendarOutline />, label: "Calendário" },
    { to: "/professional/financeiro", icon: <FiDollarSign />, label: "Financeiro" },
    { to: "/professional/messages", icon: <TiMessages />, label: "Mensagens" },
  ],
  PACIENTE: [
    { to: "/paciente/dashboard", icon: <RiDashboardHorizontalFill />, label: "Dashboard" },
    { to: "/paciente/agenda", icon: <IoCalendarOutline />, label: "Minha Agenda" },
    { to: "/paciente/messages", icon: <TiMessages />, label: "Mensagens" },
    { to: "/paciente/diario", icon: <FaBookMedical />, label: "Diário dos Sonhos" },
    { to: "/paciente/financeiro", icon: <FiDollarSign />, label: "Financeiro" },
  ],
  EMPRESA: [
    { to: "/empresa/dashboard", icon: <RiDashboardHorizontalFill />, label: "Dashboard" },
    { to: "/empresa/agenda", icon: <IoCalendarOutline />, label: "Agenda de Colaboradores" },
    { to: "/empresa/messages", icon: <TiMessages />, label: "Mensagens" },
    { to: "/empresa/financeiro", icon: <FiDollarSign />, label: "Financeiro" },
  ],
};

const defaultMenuItems: NavItem[] = [
  { to: "/dashboard", icon: <RiDashboardHorizontalFill />, label: "Dashboard" },
];


const GeneralLayout = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, markOneAsRead } = useNotifications();
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);


  const formatNotificationDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'agora mesmo';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'data inválida';
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const fetchProfileForLayout = useCallback(async () => {
    setLoadingProfile(true);
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/profile/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            setProfileData(data);
        } else {
            localStorage.removeItem('token');
            navigate('/login');
        }
    } catch (error) {
        console.error("Falha ao buscar perfil:", error);
    } finally {
        setLoadingProfile(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfileForLayout();
    const handleProfileUpdate = () => fetchProfileForLayout();
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchProfileForLayout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (isSidebarOpen && window.innerWidth <= 992) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) &&
            menuToggleRef.current && !menuToggleRef.current.contains(event.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  const handleEditProfile = () => {
    if (!profileData) return;
    
    // Converte o role para minúsculas para padronização
    let rolePath = profileData.role.toLowerCase();

    // Mapeia os roles para os caminhos de rota corretos
    if (rolePath === 'adm') {
      rolePath = 'admin'; // Corrige o caminho para o administrador
    } else if (rolePath === 'profissional') {
      rolePath = 'professional'; // Mantém a conversão para consistência
    }
    // Para 'paciente' e 'empresa', os nomes já correspondem aos caminhos.

    navigate(`/${rolePath}/profile`);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNotificationClick = async (notification: { id: number; related_url: string | null }) => {
    console.log('[Notificação] Clicada. Tentando navegar para:', notification.related_url);

    // 1. Marca a notificação específica como lida
    await markOneAsRead(notification.id);

    // 2. Navega para a URL se ela existir
    if (notification.related_url) {
        navigate(notification.related_url);
    }
    
    // 3. Fecha o dropdown de notificações
    setNotificationsOpen(false);
  };

  const getNavigationItems = (): NavItem[] => {
    if (loadingProfile || !profileData || !profileData.role) {
      return defaultMenuItems;
    }
    return menuItems[profileData.role] || defaultMenuItems;
  };

  const displayName = profileData?.nome || profileData?.nome_empresa || 'Usuário';
  const displayEmail = profileData?.email || (loadingProfile ? 'Carregando...' : 'Não encontrado');
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const imageUrl = profileData?.imagem_url
    ? `${apiUrl}/${profileData.imagem_url}?t=${new Date().getTime()}`
    : '/assets/default-avatar.png';

  const navigationItems = getNavigationItems();

  return (
    <>
      <button ref={menuToggleRef} className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)} aria-label="Alternar menu">
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      <aside ref={sidebarRef} className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="/full.png" alt="Logo" className="sidebar-logo logo-light"/>
          <img src="/full_branca.png" alt="Logo" className="sidebar-logo logo-dark"/>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          {loadingProfile && <div style={{ padding: '12px', color: 'var(--text-light)', fontSize: '0.9rem' }}>Carregando menu...</div>}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-actions">
            <div className="notification-section" ref={notificationsDropdownRef}>
              <button className="notification-button notification-bell" onClick={() => setNotificationsOpen(prev => !prev)}>
                <FiBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>

              {isNotificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notificações</h4>
                    {unreadCount > 0 && <button className="clear-notifications-btn" onClick={markAllAsRead}>Marcar todas como lidas</button>}
                  </div>
                  <ul className="notification-list">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <li key={notif.id} className={`notification-item ${notif.is_read ? 'is-read' : ''}`} onClick={() => handleNotificationClick(notif)}>
                          <div className="notification-item-content">
                            <NotificationIcon type={notif.type} />
                            <div>
                              <p>{notif.message}</p>
                              <small>{formatNotificationDate(notif.created_at)}</small>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <div className="no-notifications">Nenhuma notificação nova.</div>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="profile-section" ref={profileDropdownRef}>
              <button className="profile-button" onClick={() => setProfileOpen(prev => !prev)}>
                <img src={imageUrl} alt="Perfil" className="profile-image" />
              </button>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-user-info">
                    <img src={imageUrl} alt="Perfil" className="profile-dropdown-avatar" />
                    <div className="profile-dropdown-user-details">
                      <h4>{displayName}</h4>
                      <p>{displayEmail}</p>
                    </div>
                  </div>
                  <ul className="profile-dropdown-menu">
                    <li><button onClick={handleEditProfile}><FiUser /> Meu Perfil</button></li>
                    <li><button onClick={() => { navigate('/settings'); setProfileOpen(false); }}><FiSettings /> Configurações</button></li>
                    <li><button onClick={handleLogout}><FiLogOut /> Sair</button></li>
                  </ul>
                </div>
              )}
            </div>

            
          </div>
        </header>

        <Outlet />
      </main>
    </>
  );
};

export default GeneralLayout;