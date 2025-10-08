// /src/pages/adm/AboutSectionEditor.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSave, FiUpload, FiPlus, FiX } from 'react-icons/fi';

const AboutSectionEditor = ({ initialData, onSaveSuccess, onSaveError }) => {
    const [formData, setFormData] = useState({ features: [], partner_logos: [] });
    const [filesToUpload, setFilesToUpload] = useState({ about_logo: null, partner_logos: [] });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    
    // Estados para os previews das imagens
    const [logoPreview, setLogoPreview] = useState(null);
    const [partnerPreviews, setPartnerPreviews] = useState([]);

    useEffect(() => {
        // Inicializa o estado do formulário com os dados existentes ou valores padrão
        setFormData({
            ...initialData,
            features: initialData?.features || [{ title: '', description: '' }],
            partner_logos: initialData?.partner_logos || []
        });
        // Limpa os previews de arquivos novos ao carregar
        setPartnerPreviews([]);
    }, [initialData]);

    // Handlers para os campos de texto
    const handleInputChange = (e, field) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    // Handlers para a seção "Nós Oferecemos" (Features)
    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index][field] = value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...(prev.features || []), { title: '', description: '' }] }));
    };

    const removeFeature = (index) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    // Handler unificado para upload de arquivos
    const handleFileChange = (e, fieldName) => {
        if (e.target.files && e.target.files.length > 0) {
            if (fieldName === 'about_logo') {
                const file = e.target.files[0];
                setFilesToUpload(prev => ({...prev, about_logo: file }));
                setLogoPreview(URL.createObjectURL(file));
            } else if (fieldName === 'partner_logos') {
                const files = Array.from(e.target.files);
                setFilesToUpload(prev => ({...prev, partner_logos: [...prev.partner_logos, ...files] }));
                const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), file: file }));
                setPartnerPreviews(prev => [...prev, ...newPreviews]);
            }
        }
    };
    
    // Handlers para remover logos de parceiros
    const removeExistingPartnerLogo = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            partner_logos: prev.partner_logos.filter((_, index) => index !== indexToRemove)
        }));
    };

    const removeNewPartnerPreview = (fileToRemove) => {
        setFilesToUpload(prev => ({...prev, partner_logos: prev.partner_logos.filter(f => f !== fileToRemove)}));
        setPartnerPreviews(prev => prev.filter(p => p.file !== fileToRemove));
    };

    // Função de salvamento padronizada
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const dataToSave = new FormData();
            
            if (filesToUpload.about_logo) {
                dataToSave.append('about_logo', filesToUpload.about_logo);
            }
            if (filesToUpload.partner_logos.length > 0) {
                filesToUpload.partner_logos.forEach(file => {
                    dataToSave.append('partner_logos', file);
                });
            }

            dataToSave.append('about', JSON.stringify(formData));
            
            await axios.put('http://localhost:3001/api/content/site', dataToSave, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });

            // Limpa os arquivos novos após o upload bem-sucedido
            setFilesToUpload({ about_logo: null, partner_logos: [] });
            onSaveSuccess('Seção "Sobre" salva com sucesso!');
        } catch (err) {
            setError('Falha ao salvar. Verifique o console para mais detalhes.');
            onSaveError('Erro ao salvar a seção "Sobre".');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="tpt-editor-form admin-form">
            <h3>Editando a Seção "Sobre"</h3>
            
            <fieldset>
                <legend>Essência</legend>
                <div className="form-group">
                    <label>Logo da Essência</label>
                    <div className="image-preview-container">
                        <img 
                            src={logoPreview || (formData.logo_url ? `http://localhost:3001/${formData.logo_url}`: '/assets/default-placeholder.png')} 
                            alt="Preview Logo"
                            className="image-preview"
                        />
                         <label htmlFor="about_logo_input" className="image-upload-label"><FiUpload/> Trocar Logo</label>
                         <input id="about_logo_input" type="file" onChange={e => handleFileChange(e, 'about_logo')} accept="image/*" style={{display: 'none'}}/>
                    </div>
                </div>
                <div className="form-group">
                    <label>Texto da Essência</label>
                    <textarea 
                        value={formData.essence_text || ''} 
                        onChange={e => handleInputChange(e, 'essence_text')} 
                        rows={6}
                    ></textarea>
                </div>
            </fieldset>

            <fieldset>
                <legend>Nós Oferecemos</legend>
                {formData.features?.map((feature, index) => (
                    <div key={index} className="dynamic-block">
                        <div className='dynamic-block-header'>
                            <h5>Item {index + 1}</h5>
                            {formData.features.length > 1 && (
                                <button type="button" className="btn-remove-block" onClick={() => removeFeature(index)}><FiX/></button>
                            )}
                        </div>
                        <div className="form-group"><label>Título</label><input type="text" value={feature.title} onChange={e => handleFeatureChange(index, 'title', e.target.value)} /></div>
                        <div className="form-group"><label>Descrição</label><textarea value={feature.description} onChange={e => handleFeatureChange(index, 'description', e.target.value)} rows={2}></textarea></div>
                    </div>
                ))}
                <button type="button" className="btn-add-subtle" onClick={addFeature}><FiPlus/> Adicionar Item</button>
            </fieldset>

            <fieldset>
                <legend>Nossos Parceiros</legend>
                <div className="form-group">
                    <label>Logos dos Parceiros</label>
                    <div className="image-preview-container logos-grid">
                        {/* Logos já salvos */}
                        {formData.partner_logos?.map((logoUrl, index) => (
                            <div key={`existing-${index}`} className="logo-preview-item">
                                <img src={`http://localhost:3001/${logoUrl}`} alt={`Parceiro ${index + 1}`} className="image-preview" />
                                <button type="button" className="btn-remove-subtle" onClick={() => removeExistingPartnerLogo(index)}><FiX/></button>
                            </div>
                        ))}
                        {/* Previews dos novos logos a serem enviados */}
                        {partnerPreviews.map((preview, index) => (
                             <div key={`new-${index}`} className="logo-preview-item">
                                <img src={preview.url} alt={`Novo Parceiro ${index + 1}`} className="image-preview" />
                                <button type="button" className="btn-remove-subtle" onClick={() => removeNewPartnerPreview(preview.file)}><FiX/></button>
                            </div>
                        ))}
                    </div>
                    <label htmlFor="partner_logos_input" className="image-upload-label" style={{marginTop: '15px'}}><FiUpload/> Adicionar Novos Logos</label>
                    <input id="partner_logos_input" type="file" onChange={e => handleFileChange(e, 'partner_logos')} accept="image/*" multiple style={{display: 'none'}}/>
                </div>
            </fieldset>

            <div className="form-actions">
                <button onClick={handleSave} disabled={saving} className="btn-new-user">
                    <FiSave/> {saving ? 'Salvando...' : 'Salvar Seção Sobre'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default AboutSectionEditor;