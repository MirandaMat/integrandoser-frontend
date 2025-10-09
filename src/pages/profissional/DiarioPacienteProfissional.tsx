// src/pages/profissional/DiarioPacienteProfissional.tsx
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import '../../styles/diario.css'; // Reutilizando o mesmo design lindo!

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface DreamEntry {
    id: number;
    title: string;
    content: string;
    image_url: string | null;
    created_at: string;
}

interface Patient {
    id: number;
    nome: string;
}

// Modal de visualização (Apenas Leitura)
const DreamViewModal = ({ entry, onClose }) => {
    if (!entry) return null;
    return (
        <div className="note-modal-overlay" onClick={onClose}>
            <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="note-modal-header">
                    <h3>{entry.title}</h3>
                    <button onClick={onClose} className="note-modal-close-btn">&times;</button>
                </div>
                {entry.image_url && <img src={`${apiUrl}/${entry.image_url}`} alt={entry.title} className="modal-entry-image" />}
                <div className="note-modal-body">
                    <p>{entry.content}</p>
                </div>
                <div className="note-modal-footer">
                    <span>Registrado em: {new Date(entry.created_at).toLocaleString('pt-BR')}</span>
                </div>
            </div>
        </div>
    );
};


const DiarioPacienteProfissional = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const token = useMemo(() => localStorage.getItem('token'), []);

    const [entries, setEntries] = useState<DreamEntry[]>([]);
    const [patientInfo, setPatientInfo] = useState<Patient | null>(null);
    const [viewingEntry, setViewingEntry] = useState<DreamEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const [dreamsRes, patientRes] = await Promise.all([
                    fetch(`${apiUrl}/api/dreams/professional/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/api/users/patient-profile/${patientId}`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!dreamsRes.ok || !patientRes.ok) throw new Error('Falha ao carregar dados do diário.');
                
                const dreamsData = await dreamsRes.json();
                const patientData = await patientRes.json();
                
                setEntries(dreamsData);
                setPatientInfo(patientData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [patientId, token]);

    if (loading) return <p>Carregando diário do paciente...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <Fragment>
            <DreamViewModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
            <div className="dream-diary-container">
                <button onClick={() => navigate('/professional/pacientes')} className="back-button">
                    <FiArrowLeft /> Voltar para Pacientes
                </button>
                <header className="diary-header">
                    <h1>Diário de Sonhos</h1>
                    {patientInfo && <p>Registros de <strong>{patientInfo.nome}</strong></p>}
                </header>

                <main className="entries-grid">
                    {entries.length === 0 && (
                        <p className="no-notes-message">Este paciente ainda não possui registros no diário.</p>
                    )}
                    {entries.map(entry => (
                        <article key={entry.id} className="entry-card" onClick={() => setViewingEntry(entry)}>
                            {entry.image_url && <img src={`${apiUrl}/${entry.image_url}`} alt={entry.title} className="entry-image" />}
                            <div className="entry-content">
                                <time>{new Date(entry.created_at).toLocaleDateString('pt-BR')}</time>
                                <h3>{entry.title}</h3>
                                <p>{entry.content}</p>
                            </div>
                        </article>
                    ))}
                </main>
            </div>
        </Fragment>
    );
};

export default DiarioPacienteProfissional;