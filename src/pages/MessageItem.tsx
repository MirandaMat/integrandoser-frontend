import { useState } from 'react';
import { FiEdit, FiTrash2, FiSmile, FiCheck, FiX, FiFileText } from 'react-icons/fi';

// Tipagem para as props do componente
interface MessageItemProps {
    message: {
        id: string;
        content: string;
        created_at: string;
        attachments?: { id: string; file_url: string; file_type: string }[];
        reactions?: { user_id: string; emoji: string }[];
    };
    isOwnMessage: boolean;
    onEdit: (messageId: string, newContent: string) => void;
    onDelete: (messageId: string) => void;
    onReact: (messageId: string, emoji: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwnMessage, onEdit, onDelete, onReact }) => {
    const [isHovering, setIsHovering] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [showReactions, setShowReactions] = useState(false);

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    const reactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
    
    // Verifica se a mensagem foi enviada na última hora para permitir ações
    const canPerformAction = (new Date().getTime() - new Date(message.created_at).getTime()) < 60 * 60 * 1000;

    const handleSaveEdit = () => {
        if (editedContent.trim()) {
            onEdit(message.id, editedContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(message.content);
        setIsEditing(false);
    };
    
    return (
        <div 
            className={`message-wrapper ${isOwnMessage ? 'sent-wrapper' : 'received-wrapper'}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setShowReactions(false); // Garante que o popover feche
            }}
        >
            <div className={`message ${isOwnMessage ? 'sent' : 'received'}`}>
                {isEditing ? (
                    <div className="message-edit-form">
                        <input 
                            type="text" 
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                        />
                        <button onClick={handleSaveEdit}><FiCheck /></button>
                        <button onClick={handleCancelEdit}><FiX /></button>
                    </div>
                ) : (
                    <>
                        {/* Renderização de Anexos */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="message-attachments">
                                {message.attachments.map(att => (
                                    <div key={att.id} className="attachment-item">
                                        {att.file_type.startsWith('image/') ? (
                                            <a href={`${apiUrl}/${att.file_url}`} target="_blank" rel="noopener noreferrer">
                                                 <img src={`${apiUrl}/${att.file_url}`} alt="Anexo" className="attachment-image" />
                                            </a>
                                        ) : (
                                            <a href={`${apiUrl}/${att.file_url}`}  target="_blank" rel="noopener noreferrer" className="attachment-file">
                                                <FiFileText />
                                                <span>{att.file_url.split('/').pop()}</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Conteúdo da mensagem */}
                        {message.content}

                        {/* Pop-up de confirmação para apagar */}
                        {isConfirmingDelete && (
                             <div className="delete-confirmation">
                                <p>Apagar?</p>
                                <button onClick={() => onDelete(message.id)}><FiCheck /></button>
                                <button onClick={() => setIsConfirmingDelete(false)}><FiX /></button>
                            </div>
                        )}
                    </>
                )}
                
                {/* Ações de Editar e Apagar (Aparecem no hover, se for o dono e dentro do tempo limite) */}
                {isHovering && !isEditing && isOwnMessage && canPerformAction && !isConfirmingDelete && (
                    <div className="message-actions">
                        <button onClick={() => setIsEditing(true)} title="Editar"><FiEdit size={14} /></button>
                        <button onClick={() => setIsConfirmingDelete(true)} title="Apagar"><FiTrash2 size={14} /></button>
                    </div>
                )}
                
                {/* Botão de Reação (Aparece no hover para todos) */}
                {isHovering && !isEditing && !isConfirmingDelete && (
                    <button className="react-action-btn" onClick={() => setShowReactions(!showReactions)} title="Reagir"><FiSmile size={14} /></button>
                )}
                

                {/* Balão de Reações */}
                {showReactions && (
                    <div className={`reaction-popover ${isOwnMessage ? 'sent' : 'received'}`}>
                        {reactions.map(emoji => (
                            <button key={emoji} onClick={() => { onReact(message.id, emoji); setShowReactions(false); }}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Exibição das Reações existentes */}
                {message.reactions && message.reactions.length > 0 && (
                    <div className="message-reactions-display">
                        {message.reactions.map(r => <span key={r.user_id}>{r.emoji}</span>)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItem;