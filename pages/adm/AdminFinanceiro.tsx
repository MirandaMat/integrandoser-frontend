// src/pages/adm/AdminFinanceiro.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Finance.css';
import { FiDollarSign, FiDownload, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';
import { IoIosSend } from 'react-icons/io'; 
import InvoiceModal from '../InvoiceModal'; 
import LineChart from '../LineChart'; 
import ConfirmationModal from '../ConfirmationModal'; 
import ReceiptModal from '../ReceiptModal';

const StatCard = ({ title, value, chartData, chartColor }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="stat-card-title">{title}</span>
      {chartData ? (
          <div className="stat-chart-container" style={{ width: '100%', height: '50px' }}>
              <LineChart data={chartData} dataKey="value" lineColor={chartColor} />
          </div>
      ) : (
          <FiDollarSign size={24} color="#10b981" />
      )}
    </div>
    <span className="stat-card-value">{value}</span>
  </div>
);

const AdminFinanceiro = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    faturamentoBruto: 0,
    comissaoPlataforma: 0,
    comissaoPlataformaAnual: 0, // <-- VOLTE PARA ESTE NOME
    repassesEfetuados: 0,
    comissoesAFaturar: 0
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmModalProps, setConfirmModalProps] = useState({
        title: '',
        message: '',
        onConfirm: () => {},
        confirmButtonType: 'primary' // 'primary' ou 'danger'
    });

  const [monthlyCommissionData, setMonthlyCommissionData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [professionalsRevenue, setProfessionalsRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestInvoices, setLatestInvoices] = useState([]); 
  const [allInvoices, setAllInvoices] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState('');

  const handleOpenReceiptModal = (receiptUrl) => {
      setSelectedReceiptUrl(receiptUrl);
      setIsReceiptModalOpen(true);
  };

  const handleCloseReceiptModal = () => {
      setIsReceiptModalOpen(false);
      setSelectedReceiptUrl('');
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
        const [kpisRes, transRes, profRevenueRes, pendingInvRes, latestInvoicesRes, monthlyCommissionsRes, allInvoicesRes] = await Promise.all([
            fetch('http://localhost:3001/api/finance/kpis', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/professionals-revenue', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/invoices/pending-approval', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/invoices/latest', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/monthly-commissions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('http://localhost:3001/api/finance/invoices/all', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!kpisRes.ok) throw new Error('Falha ao buscar KPIs');
        if (!transRes.ok) throw new Error('Falha ao buscar transações');
        if (!profRevenueRes.ok) throw new Error('Falha ao buscar faturamento dos profissionais');
        if (!pendingInvRes.ok) throw new Error('Falha ao buscar faturas pendentes de aprovação');
        if (!latestInvoicesRes.ok) throw new Error('Falha ao buscar as últimas faturas');
        if (!monthlyCommissionsRes.ok) throw new Error('Falha ao buscar comissões mensais');
        if (!allInvoicesRes.ok) throw new Error('Falha ao buscar todas as faturas');

        const kpisData = await kpisRes.json();
        const transactionsData = await transRes.json();
        const profRevenueData = await profRevenueRes.json();
        const latestInvoicesData = await latestInvoicesRes.json();
        const monthlyCommissionsData = await monthlyCommissionsRes.json();
        const allInvoicesData = await allInvoicesRes.json();
        
        const latestProfessionalInvoices = latestInvoicesData.filter(invoice => invoice.role === 'PROFISSIONAL');

        setKpis(kpisData);
        setTransactions(transactionsData);
        setProfessionalsRevenue(profRevenueData);
        setLatestInvoices(latestProfessionalInvoices);
        setAllInvoices(allInvoicesData);

        const formattedData = monthlyCommissionsData.map(item => ({
            name: item.month.toString(),
            value: item.total_commission
        }));
        setMonthlyCommissionData(formattedData);

    } catch (error) {
        console.error("Falha ao buscar dados financeiros:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderInvoiceStatus = (status) => {
      let statusText = 'Desconhecido';
      let className = 'cancelled';

      switch (status) {
          case 'completed':
              statusText = 'Pago';
              className = 'completed';
              break;
          case 'pending':
              statusText = 'Pendente';
              className = 'pending';
              break;
          case 'paid': // 'paid' significa comprovante enviado, ainda pendente de ação
              statusText = 'Pendente';
              className = 'pending';
              break;
          case 'rejected':
              statusText = 'Rejeitado';
              className = 'rejected';
              break;
          case 'cancelled':
              statusText = 'Cancelado';
              className = 'cancelled';
              break;
          default:
              statusText = status;
              break;
      }
      return <span className={`status-badge ${className}`}>{statusText}</span>;
  };

  // Função que contém a lógica de API para aprovar
  const approvePayment = async (invoiceId) => {
      const token = localStorage.getItem('token');
      try {
          const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: 'completed' })
          });
          if (!response.ok) throw new Error('Falha ao aprovar fatura.');
          await fetchData(); // Recarrega os dados
      } catch (error) {
          console.error('Falha ao aprovar fatura:', error);
          alert('Falha ao aprovar fatura.');
      } finally {
          setIsConfirmModalOpen(false); // Fecha o modal
      }
  };

  // Função que contém a lógica de API para rejeitar
  const rejectPayment = async (invoiceId) => {
      const token = localStorage.getItem('token');
      try {
          const response = await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ status: 'pending' })
          });
          if (!response.ok) throw new Error('Falha ao rejeitar fatura.');
          await fetchData(); // Recarrega os dados
      } catch (error) {
          console.error('Falha ao rejeitar fatura:', error);
          alert('Falha ao rejeitar fatura.');
      } finally {
          setIsConfirmModalOpen(false); // Fecha o modal
      }
  };

  const handleApprove = (invoiceId) => {
      setConfirmModalProps({
          title: 'Confirmar Aprovação',
          message: `Tem certeza que deseja aprovar o pagamento da fatura #${invoiceId}? Esta ação criará uma transação concluída.`,
          onConfirm: () => approvePayment(invoiceId),
          confirmButtonType: 'primary'
      });
      setIsConfirmModalOpen(true);
  };

  const handleReject = (invoiceId) => {
      setConfirmModalProps({
          title: 'Confirmar Rejeição',
          message: `Tem certeza que deseja rejeitar o comprovante da fatura #${invoiceId}? O status voltará para 'Pendente'.`,
          onConfirm: () => rejectPayment(invoiceId),
          confirmButtonType: 'danger' // Usaremos o estilo de perigo aqui
      });
      setIsConfirmModalOpen(true);
  };

  const handleGerarRelatorio = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/api/finance/report/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio_financeiro.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Falha ao gerar o relatório:', error);
      alert('Falha ao gerar o relatório financeiro.');
    }
  };

  const handleOpenInvoiceModal = (professional) => {
    setSelectedProfessional(professional);
    setIsInvoiceModalOpen(true);
  };
  
  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setSelectedProfessional(null);
  };

  const handleInvoiceSent = () => {
    fetchData(); 
  };
  
  const currentMonthValue = monthlyCommissionData.find(item => item.name === (new Date().getMonth() + 1).toString())?.value || 0;

  if (loading) return <p>Carregando dados financeiros...</p>;

  return (
    <>
      <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          onConfirm={confirmModalProps.onConfirm}
          confirmButtonType={confirmModalProps.confirmButtonType}
      />
      <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={handleCloseReceiptModal}
          receiptUrl={selectedReceiptUrl}
      />
      <div className="admin-header">
        <h1>Financeiro</h1>
      </div>

      <div className="stats-grid">
        <StatCard 
            title="Faturamento Bruto Anual" 
            value={parseFloat(kpis.comissaoPlataformaAnual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            chartData={monthlyCommissionData} 
            chartColor="#10b981" 
        />
        <StatCard 
            title="Faturamento Bruto Mensal" 
            value={parseFloat(currentMonthValue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            chartData={monthlyCommissionData} 
            chartColor="#10b981" 
        />
        <StatCard 
            title="Comissões a Faturar" 
            value={parseFloat(kpis.comissoesAFaturar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
        />
      </div>

      <div className="management-section">
        <div className="management-header">
            <h2>Gerenciamento de Faturas</h2>
            <button onClick={() => navigate('/admin/financeiro/faturas')} className="btn-new-user">
                Gerenciar Todas as Faturas
            </button>
        </div>
        <table className="user-table">
            <thead>
                <tr>
                    <th>Profissional</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Comprovante</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {latestInvoices.length > 0 ? (
                    latestInvoices.map((inv) => (
                        <tr key={inv.id}>
                            <td>{inv.user_name || inv.email}</td>
                            <td>{inv.description}</td>
                            <td className='text-negative'>
                                {parseFloat(inv.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                            <td>{renderInvoiceStatus(inv.status)}</td>
                            <td>
                                {inv.receipt_url ? (
                                    <button
                                        className="action-btn"
                                        title="Ver Comprovante"
                                        onClick={() => handleOpenReceiptModal(inv.receipt_url)}
                                    >
                                        <FiEye size={18} />
                                    </button>
                                ) : (
                                    'N/A'
                                )}
                            </td>
                            <td className="action-buttons">
                                {inv.receipt_url && inv.status === 'paid' ? (
                                    <>
                                        <button onClick={() => handleApprove(inv.id)} className="action-btn" title="Aprovar Comprovante">
                                            <FiCheckCircle size={18} color="#10B981"/>
                                        </button>
                                        <button onClick={() => handleReject(inv.id)} className="action-btn" title="Rejeitar Comprovante">
                                            <FiXCircle size={18} color="#EF4444"/>
                                        </button>
                                    </>
                                ) : (
                                    <span>--</span>
                                )}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={7}>Nenhuma fatura recente para profissionais encontrada.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      <div className="management-section">
        <div className="management-header">
          <h2>Faturamento por Profissional (Sessões Concluídas)</h2>
        </div>
        <table className="user-table">
          <thead>
            <tr>
              <th>Profissional</th>
              <th>Faturamento Total Gerado</th>
              <th>Comissão da Plataforma (25%)</th> 
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {professionalsRevenue.map((prof) => {
                const hasExistingInvoice = allInvoices.some(
                    (invoice) => invoice.user_id === prof.user_id && (invoice.status === 'pending' || invoice.status === 'paid')
                );
                
                return (
                    <tr key={prof.professional_id}>
                        <td>{prof.professional_name}</td>
                        <td>
                            {parseFloat(prof.total_revenue).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className='text-positive'>
                            {(prof.total_revenue * 0.25).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="action-buttons">
                            <Link to={`/admin/financeiro/profissional/${prof.professional_id}`} className="action-btn" title="Ver Detalhes">
                                <FiEye size={18} />
                            </Link>
                            <button
                                onClick={() => handleOpenInvoiceModal(prof)}
                                className="action-btn"
                                title="Cobrar Comissão"
                                disabled={hasExistingInvoice}
                            >
                                <IoIosSend size={18} />
                            </button>
                        </td>
                    </tr>
                );
            })}
            {professionalsRevenue.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhum faturamento de sessões concluídas encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="management-section">
        <div className="management-header">
          <h2>Últimas Transações</h2>
          <button className="btn-new-user" onClick={handleGerarRelatorio}><FiDownload/> Gerar Relatório</button>
        </div>
        <table className="user-table transactions-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Usuário/Origem</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Comprovante</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td>{t.type}</td>
                <td>{t.user}</td>
                <td className={t.value > 0 ? 'text-positive' : 'text-negative'}>
                    {t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td><span className={`status-badge ${t.status.toLowerCase()}`}>{t.status}</span></td>
                <td>
                  {t.receipt_url ? (
                    <button
                        className="action-btn"
                        title="Ver Comprovante"
                        onClick={() => handleOpenReceiptModal(t.receipt_url)}
                    >
                        <FiEye size={18} />
                    </button>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        professional={selectedProfessional}
        onInvoiceSent={handleInvoiceSent}
      />
    </>
  );
};

export default AdminFinanceiro;