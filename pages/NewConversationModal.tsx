// src/pages/NewConversationModal.tsx

import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const NewConversationModal = ({ isOpen, onClose, onSelectUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setInitialLoad(true);
            return;
        }

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const endpoint = searchTerm.trim()
                    ? `search-users/${searchTerm}`
                    : 'conversations/suggestions';

                const response = await fetch(`http://localhost:3001/api/messages/${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error('Falha na busca de usuários');
                
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error("Erro ao buscar usuários:", error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        if (initialLoad) {
            fetchUsers();
            setInitialLoad(false);
        } else {
            const debounceTimeout = setTimeout(fetchUsers, 300);
            return () => clearTimeout(debounceTimeout);
        }

    }, [searchTerm, isOpen, initialLoad]);

    if (!isOpen) return null;

    const handleUserSelect = (user) => {
        onSelectUser(user);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                <div className="modal-header">
                    {/* O título agora é h2, conforme o CSS */}
                    <h2>Iniciar Nova Conversa</h2>
                    <button onClick={onClose} className="modal-close-btn"><FiX /></button>
                </div>
                
                {/* 1. Estilos removidos e classe "search-bar-wrapper" aplicada */}
                <div className="search-bar-wrapper" style={{ padding: '0', borderBottom: 'none', marginBottom: '20px' }}>
                    <FiSearch />
                    <input 
                        type="text" 
                        placeholder="Buscar usuário por nome..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <ul className="user-search-results">
                    {loading && <li className="search-result-item">Buscando...</li>}
                    {!loading && results.length > 0 && results.map((user: any) => (
                        <li key={user.id} className="search-result-item" onClick={() => handleUserSelect(user)}>
                            <img src={user.imagem_url ? `http://localhost:3001/${user.imagem_url}` : '/assets/default-avatar.png'} alt={user.name} className="user-avatar" />
                            <div className="user-info">
                                <strong>{user.name}</strong>
                                <span className={`role-badge ${user.role?.toLowerCase()}`}>{user.role}</span>
                            </div>
                        </li>
                    ))}
                    {!loading && results.length === 0 && (
                        <li className="search-result-item no-results">
                            {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhuma sugestão de conversa.'}
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default NewConversationModal;