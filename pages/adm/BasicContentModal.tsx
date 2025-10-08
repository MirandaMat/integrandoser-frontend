// /src/pages/adm/BasicContentModal.tsx

import React, { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';

// Este é o nosso novo modal, focado apenas em Blog e Depoimentos.
// Todo o código de "Serviços" foi removido.
const BasicContentModal = ({ isOpen, onClose, onSave, item, type, error }) => {
    const [formData, setFormData] = useState<any>({});
    const blogCategories = ['Autoconhecimento', 'Saúde', 'Relacionamento', 'Curiosidade', 'Nutrição', 'Espiritualidade', 'Meditação', 'Educação'];

    useEffect(() => {
        if (isOpen) {
            let initialData = item ? { ...item } : {};
            // A lógica de inicialização foi simplificada, removendo o 'if (type === 'services')'.
            if (type === 'blog' && !item) {
                initialData = { paragraphs: [''] };
            }
            setFormData(initialData);
        }
    }, [item, isOpen, type]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParagraphChange = (index: number, value: string) => {
        const newParagraphs = [...(formData.paragraphs || [])];
        newParagraphs[index] = value;
        setFormData(prev => ({ ...prev, paragraphs: newParagraphs }));
    };

    const handleAddParagraph = () => {
        setFormData(prev => ({ ...prev, paragraphs: [...(prev.paragraphs || []), ''] }));
    };

    const handleRemoveParagraph = (index: number) => {
        if (formData.paragraphs?.length > 1) {
            const newParagraphs = formData.paragraphs.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, paragraphs: newParagraphs }));
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = new FormData();
        let dataCopy = { ...formData };
    
        if (type === 'blog' && Array.isArray(dataCopy.paragraphs)) {
            dataCopy.paragraphs = JSON.stringify(dataCopy.paragraphs);
        }
    
        // A lógica do 'services' foi removida do submit também.
        Object.keys(dataCopy).forEach(key => {
            if ((key === 'image' || key === 'photo' || key === 'video') && typeof dataCopy[key] === 'string') {
                return;
            }
            dataToSave.append(key, dataCopy[key]);
        });
    
        onSave(dataToSave, item?.id);
    };

    if (!isOpen) return null;

    // A função renderFieldsForServices foi completamente removida.
    const renderFieldsForBlog = () => (
        <>
            <div className="form-group"><label>Título</label><input name="title" value={formData.title || ''} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Categoria</label><select name="category" value={formData.category || ''} onChange={handleInputChange}><option value="" disabled>Selecione</option>{blogCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Resumo da Matéria</label><textarea name="excerpt" value={formData.excerpt || ''} onChange={handleInputChange}></textarea></div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Parágrafos</label>{formData.paragraphs?.map((p, index) => (<div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}><textarea value={p} onChange={(e) => handleParagraphChange(index, e.target.value)} rows={4} style={{ flexGrow: 1 }} /><button type="button" className="btn-cancel" style={{padding: '8px 12px'}} onClick={() => handleRemoveParagraph(index)}>&times;</button></div>))}<button type="button" className="btn-new-user" style={{marginTop: '10px', width: 'auto'}} onClick={handleAddParagraph}><FiPlus/> Add Parágrafo</button></div>
            <div className="form-group"><label>Imagem de Capa</label><input type="file" name="image" onChange={handleFileChange} accept="image/*" /></div>
            {item?.id && <div className="form-group"><label>Data</label><input type="date" name="post_date" value={(formData.post_date || '').split('T')[0]} onChange={handleInputChange} /></div>}
        </>
    );

    const renderFields = () => {
        switch (type) {
            case 'blog': return renderFieldsForBlog();
            case 'testimonials': return (
                    <>
                        <div className="form-group" style={{gridColumn: '1 / -1'}}><label>Depoimento</label><textarea name="quote" value={formData.quote || ''} onChange={handleInputChange} rows={6}></textarea></div>
                        <div className="form-group"><label>Nome</label><input name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Profissão</label><input name="role" value={formData.role || ''} onChange={handleInputChange} /></div>
                        <div className="form-group"><label>Foto</label><input type="file" name="photo" onChange={handleFileChange} accept="image/*" /></div>
                    </>
                );
            // O 'case: services' foi removido.
            default: return null;
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{item?.id ? 'Editar' : 'Criar'} Conteúdo</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-grid">{renderFields()}</div>
                    {error && <p className="error-message">{error}</p>}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-new-user">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BasicContentModal;