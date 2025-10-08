// src/pages/paciente/PacienteFinanceiro.tsx

import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/Admin.css';
import '../../styles/Finance.css';
import { FiDownload, FiCreditCard, FiEye } from 'react-icons/fi';
import InvoicePaymentModal from '../InvoicePaymentModal';
import ReceiptModal from '../ReceiptModal';

const PacienteFinanceiro = () => {
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [sessionHistory, setSessionHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    
    // Estados para o modal de visualização de comprovante
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

    const [alertInfo, setAlertInfo] = useState({ isOpen: false, title: '', message: '' });

    const showAlert = (title, message) => {
        setAlertInfo({ isOpen: true, title, message });
    };

    const handleCloseAlert = () => {
        setAlertInfo({ isOpen: false, title: '', message: '' });
    };

    const token = useMemo(() => localStorage.getItem('token'), []);

    const handlePayClick = (invoiceId: number) => {
        setSelectedInvoiceId(invoiceId);
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = (updatedInvoice) => {
        setIsPaymentModalOpen(false);
        setSelectedInvoiceId(null);

        if (updatedInvoice) {
            setPendingInvoices(prevInvoices => 
                prevInvoices.map(inv => 
                    inv.id === updatedInvoice.id ? updatedInvoice : inv
                )
            );
        } else {
            fetchData(); 
        }
    };
    
    const handleViewReceipt = (receiptUrl: string) => {
        setViewingReceiptUrl(receiptUrl);
        setIsReceiptModalOpen(true);
    };

    const handleCloseReceiptModal = () => {
        setIsReceiptModalOpen(false);
        setViewingReceiptUrl(null);
    };

    const handleDownloadInvoice = async (invoiceId: number) => {
        try {
            const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao baixar a fatura.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fatura_${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error("Erro no download:", err);
            showAlert('Erro no Download', err.message || 'Ocorreu uma falha ao tentar baixar a fatura. Tente novamente mais tarde.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invoicesRes, transactionsRes, sessionsRes] = await Promise.all([
                fetch('http://localhost:3001/api/finance/my-invoices', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/finance/my-transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/finance/my-sessions/patient', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!invoicesRes.ok || !transactionsRes.ok || !sessionsRes.ok) {
                const errorRes = [invoicesRes, transactionsRes, sessionsRes].find(res => !res.ok);
                const errorData = errorRes ? await errorRes.json() : { message: 'Falha ao carregar dados financeiros.' };
                throw new Error(errorData.message);
            }

            const invoicesData = await invoicesRes.json();
            const transactionsData = await transactionsRes.json();
            const sessionsData = await sessionsRes.json();

            setPendingInvoices(invoicesData);
            setPaymentHistory(transactionsData);
            setSessionHistory(sessionsData);

        } catch (err: any) {
            showAlert('Erro ao Carregar Dados', err.message || 'Não foi possível carregar suas informações financeiras. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    if (loading) return <p>Carregando dados financeiros...</p>;

    return (
        <>
            <div className="admin-header">
                <h1>Financeiro</h1>
            </div>

            {/* Seção de Faturas Pendentes */}
            <div className="management-section">
                <div className="management-header">
                    <h2>Gerenciamento de Faturas</h2>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingInvoices.length > 0 ? (
                            pendingInvoices.map((inv: any) => {
                                let statusText = 'Pendente';
                                let statusClass = 'pending';
                                if (inv.status === 'paid') {
                                    statusText = 'Aguardando Aprovação';
                                    statusClass = 'awaiting';
                                } else if (inv.status === 'rejected') {
                                    statusText = 'Pagamento Rejeitado';
                                    statusClass = 'rejected';
                                }
                                
                                const isActionable = inv.status === 'pending' || inv.status === 'rejected';

                                return (
                                    <tr key={inv.id}>
                                        <td>#{inv.id}</td>
                                        <td>{inv.description}</td>
                                        <td className='text-negative'>
                                            {parseFloat(inv.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td>{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                                        <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                                        <td className="action-buttons">
                                            <button
                                                className="btn-pay"
                                                onClick={() => handlePayClick(inv.id)}
                                                title={isActionable ? "Pagar Fatura" : "Pagamento já enviado para aprovação"}
                                                disabled={!isActionable}
                                            >
                                                <FiCreditCard /> Pagar
                                            </button>
                                            <button 
                                                className="btn-download" 
                                                title="Baixar Fatura" 
                                                onClick={() => handleDownloadInvoice(inv.id)}
                                            >
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6}>Nenhuma fatura pendente ou aguardando aprovação.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Histórico de Pagamentos (Aprovados) */}
            <div className="management-section">
                <div className="management-header">
                    <h2>Histórico de Pagamentos (Aprovados)</h2>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Data de Pagamento</th>
                            <th>Tipo</th>
                            <th>Profissional</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Comprovante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paymentHistory.map((p: any) => (
                            <tr key={p.id}>
                                <td>{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                                <td>{p.type}</td>
                                <td>{p.professional_name}</td>
                                <td>{p.value ? parseFloat(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}</td>
                                <td>
                                    <span className={`status-badge completed`}>
                                        {p.status}
                                    </span>
                                </td>
                                <td className="action-buttons">
                                    {p.receipt_url ? (
                                        <>
                                            <button 
                                                className="btn-view" 
                                                title="Ver Comprovante"
                                                onClick={() => handleViewReceipt(p.receipt_url)}
                                            >
                                                <FiEye />
                                            </button>
                                            <a 
                                                href={`http://localhost:3001/${p.receipt_url}`} 
                                                download 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="btn-download"
                                                title="Baixar Comprovante"
                                            >
                                                <FiDownload />
                                            </a>
                                        </>
                                    ) : (
                                        <span>N/A</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paymentHistory.length === 0 && <tr><td colSpan={6}>Nenhum pagamento aprovado encontrado.</td></tr>}
                    </tbody>
                </table>
            </div>

            <InvoicePaymentModal
                isOpen={isPaymentModalOpen}
                onClose={handleClosePaymentModal}
                invoiceId={selectedInvoiceId}
            />

            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={handleCloseReceiptModal}
                receiptUrl={viewingReceiptUrl}
            />

            {/* Modal de Alerta Customizado */}
            {alertInfo.isOpen && (
                <div className="modal-overlay">
                    <div className="alert-modal-content">
                        <div className="alert-modal-header">
                            <h2>{alertInfo.title}</h2>
                        </div>
                        <div className="alert-modal-body">
                            <p>{alertInfo.message}</p>
                        </div>
                        <div className="alert-modal-footer">
                            <button className="btn-primary" onClick={handleCloseAlert}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PacienteFinanceiro;