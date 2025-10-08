// src/pages/adm/HomePageEditor.tsx

import React, { useState } from 'react';
import axios from 'axios';
import { FiSave, FiUpload } from 'react-icons/fi';

const HomePageEditor = ({ initialData, onSaveSuccess, onSaveError}) => {
    const [formData, setFormData] = useState(initialData || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [heroMediaPreview, setHeroMediaPreview] = useState(null);
    const [tptMediaPreview, setTptMediaPreview] = useState(null);
    const [filesToUpload, setFilesToUpload] = useState({
        hero_video: null,
        tpt_media: null,
    });

    // ================================================================
    // ## FUNÇÃO CORRIGIDA ##
    // ================================================================
    // A função foi simplificada para atualizar o estado 'formData' diretamente.
    const handleInputChange = (e, field) => {
        const { value } = e.target;
        setFormData(prev => ({
            ...prev,
            [field]: value 
        }));
    };
    
    const handleFileChange = (e, fieldName) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFilesToUpload(prev => ({ ...prev, [fieldName]: file }));
            
            if (fieldName === 'hero_video') {
                setHeroMediaPreview(URL.createObjectURL(file));
            } else if (fieldName === 'tpt_media') {
                setTptMediaPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const dataToSave = new FormData();
            
            if (filesToUpload.hero_video) {
                dataToSave.append('hero_video', filesToUpload.hero_video);
            }
            if (filesToUpload.tpt_media) {
                dataToSave.append('tpt_media', filesToUpload.tpt_media);
            }
            
            const homeJsonString = JSON.stringify(formData);
            dataToSave.append('home', homeJsonString);
            

            await axios.put('http://localhost:3001/api/content/site', dataToSave, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            onSaveSuccess('Seção Home salva com sucesso!');
        } catch (err) {
            setError('Falha ao salvar. Verifique o console para mais detalhes.');
            onSaveError('Erro ao salvar a seção Home.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="tpt-editor-form admin-form">
            <h3>Editando a Página "Home"</h3>
            
            <fieldset>
                <legend>Seção Principal (Hero)</legend>
                <div className="form-group">
                    <label>Título Principal (Hero Title)</label>
                    <textarea 
                        value={formData.hero_title || ''} 
                        // ## CHAMADA ATUALIZADA ## (removido o parâmetro 'home')
                        onChange={e => handleInputChange(e, 'hero_title')} 
                        rows={2}
                        placeholder="Ex: Integrando sua vida ao equilíbrio de uma mente saudável"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label>Vídeo/Imagem de Fundo</label>
                    <div className="image-preview-container">
                        <video 
                            key={heroMediaPreview || formData.hero_video_url}
                            src={heroMediaPreview || (formData.hero_video_url ? `http://localhost:3001/${formData.hero_video_url}`: '/assets/default-placeholder.png')} 
                            className="image-preview" controls autoPlay loop muted
                        />
                         <label htmlFor="hero_video_input" className="image-upload-label"><FiUpload/> Trocar Mídia</label>
                         <input id="hero_video_input" type="file" onChange={e => handleFileChange(e, 'hero_video')} accept="video/*,image/*" style={{display: 'none'}}/>
                    </div>
                </div>
                <div className="form-group">
                    <label>Link do Botão "Converse Conosco" (WhatsApp)</label>
                    <input 
                        type="text" 
                        value={formData.hero_whatsapp_link || ''} 
                        // ## CHAMADA ATUALIZADA ##
                        onChange={e => handleInputChange(e, 'hero_whatsapp_link')} 
                        placeholder="Ex: https://wa.me/5551912345678"
                    />
                </div>
            </fieldset>

            <fieldset>
                <legend>Seção "Terapia Para Todos"</legend>
                <div className="form-group">
                    <label>Título da Seção</label>
                    <input
                        type="text"
                        value={formData.tpt_title || ''}
                        // ## CHAMADA ATUALIZADA ##
                        onChange={e => handleInputChange(e, 'tpt_title')}
                        placeholder="Ex: Terapia Para Todos"
                    />
                </div>
                <div className="form-group">
                    <label>Mídia da Seção (Vídeo ou Imagem)</label>
                     <div className="image-preview-container">
                        {(tptMediaPreview || formData.tpt_media_url) && (
                            formData.tpt_media_type === 'video' || (filesToUpload.tpt_media?.type.startsWith('video')) ? (
                                <video 
                                    key={tptMediaPreview || formData.tpt_media_url}
                                    src={tptMediaPreview || `http://localhost:3001/${formData.tpt_media_url}`} 
                                    className="image-preview" controls autoPlay loop muted
                                />
                            ) : (
                                <img 
                                    src={tptMediaPreview || `http://localhost:3001/${formData.tpt_media_url}`} 
                                    alt="Preview TPT" 
                                    className="image-preview"
                                />
                            )
                        )}
                        <label htmlFor="tpt_media_input" className="image-upload-label"><FiUpload/> Trocar Mídia</label>
                        <input id="tpt_media_input" type="file" onChange={e => handleFileChange(e, 'tpt_media')} accept="video/*,image/*" style={{display: 'none'}}/>
                    </div>
                </div>
                <div className="form-group">
                    <label>Texto da Seção</label>
                    <textarea 
                        value={formData.tpt_text || ''} 
                        // ## CHAMADA ATUALIZADA ##
                        onChange={e => handleInputChange(e, 'tpt_text')} 
                        rows={4}
                    ></textarea>
                </div>
            </fieldset>

            <div className="form-actions">
                <button onClick={handleSave} disabled={saving} className="btn-new-user">
                    <FiSave/> {saving ? 'Salvando...' : 'Salvar Alterações na Home'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default HomePageEditor;