// src/components/InvoicePaymentModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Finance.css'; 
import { FiX, FiCheckCircle, FiCopy, FiUpload, FiLoader, FiAlertTriangle } from 'react-icons/fi';

const InvoicePaymentModal = ({ isOpen, onClose, invoiceId }) => {
    const [details, setDetails] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar Código PIX');
    const [isLoading, setIsLoading] = useState(false);

    const resetState = useCallback(() => {
        setDetails(null);
        setSelectedFile(null);
        setError('');
        setSuccess('');
        setIsSubmitting(false);
        setIsLoading(false);
        setCopyButtonText('Copiar Código PIX');
    }, []);

    useEffect(() => {
        if (isOpen && invoiceId) {
            resetState();
            const fetchDetails = async () => {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                try {
                    const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/payment-details`, {
                    headers: { 'Authorization': `Bearer ${token}` } 
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.message || 'Falha ao buscar detalhes da fatura.');
                    }
                    setDetails(data);
                } catch (error) { 
                    console.error("Erro ao buscar detalhes da fatura:", error); 
                    setError(error.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchDetails();
        }
    }, [isOpen, invoiceId, resetState]);

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError('Por favor, selecione um arquivo de comprovante.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('receipt', selectedFile);

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/upload-receipt`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha no envio do comprovante.');
            }
            setSuccess(data.message || 'Comprovante enviado com sucesso!');

            // Passa a fatura atualizada para a função onClose
            setTimeout(() => {
                onClose(data.invoice); 
            }, 2000);

        } catch (err) { 
            console.error("Erro no upload:", err);
            setError(err.message || 'Ocorreu uma falha no envio. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyPix = () => {
        if (details?.pixDetails?.copy_paste_code) {
            navigator.clipboard.writeText(details.pixDetails.copy_paste_code)
                .then(() => {
                    setCopyButtonText('Copiado!');
                    setTimeout(() => setCopyButtonText('Copiar Código PIX'), 2000);
                })
                .catch(err => {
                    setError('Não foi possível copiar o código PIX. Tente manualmente.');
                    console.error('Erro ao copiar:', err);
                });
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose(null); // Passa null pois não houve atualização
        }
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="modal-status-indicator">
                    <FiLoader className="spin-animation" size={48} />
                    <p>Carregando detalhes da fatura...</p>
                </div>
            );
        }

        if (error && !details) {
            return (
                <div className="modal-status-indicator">
                    <FiAlertTriangle size={48} color="var(--danger-color)" />
                    <p className="error-message">{error}</p>
                </div>
            );
        }

        if (success) {
            return (
                <div className="modal-status-indicator">
                    <FiCheckCircle size={48} color="var(--secondary-color)" />
                    <p className="success-message">{success}</p>
                    <p>O modal fechará em breve...</p>
                </div>
            )
        }

        if (details) {
            return (
                <>
                    {/* --- Resumo da Fatura --- */}
                    <div className="invoice-summary">
                        <div className="summary-item">
                            <span>Valor a Pagar</span>
                            <strong className="text-negative">
                                {parseFloat(details.invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </strong>
                        </div>
                        <div className="summary-item">
                            <span>Vencimento</span>
                            <strong>{new Date(details.invoice.due_date).toLocaleDateString('pt-BR')}</strong>
                        </div>
                    </div>

                    {/* --- Seção de Pagamento PIX --- */}
                    <div className="pix-section">
                        <div className="pix-qr-section">
                            <h4>Pague com QR Code</h4>
                            <img src={details.pixDetails.qr_code_url} alt="PIX QR Code" className="pix-qr-code" />
                        </div>
                        <div className="pix-manual-payment">
                            <h4>PIX Copia e Cola</h4>
                            <div className="pix-code-display">
                                <code>{details.pixDetails.copy_paste_code}</code>
                            </div>
                            <button onClick={handleCopyPix} className="btn-copy-main">
                                <FiCopy />
                                <span>{copyButtonText}</span>
                            </button>
                        </div>
                    </div>

                    {/* --- Seção de Upload de Comprovante --- */}
                    <div className="upload-section">
                        <h4>Anexe o Comprovante de Pagamento</h4>
                        <label htmlFor="file-upload" className="file-input-label">
                            <FiUpload />
                            <span>{selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo'}</span>
                        </label>
                        <input 
                            id="file-upload"
                            type="file" 
                            onChange={e => setSelectedFile(e.target.files[0])} 
                            className="file-input-hidden"
                            accept="image/png, image/jpeg, application/pdf"
                        />
                        <button 
                            onClick={handleFileUpload} 
                            className="btn-upload" 
                            disabled={isSubmitting || !selectedFile}
                        >
                            {isSubmitting ? 'Enviando...' : 'Confirmar Pagamento'}
                        </button>
                    </div>

                    {error && <p className="error-message modal-scoped-error">{error}</p>}
                </>
            );
        }
        return null;
    };


    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Pagamento de Fatura #{invoiceId}</h2>
                    <button className="modal-close-btn" onClick={() => onClose(null)} disabled={isSubmitting}><FiX /></button>
                </div>
                <div className="modal-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default InvoicePaymentModal;