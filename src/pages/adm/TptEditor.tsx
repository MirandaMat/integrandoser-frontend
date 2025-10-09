// /src/pages/adm/TptEditor.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiSave, FiX, FiUpload } from 'react-icons/fi';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const TptEditor = ({ initialData, onSaveSuccess, onSaveError }) => {
    const [formData, setFormData] = useState({});
    const [fileToUpload, setFileToUpload] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        setFormData({
            ...initialData,
            about_paragraphs: initialData?.about_paragraphs || [''],
            how_it_works_steps: initialData?.how_it_works_steps || [{ icon: 'form', title: '', description: '' }],
            offerings_therapy_types: initialData?.offerings_therapy_types || [''],
            offerings_project_benefits: initialData?.offerings_project_benefits || [{ title: '', description: '' }],
            cta_boxes: initialData?.cta_boxes || [{ title: '', description: '', buttonText: '', buttonLink: '' }]
        });
    }, [initialData]);

    const handleInputChange = (e, field) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleArrayItemChange = (e, section, index, field = null) => {
        const { name, value } = e.target;
        const fieldToUpdate = field || name;
        const newArray = [...(formData[section] || [])];
        if (typeof newArray[index] === 'object' && newArray[index] !== null) {
            newArray[index] = { ...newArray[index], [fieldToUpdate]: value };
        } else {
            newArray[index] = value;
        }
        setFormData(prev => ({ ...prev, [section]: newArray }));
    };

    // ## NOVA FUNÇÃO ##: Para atualizar o link do botão com um clique
    const setCtaButtonLink = (index, link) => {
        const newArray = [...(formData.cta_boxes || [])];
        newArray[index] = { ...newArray[index], buttonLink: link };
        setFormData(prev => ({ ...prev, cta_boxes: newArray }));
    };

    const addItem = (section, defaultItem) => {
        setFormData(prev => ({ ...prev, [section]: [...(prev[section] || []), defaultItem] }));
    };

    const removeItem = (section, index) => {
        setFormData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFileToUpload(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const dataToSave = new FormData();
            
            if (fileToUpload) {
                dataToSave.append('about_image', fileToUpload);
            }

            dataToSave.append('tpt_data', JSON.stringify(formData));
            
            await axios.put(`${apiUrl}/api/content/tpt`, dataToSave, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            onSaveSuccess('Página TPT salva com sucesso!');
        } catch (err) {
            setError('Falha ao salvar. Verifique o console para mais detalhes.');
            onSaveError('Erro ao salvar a página TPT.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="tpt-editor-form admin-form">
            <h3>Editando a Página "Terapia Para Todos"</h3>
            
            <fieldset>
                <legend>Seção Principal (Hero)</legend>
                <div className="form-group"><label>Título</label><input type="text" value={formData.hero_title || ''} onChange={e => handleInputChange(e, 'hero_title')} /></div>
                <div className="form-group"><label>Subtítulo</label><textarea value={formData.hero_subtitle || ''} onChange={e => handleInputChange(e, 'hero_subtitle')} rows={3}></textarea></div>
            </fieldset>

            <fieldset>
                <legend>Seção "Sobre o Projeto"</legend>
                {/* ... (código inalterado) ... */}
                <div className="form-group"><label>Título da Seção</label><input type="text" value={formData.about_title || ''} onChange={e => handleInputChange(e, 'about_title')} /></div>
                <div className="form-group"><label>Título da Missão</label><input type="text" value={formData.about_mission_title || ''} onChange={e => handleInputChange(e, 'about_mission_title')} /></div>
                <div className="form-group">
                    <label>Imagem da Seção</label>
                    <div className="image-preview-container">
                        <img src={imagePreview || (formData.about_image_url ? `${apiUrl}/${formData.about_image_url}`: '/assets/default-placeholder.png')} alt="Preview" className="image-preview" />
                        <label htmlFor="about_image_input" className="image-upload-label"><FiUpload/> Trocar Imagem</label>
                        <input id="about_image_input" type="file" onChange={handleFileChange} accept="image/*" style={{display: 'none'}}/>
                    </div>
                </div>
                <div className="form-group">
                    <label>Parágrafos</label>
                    {formData.about_paragraphs?.map((p, index) => (
                        <div key={index} className="dynamic-sub-item">
                            <div className='form-group' style={{width: '100%'}}><textarea value={p} onChange={e => handleArrayItemChange(e, 'about_paragraphs', index)} rows={4}></textarea></div>
                            <button type="button" className="btn-remove-subtle" onClick={() => removeItem('about_paragraphs', index)}><FiX/></button>
                        </div>
                    ))}
                    <button type="button" className="btn-add-subtle" onClick={() => addItem('about_paragraphs', '')}><FiPlus/> Adicionar Parágrafo</button>
                </div>
            </fieldset>

            <fieldset>
                <legend>Seção "Como Funciona?"</legend>
                {/* ... (código inalterado) ... */}
                <div className="form-group"><label>Título da Seção</label><input type="text" value={formData.how_it_works_title || ''} onChange={e => handleInputChange(e, 'how_it_works_title')} /></div>
                {formData.how_it_works_steps?.map((step, index) => (
                    <div key={index} className="dynamic-block">
                        <div className='dynamic-block-header'><h5>Passo {index + 1}</h5><button type="button" className="btn-remove-block" onClick={() => removeItem('how_it_works_steps', index)}><FiX/></button></div>
                        <div className="form-group">
                            <label>Ícone</label>
                            <select name="icon" value={step.icon} onChange={e => handleArrayItemChange(e, 'how_it_works_steps', index)}>
                                <option value="form">Formulário (Inscrição)</option>
                                <option value="users">Usuários (Conexão)</option>
                                <option value="heart">Coração (Acolhimento)</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Título do Passo</label><input type="text" name="title" value={step.title} onChange={e => handleArrayItemChange(e, 'how_it_works_steps', index)} /></div>
                        <div className="form-group"><label>Descrição</label><textarea name="description" value={step.description} onChange={e => handleArrayItemChange(e, 'how_it_works_steps', index)} rows={2}></textarea></div>
                    </div>
                ))}
                <button type="button" className="btn-add-subtle" onClick={() => addItem('how_it_works_steps', {icon: 'form', title: '', description: ''})}><FiPlus/> Adicionar Passo</button>
            </fieldset>

            <fieldset>
                <legend>Seção "O Que Oferecemos"</legend>
                {/* ... (código inalterado) ... */}
                <div className="form-group"><label>Título da Seção</label><input type="text" value={formData.offerings_title || ''} onChange={e => handleInputChange(e, 'offerings_title')} /></div>
                <div className="offerings-columns">
                    <div className="offerings-column">
                        <div className="form-group"><label>Título da Coluna 1 (Tipos de Terapia)</label><input type="text" value={formData.offerings_col1_title || ''} onChange={e => handleInputChange(e, 'offerings_col1_title')} /></div>
                        {formData.offerings_therapy_types?.map((type, index) => (
                            <div key={index} className="dynamic-sub-item">
                                <div className='form-group' style={{width: '100%'}}><input type="text" value={type} onChange={e => handleArrayItemChange(e, 'offerings_therapy_types', index)} /></div>
                                <button type="button" className="btn-remove-subtle" onClick={() => removeItem('offerings_therapy_types', index)}><FiX/></button>
                            </div>
                        ))}
                        <button type="button" className="btn-add-subtle" onClick={() => addItem('offerings_therapy_types', '')}><FiPlus/> Adicionar Terapia</button>
                    </div>
                    <div className="offerings-column">
                        <div className="form-group"><label>Título da Coluna 2 (Benefícios)</label><input type="text" value={formData.offerings_col2_title || ''} onChange={e => handleInputChange(e, 'offerings_col2_title')} /></div>
                        {formData.offerings_project_benefits?.map((item, index) => (
                            <div key={index} className="dynamic-block">
                                <div className='dynamic-block-header'><h5>Benefício {index + 1}</h5><button type="button" className="btn-remove-block" onClick={() => removeItem('offerings_project_benefits', index)}><FiX/></button></div>
                                <div className="form-group"><label>Título do Benefício</label><input type="text" name="title" value={item.title} onChange={e => handleArrayItemChange(e, 'offerings_project_benefits', index)} /></div>
                                <div className="form-group"><label>Descrição</label><textarea name="description" value={item.description} onChange={e => handleArrayItemChange(e, 'offerings_project_benefits', index)} rows={2}></textarea></div>
                            </div>
                        ))}
                        <button type="button" className="btn-add-subtle" onClick={() => addItem('offerings_project_benefits', {title: '', description: ''})}><FiPlus/> Adicionar Benefício</button>
                    </div>
                </div>
            </fieldset>

            <fieldset>
                <legend>Seção "Faça Parte Dessa Missão" (CTA)</legend>
                <div className="form-group"><label>Título da Seção</label><input type="text" value={formData.cta_title || ''} onChange={e => handleInputChange(e, 'cta_title')} /></div>
                {formData.cta_boxes?.map((box, index) => (
                     <div key={index} className="dynamic-block">
                        <div className='dynamic-block-header'><h5>Box de Ação {index + 1}</h5><button type="button" className="btn-remove-block" onClick={() => removeItem('cta_boxes', index)}><FiX/></button></div>
                        <div className="form-group"><label>Título do Box</label><input type="text" name="title" value={box.title} onChange={e => handleArrayItemChange(e, 'cta_boxes', index)} /></div>
                        <div className="form-group"><label>Descrição</label><textarea name="description" value={box.description} onChange={e => handleArrayItemChange(e, 'cta_boxes', index)} rows={3}></textarea></div>
                        <div className="form-group"><label>Texto do Botão</label><input type="text" name="buttonText" value={box.buttonText} onChange={e => handleArrayItemChange(e, 'cta_boxes', index)} /></div>
                        
                        {/* ## ATUALIZAÇÃO AQUI: Adicionado campo de texto com botões de atalho ## */}
                        <div className="form-group">
                            <label>Link do Botão</label>
                            <input type="text" name="buttonLink" value={box.buttonLink || ''} onChange={e => handleArrayItemChange(e, 'cta_boxes', index)} />
                            <div className="link-helpers">
                                <label>Preenchimento Rápido:</label>
                                <div className="helper-buttons">
                                    <button type="button" className="helper-btn" onClick={() => setCtaButtonLink(index, '/triagem?type=paciente')}>Triagem de Paciente</button>
                                    <button type="button" className="helper-btn" onClick={() => setCtaButtonLink(index, '/triagem?type=profissional')}>Triagem de Profissional</button>
                                    <button type="button" className="helper-btn" onClick={() => setCtaButtonLink(index, '/triagem?type=empresa')}>Triagem de Empresa</button>
                                </div>
                            </div>
                        </div>

                    </div>
                ))}
                <button type="button" className="btn-add-subtle" onClick={() => addItem('cta_boxes', {title: '', description: '', buttonText: '', buttonLink: ''})}><FiPlus/> Adicionar Box de Ação</button>
            </fieldset>
            
            <div className="form-actions">
                <button onClick={handleSave} disabled={saving} className="btn-new-user"><FiSave/> {saving ? 'Salvando...' : 'Salvar Alterações na Página'}</button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default TptEditor;