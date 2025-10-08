// src/components/ServicesCarousel.tsx

import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from 'react-router-dom';
import axios from 'axios';

// ===================================================================
// 1. Componente do Card Individual (NOVO)
// ===================================================================
// Extraímos a lógica do card para seu próprio componente.
// Agora, o Hook useTransform é chamado no nível mais alto deste componente, o que é correto.
const ServiceCard = ({ service, index, totalServices, scrollYProgress }) => {
    // A lógica da animação agora vive aqui, de forma segura
    const scale = useTransform(scrollYProgress, (pos) => {
        const distance = pos * (totalServices - 1) - index;
        return 1 - Math.max(0, distance) * 0.05;
    });

    return (
        <motion.div
            key={service.id}
            className='service-card'
            style={{
                scale,
                top: `calc(120px + ${index * 40}px)`
            }}
        >
            <div className="service-image">
                <img 
                    src={`http://localhost:3001/${service.image_url}`} 
                    alt={service.title} 
                    onError={(e) => { e.currentTarget.src = '/assets/default-placeholder.png'; }}
                />
            </div>
            <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link to={`/service/${service.slug}`} className="btn-service btn-service-primary">
                    Saiba mais
                </Link>
            </div>
        </motion.div>
    );
};


// ===================================================================
// 2. Componente Principal do Carrossel (ATUALIZADO)
// ===================================================================
const ServicesCarousel = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end']
    });

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/content/services');
                setServices(response.data);
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar os serviços.');
                console.error("Erro ao buscar serviços:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Carregando serviços...</div>;
    if (error) return <div style={{ textAlign: 'center', padding: '100px 0', color: 'red' }}>{error}</div>;

    return (
        <div className="services-scroll-section">
            <div className="services-header">
                <h2>O que você procura</h2>
                <div className="services-underline"></div>
            </div>

            <div ref={containerRef} className="services-container">
                {/* Agora, o .map apenas renderiza o novo componente ServiceCard */}
                {services.map((service, index) => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        index={index}
                        totalServices={services.length}
                        scrollYProgress={scrollYProgress}
                    />
                ))}
            </div>
            <div className="blog-decoration blog-decoration-2"></div>
            <div className="blog-decoration blog-decoration-1"></div>
        </div>
    );
};

export default ServicesCarousel;