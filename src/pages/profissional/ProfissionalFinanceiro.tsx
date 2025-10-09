// src/pages/profissional/ProfissionalFinanceiro.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import '../../styles/Admin.css';
import '../../styles/Finance.css';
// 1. Importar o novo ícone
import { FiDollarSign, FiDownload, FiFileText, FiCreditCard, FiEye, FiCheckCircle, FiXCircle, FiCalendar } from 'react-icons/fi';
import InvoicePaymentModal from '../InvoicePaymentModal';
import ConfirmationModal from '../ConfirmationModal';
import ReceiptModal from '../ReceiptModal';

// Componente StatCard 
const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">{title}</span>
            {icon}
        </div>
        <span className="stat-card-value">{value}</span>
    </div>
);

const ProfissionalFinanceiro = () => {
    const [createdInvoices, setCreatedInvoices] = useState([]);
    const [billingHistory, setBillingHistory] = useState([]);
    const [invoicesToPay, setInvoicesToPay] = useState([]);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [monthlyNetRevenue, setMonthlyNetRevenue] = useState(0);
    // 2. Adicionar novo estado para o rendimento anual
    const [annualNetRevenue, setAnnualNetRevenue] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedReceiptUrl, setSelectedReceiptUrl] = useState('');

    const [confirmationConfig, setConfirmationConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonType: 'primary' as 'primary' | 'danger',
        isInfoOnly: false
    });
    
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const token = useMemo(() => localStorage.getItem('token'), []);
    const apiBaseUrl = useMemo(() => `${apiUrl}/api/finance`, []);

    const showInfoModal = (title, message) => {
        setConfirmationConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => setConfirmationConfig({ ...confirmationConfig, isOpen: false }),
            confirmButtonType: 'primary',
            isInfoOnly: true
        });
    };

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const fetchWithAuth = async (url) => {
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error((await res.json()).message || 'Falha na requisição.');
                return res.json();
            };

            // 3. Adicionar a nova chamada de API ao Promise.all
            const [
                billingHistoryData, 
                invoicesToPayData, 
                transactionHistoryData, 
                monthlyNetRevenueData,
                annualNetRevenueData,
                createdInvoicesData
            ] = await Promise.all([ 
                fetchWithAuth(`${apiBaseUrl}/professional/billing-history`),
                fetchWithAuth(`${apiBaseUrl}/professional/invoices`),
                fetchWithAuth(`${apiBaseUrl}/professional/transaction-history`),
                fetchWithAuth(`${apiBaseUrl}/professional/monthly-net-revenue`),
                fetchWithAuth(`${apiBaseUrl}/professional/annual-net-revenue`),
                fetchWithAuth(`${apiBaseUrl}/professional/created-invoices`)
            ]);

            // 4. Atualizar os estados com os novos dados
            setBillingHistory(billingHistoryData);
            setInvoicesToPay(invoicesToPayData);
            setTransactionHistory(transactionHistoryData);
            setMonthlyNetRevenue(monthlyNetRevenueData.monthlyNetRevenue);
            setAnnualNetRevenue(annualNetRevenueData.annualNetRevenue);
            setCreatedInvoices(createdInvoicesData);

        } catch (err: any) {
            console.error("Erro ao buscar dados de finanças:", err);
            showInfoModal('Erro ao Carregar Dados', err.message);
        } finally {
            setLoading(false);
        }
    }, [token, apiBaseUrl]);

    const executeApprovePayment = async (invoiceId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/invoices/${invoiceId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: 'completed' })
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao aprovar pagamento.');
            showInfoModal('Sucesso!', 'Pagamento aprovado com sucesso!');
            await fetchAllData();
        } catch (err: any) {
            console.error('Falha ao aprovar pagamento:', err);
            showInfoModal('Erro', err.message);
        } finally {
            setConfirmationConfig({ ...confirmationConfig, isOpen: false });
        }
    };

    const executeRejectPayment = async (invoiceId) => {
        try {
            const response = await fetch(`${apiBaseUrl}/invoices/${invoiceId}/reject`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao rejeitar pagamento.');
            showInfoModal('Sucesso!', 'Comprovante rejeitado. O pagador precisará enviar um novo.');
            await fetchAllData();
        } catch (err: any) {
            console.error('Falha ao rejeitar pagamento:', err);
            showInfoModal('Erro', err.message);
        } finally {
            setConfirmationConfig({ ...confirmationConfig, isOpen: false });
        }
    };

    useEffect(() => {
        if (token) {
            fetchAllData();
        }
    }, [token, fetchAllData]);

    const handleApprovePayment = (invoiceId) => {
        setConfirmationConfig({
            isOpen: true,
            title: 'Aprovar Pagamento?',
            message: `Tem certeza que deseja aprovar o pagamento da fatura #${invoiceId}? Esta ação moverá a fatura para o histórico.`,
            onConfirm: () => executeApprovePayment(invoiceId),
            confirmButtonType: 'primary',
            isInfoOnly: false
        });
    };

    const handleRejectPayment = (invoiceId) => {
        setConfirmationConfig({
            isOpen: true,
            title: 'Rejeitar Comprovante?',
            message: `Tem certeza que deseja rejeitar este comprovante para a fatura #${invoiceId}? O status voltará para 'pendente'.`,
            onConfirm: () => executeRejectPayment(invoiceId),
            confirmButtonType: 'danger',
            isInfoOnly: false
        });
    };

    const handleOpenPaymentModal = (invoiceId) => {
        setSelectedInvoiceId(invoiceId);
        setIsPaymentModalOpen(true);
    };

    const handleOpenReceiptModal = (receiptUrl) => {
        setSelectedReceiptUrl(receiptUrl);
        setIsReceiptModalOpen(true);
    };

    const handleDownloadInvoice = async (invoiceId) => {
        try {
            const res = await fetch(`${apiBaseUrl}/invoices/${invoiceId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Falha ao baixar fatura.');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fatura-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            showInfoModal('Erro de Download', err.message);
        }
    };

    const handleGenerateStatement = async () => {
        try {
            const response = await fetch(`${apiBaseUrl}/professional/statement/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error((await response.json()).message || 'Falha ao gerar o extrato.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extrato_financeiro.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('Falha ao gerar o extrato:', err);
            showInfoModal('Erro ao Gerar Extrato', err.message);
        }
    };

    const openStatementModal = () => {
        setConfirmationConfig({
            isOpen: true,
            title: "Gerar Extrato Financeiro",
            message: "Você deseja gerar um extrato em PDF do seu histórico financeiro do mês atual?",
            onConfirm: handleGenerateStatement,
            confirmButtonType: 'primary',
            isInfoOnly: false
        });
    }
    
    const totalPendingCommission = invoicesToPay
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((acc, inv) => acc + parseFloat(inv.amount), 0);

    if (loading) return <p>Carregando seus rendimentos...</p>;

    return (
        <>
            <div className="admin-header">
                <h1>Financeiro</h1>
            </div>

            <div className="stats-grid">
                <StatCard 
                    title="Rendimento Líquido (Mês)"
                    value={monthlyNetRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={<FiDollarSign />}
                />
                {/* 5. Adicionar o novo StatCard */}
                <StatCard 
                    title="Rendimento Líquido (Anual)"
                    value={annualNetRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={<FiCalendar />}
                />
                <StatCard 
                    title="Comissão Pendente"
                    value={totalPendingCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    icon={<FiFileText />}
                />
            </div>

            <div className="management-section">
                <div className="management-header">
                    <h2>Histórico de Cobranças Enviadas</h2>
                    <div>
                        <button className="btn-new-user" onClick={openStatementModal}>
                            <FiDownload /> Baixar Extrato do Mês
                        </button>
                    </div>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Destinatário</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {createdInvoices.length > 0 ? (
                            createdInvoices.map((invoice: any) => {
                                let statusText = invoice.status;
                                let statusClass = invoice.status.toLowerCase();
                                if (invoice.status === 'paid') {
                                    statusText = 'Aguardando Aprovação';
                                    statusClass = 'awaiting';
                                } else if (invoice.status === 'pending') {
                                    statusText = 'Pendente';
                                } else if (invoice.status === 'completed') {
                                    statusText = 'Pago';
                                } else if (invoice.status === 'rejected') {
                                    statusText = 'Rejeitado';
                                }

                                return (
                                <tr key={invoice.id}>
                                    <td>{invoice.recipient_name}</td>
                                    <td className="text-positive">{parseFloat(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td>{new Date(invoice.due_date).toLocaleDateString('pt-BR')}</td>
                                    <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                                    <td className="action-buttons">
                                        {invoice.receipt_url && invoice.status === 'paid' ? (
                                            <>
                                                <button className="action-btn" title="Ver Comprovante" onClick={() => handleOpenReceiptModal(invoice.receipt_url)}>
                                                    <FiEye size={18} />
                                                </button>
                                                <button className="action-btn" title="Aprovar Pagamento" onClick={() => handleApprovePayment(invoice.id)}>
                                                    <FiCheckCircle size={18} color="#10B981"/>
                                                </button>
                                                <button className="action-btn" title="Rejeitar Comprovante" onClick={() => handleRejectPayment(invoice.id)}>
                                                    <FiXCircle size={18} color="#EF4444"/>
                                                </button>
                                            </>
                                        ) : (
                                            <button className="action-btn" title="Baixar Fatura (PDF)" onClick={() => handleDownloadInvoice(invoice.id)}>
                                                <FiDownload size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan={5}>Nenhuma cobrança enviada encontrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="management-section">
                <div className="management-header">
                    <h2>Minhas Faturas</h2>
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
                        {invoicesToPay.length > 0 ? (
                            invoicesToPay.map((inv: any) => {
                                const isActionable = inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'rejected';

                                let statusText = inv.status;
                                if (inv.status === 'paid') statusText = 'Aguardando Aprovação';
                                if (inv.status === 'pending') statusText = 'Pendente';
                                if (inv.status === 'completed') statusText = 'Pago';
                                if (inv.status === 'rejected') statusText = 'Rejeitado';

                                return (
                                    <tr key={inv.id}>
                                        <td>#{inv.id}</td>
                                        <td>{inv.description}</td>
                                        <td className='text-negative'>
                                            {parseFloat(inv.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                                        <td><span className={`status-badge ${inv.status.toLowerCase()}`}>{statusText}</span></td>
                                        <td className="action-buttons">
                                            <button 
                                                className="action-btn" 
                                                disabled={!isActionable}
                                                onClick={() => handleOpenPaymentModal(inv.id)}
                                                title={isActionable ? "Pagar Fatura" : "Pagamento já enviado"}
                                            >
                                                <FiCreditCard size={18} />
                                            </button>
                                            <button 
                                                className="action-btn" 
                                                title="Baixar Fatura" 
                                                onClick={() => handleDownloadInvoice(inv.id)}
                                            >
                                                <FiDownload size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan={6}>Nenhuma fatura de comissão encontrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Seção de Modais */}
            <InvoicePaymentModal 
                isOpen={isPaymentModalOpen} 
                onClose={(updatedInvoice) => {
                    setIsPaymentModalOpen(false);
                    if (updatedInvoice) {
                        setInvoicesToPay(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
                    } else {
                        fetchAllData();
                    }
                }} 
                invoiceId={selectedInvoiceId}
            />
            <ReceiptModal 
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                receiptUrl={selectedReceiptUrl}
            />
            <ConfirmationModal
                isOpen={confirmationConfig.isOpen}
                onClose={() => setConfirmationConfig({ ...confirmationConfig, isOpen: false })}
                onConfirm={confirmationConfig.onConfirm}
                title={confirmationConfig.title}
                message={confirmationConfig.message}
                confirmButtonType={confirmationConfig.confirmButtonType}
            />
        </>
    );
};

export default ProfissionalFinanceiro;