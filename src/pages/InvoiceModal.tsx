// src/components/InvoiceModal.tsx
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiPercent, FiCalendar, FiFileText, FiUser } from 'react-icons/fi';
import '../styles/Admin.css'; 

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    professional: {
        professional_id: string;
        professional_name: string;
        user_id: string;
        total_revenue: number;
    };
    onInvoiceSent: () => void;
}

const InvoiceModal = ({ isOpen, onClose, professional, onInvoiceSent }: InvoiceModalProps) => {
    const [commissionRate, setCommissionRate] = useState(25);
    const [amount, setAmount] = useState(0);
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (professional) {
            const calculatedAmount = (professional.total_revenue * commissionRate) / 100;
            setAmount(parseFloat(calculatedAmount.toFixed(2)));
            // Preenche a data de vencimento para o dia 10 do próximo mês
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10);
            setDueDate(nextMonth.toISOString().split('T')[0]);
            setDescription(`Comissão referente às sessões do profissional ${professional.professional_name}`);
        }
    }, [professional, commissionRate]);

    const handleSendInvoice = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        const invoiceData = {
            userId: professional.user_id,
            amount: amount,
            dueDate,
            description,
        };

        try {
            const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/finance/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(invoiceData),
            });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Falha ao enviar a cobrança.');
            }

            alert('Cobrança enviada com sucesso!');
            onInvoiceSent(); // Notifica o componente pai para recarregar os dados
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !professional) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Gerar Cobrança de Comissão</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="invoice-details-card">
                    <h3>Detalhes do Faturamento</h3>
                    {/* Linha 90: Agora FiUser foi importado e funcionará */}
                    <div className="detail-item">
                        <FiUser /> <strong>Profissional:</strong> {professional.professional_name}
                    </div>
                    <div className="detail-item">
                        <FiDollarSign /> <strong>Faturamento Total:</strong> {parseFloat(professional.total_revenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <hr />
                    <div className="form-group">
                        <label>Percentual de Comissão</label>
                        <div className="input-with-icon">
                            <FiPercent />
                            <input 
                                type="number" 
                                value={commissionRate} 
                                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)} 
                                min="0" 
                                max="100"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Valor da Cobrança</label>
                        <div className="input-with-icon">
                            <FiDollarSign />
                            <input 
                                type="text" 
                                value={amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                readOnly 
                                className="read-only"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Data de Vencimento</label>
                        <div className="input-with-icon">
                            <FiCalendar />
                            <input 
                                type="date" 
                                value={dueDate} 
                                onChange={(e) => setDueDate(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Descrição</label>
                        <div className="input-with-icon">
                            <FiFileText />
                            <input 
                                type="text" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                {error && <p className="error-message" style={{ marginTop: '20px' }}>{error}</p>}
                
                <div className="form-actions">
                    <button onClick={onClose} className="btn-cancel">Cancelar</button>
                    <button onClick={handleSendInvoice} className="btn-new-user" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar Cobrança'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;