import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';

// Importação dos Ícones
import { FaInstagram, FaFacebookSquare, FaSignInAlt } from 'react-icons/fa';
import { IoLogoWhatsapp } from "react-icons/io";
import { MdEmail } from "react-icons/md";

// Importação de componentes
import CookieConsentBanner from '../CookieConsentBanner';

// --- Interfaces para a Tipagem do Conteúdo ---
interface SocialLink {
  link?: string;
  enabled?: boolean;
}

interface SiteContent {
  footer?: {
    socials?: {
      instagram?: SocialLink;
      facebook?: SocialLink;
      whatsapp?: SocialLink;
      email?: SocialLink;
    };
  };
  // Outras seções do site podem ser adicionadas aqui no futuro
}


// Este componente agora envolve apenas as páginas públicas.
export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tptMenuOpen, setTptMenuOpen] = useState(false);
  const [empresasMenuOpen, setEmpresasMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [siteContent, setSiteContent] = useState<SiteContent>({}); // Estado para o conteúdo do site
  const navigate = useNavigate();

  useEffect(() => {
    // Busca o conteúdo do site (incluindo o rodapé)
    const fetchSiteContent = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await axios.get(`${apiUrl}/api/content/site`);
        
        setSiteContent(response.data || {});
      } catch (error) {
        console.error("Erro ao buscar conteúdo do site:", error);
      }
    };
    
    fetchSiteContent();

    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowCookieBanner(true);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowCookieBanner(false);
  };

  const closeAllMenus = () => {
    setMenuOpen(false);
    setTptMenuOpen(false);
    setEmpresasMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (tptMenuOpen || empresasMenuOpen) {
      // Se algum submenu estiver aberto, feche tudo ao clicar no menu principal de novo.
      if(menuOpen) closeAllMenus();
    }
  };

  const handleTptClick = (e) => {
    e.preventDefault();
    setTptMenuOpen(!tptMenuOpen);
    setEmpresasMenuOpen(false);
  };

  const handleEmpresasClick = (e) => {
    e.preventDefault();
    setEmpresasMenuOpen(!empresasMenuOpen);
    setTptMenuOpen(false);
  };

  const handleNavClick = (sectionId) => {
    closeAllMenus();
    navigate('/');
    setTimeout(() => {
      const section = document.querySelector(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Extrai os dados do rodapé para facilitar o uso
  const socials = siteContent.footer?.socials;

  return (
    <div className="app-container">
      {/* --- Navbar Pública --- */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <Link to="/" className="navbar-logo" onClick={() => handleNavClick('#home')}>
            <img 
              src={scrolled ? "/full.png" : "/full_branca.png"}
              alt="IntegrandoSer Logo" 
              className="navbar-logo-img" 
            />
          </Link>
          <div className={`menu-icon ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
          <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
            <li className="nav-item"><a className="nav-link" onClick={() => handleNavClick('#home')}>Home</a></li>
            <li className="nav-item"><a className="nav-link" onClick={() => handleNavClick('#about')}>Sobre</a></li>
            <li className="nav-item"><a className="nav-link" onClick={() => handleNavClick('#services')}>Serviços</a></li>
            <li className="nav-item dropdown-container">
              <a href="#" className="nav-link" onClick={handleTptClick}>TPT</a>
              {tptMenuOpen && (
                <ul className="dropdown-menu">
                  <li><Link to="/TPT" onClick={() => { closeAllMenus(); window.scrollTo(0, 0); }}>Saiba Mais</Link></li>
                  <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSeGUbgovz4BJag76rL1eTTOqB4RHNKE2H74x8LzBJfSIvY1eQ/viewform" onClick={closeAllMenus}>Para Você</a></li>
                </ul>
              )}
            </li>
            <li className="nav-item"><a className="nav-link" onClick={() => handleNavClick('#portfolio')}>Profissionais</a></li>
            <li className="nav-item dropdown-container">
              <a href="#" className="nav-link" onClick={handleEmpresasClick}>Empresas</a>
              {empresasMenuOpen && (
                <ul className="dropdown-menu">
                  <li><a href="#parceiro" onClick={() => { closeAllMenus(); handleNavClick('#parceiro'); }}>Saiba Mais</a></li>
                  <li><a href="https://docs.google.com/forms/d/1hPG58qoTFFIQyqk6ewGNm_0ckcocRevbcKAmkyOEjBA/preview" onClick={closeAllMenus}>Solicite uma Proposta</a></li>
                </ul>
              )}
            </li>
            <li className="nav-item"><a className="nav-link" onClick={() => handleNavClick('#blog')}>Blog</a></li>
          </ul>
        </div>
      </nav>

      {/* --- Ponto de Injeção para Rotas Filhas --- */}
      <main>
        <Outlet />
      </main>

      {/* --- Footer Público (Agora dinâmico) --- */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <img src="/full_branca.png" alt="IntegrandoSer Logo" className="footer-logo-img" />
            </div>
            <div className="footer-links">
              <Link to="/login" className="nav-link">
                  <FaSignInAlt className="social-icon" />
                    Área Restrita
                  </Link>
            </div>
          </div>
          <div className="footer-social">
            {/* CORREÇÃO APLICADA AQUI: Verificação estrita com `=== true` */}
            {socials?.instagram?.enabled === true && (
              <a href={socials.instagram.link || '#'} target="_blank" rel="noopener noreferrer"><FaInstagram className="social-icon" /> Instagram</a>
            )}
            {socials?.facebook?.enabled === true && (
              <a href={socials.facebook.link || '#'} target="_blank" rel="noopener noreferrer"><FaFacebookSquare className="social-icon" /> Facebook</a>
            )}
            {socials?.whatsapp?.enabled === true && (
              <a href={socials.whatsapp.link || '#'} target="_blank" rel="noopener noreferrer"><IoLogoWhatsapp className="social-icon" /> WhatsApp</a>
            )}
            {socials?.email?.enabled === true && (
              <a href={socials.email.link || '#'} target="_blank" rel="noopener noreferrer"><MdEmail className="social-icon" /> E-mail</a>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} IntegrandoSer. Todos os direitos reservados.</p>
        </div>
      </footer>
      
      {/* O botão flutuante de WhatsApp também respeita a habilitação */}
      <a 
        href={socials?.whatsapp?.enabled === true ? socials.whatsapp.link : "https://wa.me/555192883060"} 
        className="whatsapp-fab" 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label="Converse conosco no WhatsApp"
      >
        <IoLogoWhatsapp />
      </a>
      
      {showCookieBanner && <CookieConsentBanner onAccept={handleAcceptCookies} />}
    </div>
  );
}