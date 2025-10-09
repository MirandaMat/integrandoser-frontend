// src/pages/paciente/DiarioSonhos.tsx
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiImage, FiX } from 'react-icons/fi';
import '../../styles/diario.css';

interface DreamEntry {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
}

const DiarioSonhos = () => {
    const [entries, setEntries] = useState<DreamEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<DreamEntry[]>([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState<DreamEntry | null>(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const token = useMemo(() => localStorage.getItem('token'), []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/dreams/my-dreams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar o diário.');
            const data = await res.json();
            setEntries(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    useEffect(() => {
        const result = entries.filter(entry =>
            entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredEntries(result);
    }, [searchQuery, entries]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        setEditingEntry(null);
        setIsFormVisible(false);
    };

    const handleEditClick = (entry: DreamEntry) => {
        setEditingEntry(entry);
        setTitle(entry.title);
        setContent(entry.content);
        setImagePreview(entry.image_url ? `${apiUrl}/${entry.image_url}` : null);
        setIsFormVisible(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (imageFile) formData.append('dream_image', imageFile);

        const url = editingEntry 
            ? `${apiUrl}/api/dreams/${editingEntry.id}`
            : `${apiUrl}/api/dreams`;
        const method = editingEntry ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (entryId: number) => {
        if (window.confirm('Tem certeza que deseja apagar este registro?')) {
            try {
                await fetch(`${apiUrl}/api/dreams/${entryId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchData();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const isEditable = (date: string) => {
        const diffDays = Math.ceil(Math.abs(new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 15;
    };

    return (
        <>
            {isFormVisible && (
                <div className="modal-overlay" onClick={resetForm}>
                    <form className="dream-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                        <button type="button" className="modal-close-btn" onClick={resetForm}><FiX size={24} /></button>
                        
                        <h2>{editingEntry ? 'Editando Sonho' : 'O que você sonhou hoje?'}</h2>
                        <input type="text" placeholder="Dê um título para seu sonho" value={title} onChange={e => setTitle(e.target.value)} required />
                        <textarea placeholder="Descreva os detalhes, sensações e símbolos que se lembra..." value={content} onChange={e => setContent(e.target.value)} required />

                        <div className="image-upload-area">
                            <label htmlFor="dream_image" className="image-upload-label"><FiImage /> Anexar uma imagem</label>
                            <input type="file" id="dream_image" accept="image/*" onChange={handleImageChange} />
                            {imagePreview && (
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Prévia do sonho" />
                                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}><FiX /></button>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={resetForm}>Cancelar</button>
                            <button type="submit" className="btn-save">Salvar Sonho</button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className="dream-diary-container">
                {/* O header agora contém apenas o título e o parágrafo */}
                <header className="diary-header">
                    <h1>Diário de Sonhos</h1>
                </header>

                {/* Os controles foram movidos para fora do header */}
                <div className="diary-controls">
                    <div className="search-bar">
                        <FiSearch />
                        <input type="text" placeholder="Buscar em seus sonhos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button className="btn-new-dream" onClick={() => setIsFormVisible(true)}>
                        <FiPlus /> Novo Sonho
                    </button>
                </div>

                <main className="entries-grid">
                    {loading && <p>Carregando...</p>}
                    {error && <p className="error-message">{error}</p>}

                    {filteredEntries.map(entry => (
                        <article key={entry.id} className="entry-card">
                            {entry.image_url && <img src={`${apiUrl}/${entry.image_url}`} alt={entry.title} className="entry-image" />}
                            <div className="entry-content">
                                <time>{new Date(entry.created_at).toLocaleDateString('pt-BR')}</time>
                                <h3>{entry.title}</h3>
                                <p>{entry.content}</p>
                            </div>
                            <div className="entry-actions">
                                {isEditable(entry.created_at) && (
                                    <button onClick={() => handleEditClick(entry)}><FiEdit /> Editar</button>
                                )}
                                <button onClick={() => handleDelete(entry.id)}><FiTrash2 /> Excluir</button>
                            </div>
                        </article>
                    ))}
                </main>
            </div>
        </>
    );
};

export default DiarioSonhos;