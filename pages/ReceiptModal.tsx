import React from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/Finance.css';

const ReceiptModal = ({ isOpen, onClose, receiptUrl }) => {
    if (!isOpen || !receiptUrl) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Comprovante de Pagamento</h2>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <img
                        src={`http://localhost:3001/${receiptUrl}`}
                        alt="Comprovante"
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 8, boxShadow: '0 2px 8px #0002' }}
                    />
                </div>
                <div className="modal-footer">
                    <button className="close-btn" onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;