import React, { useState, useEffect, useRef } from 'react';
import { FiFilter, FiCalendar, FiSearch, FiCheckCircle, FiXCircle, FiChevronDown } from 'react-icons/fi';
import '../../styles/Finance.css';

const CustomFilterSelector = ({ options, selectedValue, onValueChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Efeito para fechar o menu ao clicar fora dele
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        onValueChange(value);
        setIsOpen(false);
    };
    
    const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || 'Selecionar...';

    return (
        <div className="custom-filter-selector" ref={dropdownRef}>
            <button 
                className="filter-trigger-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedLabel}</span>
                <FiChevronDown className={`chevron-icon ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="filter-dropdown-menu">
                    {options.map(option => (
                        <button 
                            key={option.value} 
                            onClick={() => handleSelect(option.value)}
                            className={selectedValue === option.value ? 'active' : ''}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminFaturas = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    //const [statusFilter, setStatusFilter] = useState('all');

    const [roleFilter, setRoleFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // OPÇÕES PARA O FILTRO DE PERFIL
    const roleOptions = [
        { value: 'all', label: 'Categorias' },
        { value: 'paciente', label: 'Paciente' },
        { value: 'profissional', label: 'Profissional' },
        { value: 'empresa', label: 'Empresa' },
    ];

    const fetchInvoices = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            // Nova rota para buscar todas as faturas com dados de usuário
            const response = await fetch('http://localhost:3001/api/finance/invoices/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar faturas');
            const data = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error('Erro ao buscar faturas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Função para atualizar o status da fatura
    const handleStatusUpdate = async (invoiceId, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3001/api/finance/invoices/${invoiceId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            fetchInvoices(); // Recarrega a lista após a atualização
        } catch (error) {
            console.error('Falha ao atualizar o status da fatura:', error);
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        //const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter;
        const matchesRole = roleFilter === 'all' || invoice.role.toLowerCase() === roleFilter;
        const matchesSearch = searchTerm === '' || 
                              invoice.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              invoice.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const invoiceDate = new Date(invoice.due_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesDate = (!start || invoiceDate >= start) && (!end || invoiceDate <= end);

        //return matchesStatus && matchesRole && matchesSearch && matchesDate;
        return matchesRole && matchesSearch && matchesDate;
    });

    if (loading) {
        return <p>Carregando faturas...</p>;
    }

    return (
        <>
            <div className="admin-header">
                <h1>Gerenciamento de Faturas</h1>
            </div>
            
            <div className="management-section">
                <div className="user-controls" style={{ marginBottom: '20px' }}>
                    <div className="user-controls">
                        <div className="search-bar">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Buscar por usuário, descrição..."
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    
                        <div className="filter-group">
                            <CustomFilterSelector 
                                options={roleOptions}
                                selectedValue={roleFilter}
                                onValueChange={setRoleFilter}
                            />
                            <div className="date-filter-wrapper">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <FiCalendar className="date-filter-icon" />
                            </div>
                            <div className="date-filter-wrapper">
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                <FiCalendar className="date-filter-icon" />
                            </div>
                        </div>
                    </div>
                </div>

                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuário</th>
                            <th>Cobrado por</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Comprovante</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length > 0 ? (
                            filteredInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.id}</td>
                                    <td>
                                        <div className="user-name-cell">
                                            <span>{inv.user_name || inv.email}</span>
                                            <span className={`role-badge ${inv.role.toLowerCase()}`}>{inv.role}</span>
                                        </div>
                                    </td>
                                    <td>{inv.creator_name}</td>
                                    <td>{inv.description}</td>
                                    <td className={inv.amount > 0 ? 'text-positive' : 'text-negative'}>
                                        {parseFloat(inv.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                                    <td><span className={`status-badge ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                                    <td>
                                        {inv.receipt_url ? (
                                            <a href={`http://localhost:3001/${inv.receipt_url}`} target="_blank" rel="noopener noreferrer">Ver</a>
                                        ) : (
                                            <span>N/A</span>
                                        )}
                                    </td>
                                    <td style={{ width: '150px' }}>
                                        {inv.status !== 'paid' && (
                                            <button onClick={() => handleStatusUpdate(inv.id, 'paid')} className="action-btn" title="Marcar como Pago">
                                                <FiCheckCircle size={18} color="#10B981"/>
                                            </button>
                                        )}
                                        {inv.status !== 'pending' && (
                                            <button onClick={() => handleStatusUpdate(inv.id, 'pending')} className="action-btn" title="Marcar como Pendente">
                                                <FiXCircle size={18} color="#EF4444"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8}>Nenhuma fatura encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default AdminFaturas;