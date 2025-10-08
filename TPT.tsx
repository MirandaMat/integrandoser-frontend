// /src/TPT.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Reveal from './components/Reveal';

// Ícones
import { FaWpforms } from "react-icons/fa";
import { FiUsers, FiHeart } from "react-icons/fi";
import { BsCheck2Circle } from "react-icons/bs";

const TPT = () => {
    // Estado para armazenar o conteúdo dinâmico
    const [content, setContent] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        
        const fetchTptContent = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/content/tpt');
                setContent(response.data || {});
            } catch (err) {
                console.error("Erro ao buscar conteúdo da página TPT:", err);
                setError("Não foi possível carregar o conteúdo da página.");
            } finally {
                setLoading(false);
            }
        };

        fetchTptContent();
    }, []);

    // Função para mapear nome do ícone para componente
    const getIcon = (iconName: string) => {
        switch(iconName) {
            case 'form': return <FaWpforms size={32} />;
            case 'users': return <FiUsers size={32} />;
            case 'heart': return <FiHeart size={32} />;
            default: return <BsCheck2Circle size={32} />;
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeContent: 'center' }}>Carregando...</div>;
    }
    if (error) {
        return <div style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', color: 'red' }}>{error}</div>;
    }

    return (
        <div className="tpt-page">
            <section className="tpt-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <Reveal><h1 className="hero-title">{content.hero_title || "Terapia Para Todos - TPT"}</h1></Reveal>
                    <Reveal delay={0.3}><p className="hero-subtitle">{content.hero_subtitle || "Apoio emocional acessível para todos..."}</p></Reveal>
                </div>
            </section>

            <section className="section-padding tpt-about-section">
                <div className="tpt-about-container">
                    <Reveal><h2 className="section-title">{content.about_title || "O que é o Projeto TPT?"}</h2></Reveal>
                    <div className="tpt-about-grid">
                        <div className="tpt-about-text">
                            <Reveal>
                                <h3>{content.about_mission_title || "Nossa Missão"}</h3>
                                {content.about_paragraphs?.map((p, index) => <p key={index}>{p}</p>)}
                            </Reveal>
                        </div>
                        <div className="tpt-about-image">
                            <Reveal><img src={content.about_image_url ? `http://localhost:3001/${content.about_image_url}` : "/tpt_acolhimento.png"} alt="Acolhimento Terapêutico" /></Reveal>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-padding light-bg tpt-how-it-works-section">
                <Reveal><h2 className="section-title">{content.how_it_works_title || "Como Funciona?"}</h2></Reveal>
                <div className="tpt-how-it-works-grid">
                    {content.how_it_works_steps?.map((step, index) => (
                        <Reveal key={index} delay={index * 0.2}>
                            <div className="feature-card">
                                <div className="feature-icon">{getIcon(step.icon)}</div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            <section className="section-padding tpt-offerings-section">
                <Reveal><h2 className="section-title">{content.offerings_title || "No IntegrandoSer você vai encontrar"}</h2></Reveal>
                <div className="offerings-grid">
                    <div className="offerings-column">
                        <Reveal><h3>{content.offerings_col1_title || "Acompanhamento Terapêutico"}</h3></Reveal>
                        <ul className="offerings-list">
                            {content.offerings_therapy_types?.map((item, index) => (
                                <Reveal key={index} delay={index * 0.05}>
                                    <li><BsCheck2Circle className="offering-icon" /><span>{item}</span></li>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                    <div className="offerings-column">
                        <Reveal><h3>{content.offerings_col2_title || "Você ainda contará com"}</h3></Reveal>
                        <ul className="offerings-list benefits-list">
                            {content.offerings_project_benefits?.map((item, index) => (
                                <Reveal key={index} delay={index * 0.1}>
                                    <li>
                                        <BsCheck2Circle className="offering-icon" />
                                        <div className="benefit-content"><strong>{item.title}:</strong><span>{item.description}</span></div>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="section-padding tpt-cta-section">
                <div className="tpt-cta-container">
                    <Reveal><h2 className="section-title" style={{ color: 'var(--white)' }}>{content.cta_title || "Faça Parte Dessa Missão"}</h2></Reveal>
                    <div className="tpt-cta-grid">
                        {content.cta_boxes?.map((box, index) => (
                            <Reveal key={index} delay={index * 0.2}>
                                <div className="tpt-cta-box">
                                    <h3>{box.title}</h3>
                                    <p>{box.description}</p>
                                    <Link to={box.buttonLink} className="btn btn-primary">{box.buttonText}</Link>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TPT;