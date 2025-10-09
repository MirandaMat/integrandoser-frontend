import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { FiPaperclip, FiSend, FiSearch, FiPlusCircle, FiX, FiMessageSquare, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import '../styles/messages.css';
import NewConversationModal from './NewConversationModal';
import MessageItem from './MessageItem';
import { useSocket } from '../components/SocketProvider';
import AttachmentModal from './AttachmentModal'; 

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const MessagesPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [isNewConvoModalOpen, setIsNewConvoModalOpen] = useState(false);
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState<any | null>(null);
    const [isChatViewActive, setIsChatViewActive] = useState(false); // 1. Estado para controlar a visão mobile

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const socket = useSocket();
    const location = useLocation();
    const activeConversationRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setConversations(data);
        } catch (error) {
            console.error("Erro ao atualizar lista de conversas:", error);
        }
    };

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            setUserId(userData.id);
            await fetchConversations();
            setLoading(false);
        };
        initialize();

        if (!socket) return;

        socket.on('connect', () => {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.id) socket.emit('register', userData.id);
        });

        socket.on('newMessage', (newMessageData) => {
            const currentActiveConvo = activeConversationRef.current;
            if (currentActiveConvo && (newMessageData.sender_id.toString() === currentActiveConvo.participant_id.toString() || newMessageData.sender_id.toString() === userId)) {
                setMessages(prev => {
                    const messageExists = prev.some(msg => msg.id.toString() === newMessageData.id.toString());
                    if (messageExists) {
                        return prev;
                    }
                    return [...prev, newMessageData];
                });
            }
            fetchConversations();
        });

        socket.on('messageUpdated', (updatedMessage) => {
            setMessages(prev => prev.map(m => m.id.toString() === updatedMessage.id.toString() ? updatedMessage : m));
        });
        
        socket.on('messageDeleted', (deletedMessageId) => {
            setMessages(prev => prev.filter(m => m.id.toString() !== deletedMessageId.toString()));
        });

        socket.on('messageReaction', (reactionData) => {
            const { messageId, userId, emoji } = reactionData;

            setMessages(prevMessages => {
                return prevMessages.map(msg => {
                    if (msg.id.toString() !== messageId.toString()) {
                        return msg;
                    }

                    const existingReactions = msg.reactions || [];
                    const userReactionIndex = existingReactions.findIndex(r => r.user_id.toString() === userId.toString());
                    let newReactions;

                    if (userReactionIndex > -1) {
                        newReactions = [...existingReactions];
                        newReactions[userReactionIndex] = { user_id: userId, emoji: emoji };
                    } else {
                        newReactions = [...existingReactions, { user_id: userId, emoji: emoji }];
                    }

                    return { ...msg, reactions: newReactions };
                });
            });
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageUpdated');
            socket.off('messageDeleted');
            socket.off('messageReaction');
        };
    }, [userId]);

    useEffect(() => {
        if (!activeConversation) return;
        const fetchMessages = async () => {
            if (activeConversation.last_message === 'Inicie a conversa!') {
                setMessages([]); return;
            }
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/messages/${activeConversation.participant_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setMessages(await response.json());
            } catch (error) { console.error("Erro ao carregar mensagens:", error); }
        };
        fetchMessages();
    }, [activeConversation]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !attachment) || !activeConversation) return;
        const formData = new FormData();
        formData.append('recipient_id', activeConversation.participant_id);
        formData.append('content', newMessage);
        if (attachment) formData.append('attachments', attachment);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!response.ok) throw new Error('Falha ao enviar mensagem');
            const sentMessage = await response.json();
            
            setMessages(prev => [...prev, sentMessage]);
            
            setNewMessage('');
            setAttachment(null);
            fetchConversations();
        } catch (error) { console.error("Erro ao enviar mensagem", error); }
    };


    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newContent })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao editar mensagem');
            }

            setMessages(prevMessages =>
                prevMessages.map(msg =>
                    msg.id.toString() === messageId.toString()
                        ? { ...msg, content: newContent }
                        : msg
                )
            );

        } catch (error) {
            console.error("Erro ao editar mensagem:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao apagar mensagem');
            }
            
            setMessages(prevMessages =>
                prevMessages.filter(msg => msg.id.toString() !== messageId.toString())
            );

        } catch (error) {
            console.error("Erro ao apagar mensagem:", error);
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/${messageId}/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ emoji })
            });

            if (!response.ok) {
                throw new Error('Falha ao registrar reação');
            }
        } catch (error) {
            console.error("Erro ao enviar reação:", error);
        }
    };
    const handleAttachmentClick = () => {
        setIsAttachmentModalOpen(true);
    };
    const handleAttachmentTypeSelect = (type: 'image' | 'document') => {
        setIsAttachmentModalOpen(false);
        const fileInput = fileInputRef.current;
        if (fileInput) {
            if (type === 'image') {
                fileInput.accept = 'image/*';
            } else {
                fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
            }
            fileInput.click();
        }
    };
    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setAttachment(e.target.files[0]); } };
    const handleStartConversation = (user: any) => {
        if (!user || !user.id) return;

        const existingConvo = conversations.find((c: any) => c.participant_id.toString() === user.id.toString());

        if (existingConvo) {
            setActiveConversation(existingConvo);
        } else {
            const newConvo = {
                participant_id: user.id,
                participant_name: user.name,
                participant_photo: user.imagem_url,
                last_message: 'Inicie a conversa!',
                last_message_time: new Date().toISOString()
            };

            setConversations(prev => [newConvo, ...prev]);
            setActiveConversation(newConvo);
        }
        setIsChatViewActive(true); // Ativa a visão de chat ao iniciar nova conversa
        setIsNewConvoModalOpen(false);
    };

    const handleDeleteConversation = async () => {
        if (!conversationToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/messages/conversations/${conversationToDelete.participant_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Falha ao apagar a conversa');
            }

            setConversations(prev => prev.filter(c => c.participant_id !== conversationToDelete.participant_id));

            if (activeConversation?.participant_id === conversationToDelete.participant_id) {
                setActiveConversation(null);
                setMessages([]);
                setIsChatViewActive(false); // Garante que a visão de chat feche se a conversa ativa for deletada
            }

        } catch (error) {
            console.error("Erro ao apagar conversa:", error);
        } finally {
            setConversationToDelete(null);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Carregando...</div>;

    return (
        <>
            <AttachmentModal
                isOpen={isAttachmentModalOpen}
                onClose={() => setIsAttachmentModalOpen(false)}
                onSelect={handleAttachmentTypeSelect}
            />

            {conversationToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4>Apagar Conversa</h4>
                            <button onClick={() => setConversationToDelete(null)} className="modal-close-btn"><FiX /></button>
                        </div>
                        <div className="modal-body">
                            <p>Tem certeza que deseja apagar permanentemente sua conversa com <strong>{conversationToDelete.participant_name}</strong>?</p>
                            <p>Esta ação não pode ser desfeita.</p>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setConversationToDelete(null)}>Cancelar</button>
                                <button className="btn-danger" onClick={handleDeleteConversation}>Apagar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NewConversationModal isOpen={isNewConvoModalOpen} onClose={() => setIsNewConvoModalOpen(false)} onSelectUser={handleStartConversation} />
            
            {/* 2. Adiciona classe condicional ao layout principal */}
            <div className={`messages-layout-modern ${isChatViewActive ? 'chat-view-active' : ''}`}>
                <aside className="conversations-sidebar-modern">
                    <div className="sidebar-header">
                        <h3>Conversas</h3>
                        <button className="new-convo-btn" onClick={() => setIsNewConvoModalOpen(true)} title="Nova conversa"><FiPlusCircle size={24} /></button>
                    </div>
                    <div className="search-bar-wrapper">
                        <FiSearch /><input type="text" placeholder="Buscar conversa..." />
                    </div>
                    <ul className="conversation-list">
                        {conversations.map((convo: any) => (
                            <li key={convo.participant_id} className={`conversation-item ${activeConversation?.participant_id === convo.participant_id ? 'active' : ''}`} onClick={() => { setActiveConversation(convo); setIsChatViewActive(true); }}>
                                <div className="conversation-click-area">
                                    <img src={convo.participant_photo ? `${API_URL}/${convo.participant_photo}` : '/assets/default-avatar.png'} alt={convo.participant_name} className="user-avatar" />
                                    <div className="conversation-details">
                                        <p className="conversation-name">{convo.participant_name}</p>
                                        <p className="conversation-preview">{convo.last_message}</p>
                                    </div>
                                    <span className="conversation-time">{new Date(convo.last_message_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    {convo.unread_count > 0 && (
                                        <span className="unread-indicator">
                                            {convo.unread_count}
                                        </span>
                                    )}
                                </div>

                                <button 
                                    className="delete-convo-btn" 
                                    title="Apagar conversa"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConversationToDelete(convo);
                                    }}
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
                <main className={`chat-area-modern ${!activeConversation ? 'no-selection' : ''}`}>
                    {activeConversation ? (
                        <>
                            <header className="chat-header-modern">
                                {/* 3. Adicionar o botão de voltar e seu evento onClick */}
                                <button className="back-to-conversations-btn" onClick={() => { setActiveConversation(null); setIsChatViewActive(false); }} title="Voltar para conversas">
                                    <FiArrowLeft />
                                </button>
                                <img src={activeConversation.participant_photo ? `${API_URL}/${activeConversation.participant_photo}` : '/assets/default-avatar.png'} alt={activeConversation.participant_name} className="user-avatar" />
                                <div className="header-info">
                                    <strong>{activeConversation.participant_name}</strong>
                                    <div className="online-indicator"></div>
                                </div>
                            </header>
                            <div className="messages-container-modern">
                                {messages.map((msg: any) =>
                                    <MessageItem
                                        key={msg.id}
                                        message={msg}
                                        isOwnMessage={msg.sender_id.toString() === userId?.toString()}
                                        onEdit={handleEditMessage}
                                        onDelete={handleDeleteMessage}
                                        onReact={handleReact}
                                    />
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <footer className="chat-footer-modern">
                                {attachment && (
                                    <div className="attachment-preview">
                                        <span>{attachment.name}</span>
                                        <button onClick={() => setAttachment(null)}><FiX /></button>
                                    </div>
                                )}
                                <div className="footer-input-row">
                                    <input type="file" ref={fileInputRef} onChange={handleAttachmentChange} style={{ display: 'none' }} />
                                    <button className="footer-action-btn" onClick={handleAttachmentClick} title="Anexar arquivo"><FiPaperclip /></button>
                                    <div className="message-input-wrapper">
                                        <input type="text" placeholder="Digite sua mensagem..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                                    </div>
                                    <button className="footer-action-btn send-btn" onClick={handleSendMessage} title="Enviar mensagem"><FiSend /></button>
                                </div>
                            </footer>
                        </>
                    ) : (
                        <div className="no-conversation-selected">
                            <FiMessageSquare />
                            <h3>Selecione uma conversa</h3>
                            <p>Ou inicie uma nova para começar a conversar.</p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default MessagesPage;