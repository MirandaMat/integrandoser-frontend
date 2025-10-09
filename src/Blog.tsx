// Blog.tsx

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react'; // 1. Importar hooks
import axios from 'axios'; // 2. Importar axios

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';


const Blog = () => {
    // 3. Estados para os posts, carregamento e erro
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();

    // 4. Efeito para buscar os dados da API
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/content/blog`);
                // Pega apenas os 3 primeiros posts, já que a API os retorna em ordem decrescente de data
                setPosts(response.data.slice(0, 3)); 
            } catch (err) {
                console.error("Erro ao buscar posts para a home:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const handleReadArticle = (postId) => {
        navigate('/blogposters', { state: { openPostId: postId } });
    };

    if (loading) {
        // Pode adicionar um skeleton/loading state aqui se desejar
        return <div>Carregando notícias...</div>;
    }

    return (
        <div className="blog-container">
            <div className="blog-header">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="section-title">Nosso Blog</h2>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <p className="hero-subtitle">Artigos e insights sobre saúde mental e bem-estar</p>
                </motion.div>
            </div>
            
            <div className="blog-grid">
                {posts.map((post, index) => (
                    <motion.div
                        key={post.id}
                        className="blog-card"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                            duration: 0.8,
                            delay: 0.2 + (index * 0.1)
                        }}
                        whileHover={{ y: -10 }}
                    >
                        <div className="blog-card-image">
                            <img src={`${apiUrl}/${post.image_url}`} alt={post.title} />
                            <span className="blog-card-date">{new Date(post.post_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="blog-card-content">
                            <span className="blog-card-category">{post.category}</span>
                            <h3 className="blog-card-title">{post.title}</h3>
                            <p className="blog-card-excerpt">{post.excerpt}</p>
                            
                            <button onClick={() => handleReadArticle(post.id)} className="app-btn app-btn-primary" style={{marginTop: 'auto', paddingTop: '10px', paddingBottom: '10px'}}>
                                Ler artigo
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <motion.div
                className="blog-cta"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
            >
                {/* O botão para ver todos os artigos continua com a mesma funcionalidade */}
                <button onClick={() => { navigate('/blogposters'); window.scrollTo(0, 0); }} className="app-btn app-btn-primary">
                    Ver Todos os Artigos
                </button>
            </motion.div>
            
            {/* Elementos decorativos */}
            <div className="blog-decoration blog-decoration-1"></div>
            <div className="blog-decoration blog-decoration-2"></div>
        </div>
    );
};

export default Blog;