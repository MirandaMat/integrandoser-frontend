import React, { useState, useEffect } from 'react';
import '../../styles/Finance.css';
import axios from 'axios'; // Importar axios ou usar fetch

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const api = axios.create({
    baseURL: `${apiUrl}/api`,
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

const ChargeCard = ({ userType, userLabel, users }) => {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            // Usa a instância da API para fazer a chamada
            await api.post('/finance/my-invoices', {
                recipient_user_id: selectedUserId,
                amount: parseFloat(amount),
                dueDate,
                description
            });
            setMessage('Cobrança gerada com sucesso!');
            // Limpar formulário
            setSelectedUserId(''); setAmount(''); setDueDate(''); setDescription('');
        } catch (error: any) {
            setMessage(`Erro: ${error.response?.data?.message || 'Falha ao gerar cobrança'}`);
        }
    };

    return (
        <div className="stat-card" style={{ padding: '2rem' }}>
            <h3 className="stat-card-title">Gerar Cobrança para {userLabel}</h3>
            <form onSubmit={handleSubmit} className="charge-form">
                <div className="form-group">
                    <label>Selecione o {userLabel}</label>
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                        <option value="">Selecione...</option>
                        {users.map((user: any) => (
                            <option key={user.id} value={user.user_id}>
                                {user.nome || user.nome_empresa}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" placeholder="Ex: 150.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Data de Vencimento</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <input type="text" placeholder="Ex: Comissão Mensal" value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
                <button type="submit" className="btn-new-user">Gerar Cobrança</button>
            </form>
            {message && <p style={{ marginTop: '1rem', color: message.startsWith('Erro') ? 'red' : 'green' }}>{message}</p>}
        </div>
    );
};


const ProfissionalCobranca = () => {
    const [associates, setAssociates] = useState({ patients: [], companies: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAssociates = async () => {
            try {
                const response = await api.get('/users/my-associates');
                setAssociates(response.data);
            } catch (error) {
                console.error("Erro ao carregar associados", error);
            } finally {
                setLoading(false);
            }
        };
        loadAssociates();
    }, []);

    if (loading) return <p>Carregando seus pacientes e empresas...</p>;

    return (
        <>
            <div className="admin-header">
                <h1>Gerar Cobranças</h1>
                <p>Envie cobranças de sessões para seus pacientes e empresas parceiras.</p>
            </div>
            <div className="stats-grid">
                <ChargeCard userType="paciente" userLabel="Paciente" users={associates.patients} />
                <ChargeCard userType="empresa" userLabel="Empresa" users={associates.companies} />
            </div>
        </>
    );
};

export default ProfissionalCobranca;