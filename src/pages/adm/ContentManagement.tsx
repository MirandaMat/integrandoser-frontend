// /src/pages/adm/ContentManagement.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import '../../styles/Admin.css';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiEyeOff, FiAward, FiBookOpen, FiHeart } from 'react-icons/fi';

// Importação dos Componentes
import UserProfileModal from './UserProfileModal';
import TptEditor from './TptEditor';
import HomePageEditor from './HomePageEditor';
import AboutSectionEditor from './AboutSectionEditor';
import FounderSectionEditor from './FounderSectionEditor';
import FooterEditor from './FooterEditor';
import ServiceEditorModal from './ServiceEditorModal'; 
import BasicContentModal from './BasicContentModal'; 
import ConfirmationModal from '../ConfirmationModal';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
// Interfaces
interface ContentItem { 
    id: number | string; 
    [key: string]: any; 
}

interface Professional extends ContentItem { 
    nome: string; 
    level: string; 
    imagem_url: string; 
    especialidade: string; 
    user_id: string | number; 
    visible_web: boolean; 
}

const ContentManagement = () => {
    // Estados
    const [activeTab, setActiveTab] = useState('services');
    const [data, setData] = useState({ blog: [], testimonials: [], services: [], professionals: [], tpt: null });
    const [siteContent, setSiteContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Estados para modais de edição
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
    
    // Estados para modais de visualização
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Estado unificado para confirmações e feedback
    const [feedbackModal, setFeedbackModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonType: 'primary' as 'primary' | 'danger',
        showCancelButton: true 
    });
    
    // Configuração da API
    const token = localStorage.getItem('token');
    const tabDisplayNames = { blog: 'Blog', testimonials: 'Depoimento', services: 'Serviço' };
    const apiContent = useMemo(() => axios.create({ baseURL: `${apiUrl}/api/content`, headers: { 'Authorization': `Bearer ${token}` }}), [token]);
    const apiUsers = useMemo(() => axios.create({ baseURL: `${apiUrl}/api/users`, headers: { 'Authorization': `Bearer ${token}` }}), [token]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [blogRes, testRes, servRes, profRes, tptRes, siteRes] = await Promise.all([
                apiContent.get('/blog'),
                apiContent.get('/testimonials'),
                apiContent.get('/services'),
                apiUsers.get('/role/professionals'),
                apiContent.get('/tpt'),
                apiContent.get('/site')
            ]);
            setData({ blog: blogRes.data, testimonials: testRes.data, services: servRes.data, professionals: profRes.data, tpt: tptRes.data });
            setSiteContent(siteRes.data);
            setError('');
        } catch (err) {
            setError('Falha ao carregar conteúdos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiContent, apiUsers]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Handlers para modais de edição
    const handleOpenModal = (item: ContentItem | null = null) => { setIsModalOpen(true); setEditingItem(item); };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingItem(null); };
    const handleOpenProfileModal = async (professional: Professional) => {
        setIsProfileModalOpen(true);
        try {
            const response = await apiUsers.get(`/${professional.user_id}`);
            setSelectedUser(response.data);
        } catch (error) { console.error("Erro ao buscar detalhes do profissional:", error); setIsProfileModalOpen(false); }
    };

    // Funções para o modal de feedback e confirmação
    const showFeedback = (title: string, message: string, type: 'success' | 'error' = 'success') => {
        setFeedbackModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => setFeedbackModal({ ...feedbackModal, isOpen: false }),
            confirmButtonType: type === 'error' ? 'danger' : 'primary',
            showCancelButton: false
        });
    };
    const closeFeedbackModal = () => setFeedbackModal({ ...feedbackModal, isOpen: false });

    // Função de Salvar genérica (para Blog/Depoimentos) que usa o modal de feedback
    const handleSave = async (formData: FormData, id?: number | string) => {
        const isEdit = !!id;
        const url = isEdit ? `/${activeTab}/${id}` : `/${activeTab}`;
        const method = isEdit ? 'put' : 'post';
        try {
            await apiContent[method](url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchData();
            handleCloseModal();
            showFeedback('Sucesso!', 'O conteúdo foi salvo com sucesso.');
        } catch (err) {
            console.error(err);
            showFeedback('Erro ao Salvar', 'Não foi possível salvar o conteúdo. Tente novamente.', 'error');
        }
    };

    // Funções que abrem o modal de confirmação
    const handleDelete = (id: number | string, type: string) => {
        const performDelete = async () => {
            try {
                const api = type === 'professionals' ? apiUsers : apiContent;
                const url = type === 'professionals' ? `/${id}` : `/${type}/${id}`;
                await api.delete(url);
                fetchData();
                closeFeedbackModal();
                showFeedback('Sucesso!', 'O item foi excluído permanentemente.');
            } catch (err) { 
                closeFeedbackModal();
                showFeedback('Erro ao Excluir', 'Não foi possível excluir o item.', 'error');
            }
        };

        setFeedbackModal({
            isOpen: true,
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja apagar este item permanentemente? Esta ação não pode ser desfeita.',
            onConfirm: performDelete,
            confirmButtonType: 'danger',
            showCancelButton: true
        });
    };

    const handleToggleVisibility = (professionalId: string | number, currentStatus: boolean) => {
        const performToggle = async () => {
            try {
                await apiUsers.patch(`/professionals/${professionalId}/visibility`, { visible: !currentStatus });
                fetchData();
                closeFeedbackModal();
                showFeedback('Sucesso!', 'A visibilidade do profissional foi alterada.');
            } catch (err) { 
                closeFeedbackModal();
                showFeedback('Erro', 'Não foi possível alterar a visibilidade.', 'error');
            }
        };

        setFeedbackModal({
            isOpen: true,
            title: 'Confirmar Alteração',
            message: `Tem certeza que deseja tornar este profissional ${currentStatus ? 'privado' : 'público'}?`,
            onConfirm: performToggle,
            confirmButtonType: 'primary',
            showCancelButton: true
        });
    };

    // Callbacks para passar aos editores de página única
    const onSaveSuccess = (message: string) => {
        fetchData();
        showFeedback('Sucesso!', message);
    };
    const onSaveError = (message: string) => {
        showFeedback('Erro ao Salvar', message, 'error');
    };

    const renderCurrentTab = () => {
        if (loading) return <p>Carregando...</p>;
        if (error) return <p className="error-message">{error}</p>;

        const editorProps = { onSaveSuccess, onSaveError };

        if (activeTab === 'home') return siteContent ? <HomePageEditor initialData={siteContent.home || {}} {...editorProps} /> : <p>Conteúdo não encontrado.</p>;
        if (activeTab === 'sobre') return siteContent ? <AboutSectionEditor initialData={siteContent.about || {}} {...editorProps} /> : <p>Conteúdo não encontrado.</p>;
        if (activeTab === 'fundadora') return siteContent ? <FounderSectionEditor initialData={siteContent.founder || {}} {...editorProps} /> : <p>Conteúdo não encontrado.</p>;
        if (activeTab === 'rodape') return siteContent ? <FooterEditor initialData={siteContent.footer || {}} {...editorProps} /> : <p>Conteúdo não encontrado.</p>;
        if (activeTab === 'tpt') return data.tpt ? <TptEditor initialData={data.tpt} {...editorProps} /> : <p>Conteúdo não encontrado.</p>;
        
        const items = data[activeTab] || [];
        if (items.length === 0) return <p>Nenhum item encontrado nesta seção.</p>;
        
        return (
            <div className="content-grid">
                {items.map((item: ContentItem) => (
                    <div key={item.id} className="content-card">
                        <img src={`${apiUrl}/${item.imagem_url || item.image_url || item.photo_url || 'assets/default-placeholder.png'}`} alt={item.title || item.name || item.nome} className="card-image" onError={(e) => { e.currentTarget.src = '/assets/default-placeholder.png'; }} />
                        <div className="card-body">
                           <h4>{item.title || item.name || item.nome}</h4>
                           {activeTab === 'blog' && ( <div className="professional-details"><span>Categoria: {item.category}</span><span style={{color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px'}}><FiHeart /> {item.likes || 0}</span></div> )}
                           {activeTab === 'testimonials' && <p>"{item.quote?.substring(0, 80)}..."</p>}
                           {activeTab === 'services' && <p>{item.description?.substring(0, 100)}...</p>}
                           {activeTab === 'professionals' && ( <div className="professional-details"><span><FiAward /> Level: {(item as Professional).level || 'N/D'}</span><span><FiBookOpen /> {(item as Professional).especialidade}</span></div> )}
                        </div>
                        <div className="card-actions">
                            {activeTab === 'professionals' ? (
                                <>
                                    <button title="Ver Perfil" className="action-btn" onClick={() => handleOpenProfileModal(item as Professional)}><FiEye /></button>
                                    <button title={item.visible_web ? "Tornar Privado" : "Tornar Público"} className={`action-btn ${item.visible_web ? 'public' : 'private'}`} onClick={() => handleToggleVisibility(item.id, item.visible_web)}>{item.visible_web ? <FiEye /> : <FiEyeOff />}<span style={{marginLeft: '8px'}}>{item.visible_web ? 'Público' : 'Privado'}</span></button>
                                </>
                            ) : (
                                <>
                                    <button title="Editar" className="action-btn" onClick={() => handleOpenModal(item)}><FiEdit /></button>
                                    <button title="Excluir" className="action-btn delete" onClick={() => handleDelete(item.id, activeTab)}><FiTrash2 /></button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {activeTab === 'services' && ( <ServiceEditorModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} /> )}
            {(activeTab === 'blog' || activeTab === 'testimonials') && ( <BasicContentModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} item={editingItem} type={activeTab} /> )}
            
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={selectedUser} />

            <ConfirmationModal 
                isOpen={feedbackModal.isOpen}
                onClose={closeFeedbackModal}
                onConfirm={feedbackModal.onConfirm}
                title={feedbackModal.title}
                message={feedbackModal.message}
                confirmButtonType={feedbackModal.confirmButtonType}
            />

            <div className="management-section">
                <div className="management-header">
                    <h2>Gerenciamento de Conteúdo</h2>
                    {!['professionals', 'tpt', 'home', 'sobre', 'fundadora', 'rodape'].includes(activeTab) && ( 
                        <button className="btn-new-user" onClick={() => handleOpenModal()}>
                            <FiPlus /> Novo {tabDisplayNames[activeTab] || activeTab}
                        </button>
                    )}
                </div>
                <div className="filter-buttons" style={{ marginBottom: '24px' }}>
                    <button onClick={() => setActiveTab('blog')} className={`filter-btn ${activeTab === 'blog' ? 'active' : ''}`}>Blog</button>
                    <button onClick={() => setActiveTab('testimonials')} className={`filter-btn ${activeTab === 'testimonials' ? 'active' : ''}`}>Depoimentos</button>
                    <button onClick={() => setActiveTab('services')} className={`filter-btn ${activeTab === 'services' ? 'active' : ''}`}>Serviços</button>
                    <button onClick={() => setActiveTab('professionals')} className={`filter-btn ${activeTab === 'professionals' ? 'active' : ''}`}>Profissionais</button>
                    <button onClick={() => setActiveTab('home')} className={`filter-btn ${activeTab === 'home' ? 'active' : ''}`}>Página Home</button>
                    <button onClick={() => setActiveTab('sobre')} className={`filter-btn ${activeTab === 'sobre' ? 'active' : ''}`}>Seção Sobre</button>
                    <button onClick={() => setActiveTab('fundadora')} className={`filter-btn ${activeTab === 'fundadora' ? 'active' : ''}`}>Seção Fundadora</button>
                    <button onClick={() => setActiveTab('tpt')} className={`filter-btn ${activeTab === 'tpt' ? 'active' : ''}`}>Página TPT</button>
                    <button onClick={() => setActiveTab('rodape')} className={`filter-btn ${activeTab === 'rodape' ? 'active' : ''}`}>Rodapé</button>
                </div>
                {renderCurrentTab()}
            </div>
        </>
    );
};

export default ContentManagement;