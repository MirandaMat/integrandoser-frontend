import React, { useState, useEffect } from 'react';
import '../../styles/Finance.css';

// Supondo que você tenha uma API para buscar usuários por tipo
const fetchUsersByType = async (role: 'paciente' | 'profissional' | 'empresa') => {
    const token = localStorage.getItem('token');
    // Você precisa criar este endpoint no backend
    const response = await fetch(`http://localhost:3001/api/users?role=${role}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Falha ao buscar usuários do tipo ${role}`);
    return response.json();
};

interface User {
    id: string;
    name: string;
}

const ChargeUserCard = ({ userType, userLabel }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await fetchUsersByType(userType);
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        loadUsers();
    }, [userType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:3001/api/finance/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: selectedUserId,
                    amount: parseFloat(amount),
                    dueDate,
                    description
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            setMessage(`Cobrança para ${selectedUserId} gerada com sucesso!`);
            // Limpar formulário
            setSelectedUserId('');
            setAmount('');
            setDueDate('');
            setDescription('');

        } catch (error: any) {
            setMessage(`Erro: ${error.message}`);
        }
    };

    return (
        <div className="stat-card" style={{ padding: '2rem' }}>
            <h3 className="stat-card-title">Gerar Cobrança para {userLabel}</h3>
            <form onSubmit={handleSubmit} className="charge-form">
                <div className="form-group">
                    <label>Selecione o {userLabel}</label>
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} required>
                        <option value="">Selecione um usuário</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" placeholder="150.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Data de Vencimento</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <input type="text" placeholder="Ex: Sessão de terapia" value={description} onChange={e => setDescription(e.target.value)} required/>
                </div>
                <button type="submit" className="btn-new-user">Gerar Cobrança</button>
            </form>
            {message && <p style={{marginTop: '1rem', color: message.startsWith('Erro') ? 'red' : 'green'}}>{message}</p>}
        </div>
    );
};

const AdminCobranca = () => {
    return (
        <>
            <div className="admin-header">
                <h1>Painel de Cobranças</h1>
                <p>Gere cobranças individuais para pacientes ou empresas.</p>
            </div>

            <div className="stats-grid">
                <ChargeUserCard userType="paciente" userLabel="Paciente" />
                <ChargeUserCard userType="empresa" userLabel="Empresa" />
            </div>
        </>
    );
};
export default AdminCobranca;