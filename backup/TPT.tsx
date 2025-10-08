import { useEffect } from 'react';
import Reveal from './components/Reveal'; // Usando o componente de animação existente

// Ícones
import { FaWpforms } from "react-icons/fa";
import { FiUsers, FiHeart } from "react-icons/fi";
import { BsCheck2Circle } from "react-icons/bs";

const TPT = () => {
    // Rola para o topo da página ao carregar
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const howItWorksSteps = [
        {
            icon: <FaWpforms size={32} />,
            title: "Passo 1: Inscrição",
            description: "Clique no botão 'Quero Iniciar' e preencha nosso formulário seguro."
        },
        {
            icon: <FiUsers size={32} />,
            title: "Passo 2: Conexão",
            description: "Nossa equipe fará contato via WhatsApp para agendar uma entrevista inicial."
        },
        {
            icon: <FiHeart size={32} />,
            title: "Passo 3: Acolhimento",
            description: "Após a entrevista, você será encaminhado para sua primeira consulta com o profissional."
        }
    ];

    const therapyTypes = [
        "Terapia para pessoas no espectro autista",
        "Terapia cognitivo comportamental",
        "Terapia para casal",
        "Terapia para criança e adolescente",
        "Terapia para idoso",
        "Terapia para depressão",
        "Terapia para transtorno de ansiedade",
        "Terapia para fobias ou medo",
        "Terapia para Burnout",
        "Terapia para borderline",
        "Terapia para transtorno obsessivo compulsivo",
        "Terapia para transtorno de personalidade",
        "Terapia para transtorno bipolar",
    ];

    const projectBenefits = [
        {
            title: "Consultas online",
            description: "Flexibilidade para você fazer suas sessões de onde quiser com conforto e segurança."
        },
        {
            title: "Ambiente acolhedor e seguro",
            description: "Espaço sem julgamento para você se expressar livremente e buscar soluções."
        },
        {
            title: "Apoio contínuo",
            description: "Acompanhamento para garantir que você evolua e encontre o seu equilíbrio."
        },
        {
            title: "Planos especiais",
            description: "Condições e valores que você só encontra aqui, pensados para democratizar o acesso."
        }
    ];

    return (
        <div className="tpt-page">
            {/* Seção Hero */}
            <section className="tpt-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <Reveal>
                        <h1 className="hero-title">Terapia Para Todos - TPT</h1>
                    </Reveal>
                    <Reveal delay={0.3}>
                        <p className="hero-subtitle">Apoio emocional acessível para todos, com terapia de qualidade para quem mais precisa</p>
                    </Reveal>
                </div>
            </section>

            {/* Seção Sobre o Projeto */}
            <section className="section-padding tpt-about-section">
                <div className="tpt-about-container">
                    <Reveal>
                        <h2 className="section-title">O que é o Projeto TPT?</h2>
                    </Reveal>
                    <div className="tpt-about-grid">
                        <div className="tpt-about-text">
                            <Reveal>
                                <h3>Nossa Missão</h3>
                                <p>
                                    O TPT (Terapia Para Todos) é um projeto do IntegrandoSer criado para 
                                    tornar a terapia acessível a todos, com planos completos e valores especiais, 
                                    pois acreditamos que o cuidado com a saúde mental deve ser um direito de todos,
                                     independentemente da posição social.
                                </p>
                                <p>
                                    A terapia é essencial para o fortalecimento emocional e para o desenvolvimento de 
                                    habilidades que ajudam a lidar com os desafios da vida. Nosso projeto conecta você 
                                    a terapeutas capacitados que compartilham dessa missão de levar acolhimento e suporte 
                                    a quem mais precisa.
                                </p>
                                <p>
                                    Se você está buscando apoio terapêutico para superar desafios emocionais ou melhorar o 
                                    seu bem-estar, estamos aqui para ajudar. O TPT oferece um espaço seguro, acolhedor e 
                                    acessível para que você possa cuidar de sua saúde mental de forma eficaz.
                                </p>
                            </Reveal>
                        </div>
                        <div className="tpt-about-image">
                            <Reveal>
                                <img src="/tpt_acolhimento.png" alt="Acolhimento Terapêutico" />
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção Como Funciona */}
            <section className="section-padding light-bg tpt-how-it-works-section">
                <Reveal>
                    <h2 className="section-title">Como Funciona?</h2>
                </Reveal>
                <div className="tpt-how-it-works-grid">
                    {howItWorksSteps.map((step, index) => (
                        <Reveal key={index} delay={index * 0.2}>
                            <div className="feature-card">
                                <div className="feature-icon">{step.icon}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Seção O Que Oferecemos */}
            <section className="section-padding tpt-offerings-section">
                <Reveal>
                    <h2 className="section-title">No IntegrandoSer você vai encontrar</h2>
                </Reveal>
                <div className="offerings-grid">
                    {/* Coluna 1: Acompanhamento Terapêutico */}
                    <div className="offerings-column">
                        <Reveal>
                            <h3>Acompanhamento Terapêutico</h3>
                        </Reveal>
                        <ul className="offerings-list">
                            {therapyTypes.map((item, index) => (
                                <Reveal key={index} delay={index * 0.05}>
                                    <li>
                                        <BsCheck2Circle className="offering-icon" />
                                        <span>{item}</span>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                    {/* Coluna 2: Benefícios do Projeto */}
                    <div className="offerings-column">
                        <Reveal>
                            <h3>Você ainda contará com</h3>
                        </Reveal>
                        <ul className="offerings-list benefits-list">
                            {projectBenefits.map((item, index) => (
                                <Reveal key={index} delay={index * 0.1}>
                                    <li>
                                        <BsCheck2Circle className="offering-icon" />
                                        <div className="benefit-content">
                                            <strong>{item.title}:</strong>
                                            <span>{item.description}</span>
                                        </div>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Seção de Chamada para Ação (CTA) */}
            <section className="section-padding tpt-cta-section">
                <div className="tpt-cta-container">
                    <Reveal>
                        <h2 className="section-title" style={{ color: 'var(--white)' }}>Faça Parte Dessa Missão</h2>
                    </Reveal>
                    <div className="tpt-cta-grid">
                        {/* Box para Pacientes */}
                        <Reveal delay={0.2}>
                            <div className="tpt-cta-box">
                                <h3>Para Você</h3>
                                <p>Dê o primeiro passo em direção ao seu bem-estar. Preencha o formulário e aguarde nosso contato para iniciar sua jornada terapêutica.</p>
                                <a 
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSeGUbgovz4BJag76rL1eTTOqB4RHNKE2H74x8LzBJfSIvY1eQ/viewform"
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-primary"
                                >
                                    Iniciar Minha Jornada
                                </a>
                            </div>
                        </Reveal>

                        {/* Box para Terapeutas */}
                        <Reveal delay={0.4}>
                            <div className="tpt-cta-box">
                                <h3>Para Profissionais</h3>
                                <p>É um profissional e deseja fazer a diferença? Junte-se à nossa rede de parceiros no projeto TPT e nos ajude a ampliar o acesso à saúde mental.</p>
                                <a 
                                    href="https://docs.google.com/forms/d/e/1FAIpQLSdq562ndV8BYeM_DpHhl-FlS--gqLBOezFMOYFVGfOC91VYvA/viewform"
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-primary"
                                >
                                    Credencie-se
                                </a>
                            </div>
                        </Reveal>

                        {/* Box para Empresas */}
                        <Reveal delay={0.4}>
                            <div className="tpt-cta-box">
                                <h3>Para Empresas</h3>
                                <p>
                                    Cuidar da saúde emocional dos seus colaboradores é responsabilidade social, reconhecida pela nova NR-1. Torne-se nossa parceira.
                                </p>
                                <a 
                                    href="https://docs.google.com/forms/d/1hPG58qoTFFIQyqk6ewGNm_0ckcocRevbcKAmkyOEjBA/preview"
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-primary"
                                >
                                   Seja Parceira
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TPT;