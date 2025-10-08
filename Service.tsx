import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiChevronDown, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';

const FaqItem = ({ faq, isOpen, onClick }) => (
    <div className="service-page-faq-item">
        <button className="service-page-faq-question" onClick={onClick}>
            <span>{faq.question}</span>
            <FiChevronDown className={`faq-icon ${isOpen ? 'open' : ''}`} />
        </button>
        {isOpen && <div className="service-page-faq-answer"><p>{faq.answer}</p></div>}
    </div>
);

const Service = () => {
    const { serviceSlug } = useParams();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    useEffect(() => {
        const fetchServiceData = async () => {
            setLoading(true);
            try {
                // ANTES: Buscava tudo e filtrava no frontend
                // const response = await axios.get('http://localhost:3001/api/content/services');
                // const currentService = response.data.find(s => s.slug && s.slug.trim() === serviceSlug);

                // DEPOIS: Busca diretamente o serviço necessário usando o novo endpoint
                const response = await axios.get(`http://localhost:3001/api/content/services/${serviceSlug}`);
                const currentService = response.data; // A API já retorna o objeto correto
                
                setService(currentService);
                setError(null);
            } catch (err) {
                // O erro 404 do backend será capturado aqui
                if (err.response && err.response.status === 404) {
                    setError('Serviço não encontrado.');
                } else {
                    setError('Erro ao carregar dados do serviço.');
                }
                console.error("Erro ao buscar serviço:", err);
            } finally {
                setLoading(false);
            }
        };

        if (serviceSlug) {
            fetchServiceData();
        }
        window.scrollTo(0, 0);
    }, [serviceSlug]);

    const handleFaqClick = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    if (loading) {
        return <div style={{ minHeight: '60vh', display: 'grid', placeContent: 'center' }}>Carregando serviço...</div>;
    }

    if (error) {
        return <div style={{ minHeight: '60vh', display: 'grid', placeContent: 'center', color: 'red' }}>{error}</div>;
    }

    if (!service || !service.details) {
        return (
            <div className="service-page-container section-padding">
                <div className="service-not-found">
                    <h2>Serviço não encontrado</h2>
                    <p>O conteúdo para este serviço não está disponível ou o link está incorreto.</p>
                    <Link to="/" className="btn btn-primary">Voltar para a Home</Link>
                </div>
            </div>
        );
    }
    
    const { pageTitle, quote, introduction, sections, howItWorks, faq, cta } = service.details;

    return (
        <main className="service-page-container">
            <section className="service-hero" style={{ backgroundImage: `url(http://localhost:3001/${service.image_url})` }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">{pageTitle}</h1>
                    <p className="hero-subtitle">"{quote}"</p>
                </div>
            </section>
            
            <section className="service-page-section light-bg">
                <div className="service-page-content-wrapper">
                    <p className="service-page-introduction">{introduction}</p>
                </div>
            </section>
            
            {sections?.length > 0 && (
                 <section className="service-page-cta">
                    <div className="service-page-content-wrapper">
                        {sections.map((section, index) => (
                            <div key={index} className="service-page-layout-block">
                                <h2 className='service-page-cta-title'>{section.title}</h2>
                                {section.intro && <p className="service-page-section-intro">{section.intro}</p>}
                                <div className="service-page-details-grid">
                                    {section.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="service-page-detail-card">
                                            <h4>{item.name}</h4>
                                            {item.description && <p>{item.description}</p>}
                                        </div>
                                    ))}
                                </div>
                                {section.outro && <p className="service-page-section-outro">{section.outro}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {howItWorks && (
                 <section className="service-page-section light-bg">
                    <div className="service-page-content-wrapper">
                         <h2 className='service-page-title centered'>{howItWorks.title}</h2>
                         <div className="service-page-steps-container">
                            {howItWorks.steps.map((step, index) => (
                                <div key={index} className="service-page-step">
                                    <div className="service-page-step-number">{index + 1}</div>
                                    <p>{step}</p>
                                </div>
                            ))}
                         </div>
                         {howItWorks.closingText && <p className="service-page-section-closetext">{howItWorks.closingText}</p>}
                    </div>
                </section>
            )}

            {cta && (
                 <section className="service-page-cta">
                    <div className="service-page-cta-content">
                        <h3 className="service-page-cta-title">{cta.text}</h3>
                        <Link to="/triagem" className="service-page-cta-btn">
                            {cta.buttonText} <FiArrowRight />
                        </Link>
                    </div>
                </section>
            )}

            {faq?.length > 0 && (
                <section className="service-page-section light-bg">
                    <div className="service-page-content-wrapper">
                        <h2 className='service-page-title centered'>Perguntas Frequentes</h2>
                        <div className="service-page-faq-container">
                            {faq.map((item, index) => (
                               <FaqItem key={index} faq={item} isOpen={openFaqIndex === index} onClick={() => handleFaqClick(index)} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

export default Service;