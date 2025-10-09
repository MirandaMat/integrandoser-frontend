// src/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, isAdmin, isProfissional, isEmpresa } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createNotification } = require('../services/notificationService.js'); 
const { sendInvoiceNotificationEmail, sendReceiptUploadNotificationEmail } = require('../config/mailer.js');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');



// Função auxiliar para converter BigInt para String
const serializeBigInts = (data) => {
    // 1. Converte BigInt para string
    if (typeof data === 'bigint') {
        return data.toString();
    }

    // 2. NOVO: Preserva objetos Date sem alterá-los
    if (data instanceof Date) {
        return data;
    }

    // 3. Trata nulos e outros tipos primitivos
    if (data === null || typeof data !== 'object') {
        return data;
    }

    // 4. Mapeia arrays recursivamente
    if (Array.isArray(data)) {
        return data.map(item => serializeBigInts(item));
    }

    // 5. Mapeia objetos recursivamente
    const newObj = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            newObj[key] = serializeBigInts(data[key]);
        }
    }
    return newObj;
};



// ===============================================
// --- ROTAS DO ADMIN ---
// As rotas do admin são protegidas pelos middlewares 'protect' e 'isAdmin'.
// ===============================================

// Rota para ADMIN buscar KPIs
router.get('/kpis', [protect, isAdmin], async (req, res) => {
    try {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);


        const grossRevenueRows = await db.query( //
            "SELECT SUM(amount) as total FROM transactions WHERE type = 'payment' AND status = 'completed' AND transaction_date BETWEEN ? AND ?", //
            [firstDayOfMonth, lastDayOfMonth] //
        );
        const faturamentoBruto = grossRevenueRows[0]?.total || 0; //
        const faturamentoBrutoAnual = grossRevenueRows[0]?.annual_total || 0; // <-- NOVO VALOR CORRETO

        const commissionRows = await db.query( //
            "SELECT SUM(CASE WHEN transaction_date BETWEEN ? AND ? THEN amount ELSE 0 END) as monthly_total, SUM(CASE WHEN YEAR(transaction_date) = YEAR(CURDATE()) THEN amount ELSE 0 END) as annual_total FROM transactions WHERE type = 'commission' AND status = 'completed'", //
            [firstDayOfMonth, lastDayOfMonth] //
        );
        const comissaoPlataforma = commissionRows[0]?.monthly_total || 0; //
        const comissaoPlataformaAnual = commissionRows[0]?.annual_total || 0; // <-- Valor anual correto

        const payoutRows = await db.query( //
            "SELECT SUM(amount) as total FROM transactions WHERE type = 'payout' AND status = 'completed' AND transaction_date BETWEEN ? AND ?", //
            [firstDayOfMonth, lastDayOfMonth] //
        );
        const repassesEfetuados = Math.abs(payoutRows[0]?.total || 0); //


        // filtra apenas faturas para profissionais.
        const pendingCommissionsRows = await db.query( //
            `SELECT SUM(commission_value) as total 
             FROM professional_billings 
             WHERE status = 'unbilled'` //
        );
        const comissoesAFaturar = pendingCommissionsRows[0]?.total || 0; //

        res.json({
            faturamentoBruto, //
            comissaoPlataforma, //
            comissaoPlataformaAnual, // <-- Enviando o valor correto
            repassesEfetuados, //
            comissoesAFaturar //
        });

    } catch (error) {
        console.error('Error fetching financial KPIs:', error);
        res.status(500).json({ message: 'Erro ao buscar dados financeiros.' });
    }
});

// Rota para ADMIN buscar comissões mensais
router.get('/monthly-commissions', [protect, isAdmin], async (req, res) => {
    try {
        const query = `
            SELECT 
                MONTH(transaction_date) as month,
                SUM(amount) as total_commission
            FROM transactions
            WHERE type = 'commission'
            AND status = 'completed'
            AND YEAR(transaction_date) = YEAR(CURDATE())
            GROUP BY month
            ORDER BY month ASC;
        `;
        const monthlyCommissions = await db.query(query);
        res.json(monthlyCommissions);
    } catch (error) {
        console.error('Error fetching monthly commissions:', error);
        res.status(500).json({ message: 'Erro ao buscar comissões mensais.' });
    }
});


// ENCONTRE esta rota e substitua pela versão corrigida abaixo:

router.get('/transactions', [protect, isAdmin], async (req, res) => {
    try {
        const transactions = await db.query(
            `SELECT 
                t.id, 
                t.transaction_date as date, 
                t.type, 
                t.amount as value, 
                t.status,
                COALESCE(prof.nome, a.nome, u.email) as user,
                t.receipt_url -- CORREÇÃO APLICADA AQUI: Busca o comprovante da tabela de transações
             FROM transactions t
             JOIN users u ON t.user_id = u.id
             JOIN roles r ON u.role_id = r.id
             LEFT JOIN professionals prof ON u.id = prof.user_id
             LEFT JOIN administrators a ON u.id = a.user_id
             LEFT JOIN invoices i ON t.invoice_id = i.id 
             WHERE r.name IN ('PROFISSIONAL', 'ADM')
             ORDER BY t.transaction_date DESC 
             LIMIT 10`
        );
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Erro ao buscar transações.' });
    }
});


router.get('/professionals-revenue', [protect, isAdmin], async (req, res) => {
    try {
        // A query agora busca da nova tabela, somando apenas os itens não faturados
        const query = `
            SELECT 
                p.id as professional_id,
                p.nome as professional_name,
                u.id as user_id,
                SUM(pb.gross_value) as total_revenue
            FROM professional_billings pb
            JOIN professionals p ON pb.professional_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE pb.status = 'unbilled'
            GROUP BY p.id, p.nome, u.id
            ORDER BY total_revenue DESC;
        `;
        const revenueByProfessional = await db.query(query); //
        res.json(revenueByProfessional); //
    } catch (error) { //
        console.error('Error fetching revenue by professional:', error); //
        res.status(500).json({ message: 'Erro ao buscar faturamento por profissional.' }); //
    }
});

router.post('/invoices', [protect, isAdmin], async (req, res) => {
    const { userId, amount, dueDate, description } = req.body;
    const creatorUserId = req.user.id || req.user.userId; 

    if (!userId || !amount || !dueDate) {
        return res.status(400).json({ message: 'Usuário, valor e data de vencimento são obrigatórios.' });
    }

    let conn; 
    try {
        conn = await db.getConnection(); 
        await conn.beginTransaction();

        const [lastInvoice] = await conn.query(
            "SELECT created_at FROM invoices WHERE user_id = ? AND creator_user_id = ? ORDER BY created_at DESC LIMIT 1",
            [userId, creatorUserId]
        );

        if (lastInvoice) {
            const lastInvoiceDate = new Date(lastInvoice.created_at);
            const today = new Date();
            const timeDifference = today.getTime() - lastInvoiceDate.getTime();
            const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

            if (daysDifference < 15) {
                await conn.rollback();
                return res.status(403).json({ 
                    message: `Já existe uma cobrança recente para este profissional. Tente novamente em ${Math.ceil(15 - daysDifference)} dias.` 
                });
            }
        }
        
        const result = await conn.query( 
            'INSERT INTO invoices (user_id, creator_user_id, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, creatorUserId, amount, dueDate, description, 'pending']
        );
        
        let invoiceId;
        if (Array.isArray(result) && result[0] && result[0].insertId) {
            invoiceId = result[0].insertId;
        } else if (result && result.insertId) {
            invoiceId = result.insertId;
        }
        
        if (invoiceId) {
             // Busca o ID do perfil profissional a partir do user_id que foi cobrado
            const [profProfile] = await conn.query("SELECT id FROM professionals WHERE user_id = ?", [userId]); //
            if (profProfile) {
                // Atualiza o status dos itens em professional_billings para 'invoiced'
                await conn.query(
                    "UPDATE professional_billings SET status = 'invoiced', invoice_id = ? WHERE professional_id = ? AND status = 'unbilled'",
                    [invoiceId, profProfile.id]
                );
            }
            await conn.commit();
            // Enviar notificação ao usuário sobre a nova fatura
            const amountFormatted = parseFloat(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            await createNotification(
                req,
                userId, // The user receiving the invoice
                'new_invoice',
                `Uma nova cobrança de ${amountFormatted} foi gerada pela administração.`,
                '/professional/financeiro' // Assuming admin bills professionals
            );


            const [recipientUser] = await conn.query("SELECT p.nome, u.email FROM professionals p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?", [userId]);
            if (recipientUser && recipientUser.email) {
                try {
                    await sendInvoiceNotificationEmail(
                        recipientUser.email,
                        recipientUser.nome,
                        'Administração IntegrandoSer',
                        amount,
                        dueDate,
                        invoiceId,
                        'http://localhost:5173/professional/financeiro' // Link para a página de finanças do profissional
                    );
                } catch (emailError) {
                    console.error("AVISO: Fatura criada, mas o e-mail de notificação falhou.", emailError);
                }
            }
            res.status(201).json({ 
                message: 'Cobrança gerada com sucesso!', 
                invoiceId: serializeBigInts({ id: invoiceId }).id 
            });


        } else {
            throw new Error('Não foi possível obter o ID da fatura inserida.');
        }

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Erro ao gerar cobrança.' });
    } finally {
        if (conn) conn.release(); 
    }
});

// Permite que Admin ou o Profissional dono da fatura alterem o status
router.patch('/invoices/:id/status', [protect], async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const userId = req.user.id || req.user.userId;
    const { role } = req.user;

    if (!userId) {
        return res.status(401).json({ message: 'ID do usuário não encontrado na sessão. Faça login novamente.' });
    }

    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        
        const [invoice] = await conn.query("SELECT * FROM invoices WHERE id = ?", [parseInt(id)]);
        if (!invoice) {
            await conn.rollback();
            return res.status(404).json({ message: 'Fatura não encontrada.' });
        }
            
        // --- VERIFICAÇÃO DE PERMISSÃO ---
        const isCreator = Number(invoice.creator_user_id) === Number(userId);
        const isAdmin = role === 'ADM';

        if (!isAdmin && !(role === 'PROFISSIONAL' && isCreator)) {
            await conn.rollback();
            return res.status(403).json({ message: 'Você não tem permissão para modificar esta fatura.' });
        }

        // --- LÓGICA DE ATUALIZAÇÃO DE STATUS ---
        if (status === 'completed') {
            
            let transactionType = 'payment';

            const [creatorUser] = await conn.query(
                "SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
                [invoice.creator_user_id]
            );

            if ((creatorUser && creatorUser.role === 'ADM') || !invoice.creator_user_id) {
                transactionType = 'commission';
            }
            
            const beneficiaryUserId = transactionType === 'payment' ? invoice.creator_user_id : invoice.user_id;

            await conn.query(
                "INSERT INTO transactions (invoice_id, user_id, creator_user_id, type, amount, status, description, receipt_url, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
                [
                    parseInt(invoice.id),
                    beneficiaryUserId,
                    invoice.creator_user_id,
                    transactionType,
                    invoice.amount,
                    'completed',
                    invoice.description,
                    invoice.receipt_url
                ]
            );

            const amountFormatted = parseFloat(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // 1. Notificação para o CRIADOR da fatura (lógica que já existia)
            if (invoice.creator_user_id) {
                const [creatorDetails] = await conn.query("SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", [invoice.creator_user_id]);
                const creatorRole = creatorDetails.role.toLowerCase();
                const notificationUrl = `/${creatorRole}/financeiro`;

                await createNotification(
                    req,
                    invoice.creator_user_id,
                    'payment_received',
                    `O pagamento da fatura #${invoice.id} (${amountFormatted}) foi confirmado.`,
                    notificationUrl
                );
            }

            // 2. NOVO: Notificação para o PAGADOR da fatura
            if (invoice.user_id) {
                const [payerDetails] = await conn.query("SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", [invoice.user_id]);
                if (payerDetails) {
                    const payerRole = payerDetails.role.toLowerCase();
                    const notificationUrl = `/${payerRole}/financeiro`;
                    
                    await createNotification(
                        req,
                        invoice.user_id,
                        'payment_received',
                        `Seu pagamento para a fatura #${invoice.id} (${amountFormatted}) foi aprovado.`,
                        notificationUrl
                    );
                }
            }

            // Exclui a fatura original após a migração para a tabela de transações
            //await conn.query("DELETE FROM invoices WHERE id = ?", [parseInt(id)]);
            await conn.query(
                "UPDATE invoices SET status = ? WHERE id = ?",
                ['completed', parseInt(id)]
            );

        } else {
            // Para outros status ('pending', 'rejected', etc.), apenas atualiza a fatura
            await conn.query(
                "UPDATE invoices SET status = ?, updated_at = NOW(), receipt_url = IF(status = 'pending' OR status = 'rejected', NULL, receipt_url) WHERE id = ?",
                [status, parseInt(id)]
            );
        }

        await conn.commit();
        res.status(200).json({ message: `Status da fatura ${id} atualizado para '${status}' com sucesso.` });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Erro ao atualizar o status da fatura:', error);
        res.status(500).json({ message: 'Erro no servidor.' });
    } finally {
        if (conn) conn.release();
    }
});


router.get('/professional-statement/:professionalId', [protect, isAdmin], async (req, res) => {
    const { professionalId } = req.params;
    
    try {
        // Busca os dados do profissional (continua igual)
        const [professional] = await db.query("SELECT * FROM professionals WHERE id = ?", [professionalId]);
        if (!professional) {
            return res.status(404).json({ message: 'Profissional não encontrado.' });
        }

        // CORRIGIDO: Busca as sessões PENDENTES da nova tabela 'professional_billings'
        const sessions = await db.query(
            `SELECT 
                pb.billing_date as appointment_time, 
                pb.gross_value as session_value,
                p.nome as patient_name
             FROM professional_billings pb
             JOIN appointments a ON pb.appointment_id = a.id
             JOIN patients p ON a.patient_id = p.id
             WHERE pb.professional_id = ? AND pb.status = 'unbilled'
             ORDER BY pb.billing_date ASC`,
            [professionalId]
        );
        
        // Otimizado: Busca apenas faturas pendentes que são relevantes para esta tela
        const invoices = await db.query(
            "SELECT * FROM invoices WHERE user_id = ? AND status IN ('pending', 'paid')", 
            [professional.user_id]
        );

        res.json(serializeBigInts({
            professional: professional || null,
            sessions: sessions || [], 
            invoices: invoices || []
        }));
    } catch (error) { //
        console.error('Erro ao buscar detalhamento do profissional:', error); //
        res.status(500).json({ message: 'Erro ao buscar detalhamento.' }); //
    }
});

router.get('/invoices/pending-approval', [protect, isAdmin], async (req, res) => {
    try {
        const invoices = await db.query(
            `SELECT 
                i.id, 
                i.user_id,
                i.amount, 
                i.due_date, 
                i.description, 
                i.receipt_url,
                u.email,
                COALESCE(p.nome, prof.nome, c.nome_empresa, a.nome) as user_name
             FROM invoices i
             JOIN users u ON i.user_id = u.id
             LEFT JOIN patients p ON u.id = p.user_id
             LEFT JOIN professionals prof ON u.id = prof.user_id
             LEFT JOIN companies c ON u.id = c.user_id
             LEFT JOIN administrators a ON u.id = a.user_id
             WHERE i.receipt_url IS NOT NULL AND i.status = 'pending'
             ORDER BY i.due_date DESC`
        );
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices for approval:', error);
        res.status(500).json({ message: 'Erro ao buscar faturas para aprovação.' });
    }
});


router.patch('/invoices/:invoiceId/reject', [protect, isAdmin], async (req, res) => {
    const { invoiceId } = req.params;
    let conn; // Adicionado para poder usar o finally
    try {
        conn = await db.getConnection();
        // Busca o comprovante atual
        const [invoice] = await conn.query("SELECT receipt_url FROM invoices WHERE id = ?", [invoiceId]);
        if (invoice && invoice.receipt_url) {
            const filePath = path.join(__dirname, '../../', invoice.receipt_url);
            // fs.unlink é assíncrono, o callback é uma boa prática
            fs.unlink(filePath, err => {
                if (err) console.warn('Aviso: Erro ao apagar arquivo de comprovante antigo:', err);
            });
        }
        // Atualiza status e apaga comprovante
        await conn.query("UPDATE invoices SET status = 'rejected', receipt_url = NULL WHERE id = ?", [invoiceId]);
        res.json({ message: "Fatura rejeitada e comprovante apagado." });
    } catch (error) {
        console.error("Erro ao rejeitar fatura:", error);
        res.status(500).json({ message: "Erro ao rejeitar fatura." });
    } finally {
        if (conn) conn.release(); // Adicionado para garantir a liberação da conexão
    }
});


// All invoices - apenas para Admin
router.get('/invoices/all', [protect, isAdmin], async (req, res) => {
    try {
        const invoices = await db.query(
            `SELECT
                i.id,
                i.user_id,
                i.amount,
                i.due_date,
                i.description,
                i.status,
                i.receipt_url,
                u_payer.email,
                r_payer.name as role,
                COALESCE(p.nome, prof.nome, c.nome_empresa, a.nome) as user_name,
                COALESCE(prof_creator.nome, admin_creator.nome, 'Sistema') as creator_name
            FROM invoices i
            JOIN users u_payer ON i.user_id = u_payer.id
            JOIN roles r_payer ON u_payer.role_id = r_payer.id
            LEFT JOIN patients p ON u_payer.id = p.user_id
            LEFT JOIN professionals prof ON u_payer.id = prof.user_id
            LEFT JOIN companies c ON u_payer.id = c.user_id
            LEFT JOIN administrators a ON u_payer.id = a.user_id
            LEFT JOIN users u_creator ON i.creator_user_id = u_creator.id
            LEFT JOIN professionals prof_creator ON u_creator.id = prof_creator.user_id
            LEFT JOIN administrators admin_creator ON u_creator.id = admin_creator.user_id
            WHERE i.status IN ('pending', 'overdue', 'paid') -- <-- ALTERAÇÃO AQUI
            ORDER BY i.due_date DESC`
        );
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching all invoices:', error); //
        res.status(500).json({ message: 'Erro ao buscar todas as faturas.' }); //
    }
});

router.get('/invoices/latest', [protect, isAdmin], async (req, res) => {
    try {
        const invoices = await db.query(
            `SELECT
                i.id,
                i.user_id,
                i.amount,
                i.due_date,
                i.description,
                i.status,
                i.receipt_url,
                u.email,
                r.name as role,
                COALESCE(p.nome, prof.nome, c.nome_empresa, a.nome) as user_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN professionals prof ON u.id = prof.user_id
            LEFT JOIN companies c ON u.id = c.user_id
            LEFT JOIN administrators a ON u.id = a.user_id
            ORDER BY i.created_at DESC
            LIMIT 8`
        );
        res.json(serializeBigInts(invoices));
    } catch (error) {
        console.error('Error fetching latest invoices:', error);
        res.status(500).json({ message: 'Erro ao buscar as faturas mais recentes.' });
    }
});

router.get('/report/transactions', [protect, isAdmin], async (req, res) => {
    try {
        const transactions = await db.query(
            `SELECT 
                t.transaction_date as date, 
                t.type, 
                t.amount as value, 
                t.status,
                COALESCE(p.nome, prof.nome, c.nome_empresa, a.nome, u.email) as user
             FROM transactions t
             JOIN users u ON t.user_id = u.id
             LEFT JOIN patients p ON u.id = p.user_id
             LEFT JOIN professionals prof ON u.id = prof.user_id
             LEFT JOIN companies c ON u.id = c.user_id
             LEFT JOIN administrators a ON u.id = a.user_id
             ORDER BY t.transaction_date DESC`
        );

        const doc = new PDFDocument();
        const filename = 'relatorio_financeiro.pdf';
        
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(16).text('Relatório Financeiro', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`).moveDown();

        const table = {
            headers: ['Data', 'Tipo', 'Usuário/Origem', 'Valor', 'Status'],
            rows: transactions.map(t => [
                new Date(t.date).toLocaleDateString('pt-BR'),
                t.type,
                t.user,
                t.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                t.status
            ])
        };

        const drawTable = (table, x, y) => {
            let startX = x;
            let startY = y;
            const rowHeight = 25;
            const cellPadding = 5;
            const colWidths = [100, 80, 150, 80, 80];

            doc.font('Helvetica-Bold').fontSize(10);
            table.headers.forEach((header, i) => {
                doc.text(header, startX + doc.widthOfString(header) / 2 - 10, startY + cellPadding, { width: colWidths[i] });
                startX += colWidths[i];
            });
            doc.moveTo(x, startY + rowHeight).lineTo(x + colWidths.reduce((a, b) => a + b, 0), startY + rowHeight).stroke();
            
            startY += rowHeight;
            doc.font('Helvetica').fontSize(10);

            table.rows.forEach(row => {
                startX = x;
                row.forEach((cell, i) => {
                    doc.text(cell, startX + cellPadding, startY + cellPadding, { width: colWidths[i] });
                    startX += colWidths[i];
                });
                startY += rowHeight;
            });
        };

        drawTable(table, 50, doc.y + 10);
        
        doc.end();

    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ message: 'Erro ao gerar relatório.' });
    }
});

router.post('/generate-commissions-for-all', [protect, isAdmin], async (req, res) => {
    const commissionRate = 0.25; 
    const { month, year } = req.body; 

    if (!month || !year) {
        return res.status(400).json({ message: 'Mês e ano são obrigatórios.' });
    }
    
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const sessionsByProfessional = await conn.query(
            `SELECT 
                a.professional_id, 
                p.user_id,
                SUM(a.session_value) as total_revenue,
                GROUP_CONCAT(a.id) as session_ids
             FROM appointments a
             JOIN professionals p ON a.professional_id = p.id
             WHERE a.status = 'Concluída' 
             AND a.session_value IS NOT NULL
             AND MONTH(a.appointment_time) = ?
             AND YEAR(a.appointment_time) = ?
             GROUP BY a.professional_id, p.user_id`,
            [month, year]
        );

        if (sessionsByProfessional.length === 0) {
            await conn.rollback();
            return res.status(200).json({ message: 'Nenhuma sessão concluída encontrada para este período. Nenhuma fatura gerada.' });
        }

        for (const prof of sessionsByProfessional) {
            const commissionAmount = prof.total_revenue * commissionRate;
            const dueDate = new Date(year, month, 10);

            const description = `Comissão referente às sessões de ${month}/${year}.`;
            
            const invoiceResult = await conn.query(
                'INSERT INTO invoices (user_id, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?)',
                [prof.user_id, commissionAmount, dueDate, description, 'pending']
            );
            const invoiceId = invoiceResult.insertId;

            await conn.query(
                "INSERT INTO transactions (invoice_id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)",
                [invoiceId, prof.user_id, commissionAmount, 'commission', description]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Faturas de comissão geradas com sucesso!' });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Erro ao gerar faturas de comissão:', error);
        res.status(500).json({ message: 'Erro ao gerar faturas.' });
    } finally {
        if (conn) conn.release();
    }
});


// ===============================================
// --- ROTAS DO PROFISSIONAL ---
// ===============================================
/*
// Rota para buscar sessões faturadas
router.get('/professional/billed-sessions', [protect, isProfissional], async (req, res) => {
    console.log('✅ Back-end: Rota /professional/billed-sessions acessada.');
    const userId = req.user.id || req.user.userId;
    try {
        const professionalRows = await db.query("SELECT id FROM professionals WHERE user_id = ?", [userId]);
        
        if (!professionalRows || professionalRows.length === 0) {
            console.error(`Perfil profissional não encontrado para o user_id: ${userId}`);
            return res.status(404).json({ message: 'Perfil profissional não encontrado.' });
        }
        const professionalId = professionalRows[0].id;

        // QUERY MODIFICADA para verificar 'transactions' (pago) e 'invoices' (pendente)
        const billedSessions = await db.query(
            `SELECT
                a.id, 
                a.appointment_time as date, 
                a.session_value as value, 
                p.nome as patient, 
                p.id as patient_id,
                p.company_id,
                CASE
                    WHEN t.id IS NOT NULL THEN 'Pago'
                    WHEN i.id IS NOT NULL THEN 'Pendente'
                    ELSE 'Não Faturado'
                END as payment_status
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             LEFT JOIN invoices i ON i.description LIKE CONCAT('%sessão ', a.id, '%') AND i.creator_user_id = ?
             LEFT JOIN transactions t ON t.description LIKE CONCAT('%sessão ', a.id, '%') AND t.type = 'payment' AND t.status = 'completed'
             WHERE a.professional_id = ? 
             AND a.status = 'Concluída' 
             AND a.appointment_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY a.id, a.appointment_time, a.session_value, p.nome, p.id, p.company_id, t.id, i.id
             ORDER BY a.appointment_time DESC`,
            [userId, professionalId]
        );
        res.json(serializeBigInts(billedSessions));
    } catch (error) {
        console.error("Erro ao buscar sessões faturadas:", error);
        res.status(500).json({ message: 'Erro ao buscar sessões faturadas.' });
    }
});
*/

// Rota para buscar o histórico de faturamento da tabela professional_billings
router.get('/professional/billing-history', [protect, isProfissional], async (req, res) => {
    const userId = req.user.id || req.user.userId;
    try {
        const [profProfile] = await db.query("SELECT id FROM professionals WHERE user_id = ?", [userId]);
        if (!profProfile) {
            return res.status(404).json({ message: 'Perfil profissional não encontrado.' });
        }

        const billingHistory = await db.query(
            `SELECT
                pb.id, 
                pb.billing_date, 
                pb.gross_value, 
                pb.commission_value,
                p.nome as patient_name,
                i.status as invoice_status
             FROM professional_billings pb
             JOIN appointments a ON pb.appointment_id = a.id
             JOIN patients p ON a.patient_id = p.id
             LEFT JOIN invoices i ON pb.invoice_id = i.id
             WHERE pb.professional_id = ? AND pb.status = 'invoiced'
             ORDER BY pb.billing_date DESC
             LIMIT 30`,
            [profProfile.id]
        );
        res.json(serializeBigInts(billingHistory));
    } catch (error) {
        console.error("Erro ao buscar histórico de faturamento:", error);
        res.status(500).json({ message: 'Erro ao buscar histórico de faturamento.' });
    }
});

// Rota para o profissional buscar as faturas que ele criou
router.get('/professional/created-invoices', [protect, isProfissional], async (req, res) => {
    const creatorUserId = req.user.id || req.user.userId;
    try {
        const query = `
            SELECT
                i.id,
                i.amount,
                i.due_date,
                i.description,
                i.status,
                i.receipt_url,
                COALESCE(p.nome, c.nome_empresa, u.email) as recipient_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN companies c ON u.id = c.user_id
            WHERE i.creator_user_id = ?
            ORDER BY i.created_at DESC
        `;
        const invoices = await db.query(query, [creatorUserId]);
        res.json(serializeBigInts(invoices)); // Use the existing helper to handle BigInts
    } catch (error) {
        console.error("Erro ao buscar faturas criadas pelo profissional:", error);
        res.status(500).json({ message: 'Erro ao buscar cobranças enviadas.' });
    }
});

// Rota para buscar faturas
router.get('/professional/invoices', [protect, isProfissional], async (req, res) => {
    console.log('✅ Back-end: Rota /professional/invoices acessada.');
    const userId = req.user.id || req.user.userId;
    try {
        const invoices = await db.query(
            `SELECT i.*, 
                COALESCE(p_rec.nome, prof_rec.nome, c_rec.nome_empresa, a_rec.nome) as recipient_name,
                u_creator.email as creator_email
            FROM invoices i
            JOIN users u_recipient ON i.user_id = u_recipient.id
            LEFT JOIN users u_creator ON i.creator_user_id = u_creator.id
            LEFT JOIN patients p_rec ON u_recipient.id = p_rec.user_id
            LEFT JOIN professionals prof_rec ON u_recipient.id = prof_rec.user_id
            LEFT JOIN companies c_rec ON u_recipient.id = c_rec.user_id
            LEFT JOIN administrators a_rec ON u_recipient.id = a_rec.user_id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC`,
            [userId]
        );
        res.json(invoices);
    } catch (error) {
        console.error("Erro ao buscar faturas do profissional:", error);
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

// Rota para buscar o histórico de transações (pagamentos e comissões)
router.get('/professional/transaction-history', [protect, isProfissional], async (req, res) => {
    const userId = req.user.id || req.user.userId;
    try {
        const rows = await db.query(
            `SELECT id, amount as value, transaction_date as date, type, description, status
             FROM transactions
             WHERE user_id = ? AND type IN ('payment', 'commission') AND status = 'completed'
             ORDER BY transaction_date DESC
             LIMIT 30`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar histórico de transações.' });
    }
});


// Rota para calcular próximo repasse
router.get('/professional/next-payout', [protect, isProfissional], async (req, res) => {
    console.log('✅ Back-end: Rota /professional/next-payout acessada.');
    const userId = req.user.id || req.user.userId;
    try {
        const professionalRows = await db.query("SELECT id FROM professionals WHERE user_id = ?", [userId]);

        if (!professionalRows || professionalRows.length === 0) {
            console.error(`Perfil profissional não encontrado para o user_id: ${userId}`);
            return res.status(404).json({ message: 'Perfil profissional não encontrado.' });
        }
        const professionalId = professionalRows[0].id;

        const [totalGrossRevenue] = await db.query(
            `SELECT SUM(session_value * 0.75) AS total_revenue
             FROM appointments
             WHERE professional_id = ? AND status = 'Concluída'`,
            [professionalId]
        );
        const nextRevenue = totalGrossRevenue?.total_revenue || 0;

        const [pendingCommissions] = await db.query(
            `SELECT SUM(amount) as total_commissions
             FROM invoices
             WHERE user_id = ? AND status IN ('pending', 'overdue')`,
            [userId]
        );
        const pendingValue = pendingCommissions?.total_commissions || 0;
        
        const nextPayout = nextRevenue - pendingValue;
        
        res.json({ nextPayout });
    } catch (error) {
        console.error("Erro ao calcular o próximo repasse:", error);
        res.status(500).json({ message: 'Erro ao calcular o próximo repasse.' });
    }
});

// Rota para gerar extrato do profissional em PDF
router.get('/professional/statement/download', [protect, isProfissional], async (req, res) => {
    const userId = req.user.id || req.user.userId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    let conn;
    try {
        conn = await db.getConnection();

        const [professional] = await conn.query("SELECT nome FROM professionals WHERE user_id = ?", [userId]);
        if (!professional) {
            return res.status(404).json({ message: 'Perfil do profissional não encontrado.' });
        }

        // 1. BUSCAR TRANSAÇÕES CONCLUÍDAS DO MÊS ATUAL (LÓGICA EXISTENTE)
        const completedTransactions = await conn.query(
            `SELECT transaction_date as date, description, type, amount as value
             FROM transactions
             WHERE user_id = ? AND status = 'completed' AND type IN ('payment', 'commission') AND transaction_date BETWEEN ? AND ?
             ORDER BY transaction_date ASC`,
            [userId, firstDayOfMonth, lastDayOfMonth]
        );

        // 2. BUSCAR COBRANÇAS A RECEBER (QUE O PROFISSIONAL CRIOU E ESTÃO PENDENTES)
        const pendingIncome = await conn.query(
            `SELECT i.due_date as date, i.description, i.amount as value, COALESCE(p.nome, c.nome_empresa) as recipient_name
             FROM invoices i
             LEFT JOIN users u ON i.user_id = u.id
             LEFT JOIN patients p ON u.id = p.user_id
             LEFT JOIN companies c ON u.id = c.user_id
             WHERE i.creator_user_id = ? AND i.status IN ('pending', 'paid', 'rejected')`,
            [userId]
        );

        // 3. BUSCAR COMISSÕES A PAGAR (QUE O PROFISSIONAL RECEBEU E ESTÃO PENDENTES)
        const pendingDebts = await conn.query(
            `SELECT due_date as date, description, amount as value
             FROM invoices
             WHERE user_id = ? AND status = 'pending'`,
            [userId]
        );

        // --- INÍCIO DA GERAÇÃO DO PDF ---
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const filename = `extrato_${professional.nome.replace(/\s+/g, '_')}_${currentMonth}-${currentYear}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Cabeçalho
        doc.fontSize(16).text(`Extrato Financeiro - ${professional.nome}`, { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Período de Referência: ${firstDayOfMonth.toLocaleDateString('pt-BR')} a ${lastDayOfMonth.toLocaleDateString('pt-BR')}`, { align: 'center' }).moveDown(2);

        // Seção de Resumo (baseado apenas em transações concluídas)
        doc.fontSize(14).text('Resumo do Mês (Transações Concluídas)', { underline: true }).moveDown();
        
        const totalPayments = completedTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + parseFloat(t.value || 0), 0);
        const totalCommissions = completedTransactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + parseFloat(t.value || 0), 0);
        const netRevenue = totalPayments - totalCommissions;

        doc.font('Helvetica-Bold').fontSize(10).text('Total Recebido (Concluído): ').font('Helvetica').text(formatCurrency(totalPayments)).moveDown(0.5);
        doc.font('Helvetica-Bold').text('Total Descontado (Comissões Pagas): ').font('Helvetica').text(formatCurrency(totalCommissions)).moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12).text('Resultado Líquido do Mês: ').font('Helvetica').text(formatCurrency(netRevenue)).moveDown(2);

        // --- NOVA SEÇÃO: PENDÊNCIAS FINANCEIRAS ---
        doc.fontSize(14).text('Pendências Financeiras (Em Aberto)', { underline: true }).moveDown();

        // Tabela de Cobranças A Receber
        if (pendingIncome.length > 0) {
            doc.font('Helvetica-Bold').fontSize(11).text('Valores a Receber:').moveDown(0.5);
            const incomeTable = {
                headers: ['Vencimento', 'Destinatário', 'Descrição', 'Valor'],
                rows: pendingIncome.map(i => [
                    new Date(i.date).toLocaleDateString('pt-BR'),
                    i.recipient_name,
                    i.description,
                    formatCurrency(i.value)
                ])
            };
            drawTable(doc, incomeTable, 40, doc.y, [80, 130, 200, 80]);
            doc.moveDown(2);
        }

        // Tabela de Comissões A Pagar
        if (pendingDebts.length > 0) {
            doc.font('Helvetica-Bold').fontSize(11).text('Comissões a Pagar:').moveDown(0.5);
            const debtTable = {
                headers: ['Vencimento', 'Descrição', 'Valor'],
                rows: pendingDebts.map(i => [
                    new Date(i.date).toLocaleDateString('pt-BR'),
                    i.description,
                    formatCurrency(-Math.abs(i.value)) // Valor negativo
                ])
            };
            drawTable(doc, debtTable, 40, doc.y, [80, 310, 100]);
            doc.moveDown(2);
        }
        
        if (pendingIncome.length === 0 && pendingDebts.length === 0) {
            doc.font('Helvetica').fontSize(10).text('Nenhuma pendência financeira encontrada.').moveDown(2);
        }

        // Seção de Transações Concluídas
        if (completedTransactions.length > 0) {
            doc.fontSize(14).text('Detalhes das Transações Concluídas no Mês', { underline: true }).moveDown();
            const transactionsTable = {
                headers: ['Data', 'Descrição', 'Tipo', 'Valor'],
                rows: completedTransactions.map(t => [
                    new Date(t.date).toLocaleDateString('pt-BR'),
                    t.description,
                    t.type === 'payment' ? 'Recebimento' : 'Comissão',
                    formatCurrency(t.type === 'commission' ? -Math.abs(t.value) : t.value)
                ])
            };
            drawTable(doc, transactionsTable, 40, doc.y, [80, 250, 80, 80]);
        } else {
            doc.fontSize(10).text('Nenhuma transação concluída encontrada para este período.');
        }
        
        doc.end();

    } catch (error) {
        console.error("Erro ao gerar extrato do profissional:", error);
        res.status(500).json({ message: 'Erro interno ao gerar extrato.' });
    } finally {
        if (conn) conn.release();
    }
});


// Função auxiliar para desenhar a tabela no PDF
const drawTable = (doc, table, x, y) => {
    let startX = x;
    let startY = y;
    const rowHeight = 25;
    const cellPadding = 5;
    const colWidths = [120, 150, 100, 100]; // Ajustado para as colunas do extrato

    doc.font('Helvetica-Bold').fontSize(10);
    table.headers.forEach((header, i) => {
        doc.text(header, startX, startY + cellPadding, { width: colWidths[i] });
        startX += colWidths[i];
    });
    doc.moveTo(x, startY + rowHeight).lineTo(x + colWidths.reduce((a, b) => a + b, 0), startY + rowHeight).stroke();
    
    startY += rowHeight;
    doc.font('Helvetica').fontSize(10);

    table.rows.forEach(row => {
        startX = x;
        row.forEach((cell, i) => {
            doc.text(cell, startX, startY + cellPadding, { width: colWidths[i] });
            startX += colWidths[i];
        });
        startY += rowHeight;
    });
};


const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    
    // Esta função agora formata qualquer número (positivo ou negativo) corretamente
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};


// Rota para criar uma fatura para um paciente (acessada por profissional)
router.post('/professional/invoices/patient', [protect, isProfissional], async (req, res) => {
    const creatorUserId = req.user.id || req.user.userId;
    const { patientId, amount, description } = req.body;

    if (!patientId || !amount || !description) {
        return res.status(400).json({ message: 'Paciente, valor e descrição são obrigatórios.' });
    }

    const patientUserRows = await db.query("SELECT user_id FROM patients WHERE id = ?", [patientId]);
    if (patientUserRows.length === 0) {
        return res.status(404).json({ message: "Paciente não encontrado." });
    }
    const recipientUserId = patientUserRows[0].user_id;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    try {
        await db.query(
            'INSERT INTO invoices (user_id, creator_user_id, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [recipientUserId, creatorUserId, amount, dueDate.toISOString().split('T')[0], description, 'pending']
        );

        // Enviar notificação para o paciente
        const [creatorProfile] = await db.query("SELECT nome FROM professionals WHERE user_id = ?", [creatorUserId]);
        const creatorName = creatorProfile ? creatorProfile.nome : 'seu profissional';
        const amountFormatted = parseFloat(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        await createNotification(
            req,
            recipientUserId,
            'new_invoice',
            `Você recebeu uma cobrança de ${creatorName} no valor de ${amountFormatted}.`,
            '/paciente/financeiro'
        );

        const [patientDetails] = await db.query("SELECT p.nome, u.email FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?", [patientId]);
        if (patientDetails && patientDetails.email) {
            try {
                await sendInvoiceNotificationEmail(
                    patientDetails.email,
                    patientDetails.nome,
                    creatorName,
                    amount,
                    dueDate,
                    invoiceResult.insertId, // Assumindo que a query de INSERT retorna o ID
                    'http://localhost:5173/paciente/financeiro'
                );
            } catch (emailError) {
                console.error("AVISO: Fatura criada, mas o e-mail de notificação falhou.", emailError);
            }
        }

        res.status(201).json({ message: 'Cobrança gerada com sucesso para o paciente!' });
    } catch (error) {
        console.error("Erro ao criar fatura para o paciente:", error);
        res.status(500).json({ message: 'Erro ao gerar cobrança.' });
    }
});


// server/src/routes/financeRoutes.js

router.post('/professional/invoices/company', [protect, isProfissional], async (req, res) => {
    const creatorUserId = req.user.id || req.user.userId;
    const { companyId, amount, description } = req.body;

    if (!companyId || !amount || !description) {
        return res.status(400).json({ message: 'Empresa, valor e descrição são obrigatórios.' });
    }

    const companyUserRows = await db.query("SELECT user_id FROM companies WHERE id = ?", [companyId]);
    if (companyUserRows.length === 0) {
        return res.status(404).json({ message: "Empresa não encontrada." });
    }
    const recipientUserId = companyUserRows[0].user_id;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    try {
        await db.query(
            'INSERT INTO invoices (user_id, creator_user_id, amount, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [recipientUserId, creatorUserId, amount, dueDate.toISOString().split('T')[0], description, 'pending']
        );
        
        // ======================= INÍCIO DA NOVA NOTIFICAÇÃO =======================
        const [creatorProfile] = await db.query("SELECT nome FROM professionals WHERE user_id = ?", [creatorUserId]);
        const creatorName = creatorProfile ? creatorProfile.nome : 'um profissional';
        const amountFormatted = parseFloat(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        await createNotification(
            req,
            recipientUserId,
            'new_invoice',
            `Sua empresa recebeu uma cobrança de ${creatorName} no valor de ${amountFormatted}.`,
            '/empresa/financeiro' // URL correta para a empresa
        );
        // ======================== FIM DA NOVA NOTIFICAÇÃO ========================

        res.status(201).json({ message: 'Cobrança gerada com sucesso para a empresa!' });
    } catch (error) {
        console.error("Erro ao criar fatura para a empresa:", error);
        res.status(500).json({ message: 'Erro ao gerar cobrança.' });
    }
});

// ===============================================
// --- ROTAS DO PACIENTE E EMPRESA ---
// ===============================================

router.get('/my-sessions/patient', protect, async (req, res) => {
    const userId = req.user.id || req.user.userId;
    try {
        // Busca o paciente pelo user_id
        // ALTERADO: Renomeado para 'patientRows' para maior clareza e para pegar o array de resultados.
        const patientRows = await db.query("SELECT id FROM patients WHERE user_id = ?", [userId]);

        // ALTERADO: Validação mais robusta para verificar se o array de resultados não está vazio.
        if (!patientRows || patientRows.length === 0) {
            return res.status(404).json({ message: "Paciente não encontrado para este usuário." });
        }

        // ADICIONADO: Extrai o primeiro objeto (o paciente) do array de resultados.
        const patient = patientRows[0];

        // Busca as sessões do paciente (agora 'patient.id' terá o valor correto)
        const sessions = await db.query(
            `SELECT a.id, a.appointment_time as date, prof.nome as professional_name, a.session_value as value
             FROM appointments a
             JOIN professionals prof ON a.professional_id = prof.id
             WHERE a.patient_id = ? AND a.status = 'Concluída'
             ORDER BY a.appointment_time DESC`,
            [patient.id]
        );
        res.json(serializeBigInts(sessions));
    } catch (error) {
        console.error("Erro ao buscar sessões do paciente:", error);
        res.status(500).json({ message: 'Erro ao buscar seu histórico de sessões.' });
    }
});


router.get('/my-invoices', protect, async (req, res) => {
    const userId = req.user.id || req.user.userId;
    try {
        // CORREÇÃO: Buscar faturas com status 'pending' (pendente), 'paid' (pago/aguardando aprovação) e 'rejected' (rejeitado)
        const invoices = await db.query(
            "SELECT id, due_date as date, description, amount as value, status FROM invoices WHERE user_id = ? AND status IN ('pending', 'paid', 'rejected') ORDER BY due_date ASC",
            [userId]
        );
        res.json(invoices);
    } catch (error) {
        console.error("Erro ao buscar faturas do paciente:", error);
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});



router.get('/my-transactions', protect, async (req, res) => {
    const userId = req.user.id || req.user.userId;
    try {
        const query = `
            SELECT 
                t.id, 
                t.transaction_date as date, 
                t.type,
                t.amount as value, 
                t.status,
                t.receipt_url, 
                COALESCE(prof.nome, 'Sistema') as professional_name
            FROM transactions t
            -- Esta JOIN agora funcionará para novos dados
            JOIN invoices i ON t.invoice_id = i.id
            LEFT JOIN users u_creator ON t.creator_user_id = u_creator.id
            LEFT JOIN professionals prof ON u_creator.id = prof.user_id
            -- E esta condição filtrará corretamente pelo paciente
            WHERE i.user_id = ? AND t.status = 'completed' 
            ORDER BY t.transaction_date DESC
        `;
        const transactions = await db.query(query, [userId]);
        res.json(transactions);
    } catch (error) {
        console.error("Erro ao buscar transações do paciente:", error);
        res.status(500).json({ message: 'Erro ao buscar transações.' });
    }
});


// Placeholder para gerar cobrança PIX
async function generatePixCharge(invoice) {
    let pixToken = null;
    let conn;
    try {
        conn = await db.getConnection();
        if (invoice.creator_user_id) {
            const [adm] = await conn.query("SELECT pix_token FROM administrators WHERE user_id = ?", [invoice.creator_user_id]);
            pixToken = adm?.pix_token || null;
        } else {
            const [prof] = await conn.query("SELECT pix_token FROM professionals WHERE user_id = ?", [invoice.user_id]);
            pixToken = prof?.pix_token || null;
        }
    } finally {
        if (conn) conn.release();
    }
    return {
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixToken || 'pix')}&size=200x200`,
        copy_paste_code: pixToken || ''
    };
}


// ROTA PARA O USUÁRIO PEGAR OS DETALHES DE PAGAMENTO DE UMA FATURA
router.get('/invoices/:invoiceId/payment-details', protect, async (req, res) => {
    const { invoiceId } = req.params;
    const userId = req.user.id || req.user.userId;
    let conn;
    try {
        conn = await db.getConnection();
        const [invoice] = await conn.query("SELECT * FROM invoices WHERE id = ? AND user_id = ?", [invoiceId, userId]);
        if (!invoice) return res.status(404).json({ message: "Fatura não encontrada ou não pertence a você." });

        const sessionsDetails = await conn.query(
            `SELECT t.transaction_date, t.amount, p.nome as patient_name
            FROM transactions t
            LEFT JOIN appointments a ON t.description LIKE CONCAT('%', a.professional_id, '%') AND t.description LIKE CONCAT('%', a.patient_id, '%')
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE t.invoice_id = ? AND t.type = 'commission'`,
            [invoiceId]
        );

        const pixDetails = await generatePixCharge(invoice);
        res.json({ invoice, pixDetails, sessionsDetails });
    } catch (error) {
        console.error("Erro ao buscar detalhes da fatura:", error);
        res.status(500).json({ message: 'Erro ao buscar detalhes da fatura.' });
    } finally {
        if (conn) conn.release();
    }
});

// ROTA PARA O USUÁRIO ENVIAR O COMPROVANTE
// ROTA PARA O USUÁRIO ENVIAR O COMPROVANTE (VERSÃO FINAL E COMPLETA)
router.post('/invoices/:invoiceId/upload-receipt', [protect, upload.single('receipt')], async (req, res) => {
    const { invoiceId } = req.params;
    const userId = req.user.id || req.user.userId;
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado ou tipo inválido.' });
    
    let conn;
    try {
        conn = await db.getConnection(); 
        const receiptUrl = req.file.path;
        
        // 1. Atualiza a fatura no banco de dados
        await conn.query("UPDATE invoices SET receipt_url = ?, status = 'paid' WHERE id = ? AND user_id = ?", [receiptUrl, invoiceId, userId]);

        // 2. Busca a fatura recém-atualizada para obter todos os dados necessários
        const [updatedInvoice] = await conn.query("SELECT * FROM invoices WHERE id = ?", [invoiceId]);
        
        // 3. Bloco de notificação (em tempo real e por e-mail)
        if (updatedInvoice && updatedInvoice.creator_user_id) {
            // Busca o nome de quem enviou o comprovante
            const [uploaderProfile] = await conn.query(`SELECT COALESCE(p.nome, prof.nome, c.nome_empresa, a.nome) as name FROM users u LEFT JOIN patients p ON u.id = p.user_id LEFT JOIN professionals prof ON u.id = prof.user_id LEFT JOIN companies c ON u.id = c.user_id LEFT JOIN administrators a ON u.id = a.user_id WHERE u.id = ?`, [userId]);
            const uploaderName = uploaderProfile ? uploaderProfile.name : 'Um usuário';

            // Busca o papel do criador da fatura para montar a URL correta
            const [creatorUser] = await conn.query("SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?", [updatedInvoice.creator_user_id]);
            const creatorRole = creatorUser ? creatorUser.role.toLowerCase() : 'admin';
            let notificationUrl = `/${creatorRole}/financeiro`;
            if (creatorRole === 'admin') notificationUrl = '/admin/financeiro/faturas';
            if (creatorRole === 'professional') notificationUrl = '/professional/cobrancas';

            // Envia a notificação em tempo real
            await createNotification(
                req,
                updatedInvoice.creator_user_id,
                'payment_received',
                `${uploaderName} enviou um comprovante para a fatura #${invoiceId}.`,
                notificationUrl // Passa a URL dinâmica
            );
            
            // Busca os detalhes do criador para enviar o e-mail
            const [creatorDetails] = await conn.query("SELECT u.email, COALESCE(prof.nome, a.nome) as name FROM users u LEFT JOIN professionals prof ON u.id = prof.user_id LEFT JOIN administrators a ON u.id = a.user_id WHERE u.id = ?", [updatedInvoice.creator_user_id]);
            
            if (creatorDetails && creatorDetails.email) {
                try {
                    // Envia o e-mail de notificação
                    await sendReceiptUploadNotificationEmail(
                        creatorDetails.email,
                        creatorDetails.name || 'Admin',
                        uploaderName,
                        invoiceId,
                        `http://localhost:5173${notificationUrl}`
                    );
                } catch (emailError) {
                    console.error("AVISO: Comprovante salvo, mas o e-mail de notificação falhou.", emailError);
                }
            }
        }

        // 4. Responde ao frontend com a fatura atualizada para evitar a "race condition"
        res.json({ 
            message: 'Comprovante enviado e fatura marcada como paga!',
            invoice: serializeBigInts(updatedInvoice) // Enviando os dados atualizados
        });

    } catch (error) {
        console.error("Erro ao salvar comprovante:", error);
        res.status(500).json({ message: 'Erro ao salvar comprovante.' });
    } finally {
        if (conn) conn.release();
    }
});

router.get('/invoices/:invoiceId/download', [protect], async (req, res) => {
    const { invoiceId } = req.params;
    const { userId, role } = req.user;

    try {
        // 1. Consulta SQL Robusta para buscar a fatura e os nomes de ambas as partes
        const invoiceQuery = `
            SELECT 
                i.*,
                payer_user.id as payer_user_id,
                COALESCE(payer_prof.nome, payer_pat.nome, payer_comp.nome_empresa) as payer_name,
    
                creator_user.id as creator_id,

                creator_role.name as creator_role,
                COALESCE(creator_prof.nome, creator_adm.nome) as creator_name
            FROM invoices i
            LEFT JOIN users payer_user ON i.user_id = payer_user.id
            LEFT JOIN professionals payer_prof ON payer_user.id = payer_prof.user_id
            LEFT JOIN patients payer_pat ON payer_user.id = payer_pat.user_id
            LEFT JOIN companies payer_comp ON payer_user.id = payer_comp.user_id
            LEFT JOIN users creator_user ON i.creator_user_id = creator_user.id
            LEFT JOIN roles creator_role ON creator_user.role_id = creator_role.id
            LEFT JOIN professionals creator_prof ON creator_user.id = creator_prof.user_id
            LEFT JOIN administrators creator_adm ON creator_user.id = creator_adm.user_id
            WHERE i.id = ?
        `;
        
        // 2. Aplicar a verificação de permissão
        let invoice;
        if (role === 'ADM') {
            [invoice] = await db.query(invoiceQuery, [invoiceId]);
        } else {
            // CORREÇÃO APLICADA AQUI:
            // Permite o download se o usuário for o destinatário (payer) OU o criador.
            const queryWithPermission = `${invoiceQuery} AND (i.user_id = ? OR i.creator_user_id = ?)`;
            [invoice] = await db.query(queryWithPermission, [invoiceId, userId, userId]);
        }

        if (!invoice) {
            return res.status(404).json({ message: "Fatura não encontrada ou você não tem permissão para acessá-la." });
        }

        // 3. Gerar PDF com base no tipo de fatura (identificado pelo papel do criador)
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const filename = `fatura_${invoice.id}.pdf`;

        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Obter PIX do beneficiário (criador da fatura)
        const pixDetails = await generatePixCharge(invoice);
        const qrCodeBuffer = await QRCode.toBuffer(pixDetails.copy_paste_code || 'chave-pix-invalida');

        // ==========================================================
        // Lógica Condicional para Geração do PDF
        // ==========================================================
        
        if (invoice.creator_role === 'PROFISSIONAL') {
            // --- PDF para FATURA DE SERVIÇO (Profissional -> Paciente) ---
            doc.font('Helvetica-Bold').fontSize(16).text('FATURA DE SERVIÇOS', { align: 'center' }).moveDown(2);
            doc.fontSize(10);
            doc.font('Helvetica-Bold').text('PRESTADOR:', { continued: true }).font('Helvetica').text(` ${invoice.creator_name}`);
            doc.font('Helvetica-Bold').text('DESTINATÁRIO:', { continued: true }).font('Helvetica').text(` ${invoice.payer_name}`);
            doc.font('Helvetica-Bold').text('VENCIMENTO:', { continued: true }).font('Helvetica').text(` ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}`);
            doc.font('Helvetica-Bold').text('FATURA Nº:', { continued: true }).font('Helvetica').text(` ${invoice.id}`);
            doc.moveDown(2);

            // Tabela simples de serviços
            doc.font('Helvetica-Bold').text('Descrição', { continued: true }).text('Valor', { align: 'right' });
            doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.x, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica').text(invoice.description, { continued: true, width: 400 }).text(parseFloat(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { align: 'right' });
            doc.moveDown(2);

        } else { // Assume-se que o criador é ADM
            // --- PDF para FATURA DE COMISSÃO (Admin -> Profissional) ---
            doc.font('Helvetica-Bold').fontSize(16).text('FATURA DE COMISSÃO', { align: 'center' }).moveDown(2);
            doc.fontSize(10);
            doc.font('Helvetica-Bold').text('PROFISSIONAL:', { continued: true }).font('Helvetica').text(` ${invoice.payer_name}`);
            doc.font('Helvetica-Bold').text('VENCIMENTO:', { continued: true }).font('Helvetica').text(` ${new Date(invoice.due_date).toLocaleDateString('pt-BR')}`);
            doc.font('Helvetica-Bold').text('FATURA Nº:', { continued: true }).font('Helvetica').text(` ${invoice.id}`);
            doc.moveDown(1);
        }

        // Seção de Valor Total e PIX (comum a ambos os tipos de PDF)
        doc.font('Helvetica-Bold').fontSize(12).text('VALOR TOTAL:', { continued: true }).font('Helvetica-Bold').text(parseFloat(invoice.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), { align: 'right' });
        doc.moveDown(2);

        if (qrCodeBuffer) {
            doc.image(qrCodeBuffer, { fit: [150, 150], align: 'center' });
            doc.moveDown(1);
            doc.font('Helvetica').fontSize(8).text('Aponte a câmera do seu celular ou use o código abaixo.', { align: 'center' });
            doc.font('Courier').fontSize(8).text(pixDetails.copy_paste_code, { align: 'center' });
        }

        doc.end();

    } catch (error) {
        console.error("ERRO DETALHADO AO GERAR PDF:", error);
        res.status(500).json({ message: 'Erro interno ao gerar fatura em PDF.' });
    }
});


// Rota para buscar extrato da empresa
router.get('/my-statement/company', [protect, isEmpresa], async (req, res) => {
    const userId = req.user.userId || req.user.id;
    try {
        const companyProfileRows = await db.query("SELECT id, creditos FROM companies WHERE user_id = ?", [userId]);
        
        if (!companyProfileRows || companyProfileRows.length === 0) {
            return res.status(404).json({ message: "Perfil da empresa não encontrado." });
        }
        const companyProfile = companyProfileRows[0];
        const companyId = companyProfile.id;

        const usageDetails = await db.query(
            `SELECT a.id, a.appointment_time as date, p.nome as colaborador, prof.nome as profissional, a.session_value as cost
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN professionals prof ON a.professional_id = prof.id
             WHERE p.company_id = ? AND a.status = 'Concluída'
             ORDER BY a.appointment_time DESC`,
            [companyId]
        );
        
        const consumptionRows = await db.query(
            `SELECT SUM(a.session_value) as total
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE p.company_id = ? AND a.status = 'Concluída' AND a.appointment_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [companyId]
        );

        const activeEmployeesRows = await db.query("SELECT COUNT(id) as total FROM patients WHERE company_id = ?", [companyId]);

        res.json(serializeBigInts({
            remainingCredits: companyProfile.creditos,
            monthlyConsumption: consumptionRows[0]?.total || 0,
            activeEmployees: activeEmployeesRows[0]?.total || 0,
            usageDetails
        }));
    } catch (error) {
        console.error("Erro ao buscar extrato da empresa:", error);
        res.status(500).json({ message: 'Erro ao buscar extrato.' });
    }
});

// Rota para a EMPRESA baixar o relatório de utilização em PDF
router.get('/company/statement/download', [protect, isEmpresa], async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const now = new Date();
    const filename = `relatorio_utilizacao_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;

    try {
        const [company] = await db.query("SELECT id, nome_empresa FROM companies WHERE user_id = ?", [userId]);
        if (!company) {
            return res.status(404).json({ message: 'Perfil da empresa não encontrado.' });
        }

        const usageDetails = await db.query(
            `SELECT a.appointment_time as date, p.nome as colaborador, prof.nome as profissional, a.session_value as cost
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN professionals prof ON a.professional_id = prof.id
             WHERE p.company_id = ? AND a.status = 'Concluída'
             ORDER BY a.appointment_time DESC`,
            [company.id]
        );

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // --- Conteúdo do PDF ---
        doc.fontSize(16).text(`Relatório de Utilização - ${company.nome_empresa}`, { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Gerado em: ${now.toLocaleDateString('pt-BR')}`, { align: 'center' }).moveDown(2);

        if (usageDetails.length > 0) {
            const table = {
                headers: ['Data', 'Colaborador', 'Profissional', 'Custo'],
                rows: usageDetails.map(u => [
                    new Date(u.date).toLocaleDateString('pt-BR'),
                    u.colaborador,
                    u.profissional,
                    parseFloat(u.cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                ])
            };
            // Reutilizando a função de desenhar tabela já existente no arquivo
            drawTable(doc, table, 50, doc.y + 10, [100, 150, 150, 100]);
        } else {
            doc.fontSize(12).text('Nenhuma sessão concluída encontrada para este período.');
        }

        doc.end();

    } catch (error) {
        console.error("Erro ao gerar relatório de utilização da empresa:", error);
        res.status(500).json({ message: 'Erro interno ao gerar relatório.' });
    }
});



// ==============================================
// Função para gerar cobrança PIX
// ==============================================

async function generatePixCharge(invoice) {
    let pixToken = null;
    let conn;
    try {
        // CORREÇÃO: Usar 'db.getConnection()' em vez de 'pool.getConnection()'
        conn = await db.getConnection();

        if (invoice.creator_user_id) {
            const [creatorUser] = await conn.query(
                `SELECT r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
                [invoice.creator_user_id]
            );

            if (!creatorUser) throw new Error(`Beneficiário (ID: ${invoice.creator_user_id}) não encontrado.`);

            if (creatorUser.role === 'ADM') {
                const [adm] = await conn.query("SELECT pix_token FROM administrators WHERE user_id = ?", [invoice.creator_user_id]);
                pixToken = adm?.pix_token || null;
            } else if (creatorUser.role === 'PROFISSIONAL') {
                const [prof] = await conn.query("SELECT pix_token FROM professionals WHERE user_id = ?", [invoice.creator_user_id]);
                pixToken = prof?.pix_token || null;
            }
        } else {
            // Fallback para faturas do sistema (raro)
            const [adminProfile] = await conn.query("SELECT pix_token FROM administrators LIMIT 1");
            if (adminProfile) pixToken = adminProfile.pix_token;
        }
    } catch (error) {
        console.error("Erro na função generatePixCharge:", error);
        pixToken = null;
    } finally {
        if (conn) conn.release();
    }

    return {
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixToken || 'chave-pix-nao-configurada')}&size=200x200`,
        copy_paste_code: pixToken || 'Chave PIX do beneficiário não configurada.'
    };
}

// ROTA PARA O PROFISSIONAL BUSCAR O FATURAMENTO LÍQUIDO DO MÊS
router.get('/professional/monthly-net-revenue', [protect, isProfissional], async (req, res) => {
    // O ID do usuário é injetado pelo middleware 'protect'
    const userId = req.user.id || req.user.userId;

    try {
        const query = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as totalPayments,
                COALESCE(SUM(CASE WHEN type = 'commission' THEN amount ELSE 0 END), 0) as totalCommissions
            FROM transactions
            WHERE user_id = ?
            AND status = 'completed'
            AND MONTH(transaction_date) = MONTH(CURDATE())
            AND YEAR(transaction_date) = YEAR(CURDATE());
        `;
        // Executa a query no banco de dados
        const [result] = await db.query(query, [userId]);

        // O faturamento líquido é o total de pagamentos recebidos menos as comissões pagas
        const netRevenue = parseFloat(result.totalPayments) - parseFloat(result.totalCommissions);

        res.json({ monthlyNetRevenue: netRevenue });

    } catch (error) {
        console.error("Erro ao calcular faturamento líquido mensal do profissional:", error); //
        res.status(500).json({ message: 'Erro ao calcular faturamento líquido.' }); //
    }
});


// ROTA PARA BUSCAR DETALHES DE FATURAMENTO DE UM PROFISSIONAL ESPECÍFICO
router.get('/professional-billing-details/:professionalId', [protect, isAdmin], async (req, res) => {
    const { professionalId } = req.params;

    try {
        // Busca os dados do profissional
        const [professionalDetails] = await db.query(
            `SELECT p.id, p.nome, u.id as user_id 
             FROM professionals p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [professionalId]
        );

        if (!professionalDetails) {
            return res.status(404).json({ message: 'Profissional não encontrado.' });
        }

        // Busca todos os itens de faturamento pendentes (unbilled)
        const billingItems = await db.query(
            `SELECT 
                pb.id,
                pb.billing_date,
                pb.gross_value,
                pb.commission_value,
                p.nome as patient_name
             FROM professional_billings pb
             JOIN appointments a ON pb.appointment_id = a.id
             JOIN patients p ON a.patient_id = p.id
             WHERE pb.professional_id = ? AND pb.status = 'unbilled'
             ORDER BY pb.billing_date ASC`,
            [professionalId]
        );

        // Calcula os totais
        const summary = billingItems.reduce((acc, item) => {
            acc.totalGross += parseFloat(item.gross_value);
            acc.totalCommission += parseFloat(item.commission_value);
            return acc;
        }, { totalGross: 0, totalCommission: 0 });

        res.json(serializeBigInts({
            professional: professionalDetails,
            billingItems,
            summary
        }));

    } catch (error) {
        console.error("Erro ao buscar detalhes de faturamento do profissional:", error);
        res.status(500).json({ message: 'Erro ao buscar detalhes de faturamento.' });
    }
});

// ROTA PARA A EMPRESA BUSCAR O CONSUMO ANUAL
router.get('/company/annual-consumption', [protect, isEmpresa], async (req, res) => {
    const userId = req.user.userId || req.user.id;
    try {
        const [company] = await db.query("SELECT id FROM companies WHERE user_id = ?", [userId]);
        if (!company) {
            return res.status(404).json({ message: 'Perfil da empresa não encontrado.' });
        }

        const [annualConsumption] = await db.query(
            `SELECT SUM(a.session_value) as total
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             WHERE p.company_id = ? 
             AND a.status = 'Concluída' 
             AND YEAR(a.appointment_time) = YEAR(CURDATE())`,
            [company.id]
        );

        res.json({ annualConsumption: annualConsumption?.total || 0 });

    } catch (error) {
        console.error("Erro ao buscar consumo anual da empresa:", error);
        res.status(500).json({ message: 'Erro ao buscar consumo anual.' });
    }
});


// ROTA PARA O PROFISSIONAL BUSCAR O FATURAMENTO LÍQUIDO ANUAL
router.get('/professional/annual-net-revenue', [protect, isProfissional], async (req, res) => {
    const userId = req.user.id || req.user.userId;

    try {
        const query = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END), 0) as totalPayments,
                COALESCE(SUM(CASE WHEN type = 'commission' THEN amount ELSE 0 END), 0) as totalCommissions
            FROM transactions
            WHERE user_id = ?
            AND status = 'completed'
            AND YEAR(transaction_date) = YEAR(CURDATE());
        `;
        const [result] = await db.query(query, [userId]);

        const annualNetRevenue = parseFloat(result.totalPayments) - parseFloat(result.totalCommissions);

        res.json({ annualNetRevenue });

    } catch (error) {
        console.error("Erro ao calcular faturamento líquido anual do profissional:", error);
        res.status(500).json({ message: 'Erro ao calcular faturamento líquido anual.' });
    }
});

module.exports = router;