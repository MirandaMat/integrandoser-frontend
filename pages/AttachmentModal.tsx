// src/components/AttachmentModal.tsx
import React from 'react';
import { FiX, FiImage, FiFileText } from 'react-icons/fi';
import '../styles/messages.css'; // Usaremos o mesmo CSS

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'image' | 'document') => void;
}

const AttachmentModal: React.FC<AttachmentModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h4>Selecione o tipo de anexo</h4>
          <button onClick={onClose} className="modal-close-btn"><FiX /></button>
        </div>
        <div className="modal-body attachment-options">
          <button className="attachment-option-btn" onClick={() => onSelect('image')}>
            <FiImage size={40} />
            <span>Imagem</span>
          </button>
          <button className="attachment-option-btn" onClick={() => onSelect('document')}>
            <FiFileText size={40} />
            <span>Documento</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;