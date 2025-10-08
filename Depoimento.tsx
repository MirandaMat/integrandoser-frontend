// Depoimento.tsx

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from 'axios'; // 1. Importar o axios

const Depoimentos = () => {
    // 2. Remover o array estático e criar estados para os dados, loading e erro
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const headerRef = useRef(null);
    const containerRef = useRef(null);
    const isInView = useInView(containerRef, { amount: 0.3 });

    // 3. Efeito para buscar os dados da API
    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/content/testimonials');
                setTestimonials(response.data);
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar os depoimentos.');
                console.error("Erro ao buscar depoimentos:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTestimonials();
    }, []); // O array vazio [] garante que a busca ocorra apenas uma vez

    const goToNext = () => {
        if (testimonials.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    };

    const goToPrev = () => {
        if (testimonials.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    };

    // Efeito para avançar automaticamente
    useEffect(() => {
        if (!isInView || testimonials.length === 0) return;
        const timer = setTimeout(goToNext, 15000);
        return () => clearTimeout(timer);
    }, [currentIndex, testimonials.length, isInView]);

    // Efeito para rolar o avatar ativo no mobile
    useEffect(() => {
        if (!isInView || !headerRef.current || testimonials.length === 0) return;
        const activeAvatar = headerRef.current.querySelector(`[data-avatar-id='${testimonials[currentIndex].id}']`);
        if (activeAvatar) {
            activeAvatar.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [currentIndex, isInView, testimonials]);

    // 4. Renderização condicional para os estados de carregamento e erro
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '60px' }}>Carregando depoimentos...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '60px', color: 'red' }}>{error}</div>;
    }
    
    if (testimonials.length === 0) {
        return <div style={{ textAlign: 'center', padding: '60px' }}>Nenhum depoimento encontrado.</div>;
    }


    return (
        <div className="stories-testimonial-container" ref={containerRef}>
            <div ref={headerRef} className="stories-header">
                <button className="story-nav-arrow left" onClick={goToPrev} aria-label="Depoimento Anterior">&lt;</button>
                <button className="story-nav-arrow right" onClick={goToNext} aria-label="Próximo Depoimento">&gt;</button>
                
                {/* 5. Mapeia sobre o estado 'testimonials' */}
                {testimonials.map((testimonial, index) => (
                    <button 
                        key={testimonial.id}
                        className={`story-avatar-wrapper ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        data-avatar-id={testimonial.id}
                    >
                        <svg className="story-avatar-progress-ring" viewBox="0 0 100 100">
                            <circle className="story-avatar-bg" cx="50" cy="50" r="45"></circle>
                            {index === currentIndex && (
                                <motion.circle
                                    className="story-avatar-progress"
                                    cx="50" cy="50" r="45"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{ strokeDashoffset: 0 }}
                                    transition={{ duration: 15, ease: "linear" }}
                                    onAnimationComplete={goToNext}
                                />
                            )}
                        </svg>
                        {/* 6. Corrige o caminho da imagem para buscar do servidor */}
                        <img 
                           src={`http://localhost:3001/${testimonial.photo_url}`} 
                           alt={testimonial.name} 
                           className="story-avatar-image" 
                           onError={(e) => { e.currentTarget.src = '/assets/depoimentos/unknow3.png'; }} // Fallback
                        />
                    </button>
                ))}
            </div>

            <div className="story-content-wrapper">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        className="story-content"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                    >
                        <div className="story-author">
                            <h4 className="story-author-name">{testimonials[currentIndex].name}</h4>
                            <p className="story-author-role">{testimonials[currentIndex].role}</p>
                        </div>
                        <p className="story-quote">"{testimonials[currentIndex].quote}"</p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Depoimentos;