// src/pages/empresa/EmpresaFinanceiro.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import '../../styles/Admin.css';
import '../../styles/Finance.css';
import { FiCreditCard, FiUsers, FiBarChart2, FiDownload, FiEye, FiCalendar } from 'react-icons/fi'; // Importa FiCalendar
import InvoicePaymentModal from '../InvoicePaymentModal';
import ReceiptModal from '../ReceiptModal';

const StatCard = ({ title, value, icon }) => (
    <div className="stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-card-title">{title}</span>
            {icon}
        </div>
        <span className="stat-card-value">{value}</span>
    </div>
);

const EmpresaFinanceiro = () => {
    // Adiciona a nova propriedade 'annualConsumption' ao estado
    const [statement, setStatement] = useState({
        monthlyConsumption: 0,
        annualConsumption: 0, 
        activeEmployees: 0,
        usageDetails: []
    });
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

    const token = useMemo(() => localStorage.getItem('token'), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Adiciona a nova chamada de API ao Promise.all
            const [statementRes, invoicesRes, annualConsumptionRes] = await Promise.all([
                fetch('http://localhost:3001/api/finance/my-statement/company', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/finance/my-invoices', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3001/api/finance/company/annual-consumption', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!statementRes.ok || !invoicesRes.ok || !annualConsumptionRes.ok) {
                const errorData = await statementRes.json() || await invoicesRes.json() || await annualConsumptionRes.json();
                throw new Error(errorData.message || 'Falha ao buscar dados financeiros.');
            }

            const statementData = await statementRes.json();
            const invoicesData = await invoicesRes.json();
            const annualConsumptionData = await annualConsumptionRes.json();

            // Combina os dados de statement com o novo dado de consumo anual
            setStatement({ ...statementData, annualConsumption: annualConsumptionData.annualConsumption });
            setInvoices(invoicesData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token, fetchData]);

    const handlePayClick = (invoiceId: number) => {
        setSelectedInvoiceId(invoiceId);
        setIsPaymentModalOpen(true);
    };

    const handleClosePaymentModal = (updatedInvoice) => {
        setIsPaymentModalOpen(false);
        setSelectedInvoiceId(null);
        if (updatedInvoice) {
            setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
        } else {
            fetchData();
        }
    };

    const handleViewReceipt = (receiptUrl: string) => {
        setViewingReceiptUrl(receiptUrl);
        setIsReceiptModalOpen(true);
    };

    const handleDownloadInvoice = async (invoiceId: number) => {
        try {
            const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao baixar a fatura.');

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
            setError(err.message || 'Ocorreu uma falha no download.');
        }
    };

    const handleDownloadHistory = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/finance/company/statement/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao baixar o histórico.');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_utilizacao.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("Erro no download do histórico:", err);
            setError(err.message || 'Ocorreu uma falha no download.');
        }
    };

    if (loading) return <p>Carregando dados da empresa...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <div className="admin-header">
                <h1>Financeiro</h1>
            </div>

            <div className="stats-grid">
                <StatCard title="Consumo no Mês" value={(statement.monthlyConsumption || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<FiBarChart2 size={24}/>}/>
                {/* Novo StatCard para Consumo Anual */}
                <StatCard title="Consumo Anual" value={(statement.annualConsumption || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<FiCalendar size={24}/>}/>
                <StatCard title="Colaboradores Ativos" value={(statement.activeEmployees || 0).toString()} icon={<FiUsers size={24}/>}/>
            </div>

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
                        {invoices.length > 0 ? (
                            invoices.map((inv: any) => {
                                let statusText = 'Pendente';
                                let statusClass = 'pending';
                                if (inv.status === 'paid') {
                                    statusText = 'Aguardando Aprovação';
                                    statusClass = 'awaiting';
                                } else if (inv.status === 'rejected') {
                                    statusText = 'Pagamento Rejeitado';
                                    statusClass = 'rejected';
                                } else if (inv.status === 'completed') {
                                    statusText = 'Pago';
                                    statusClass = 'completed';
                                }
                                
                                const isActionable = inv.status === 'pending' || inv.status === 'rejected';

                                return (
                                <tr key={inv.id}>
                                    <td>#{inv.id}</td>
                                    <td>{inv.description}</td>
                                    <td className='text-negative'>
                                        {parseFloat(inv.amount || inv.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td>{new Date(inv.due_date || inv.date).toLocaleDateString('pt-BR')}</td>
                                    <td><span className={`status-badge ${statusClass}`}>{statusText}</span></td>
                                    <td className="action-buttons">
                                        {inv.status === 'paid' && inv.receipt_url && (
                                            <button className="action-btn" title="Ver Comprovante" onClick={() => handleViewReceipt(inv.receipt_url)}>
                                                <FiEye size={18} />
                                            </button>
                                        )}
                                        <button
                                            className="action-btn"
                                            onClick={() => handlePayClick(inv.id)}
                                            title={isActionable ? "Pagar Fatura" : "Pagamento já enviado para aprovação"}
                                            disabled={!isActionable}
                                        >
                                            <FiCreditCard size={18} />
                                        </button>
                                        <button className="action-btn" title="Baixar Fatura" onClick={() => handleDownloadInvoice(inv.id)}>
                                            <FiDownload size={18} />
                                        </button>
                                    </td>
                                </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6}>Nenhuma fatura pendente encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="management-section">
                <div className="management-header">
                    <h2>Histórico de Utilização por Colaborador</h2>
                    <div>
                        <button className="btn-secondary" onClick={handleDownloadHistory}>
                            <FiDownload /> Baixar Histórico
                        </button>
                    </div>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Colaborador</th>
                            <th>Profissional Atendido</th>
                            <th>Custo da Sessão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statement.usageDetails && statement.usageDetails.length > 0 ? (
                            statement.usageDetails.map((u: any) => (
                            <tr key={u.id}>
                                <td>{new Date(u.date).toLocaleDateString('pt-BR')}</td>
                                <td>{u.colaborador}</td>
                                <td>{u.profissional}</td>
                                <td>{(u.cost ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                        ))
                        ) : (
                            <tr><td colSpan={4}>Nenhuma utilização registrada.</td></tr>
                        )}
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
                onClose={() => setViewingReceiptUrl(null)}
                receiptUrl={viewingReceiptUrl}
            />
        </>
    );
};

export default EmpresaFinanceiro;