// src/components/Modal.tsx
import React from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string; // Prop opcional para estilização customizada
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, contentClassName = '' }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // O overlay que escurece o fundo
    <div className="modal-overlay" onClick={onClose}>
      {/* O contêiner do conteúdo do modal */}
      <div className={`modal-content ${contentClassName}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;