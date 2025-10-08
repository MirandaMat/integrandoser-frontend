import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Importação de componentes internos
import ServicesCarousel from '../ServicesCarousel';
import Depoimento from '../Depoimento';
import Blog from '../Blog';
import Reveal from '../components/Reveal';
import LineReveal from '../components/LineReveal';

// Importação dos Ícones
import { FiUser, FiHome } from 'react-icons/fi';
import { LuHeartHandshake } from "react-icons/lu";

// --- Interfaces para a Tipagem do Conteúdo ---
interface Feature {
  title: string;
  description: string;
}

interface SiteContent {
  home?: {
    hero_title?: string;
    hero_whatsapp_link?: string;
    tpt_title?: string;
    tpt_text?: string;
    tpt_media_url?: string;
    tpt_media_type?: 'video' | 'image';
  };
  about?: {
    logo_url?: string;
    essence_text?: string;
    features?: Feature[];
  };
  founder?: {
    image_url?: string;
    paragraphs?: string[];
  };
}

function HomePage() {
  const [content, setContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/content/site');
        setContent(response.data || {});
      } catch (error) {
        console.error("Erro ao buscar conteúdo do site:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return <div>Carregando...</div>; // Ou um componente de loading
  }

  // Extrai os dados para facilitar o uso no JSX, com fallbacks para o conteúdo original
  const homeContent = content.home || {};
  const aboutContent = content.about || {};
  const founderContent = content.founder || {};

  // O vídeo hero principal continua sendo um ativo local, conforme o código original
  const heroVideoPath = '/assets/video_hero.mov';
  const defaultFeatures: Feature[] = [
    { title: 'Apoio Personalizado', description: 'Suporte terapêutico alinhado às necessidades e singularidades de cada indivíduo em sua jornada.' },
    { title: 'Encontro Ideal', description: 'Facilitamos a conexão entre pacientes e terapeutas, assegurando uma relação que promove o sucesso terapêutico.' },
    { title: 'Ambiente Acolhedor', description: 'Promovemos um ambiente acolhedor e acessível, onde a terapia se torna uma experiência transformadora e humanizada.' }
  ];

  return (
    <>
      {/* Hero Section (Já dinâmica) */}
      <section id="home" className="hero-section">
        <video 
            // Usa a URL do DB se existir, senão usa a local como fallback
            key={homeContent.hero_video_url} // key para forçar o recarregamento
            className="hero-video-bg" 
            autoPlay 
            loop 
            muted 
            playsInline
        >
          <source src={homeContent.hero_video_url ? `http://localhost:3001/${homeContent.hero_video_url}` : "/assets/video_hero.mov"} type="video/mp4" />
          Seu navegador não suporta o elemento de vídeo.
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">{homeContent.hero_title || 'Integrando sua vida ao equilíbrio de uma mente saudável'}</h1>
          <div className="hero-buttons">
            <a href={homeContent.hero_whatsapp_link || 'https://wa.me/555192883060'} className="btn btn-primary">Converse conosco</a>
            <Link to="/terapeutas" className="btn btn-outline">Profissionais Credenciados</Link>
          </div>
        </div>
        <div className="hero-scroll-indicator"></div>
      </section>
      
      {/* Seção Sobre (Agora dinâmica) */}
      <section id="about" className="section-padding about-wrapper">
        <Reveal> 
          <div className="about-title-container">
            <h2 className="about-section-title">Nossa Essência</h2>
          </div>
        </Reveal>
        <Reveal>
          <div className="about-essence-container">
            <div className="about-essence-logo">
                <img 
                  src={aboutContent.logo_url ? `http://localhost:3001/${aboutContent.logo_url}` : "/Logo.png"} 
                  alt="Símbolo Integrando Ser" 
                />
            </div>
            <div className="about-essence-text">
              <p>
                {aboutContent.essence_text || `O IntegrandoSer nasceu do sonho da Analista Junguiana Fernanda Oliveira, 
                que idealizou um espaço onde cada indivíduo pudesse encontrar o suporte 
                terapêutico mais alinhado às suas necessidades e singularidades.
                Inspirada por sua experiência clínica e pelo desejo de tornar a 
                terapia mais acessível e humanizada, Fernanda criou um projeto 
                inovador que conecta pacientes ao terapeuta ideal com base em um 
                perfil cuidadosamente analisado.
                Nosso compromisso é transformar vidas com acolhimento, escuta e integração entre mente, corpo e alma.`}
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
            {aboutContent.features?.map((feature, index) => (
              <Reveal key={index} delay={0.5 + index * 0.3}> 
                <div className="feature-block">
                  <div className="feature-circle">
                    <div className="feature-icon">
                      {index === 0 && <FiUser size={32} />}
                      {index === 1 && <LuHeartHandshake size={32} />}
                      {index === 2 && <FiHome size={32} />}
                    </div>
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal> 
          <h3 className="about-section-subtitle">Nossos parceiros</h3>
        </Reveal>
        <Reveal> 
          <div className="partners-container">
            <div className="partners-slider">
              {aboutContent.partner_logos?.map((logoUrl, index) => (
                <img key={index} src={`http://localhost:3001/${logoUrl}`} alt={`Logo Parceiro ${index + 1}`} className="partner-logo-item" />
              ))}
              {/* Duplicamos para o efeito de slider infinito, se houver logos */}
              {aboutContent.partner_logos?.map((logoUrl, index) => (
                <img key={`clone-${index}`} src={`http://localhost:3001/${logoUrl}`} alt={`Logo Parceiro ${index + 1}`} className="partner-logo-item" />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Serviços */}
      <section id="services">
        <ServicesCarousel />
      </section>

      {/* TPT - Terapia Para Todos (Já dinâmica) */}
      <section id="tpt" className="section-padding tpt-video-section">
        <div className="tpt-video-container">
            <div className="tpt-video-wrapper">
              <Reveal direction="left" delay={0.2}>
                {homeContent.tpt_media_url && (
                  homeContent.tpt_media_type === 'video' ? (
                    <video className="tpt-video" autoPlay loop muted playsInline>
                      <source src={`http://localhost:3001/${homeContent.tpt_media_url}`} type="video/mp4" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  ) : (
                    <img src={`http://localhost:3001/${homeContent.tpt_media_url}`} alt="Terapia para todos" className="tpt-video" />
                  )
                )}
              </Reveal>
            </div>
            <div className="tpt-content-wrapper">
                <Reveal direction="right" delay={0.3}>
                    <h2 className="section-title">{homeContent.tpt_title || 'Terapia Para Todos'}</h2>
                    <div className="tpt-text-box">
                        <p>{homeContent.tpt_text || 'O Terapia Para Todos - TPT é um projeto do IntegrandoSer criado para tornar a terapia acessível a todos, com planos completos e valores especiais...'}</p>
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

      {/* Seção Terapeuta (CTA estático) */}
      <section id="portfolio" className=" therapists-section">
        <div className="therapists-container">
            <div className="therapists-bg-image"></div>
            <div className="therapists-content">
                <Reveal delay={0.3}> <h2 className="section-therapists-title">Profissionais Credenciados</h2></Reveal>
                <div className="therapists-text-box">
                    <Reveal delay={0.4}> <p>Cada profissional de nossa equipe traz consigo uma história única, marcada pelo compromisso genuíno com o cuidado e o acolhimento...</p></Reveal>
                    <Reveal delay={0.5}> <Link to="/terapeutas" className="btn btn-primary" onClick={() => window.scrollTo(0, 0)} >Conheça Todos</Link></Reveal>
                </div>
            </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="blog-section">
        <Blog />
      </section>

      {/* Seção Fundadora (Agora dinâmica) */}
      <section id="founder" className="section-padding founder-section">
        <Reveal delay={0.2}> 
          <div className="founder-card">
              <div className="founder-image-container">
                  <img 
                    src={founderContent.image_url ? `http://localhost:3001/${founderContent.image_url}` : "/assets/terapeutas/fernanda_oliveira.jpeg"} 
                    alt="Fernanda Oliveira, fundadora do IntegrandoSer" 
                    className="founder-image" 
                  />
              </div>
              <div className="founder-text">
                  <h3>Fernanda Oliveira</h3>
                  {(founderContent.paragraphs && founderContent.paragraphs.length > 0) ? (
                    founderContent.paragraphs.map((p, index) => <p key={index}>{p}</p>)
                  ) : (
                    <>
                      <p>Sou Fernanda Oliveira, Analista Junguiana com especialização em Psicologia Analítica. Minha missão é cuidar do bem-estar emocional e psicológico de cada pessoa que cruza meu caminho terapêutico...</p>
                      <p>Foi com esse propósito que fundei o IntegrandoSer — um espaço que idealizei com muito carinho para acolher aqueles que buscam evolução emocional e espiritual...</p>
                    </>
                  )}
              </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

export default HomePage;