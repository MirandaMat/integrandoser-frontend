import { useState, useEffect } from 'react';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import './App.css';

import ServicesCarousel from './ServicesCarousel';
import Terapeutas from './Terapeutas';

// Icons
import { FiUser, FiHome } from 'react-icons/fi';
import { LuHeartHandshake } from "react-icons/lu";

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

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Navbar */}
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="navbar-container">
            <Link to="/" className="navbar-logo">IntegrandoSer</Link>
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
              <li className="nav-item"><a href="#about" className="nav-link" onClick={() => setMenuOpen(false)}>Sobre</a></li>
              <li className="nav-item"><a href="#services" className="nav-link" onClick={() => setMenuOpen(false)}>Serviços</a></li>
              <li className="nav-item"><a href="#portfolio" className="nav-link" onClick={() => setMenuOpen(false)}>Terapeutas</a></li>
              <li className="nav-item"><a href="#blog" className="nav-link" onClick={() => setMenuOpen(false)}>Blog</a></li>
              <li className="nav-item"><a href="#contact" className="nav-link" onClick={() => setMenuOpen(false)}>Contato</a></li>
            </ul>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terapeutas" element={<Terapeutas />} />
        </Routes>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-logo">IntegrandoSer</div>
            <div className="footer-links">
              <Link to="/">Home</Link>
              <a href="#">Login</a>
            </div>
            <div className="footer-social">
              {['instagram', 'linkedin'].map((social) => (
                <a key={social} href={`https://${social}.com`} target="_blank" rel="noopener noreferrer">
                  {social}
                </a>
              ))}
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
        <div className="about-title-container">
          <h2 className="about-section-title">Nossa Essência</h2>
        </div>
        <div className="about-content">
          <div className="about-text">
            <p>
              O IntegrandoSer nasceu do sonho da Analista Junguiana Fernanda Oliveira, 
              que idealizou um espaço onde cada indivíduo pudesse encontrar o suporte 
              terapêutico mais alinhado às suas necessidades e singularidades.
              Inspirada por sua experiência clínica e pelo desejo de tornar a 
              terapia mais acessível e humanizada, Fernanda criou um projeto 
              inovador que conecta pacientes ao terapeuta ideal com base em um 
              perfil cuidadosamente analisado.
            </p>
          </div>
        </div>
        <div className="about-features">
          <div className="feature-slider">
            <div className="feature-wrapper">
              <div className="feature-block">
                <div className="feature-icon">
                  <FiUser size={40} /> 
                </div>
                <span>Apoio Personalizado</span>
                <p className="separator">Oferecemos suporte terapêutico alinhado às necessidades e singularidades de cada indivíduo em sua jornada.</p>
              </div>
              <div className="feature-block">
                <div className="feature-icon">
                  <LuHeartHandshake size={40} /> 
                </div>
                <span>Encontro Ideal</span>
                <p className="separator">Facilitamos a conexão entre pacientes e terapeutas, assegurando uma relação que promove o sucesso terapêutico.</p>
              </div>
              <div className="feature-block">
                <div className="feature-icon">
                  <FiHome size={40} /> 
                </div>
                <span>Ambiente Acolhedor</span>
                <p className="separator">Promovemos um ambiente acolhedor e acessível, onde a terapia se torna uma experiência transformadora.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      {/* Serviços */}
      <section id="services" className="section-padding light-bg services-section">
        <div className="services-header">
          <h2 className="section-title">Nossos Serviços</h2>
        </div>
        <ServicesCarousel />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/#services" className="service-btn" style={{ display: 'inline-block', marginTop: '20px' }}>
            Saiba Mais
          </Link>
        </div>
      </section>
      
      {/* Terapeuta */}
      <section id="portfolio" className="section-padding therapists-section">
        <div className="therapists-container">
          <div className="therapists-bg-image"></div>
          <div className="therapists-content">
            <h2 className="section-therapists-title">Nossos Terapeutas</h2>
            <div className="therapists-text-box">
              <p>
                Nossa equipe é composta por terapeutas altamente qualificados e experientes, 
                cada um especializado em diferentes abordagens terapêuticas.
              </p>
              <p>
                Conheça nossos profissionais e encontre aquele com quem você mais se identifica 
                para iniciar sua jornada de autoconhecimento e cura.
              </p>
              <Link to="/terapeutas" className="btn btn-primary">
                Conheça Todos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="blog-section">
        <div className="blog-container">
          <div className="blog-header">
            <h2 className="section-title">Nosso Blog</h2>
            <p className="hero-subtitle">Artigos e insights sobre saúde mental e bem-estar</p>
          </div>
          
          <div className="blog-grid">
            {/* Card 1 */}
            <div className="blog-card">
              <div className="blog-card-image">
                <img src="/assets/blog/blog-1.png" alt="Autoconhecimento e terapia" />
                <span className="blog-card-date">15 MAR 2023</span>
              </div>
              <div className="blog-card-content">
                <span className="blog-card-category">Autoconhecimento</span>
                <h3 className="blog-card-title">Como a terapia pode ajudar no processo de autoconhecimento</h3>
                <p className="blog-card-excerpt">
                  Descubra como o processo terapêutico pode ser um poderoso aliado na jornada de autoconhecimento...
                </p>
                <a href="#" className="blog-card-link">
                  Ler artigo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="blog-card">
              <div className="blog-card-image">
                <img src="/assets/blog/blog-2.png" alt="Ansiedade e tratamento" />
                <span className="blog-card-date">28 FEV 2023</span>
              </div>
              <div className="blog-card-content">
                <span className="blog-card-category">Saúde Mental</span>
                <h3 className="blog-card-title">Técnicas comprovadas para reduzir a ansiedade no dia a dia</h3>
                <p className="blog-card-excerpt">
                  Conheça estratégias eficazes que podem ajudar a controlar os sintomas de ansiedade...
                </p>
                <a href="#" className="blog-card-link">
                  Ler artigo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="blog-card">
              <div className="blog-card-image">
                <img src="/assets/blog/blog-3.png" alt="Relacionamentos saudáveis" />
                <span className="blog-card-date">10 FEV 2023</span>
              </div>
              <div className="blog-card-content">
                <span className="blog-card-category">Relacionamentos</span>
                <h3 className="blog-card-title">Construindo relacionamentos saudáveis: dicas da terapia de casal</h3>
                <p className="blog-card-excerpt">
                  Aprenda princípios da terapia de casal que podem melhorar qualquer tipo de relação...
                </p>
                <a href="#" className="blog-card-link">
                  Ler artigo
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="blog-cta">
            <Link to="/blog" className="btn btn-primary">
              Ver Todos os Artigos
            </Link>
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="blog-decoration blog-decoration-1"></div>
        <div className="blog-decoration blog-decoration-2"></div>
      </section>

      {/* Depoimentos */}
      <section id="testimonials" className="section-padding light-bg testimonials-section">
        <div className="testimonials-title-container">
          <h2 className="section-title">O que dizem sobre nós</h2>
        </div>
        
        <div className="testimonial-slider">
          {[
            {
              id: 1,
              quote: "Transformei minha vida com a ajuda da equipe IntegrandoSer. A abordagem humanizada fez toda diferença no meu processo de autoconhecimento.",
              name: "Mariana Santos",
              since: "Paciente desde 2021",
              role: "Designer",
              photo: "/assets/depoimentos/client1.png"
            },
            {
              id: 2,
              quote: "Encontrei no IntegrandoSer o apoio que precisava para lidar com minha ansiedade. Os terapeutas são extremamente qualificados e acolhedores.",
              name: "Carlos Eduardo",
              since: "Paciente desde 2022",
              role: "Engenheiro",
              photo: "/assets/depoimentos/client2.png"
            },
            {
              id: 3,
              quote: "A terapia me ajudou a entender padrões que se repetiam na minha vida. Hoje me relaciono muito melhor com minha família e no trabalho.",
              name: "Ana Beatriz",
              since: "Paciente desde 2020",
              role: "Professora",
              photo: "/assets/depoimentos/client4.png"
            },
            {
              id: 4,
              quote: "Recomendo o IntegrandoSer para todos que buscam um espaço seguro para desenvolvimento pessoal. Mudou minha perspectiva sobre muitas coisas.",
              name: "Roberto Almeida",
              since: "Paciente desde 2023",
              role: "Médico",
              photo: "/assets/depoimentos/client3.png"
            }
          ].map((testimonial) => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-content">
                <p>{testimonial.quote}</p>
              </div>
              <div className="testimonial-author">
                <img src={testimonial.photo} alt={testimonial.name} />
                <div className="testimonial-author-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.since}</p>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
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