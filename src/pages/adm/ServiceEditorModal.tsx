// /src/pages/adm/ServiceEditorModal.tsx

import React, { useState, useEffect } from 'react';
import { FiPlus, FiX, FiUpload } from 'react-icons/fi'; // Adicionado FiUpload

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const ServiceEditorModal = ({ isOpen, onClose, onSave, item, error }) => {
    const [formData, setFormData] = useState<any>({});
    // ## NOVO ESTADO ##: para guardar a URL do preview da nova imagem
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (item) {
                let detailsObject = {};
                if (typeof item.details === 'string' && item.details) {
                    try {
                        detailsObject = JSON.parse(item.details);
                    } catch (e) {
                        detailsObject = {};
                    }
                } else if (typeof item.details === 'object' && item.details !== null) {
                    detailsObject = item.details;
                }
                setFormData({ ...item, details: detailsObject });
            } else {
                setFormData({
                    title: '', slug: '', description: '', image: null,
                    details: {
                        pageTitle: '', quote: '', introduction: '',
                        sections: [], howItWorks: null, faq: null, cta: null,
                    }
                });
            }
            // Limpa o preview ao abrir o modal
            setImagePreviewUrl(null);
        }
    }, [item, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));
            // ## NOVA LÓGICA ##: Cria uma URL temporária para o preview
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = new FormData();
        let dataCopy = { ...formData };

        if (typeof dataCopy.details === 'object' && dataCopy.details !== null) {
            dataToSave.append('details', JSON.stringify(dataCopy.details));
        }
        dataToSave.append('title', dataCopy.title || '');
        dataToSave.append('slug', dataCopy.slug || '');
        dataToSave.append('description', dataCopy.description || '');
        if (dataCopy.image && typeof dataCopy.image !== 'string') {
            dataToSave.append('image', dataCopy.image);
        }
        onSave(dataToSave, item?.id);
    };

    // --- Outros Handlers (sem alterações) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, details: { ...(prev.details || {}), [name]: value } }));
    };
    const addSectionBlock = (blockType: string) => {
        setFormData(prev => {
            const newDetails = { ...(prev.details || {}) };
            if (blockType === 'sections') {
                newDetails.sections = [...(newDetails.sections || []), { title: '', intro: '', outro: '', items: [{ name: '', description: '' }] }];
            } else if (blockType === 'howItWorks' && !newDetails.howItWorks) {
                newDetails.howItWorks = { title: 'Como funciona', steps: [''], closingText: '' };
            } else if (blockType === 'faq' && !newDetails.faq) {
                newDetails.faq = [{ question: '', answer: '' }];
            } else if (blockType === 'cta' && !newDetails.cta) {
                newDetails.cta = { text: '', buttonText: 'Agendar' };
            }
            return { ...prev, details: newDetails };
        });
    };
    const removeSectionBlock = (blockType: string, index?: number) => {
        setFormData(prev => {
            const newDetails = { ...prev.details };
            if (blockType === 'sections') {
                newDetails.sections.splice(index, 1);
            } else {
                newDetails[blockType] = null;
            }
            return { ...prev, details: newDetails };
        });
    };
    const handleBlockChange = (blockType: string, field: string, value: string, index?: number) => {
        setFormData(prev => {
            const newDetails = { ...prev.details };
            if (blockType === 'sections') {
                newDetails.sections[index][field] = value;
            } else {
                newDetails[blockType][field] = value;
            }
            return { ...prev, details: newDetails };
        });
    };
    const handleItemChange = (blockType: string, itemIndex: number, field: string, value: string, sectionIndex?: number) => {
        setFormData(prev => {
            const newDetails = { ...prev.details };
            if (blockType === 'sections') {
                newDetails.sections[sectionIndex].items[itemIndex][field] = value;
            } else {
                const items = blockType === 'faq' ? newDetails.faq : newDetails.howItWorks.steps;
                if(blockType === 'faq') items[itemIndex][field] = value;
                else items[itemIndex] = value;
            }
            return { ...prev, details: newDetails };
        });
    };
    const addItem = (blockType: string, sectionIndex?: number) => {
        setFormData(prev => {
            const newDetails = { ...prev.details };
            if (blockType === 'sections') {
                newDetails.sections[sectionIndex].items.push({ name: '', description: '' });
            } else if (blockType === 'howItWorks') {
                newDetails.howItWorks.steps.push('');
            } else if (blockType === 'faq') {
                newDetails.faq.push({ question: '', answer: '' });
            }
            return { ...prev, details: newDetails };
        });
    };
    const removeItem = (blockType: string, itemIndex: number, sectionIndex?: number) => {
        setFormData(prev => {
            const newDetails = { ...prev.details };
            if (blockType === 'sections') {
                newDetails.sections[sectionIndex].items.splice(itemIndex, 1);
            } else if (blockType === 'howItWorks') {
                newDetails.howItWorks.steps.splice(itemIndex, 1);
            } else if (blockType === 'faq') {
                newDetails.faq.splice(itemIndex, 1);
            }
            return { ...prev, details: newDetails };
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <div className="modal-header">
                    <h2>{item?.id ? 'Editar' : 'Criar'} Serviço</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-grid">
                        <div className="form-group"><label>Título do Serviço (para o card)</label><input name="title" value={formData.title || ''} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Slug (ex: "psicoterapia")</label><input name="slug" value={formData.slug || ''} onChange={handleInputChange} /></div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Descrição Curta (para o card)</label><textarea name="description" value={formData.description || ''} onChange={handleInputChange}></textarea></div>
                        
                        {/* ================================================================ */}
                        {/* ## SEÇÃO DE UPLOAD DE IMAGEM COMPLETAMENTE REFEITA ## */}
                        {/* ================================================================ */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Imagem Principal do Serviço</label>
                            <div className='image-preview-container'>
                                {/* Lógica de exibição do Preview */}
                                {imagePreviewUrl ? (
                                    <img src={imagePreviewUrl} alt="Preview da nova imagem" className="image-preview" />
                                ) : (
                                    item?.image_url && <img src={`${apiUrl}/${item.image_url}`} alt="Imagem atual" className="image-preview" />
                                )}

                                <div className="file-input-controls">
                                    <label htmlFor="image-upload" className="image-upload-label">
                                        <FiUpload />
                                        {item?.image_url ? 'Alterar Imagem' : 'Escolher Imagem'}
                                    </label>
                                    <span className="file-name-display">
                                        {formData.image?.name || "Nenhum arquivo selecionado"}
                                    </span>
                                </div>

                                <input
                                    id="image-upload"
                                    type="file"
                                    name="image"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dynamic-section-wrapper">{/* ... O restante do formulário (blocos dinâmicos) permanece inalterado ... */}
                        <h4>Conteúdo da Página do Serviço</h4>
                        <div className="form-grid">
                            <div className="form-group"><label>Título da Página</label><input name="pageTitle" value={formData.details?.pageTitle || ''} onChange={handleDetailsChange} /></div>
                            <div className="form-group"><label>Citação</label><textarea name="quote" value={formData.details?.quote || ''} onChange={handleDetailsChange}></textarea></div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Parágrafo de Introdução</label><textarea name="introduction" value={formData.details?.introduction || ''} onChange={handleDetailsChange} rows={4}></textarea></div>
                        </div>
                        <div className="section-adder">
                            <label>Adicionar Bloco de Conteúdo:</label>
                            <div className="section-adder-buttons">
                                <button type="button" onClick={() => addSectionBlock('sections')}><FiPlus/> Seção</button>
                                <button type="button" disabled={!!formData.details?.howItWorks} onClick={() => addSectionBlock('howItWorks')}><FiPlus/> Como funciona</button>
                                <button type="button" disabled={!!formData.details?.faq} onClick={() => addSectionBlock('faq')}><FiPlus/> Perguntas</button>
                                <button type="button" disabled={!!formData.details?.cta} onClick={() => addSectionBlock('cta')}><FiPlus/> CTA</button>
                            </div>
                        </div>
                        <div className="dynamic-blocks-container">{/* ... Mapeamento dos blocos ... */}
                            {formData.details?.sections?.map((section, sIdx) => (
                                <div key={sIdx} className="dynamic-block">
                                    <div className='dynamic-block-header'><h5>Seção de Itens</h5><button type="button" className="btn-remove-block" onClick={() => removeSectionBlock('sections', sIdx)}><FiX/></button></div>
                                    <div className="form-group"><label>Título da Seção</label><input placeholder="Ex: Entenda um pouco mais sobre abordagens" value={section.title} onChange={e => handleBlockChange('sections', 'title', e.target.value, sIdx)} /></div>
                                    <div className="form-group"><label>Introdução da Seção (opcional)</label><textarea placeholder="Texto que aparece antes dos itens" value={section.intro} onChange={e => handleBlockChange('sections', 'intro', e.target.value, sIdx)} /></div>
                                    {section.items.map((item, iIdx) => (
                                        <div key={iIdx} className="dynamic-sub-item">
                                            <div className="sub-item-grid">
                                                <div className="form-group"><label>Nome do Item</label><input placeholder="Ex: Psicologia Analítica" value={item.name} onChange={e => handleItemChange('sections', iIdx, 'name', e.target.value, sIdx)} /></div>
                                                <div className="form-group"><label>Descrição do Item</label><textarea placeholder="Descrição sobre o item" value={item.description} onChange={e => handleItemChange('sections', iIdx, 'description', e.target.value, sIdx)} /></div>
                                            </div>
                                            <button type="button" className="btn-remove-subtle" onClick={() => removeItem('sections', iIdx, sIdx)}><FiX/></button>
                                        </div>
                                    ))}
                                    <div className="form-group"><label>Texto de Conclusão (opcional)</label><textarea placeholder="Texto que aparece depois dos itens" value={section.outro} onChange={e => handleBlockChange('sections', 'outro', e.target.value, sIdx)} /></div>
                                    <button type="button" className="btn-add-subtle" onClick={() => addItem('sections', sIdx)}><FiPlus/> Adicionar Item</button>
                                </div>
                            ))}
                            {formData.details?.howItWorks && (
                                <div className="dynamic-block">
                                    <div className='dynamic-block-header'><h5>Como Funciona</h5><button type="button" className="btn-remove-block" onClick={() => removeSectionBlock('howItWorks')}><FiX/></button></div>
                                    <div className="form-group"><label>Título do Bloco</label><input placeholder="Ex: Como funciona?" value={formData.details.howItWorks.title} onChange={e => handleBlockChange('howItWorks', 'title', e.target.value)} /></div>
                                    {formData.details.howItWorks.steps.map((step, sIdx) => (
                                        <div key={sIdx} className="dynamic-sub-item">
                                            <div className="form-group" style={{width: '100%'}}><label>Passo {sIdx + 1}</label><textarea value={step} onChange={e => handleItemChange('howItWorks', sIdx, '', e.target.value)} /></div>
                                            <button type="button" className="btn-remove-subtle" onClick={() => removeItem('howItWorks', sIdx)}><FiX/></button>
                                        </div>
                                    ))}
                                    <div className="form-group"><label>Texto de Fechamento</label><input placeholder="Ex: Viu como é fácil?" value={formData.details.howItWorks.closingText} onChange={e => handleBlockChange('howItWorks', 'closingText', e.target.value)} /></div>
                                    <button type="button" className="btn-add-subtle" onClick={() => addItem('howItWorks')}><FiPlus/> Adicionar Passo</button>
                                </div>
                            )}
                            {formData.details?.faq && (
                                <div className="dynamic-block">
                                    <div className='dynamic-block-header'><h5>Perguntas Frequentes (FAQ)</h5><button type="button" className="btn-remove-block" onClick={() => removeSectionBlock('faq')}><FiX/></button></div>
                                    {formData.details.faq.map((q, qIdx) => (
                                        <div key={qIdx} className="dynamic-sub-item">
                                            <div className="sub-item-grid">
                                                <div className="form-group"><label>Pergunta</label><input value={q.question} onChange={e => handleItemChange('faq', qIdx, 'question', e.target.value)} /></div>
                                                <div className="form-group"><label>Resposta</label><textarea value={q.answer} onChange={e => handleItemChange('faq', qIdx, 'answer', e.target.value)} /></div>
                                            </div>
                                            <button type="button" className="btn-remove-subtle" onClick={() => removeItem('faq', qIdx)}><FiX/></button>
                                        </div>
                                    ))}
                                    <button type="button" className="btn-add-subtle" onClick={() => addItem('faq')}><FiPlus/> Adicionar Pergunta</button>
                                </div>
                            )}
                             {formData.details?.cta && (
                                <div className="dynamic-block">
                                     <div className='dynamic-block-header'><h5>Chamada para Ação (CTA)</h5><button type="button" className="btn-remove-block" onClick={() => removeSectionBlock('cta')}><FiX/></button></div>
                                     <div className="form-group"><label>Texto Principal</label><input value={formData.details.cta.text} onChange={e => handleBlockChange('cta', 'text', e.target.value)} /></div>
                                     <div className="form-group"><label>Texto do Botão</label><input value={formData.details.cta.buttonText} onChange={e => handleBlockChange('cta', 'buttonText', e.target.value)} /></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-new-user">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceEditorModal;