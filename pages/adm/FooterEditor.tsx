// src/pages/adm/FooterEditor.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSave } from 'react-icons/fi';

const FooterEditor = ({ initialData, onSaveSuccess, onSaveError }) => {
    // Padrão correto: inicializa o estado uma vez
    const [formData, setFormData] = useState({});
    
    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSocialChange = (e, socialName) => {
        const { name, value, type, checked } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            socials: {
                ...(prev.socials || {}),
                [socialName]: {
                    ...(prev.socials?.[socialName] || {}),
                    [name]: fieldValue
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const dataToSave = new FormData();
            
            // Padrão correto: Stringify o objeto de dados
            dataToSave.append('footer', JSON.stringify(formData));
            
            await axios.put('http://localhost:3001/api/content/site', dataToSave, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            onSaveSuccess('Rodapé salvo com sucesso!');
        } catch (err) {
            setError('Falha ao salvar. Verifique o console para mais detalhes.');
            onSaveError('Erro ao salvar o rodapé.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="tpt-editor-form admin-form">
            <h3>Editando o Rodapé do Site</h3>
            <fieldset>
                <legend>Redes Sociais e Contato</legend>
                {['instagram', 'facebook', 'whatsapp', 'email'].map(social => (
                     <div key={social} className="dynamic-item-block">
                        <h4>{social.charAt(0).toUpperCase() + social.slice(1)}</h4>
                        <div className="form-group">
                            <label>Link</label>
                            <input 
                                type="text" 
                                name="link"
                                value={formData.socials?.[social]?.link || ''}
                                onChange={e => handleSocialChange(e, social)} 
                            />
                        </div>
                         <div className="form-group" style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
                            <input 
                                type="checkbox"
                                id={`enabled_${social}`}
                                name="enabled"
                                checked={!!formData.socials?.[social]?.enabled}
                                onChange={e => handleSocialChange(e, social)}
                                style={{width: 'auto'}}
                             />
                             <label htmlFor={`enabled_${social}`} style={{marginBottom: 0}}>Habilitar no rodapé</label>
                        </div>
                    </div>
                ))}
            </fieldset>

            <div className="form-actions">
                <button onClick={handleSave} disabled={saving} className="btn-new-user">
                    <FiSave/> {saving ? 'Salvando...' : 'Salvar Rodapé'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default FooterEditor;