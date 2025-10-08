import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from "framer-motion";
import { IoClose, IoHeart, IoHeartOutline } from "react-icons/io5";
import axios from 'axios'; // 1. Importar o axios



const BlogPosters = () => {
    // 2. Estados para armazenar os posts, o post selecionado, e o estado de carregamento/erro
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // O estado de 'likes' agora pode vir diretamente dos dados da API, mas manteremos um estado local para feedback imediato
    const [likedPosts, setLikedPosts] = useState({}); 

    const location = useLocation();

    // 3. Efeito para buscar os dados da API quando o componente montar
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/content/blog');
                setPosts(response.data);
                setError(null);
            } catch (err) {
                setError('Não foi possível carregar os artigos do blog.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
        window.scrollTo(0, 0);
    }, []);

    // Efeito para abrir o modal se um ID foi passado pela navegação
    useEffect(() => {
        if (posts.length > 0) {
            const postIdToOpen = location.state?.openPostId;
            if (postIdToOpen) {
                const postToOpen = posts.find(p => p.id === postIdToOpen);
                if (postToOpen) {
                    openModal(postToOpen);
                }
            }
        }
    }, [location.state, posts]);

    const openModal = (post) => {
        setSelectedPost(post);
        setIsModalOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPost(null);
        document.body.style.overflow = 'auto';
    };

    const handleLikeClick = async (postId) => {
        // Atualiza a UI imediatamente para uma melhor experiência (atualização otimista)
        const isCurrentlyLiked = !!likedPosts[postId];
        setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(currentPosts => currentPosts.map(p => 
            p.id === postId ? { ...p, likes: p.likes + (isCurrentlyLiked ? -1 : 1) } : p
        ));

        try {
            // A API só incrementa, então só chamamos se não estiver curtido ainda.
            // Para um sistema completo de "descurtir", a API precisaria ser ajustada.
            if (!isCurrentlyLiked) {
                await axios.post(`http://localhost:3001/api/content/blog/${postId}/like`);
            }
        } catch (err) {
            // Reverte a UI em caso de erro
            console.error("Falha ao curtir o post:", err);
            setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
             setPosts(currentPosts => currentPosts.map(p => 
                p.id === postId ? { ...p, likes: p.likes - (isCurrentlyLiked ? 0 : 1) } : p
            ));
            alert('Erro ao registrar sua curtida.');
        }
    };

    // 5. Renderização condicional para carregamento e erro
    if (loading) return <p style={{ textAlign: 'center', padding: '80px' }}>Carregando artigos...</p>;
    if (error) return <p style={{ textAlign: 'center', padding: '80px', color: 'red' }}>{error}</p>;


    return (
        <div className="app-container">
            {/* Modal de Artigo */}
            {isModalOpen && selectedPost && (
                <div className="blog-post-modal-overlay" onClick={closeModal}>
                    <div className="blog-post-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={closeModal}><IoClose size={28} /></button>
                        <div className="modal-post-image">
                           {/* Usa image_url que vem da API */}
                           <img src={`http://localhost:3001/${selectedPost.image_url}`} alt={selectedPost.title} />
                        </div>
                        <div className="modal-post-content">
                           <div className="modal-post-header">
                                <div className="modal-post-header-main">
                                    <h2 className="modal-post-title">{selectedPost.title}</h2>
                                    <div className="modal-post-meta">
                                        <span>{selectedPost.category}</span> | <span>{new Date(selectedPost.post_date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <button
                                    className={`modal-like-btn ${likedPosts[selectedPost.id] ? 'liked' : ''}`}
                                    onClick={() => handleLikeClick(selectedPost.id)}
                                    aria-label="Curtir post"
                                >
                                    {likedPosts[selectedPost.id] ? <IoHeart size={32} /> : <IoHeartOutline size={32} />}
                                    <span style={{marginLeft: '8px'}}>{selectedPost.likes || 0}</span>
                                </button>
                           </div>
                           
                           {/* 6. Renderiza os parágrafos dinamicamente */}
                           <div className="modal-post-body">
                               {selectedPost.paragraphs?.map((paragraph, index) => (
                                   <p key={index}>{paragraph}</p>
                               ))}
                           </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Seção Hero e Grid de Posts */}
            <section className="hero-section terap-hero">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Nosso Blog</h1>
                    <p className="hero-subtitle">Explore nossos artigos e encontre insights para sua jornada de autoconhecimento e bem-estar.</p>
                </div>
            </section>
            
            <section className="section-padding">
                 <div className="blog-grid">
                    {posts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            className="blog-card"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ 
                                duration: 0.5,
                                delay: 0.1 + (index * 0.1)
                            }}
                            whileHover={{ y: -10 }}
                        >
                            <div className="blog-card-image">
                                <img src={`http://localhost:3001/${post.image_url}`} alt={post.title} />
                                <span className="blog-card-date">{new Date(post.post_date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="blog-card-content">
                                <span className="blog-card-category">{post.category}</span>
                                <h3 className="blog-card-title">{post.title}</h3>
                                <p className="blog-card-excerpt">{post.excerpt}</p>
                                <button onClick={() => openModal(post)} className="blog-card-modal-link">
                                    Ler artigo
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default BlogPosters;