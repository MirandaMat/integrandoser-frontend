// SUBSTITUA seu componente ConfirmationModal por este

import React from 'react';
import '../styles/Admin.css'; // Mantenha o estilo
import { FiX } from 'react-icons/fi';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmButtonType?: 'primary' | 'danger'; // Prop opcional
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonType = 'primary' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}><FiX /></button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                {/* No JSX original, o modal-footer não existia, vamos adicioná-lo */}
                <div className="form-actions" style={{ paddingTop: '24px', marginTop: '24px' }}>
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    {/* Botão de confirmação com classe dinâmica */}
                    <button 
                        className={`btn-new-user ${confirmButtonType === 'danger' ? 'danger' : ''}`} 
                        onClick={onConfirm}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;