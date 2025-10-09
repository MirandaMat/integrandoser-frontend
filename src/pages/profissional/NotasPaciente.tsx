// src/pages/profissional/NotasPaciente.tsx
import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlusCircle, FiEdit, FiTrash2, FiArrowLeft, FiEye } from 'react-icons/fi';
import '../../styles/NotasPaciente.css';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface Note {
    id: number;
    note_content: string;
    created_at: string;
    updated_at: string;
}

interface Patient {
    id: number;
    nome: string;
}

// Sub-componente para o Modal de Visualização
const NoteViewModal = ({ note, onClose }) => {
    if (!note) return null;
    return (
        <div className="note-modal-overlay" onClick={onClose}>
            <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="note-modal-header">
                    <h3>Nota da Sessão</h3>
                    <button onClick={onClose} className="note-modal-close-btn">&times;</button>
                </div>
                <div className="note-modal-body">
                    <p>{note.note_content}</p>
                </div>
                <div className="note-modal-footer">
                    <span>Criado em: {new Date(note.created_at).toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </div>
    );
};


const NotasPaciente = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const token = useMemo(() => localStorage.getItem('token'), []);

    const [notes, setNotes] = useState<Note[]>([]);
    const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [viewingNote, setViewingNote] = useState<Note | null>(null); // State para o modal de visualização
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [notesRes, patientRes] = await Promise.all([
                fetch(`${apiUrl}/api/notes/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${apiUrl}/api/users/patient-profile/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!notesRes.ok || !patientRes.ok) throw new Error('Falha ao carregar dados.');
            const notesData = await notesRes.json();
            const patientData = await patientRes.json();
            setNotes(notesData);
            setPatientInfo(patientData);
        } catch (err: any) { setError(err.message); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [patientId, token]);

    const handleSaveNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) return;
        const url = editingNote ? `${apiUrl}/api/notes/${editingNote.id}` : `${apiUrl}/api/notes`;
        const method = editingNote ? 'PUT' : 'POST';
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ patient_id: patientId, note_content: newNoteContent })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar nota.');
            }
            setNewNoteContent('');
            setEditingNote(null);
            fetchData();
        } catch (err: any) { setError(err.message); }
    };

    const handleEdit = (note: Note) => {
        setEditingNote(note);
        setNewNoteContent(note.note_content);
        window.scrollTo(0, 0); // Rola para o topo para ver o formulário
    };

    const handleDelete = async (noteId: number) => {
        if (window.confirm('Tem certeza que deseja apagar esta nota? A ação não pode ser desfeita.')) {
            try {
                const response = await fetch(`${apiUrl}/api/notes/${noteId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Erro ao apagar nota.');
                fetchData();
            } catch (err: any) { setError(err.message); }
        }
    };

    const isEditable = (noteDate: string) => {
        const createdAt = new Date(noteDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 15;
    };

    if (loading) return <p>Carregando notas...</p>;

    return (
        <Fragment>
            <NoteViewModal note={viewingNote} onClose={() => setViewingNote(null)} />
            <div className="notes-container">
                <button onClick={() => navigate('/professional/pacientes')} className="back-button"><FiArrowLeft /> Voltar para Pacientes</button>
                <div className="notes-header">
                    <h1>Bloco de Notas</h1>
                    {patientInfo && <h2>Paciente: {patientInfo.nome}</h2>}
                </div>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSaveNote} className="note-form">
                    <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Escreva sua nota da sessão aqui..." rows={6} />
                    <div className="form-actions">
                         {editingNote && <button type="button" className="btn-cancel" onClick={() => { setEditingNote(null); setNewNoteContent(''); }}>Cancelar Edição</button>}
                        <button type="submit" className="btn-save"><FiPlusCircle /> {editingNote ? 'Salvar Alterações' : 'Adicionar Nota'}</button>
                    </div>
                </form>
                <div className="notes-list">
                    {notes.length === 0 && !loading && <p className="no-notes-message">Nenhuma nota encontrada para este paciente.</p>}
                    {notes.map(note => (
                        <div className="note-card" key={note.id}>
                            <div className="note-clickable-area" onClick={() => setViewingNote(note)}>
                                <p className="note-content-preview">{note.note_content}</p>
                            </div>
                            <div className="note-footer">
                                <span className="note-date">Criado em: {new Date(note.created_at).toLocaleDateString('pt-BR')}</span>
                                <div className="note-actions">
                                    <button onClick={() => setViewingNote(note)} title="Ver Nota Completa"><FiEye /></button>
                                    {isEditable(note.created_at) && <button onClick={() => handleEdit(note)} title="Editar Nota"><FiEdit /></button>}
                                    <button onClick={() => handleDelete(note.id)} title="Apagar Nota"><FiTrash2 /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Fragment>
    );
};

export default NotasPaciente;