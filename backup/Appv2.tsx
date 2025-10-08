import { useState, useEffect } from 'react';
import { BrowserRouter, Link, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

import ServicesCarousel from './ServicesCarousel';
import Depoimento from './Depoimento';
import Terapeutas from './Terapeutas';
import Reveal from './components/Reveal';
import LineReveal from './components/LineReveal';
import Blog from './Blog';

// Icons
import { FiUser, FiHome } from 'react-icons/fi';
import { LuHeartHandshake } from "react-icons/lu";
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

const heroVideoPath = '/assets/video_hero.mov';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    // Configurar observador de interseção para animações
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, {
      threshold: 0.1
    });

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navbar */}
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="navbar-container">
            <Link to="/" className="navbar-logo">
            <img 
              src="/Logo.png" 
              alt="IntegrandoSer Logo" 
              className="navbar-logo-img" 
              style={{ height: '30px', marginRight: '10px' }}
            />
            IntegrandoSer
            </Link>
            <div 
              className={`menu-icon ${menuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
            >
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
            <ul className={`nav-menu ${menuOpen ? 'active' : ''}`}>
              <li className="nav-item"><a href="#home" className="nav-link" onClick={() => setMenuOpen(false)}>Home</a></li>
              <li className="nav-item"><a href="/#about" className="nav-link" onClick={() => setMenuOpen(false)}>Sobre</a></li>
              <li className="nav-item"><a href="#services" className="nav-link" onClick={() => setMenuOpen(false)}>Serviços</a></li>
              <li className="nav-item"><a href="#portfolio" className="nav-link" onClick={() => setMenuOpen(false)}>Terapeutas</a></li>
              <li className="nav-item"><a href="#blog" className="nav-link" onClick={() => setMenuOpen(false)}>Blog</a></li>
              <li className="nav-item"><a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contato</a></li>
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/#about" element={<HomePage />} />
          <Route path="/terapeutas" element={<Terapeutas />} />
        </Routes>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div>
              <div className="footer-brand">
                <img src="/logo.png" alt="IntegrandoSer Logo" className="footer-logo-img" />
                <span className="footer-logo">IntegrandoSer</span>
              </div>
              <div className="footer-partners">
                <div className="partners-title">Parceiros:</div>
                <div className="partners-grid">
                  <img src="/assets/parceiros/tavola.png" alt="Instituto Tavola - Porto Alegre" className="partner-logo" />
                  <img src="/assets/parceiros/avancar.png" alt="Avançar RS" className="partner-logo" />
                  <img src="/assets/parceiros/rakiram.png" alt="Rakiram" className="partner-logo" />
                </div>
              </div>
            </div>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <a href="#">Login</a>
            </div>
            <div className="footer-social">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="social-icon" />
                Instagram
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="social-icon" />
                LinkedIn
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} IntegrandoSer. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

// Componente HomePage que contém todo o conteúdo da página inicial
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
            <a href="#contact" className="btn btn-primary">Converse concosco</a>
            <Link to="/terapeutas" className="btn btn-outline">Conheça nossos terapeutas</Link>
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
        <div className="about-content">
          <div className="about-text">
            <Reveal delay={0.2}> 
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
            </Reveal>
          </div>
        </div>
        <div className="about-features">
          <LineReveal />
          <div className="feature-wrapper">
            <Reveal direction="left" delay={1.1}> 
              <div className="feature-block">
                <div className="feature-circle">
                  <div className="feature-icon">
                    <FiUser size={32} />
                  </div>
                </div>
                <div className="feature-content">
                  <h3>Apoio Personalizado</h3>
                  <p>Oferecemos suporte terapêutico alinhado às necessidades e singularidades de cada indivíduo em sua jornada.</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.5}> 
              <div className="feature-block">
                <div className="feature-circle">
                  <div className="feature-icon">
                    <LuHeartHandshake size={32} />
                  </div>
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
                  <div className="feature-icon">
                    <FiHome size={32} />
                  </div>
                </div>
                <div className="feature-content">
                  <h3>Ambiente Acolhedor</h3>
                  <p>Promovemos um ambiente acolhedor e acessível, onde a terapia se torna uma experiência transformadora e humanizada.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="services" >
        <Reveal delay={0.6}>
          <ServicesCarousel />
        </Reveal>
        
      </section>
      
      {/* Terapeuta */}
      <section id="portfolio" className=" therapists-section">
        <div className="therapists-container">
          <div className="therapists-bg-image"></div>
          <div className="therapists-content">
            <Reveal delay={0.3}> 
              <h2 className="section-therapists-title">Nossos Terapeutas</h2>
            </Reveal>
            <div className="therapists-text-box">
              <Reveal delay={0.4}> 
                <p>
                  Cada profissional de nossa equipe traz consigo uma história única, marcada pelo compromisso genuíno
                   com o cuidado e o acolhimento. Valorizamos a escuta sensível e o respeito à singularidade de cada pessoa, 
                   criando um espaço onde você se sente visto, ouvido e apoiado em sua jornada de transformação. 
                   Aqui, o encontro humano é a base para a construção de um caminho de saúde e bem-estar.
                </p>
              </Reveal>

              <Reveal delay={0.5}> 
                <Link to="/terapeutas" className="btn btn-primary">
                  Conheça Todos
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      
      {/* Blog */}
      <section id="blog" className="blog-section">
        <Blog />
        {/* Elementos decorativos */}
        
      </section>

      {/* Banner */}
      <section className="section-padding banner-section">
        <div className="banner-container">
          <div className="banner-bg-image"></div>
          <div className="banner-content">
            <Reveal delay={0.2}> 
              <h2 className="section-banner-text">
                Terapia para todos
              </h2>
            </Reveal>
            
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="testimonials" className="section-padding light-bg testimonials-section">
        <div className="testimonials-title-container">
          <Reveal delay={0.2}>
            <h2 className="section-title">O que dizem nossos pacientes</h2>
          </Reveal>
        </div>
        
        <Reveal delay={0.2}>
          <Depoimento />
        </Reveal>

      </section>
      
      {/* Contato */}
      <section id="contact" className="section-padding contact-section">
        <div className="contact-decoration contact-decoration-1"></div>
        <div className="contact-decoration contact-decoration-2"></div>
        
        <div className="contact-title-container">
          <h2 className="section-title">Agende uma conversa conosco</h2>
        </div>
        
        <div className="contact-container">
          <form className="contact-form">
            <div className="contact-form-group">
              <input 
                type="text" 
                placeholder="Seu nome completo" 
                required 
              />
              <input 
                type="email" 
                placeholder="Seu email" 
                required 
              />
            </div>
            
            <input 
              type="text" 
              placeholder="Assunto" 
              required 
            />
            
            <textarea 
              placeholder="Conte-nos como podemos ajudar..." 
              rows={5} 
              required
            ></textarea>
            
            <div className="contact-buttons">
              <button 
                type="submit" 
                className="contact-submit-btn"
              >
                Enviar mensagem
              </button>
              <button 
                type="button" 
                className="contact-specialist-btn"
                onClick={() => window.location.href='https://wa.me/555192883060'}
              >
                Fale com um especialista
              </button>
            </div>
          </form>
        </div>
      </section>

    </>
  );
}

export default App;