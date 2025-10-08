import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, Outlet } from 'react-router-dom';
import './styles/App.css';

// Importação dos componentes de página
import Terapeutas from './Terapeutas';
import BlogPosters from './BlogPosters';
import TPT from './TPT';
import Service from './Service';
import Login from './Login';
import AdminLayout from './layout/AdminLayout';
import AdmDashboard from './pages/adm/Admin';
import UsersAdm from './pages/adm/UsersAdm';
import ProfileAdm from './pages/adm/ProfileAdm';


// Importação de componentes internos da página
import ServicesCarousel from './ServicesCarousel';
import Depoimento from './Depoimento';
import Blog from './Blog';
import Reveal from './components/Reveal';
import LineReveal from './components/LineReveal';
import CookieConsentBanner from './CookieConsentBanner';

// Importação dos Ícones
import { FaInstagram, FaFacebookSquare, FaSignInAlt } from 'react-icons/fa';
import { IoLogoWhatsapp } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import { FiUser, FiHome } from 'react-icons/fi';
import { LuHeartHandshake } from "react-icons/lu";

const heroVideoPath = '/assets/video_hero.mov';


// ===================================================================
// 1. COMPONENTE PRINCIPAL COM A LÓGICA DE ROTAS
// Esta é a nova estrutura principal do seu App.
// ===================================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota para páginas públicas, que usarão o PublicLayout */}
        <Route path="/*" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="terapeutas" element={<Terapeutas />} />
          <Route path="blogposters" element={<BlogPosters />} />
          <Route path="TPT" element={<TPT />} />
          <Route path="service/:serviceSlug" element={<Service />} />
        </Route>

        {/* Rota para Login (página independente, sem o Layout público) */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas para o Administrador (também independentes) */}
        <Route element={<ProtectedRoute allowedRoles={['ADM']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdmDashboard />} />
            <Route path="/admin/users" element={<UsersAdm />} />
            <Route path="/admin/profile" element={<ProfileAdm />} />
            {/* <Route path="/admin/finances" element={<Financeiro />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// ===================================================================
// 2. LAYOUT PARA PÁGINAS PÚBLICAS (com Navbar e Footer)
// Este componente agora envolve apenas as páginas públicas.
// ===================================================================
function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tptMenuOpen, setTptMenuOpen] = useState(false);
  const [empresasMenuOpen, setEmpresasMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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
      closeAllMenus();
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

      {/* --- Footer Público --- */}
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
            <a href="https://www.instagram.com/terapia.para.todos?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer"><FaInstagram className="social-icon" /> Instagram</a>
            <a href="https://www.facebook.com/IIntegrandoSer/" target="_blank" rel="noopener noreferrer"><FaFacebookSquare className="social-icon" /> Facebook</a>
            <a href="https://wa.me/555192883060" target="_blank" rel="noopener noreferrer"><IoLogoWhatsapp className="social-icon" /> WhatsApp</a>
            <a href="mailto:contato@integrandoser.comc" target="_blank" rel="noopener noreferrer"><MdEmail className="social-icon" /> E-mail</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} IntegrandoSer. Todos os direitos reservados.</p>
        </div>
      </footer>
      
      <a href="https://wa.me/555192883060" className="whatsapp-fab" target="_blank" rel="noopener noreferrer" aria-label="Converse conosco no WhatsApp">
        <IoLogoWhatsapp />
      </a>
      
      {showCookieBanner && <CookieConsentBanner onAccept={handleAcceptCookies} />}
    </div>
  );
}

// ===================================================================
// 4. COMPONENTE DE ROTA PROTEGIDA
// ===================================================================
function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    // Se não há token, redireciona para o login
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
     // Se o papel do usuário não está na lista de permitidos, redireciona para a home
     return <Navigate to="/" replace />; 
  }

  return <Outlet />; // Se tudo estiver OK, renderiza o componente da rota (ex: AdmDashboard)
}

// ===================================================================
// 3. CONTEÚDO DA PÁGINA INICIAL
// O conteúdo que antes ficava em HomePage agora está aqui.
// ===================================================================
function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <video className="hero-video-bg" autoPlay loop muted playsInline>
          <source src={heroVideoPath} type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Integrando sua vida ao equilíbrio de uma mente saudável</h1>
          <div className="hero-buttons">
            <a href="https://wa.me/555192883060" className="btn btn-primary">Converse conosco</a>
            <Link to="/terapeutas" className="btn btn-outline">Profissionais Credenciados</Link>
          </div>
        </div>
        <div className="hero-scroll-indicator"></div>
      </section>
      
      {/* Sobre */}
      <section id="about" className="section-padding about-wrapper">
        <Reveal> 
          <div className="about-title-container">
            <h2 className="about-section-title">Nossa Essência</h2>
          </div>
        </Reveal>
        <Reveal>
          <div className="about-essence-container">
            <div className="about-essence-logo">
                <img src="/Logo.png" alt="Símbolo Integrando Ser" />
            </div>
            <div className="about-essence-text">
              <p>
                O IntegrandoSer nasceu do sonho da Analista Junguiana Fernanda Oliveira, 
                que idealizou um espaço onde cada indivíduo pudesse encontrar o suporte 
                terapêutico mais alinhado às suas necessidades e singularidades.
                Inspirada por sua experiência clínica e pelo desejo de tornar a 
                terapia mais acessível e humanizada, Fernanda criou um projeto 
                inovador que conecta pacientes ao terapeuta ideal com base em um 
                perfil cuidadosamente analisado.
                Nosso compromisso é transformar vidas com acolhimento, escuta e integração entre mente, corpo e alma
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal> 
          <h3 className="about-section-subtitle">Nós Oferecemos</h3>
        </Reveal>
        <div className="about-features">
          <LineReveal />
          <div className="feature-wrapper">
            <Reveal direction="left" delay={1.1}> 
              <div className="feature-block">
                <div className="feature-circle">
                  <div className="feature-icon"><FiUser size={32} /></div>
                </div>
                <div className="feature-content">
                  <h3>Apoio Personalizado</h3>
                  <p>Suporte terapêutico alinhado às necessidades e singularidades de cada indivíduo em sua jornada.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.5}> 
              <div className="feature-block">
                <div className="feature-circle">
                  <div className="feature-icon"><LuHeartHandshake size={32} /></div>
                </div>
                <div className="feature-content">
                  <h3>Encontro Ideal</h3>
                  <p>Facilitamos a conexão entre pacientes e terapeutas, assegurando uma relação que promove o sucesso terapêutico.</p>
                </div>
              </div>
            </Reveal>
            <Reveal direction="right" delay={1.4}> 
              <div className="feature-block">
                <div className="feature-circle">
                  <div className="feature-icon"><FiHome size={32} /></div>
                </div>
                <div className="feature-content">
                  <h3>Ambiente Acolhedor</h3>
                  <p>Promovemos um ambiente acolhedor e acessível, onde a terapia se torna uma experiência transformadora e humanizada.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
        <Reveal> 
          <h3 className="about-section-subtitle">Nossos parceiros</h3>
        </Reveal>
        <Reveal> 
          <div className="partners-container">
            <div className="partners-slider">
              <img src="/assets/parceiros/tavola_color.png" alt="Logo Instituto Távola" className="partner-logo-item" />
              <img src="/assets/parceiros/avancar_color.png" alt="Logo Avançar RS" className="partner-logo-item" />
              <img src="/assets/parceiros/holzbach1.png" alt="Logo Holzbach" className="partner-logo-item" />
              <img src="/assets/parceiros/rakiram_color.png" alt="Logo Rakiram" className="partner-logo-item" />
              <img src="/assets/parceiros/tavola_color.png" alt="Logo Instituto Távola" className="partner-logo-item" />
              <img src="/assets/parceiros/avancar_color.png" alt="Logo Avançar RS" className="partner-logo-item" />
              <img src="/assets/parceiros/holzbach1.png" alt="Logo Holzbach" className="partner-logo-item" />
              <img src="/assets/parceiros/rakiram_color.png" alt="Logo Rakiram" className="partner-logo-item" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Serviços */}
      <section id="services">
        <ServicesCarousel />
      </section>

      {/* TPT */}
      <section id="tpt" className="section-padding tpt-video-section">
        <div className="tpt-video-container">
            <div className="tpt-video-wrapper">
                <Reveal direction="left" delay={0.2}><video className="tpt-video" autoPlay loop muted playsInline><source src="/assets/tpt.mov" type="video/mp4" />Seu navegador não suporta o elemento de vídeo.</video></Reveal>
            </div>
            <div className="tpt-content-wrapper">
                <Reveal direction="right" delay={0.3}>
                    <h2 className="section-title">Terapia Para Todos </h2>
                    <div className="tpt-text-box">
                        <p>O Terapia Para Todos - TPT é um projeto do IntegrandoSer criado para tornar a terapia acessível a todos, com planos completos e valores especiais, pois acreditamos que o cuidado com a saúde mental deve ser um direito de todos, independentemente da posição social.</p>
                        <Link to="/TPT" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)}>Saiba Mais</Link>
                    </div>
                </Reveal>
            </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="testimonials" className="section-padding light-bg testimonials-section">
        <div className="testimonials-title-container">
          <Reveal delay={0.2}><h2 className="testimonials-section-title">O que diz quem já faz parte </h2></Reveal>
        </div>
        <Reveal delay={0.3}><Depoimento /></Reveal>
      </section>

      {/* Terapeuta */}
      <section id="portfolio" className=" therapists-section">
        <div className="therapists-container">
            <div className="therapists-bg-image"></div>
            <div className="therapists-content">
                <Reveal delay={0.3}> <h2 className="section-therapists-title">Profissionais Credenciados</h2></Reveal>
                <div className="therapists-text-box">
                    <Reveal delay={0.4}> <p>Cada profissional de nossa equipe traz consigo uma história única, marcada pelo compromisso genuíno com o cuidado e o acolhimento. Valorizamos a escuta sensível e o respeito à singularidade de cada pessoa, criando um espaço onde você se sente visto, ouvido e apoiado em sua jornada de transformação. Aqui, o encontro humano é a base para a construção de um caminho de saúde e bem-estar.</p></Reveal>
                    <Reveal delay={0.5}> <Link to="/terapeutas" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)} >Conheça Todos</Link></Reveal>
                </div>
            </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="blog-section">
        <Blog />
      </section>

      {/* Fundadora */}
      <section id="founder" className="section-padding founder-section">
        <Reveal delay={0.2}> 
          <div className="founder-card">
              <div className="founder-image-container">
                  <img src="/assets/terapeutas/fernanda_oliveira.jpeg" alt="Fernanda Oliveira, fundadora do IntegrandoSer" className="founder-image" />
              </div>
              <div className="founder-text">
                  <h3>Fernanda Oliveira</h3>
                  <p>Sou Fernanda Oliveira, Analista Junguiana com especialização em Psicologia Analítica. Minha missão é cuidar do bem-estar emocional e psicológico de cada pessoa que cruza meu caminho terapêutico. Acredito profundamente no poder do autoconhecimento, no equilíbrio entre o que é consciente e inconsciente em nós, e no desenvolvimento pessoal como base para uma vida mais plena e significativa.</p>
                  <p>Foi com esse propósito que fundei o IntegrandoSer — um espaço que idealizei com muito carinho para acolher aqueles que buscam evolução emocional e espiritual. Meu trabalho é guiado pela empatia, pela escuta sem julgamentos e pelo respeito às histórias únicas de cada indivíduo. Na minha forma de ver a terapia, o processo acontece na troca horizontal, onde ambos — terapeuta e paciente — constroem juntos os caminhos da transformação.</p>
                  <p>Acredito no potencial que todos temos de superar desafios, ressignificar experiências e encontrar propósito. E é essa crença que me move em cada sessão, workshop ou palestra que ofereço. Meu maior objetivo é facilitar o reencontro com a própria essência, promovendo saúde emocional, autodescoberta e uma relação mais autêntica com a vida.</p>
                  <p>Com o IntegrandoSer, reafirmo diariamente meu compromisso de contribuir para uma sociedade mais consciente, equilibrada e amorosa — oferecendo suporte genuíno a quem deseja crescer, se fortalecer e se transformar.</p>
              </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}


export default App;