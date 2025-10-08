// /src/pages/adm/FounderSectionEditor.tsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSave, FiUpload, FiX, FiPlus } from 'react-icons/fi';

const FounderSectionEditor = ({ initialData, onSaveSuccess, onSaveError }) => {
    // Lógica padronizada: um estado para texto, outro para arquivos
    const [textData, setTextData] = useState({ paragraphs: [''] });
    const [fileToUpload, setFileToUpload] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const { image_url, ...rest } = initialData || {};
        setTextData({ image_url, paragraphs: initialData?.paragraphs || [''], ...rest });
    }, [initialData]);


    const handleParagraphChange = (e, index) => {
        const { value } = e.target;
        const newParagraphs = [...(textData.paragraphs || [])];
        newParagraphs[index] = value;
        setTextData(prev => ({ ...prev, paragraphs: newParagraphs }));
    };

    const addParagraph = () => {
        setTextData(prev => ({ ...prev, paragraphs: [...(prev.paragraphs || []), ''] }));
    };

    const removeParagraph = (index) => {
        setTextData(prev => ({ ...prev, paragraphs: prev.paragraphs.filter((_, i) => i !== index) }));
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
            
            // Padrão correto e seguro
            if (fileToUpload) {
                dataToSave.append('founder_image', fileToUpload);
            }
            dataToSave.append('founder', JSON.stringify(textData));
            
            await axios.put('http://localhost:3001/api/content/site', dataToSave, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            
            onSaveSuccess('Seção "Fundadora" salva com sucesso!');
        } catch (err) {
            setError('Falha ao salvar. Verifique o console para mais detalhes.');
            onSaveError('Erro ao salvar a seção "Fundadora".');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    return (
        <div className="tpt-editor-form admin-form">
            <h3>Editando a Seção "Fundadora"</h3>
            <fieldset>
                <legend>Conteúdo</legend>
                 <div className="form-group">
                    <label>Imagem da Fundadora</label>
                    <div className="image-preview-container">
                        <img src={imagePreview || (textData.image_url ? `http://localhost:3001/${textData.image_url}`: '/assets/default-placeholder.png')} alt="Preview" className="image-preview" />
                         <label htmlFor="founder_image_input" className="image-upload-label"><FiUpload/> Trocar Imagem</label>
                         <input id="founder_image_input" type="file" onChange={handleFileChange} accept="image/*" style={{display: 'none'}}/>
                    </div>
                </div>
                <div className="form-group">
                    <label>Texto da Fundadora (Parágrafos)</label>
                    {textData.paragraphs?.map((p, index) => (
                        <div key={index} className="dynamic-sub-item">
                            <div className='form-group' style={{width: '100%'}}>
                                <textarea value={p} onChange={e => handleParagraphChange(e, index)} rows={4}></textarea>
                            </div>
                            <button type="button" className="btn-remove-subtle" onClick={() => removeParagraph(index)}><FiX/></button>
                        </div>
                    ))}
                    <button type="button" className="btn-add-subtle" onClick={addParagraph}><FiPlus/> Adicionar Parágrafo</button>
                </div>
            </fieldset>

            <div className="form-actions">
                <button onClick={handleSave} disabled={saving} className="btn-new-user">
                    <FiSave/> {saving ? 'Salvando...' : 'Salvar Seção Fundadora'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default FounderSectionEditor;