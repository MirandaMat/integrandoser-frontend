// server/src/routes/dreamRoutes.js
const express = require('express');
const pool = require('../config/db.js');
const { protect, isPaciente, isProfissional } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/uploadMiddleware.js');
const router = express.Router();

// ROTA DO PACIENTE para buscar SEUS PRÓPRIOS sonhos
router.get('/my-dreams', protect, isPaciente, async (req, res) => {
    const { userId } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        const [patientProfile] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [userId]);
        if (!patientProfile) return res.status(403).json({ message: 'Perfil de paciente não encontrado.' });

        const dreams = await conn.query("SELECT * FROM dream_diary_entries WHERE patient_id = ? ORDER BY created_at DESC", [patientProfile.id]);
        res.json(dreams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar sonhos.' });
    } finally {
        if (conn) conn.release();
    }
});

// ROTA DO PACIENTE para CRIAR um novo sonho (com upload de imagem)
router.post('/', protect, isPaciente, upload.single('dream_image'), async (req, res) => {
    const { title, content } = req.body;
    const { userId } = req.user;
    const imageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
    let conn;
    try {
        conn = await pool.getConnection();
        const [patientProfile] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [userId]);
        if (!patientProfile) return res.status(403).json({ message: 'Perfil de paciente não encontrado.' });

        const result = await conn.query(
            "INSERT INTO dream_diary_entries (patient_id, title, content, image_url) VALUES (?, ?, ?, ?)",
            [patientProfile.id, title, content, imageUrl]
        );
        const insertId = Array.isArray(result) ? result[0].insertId : result.insertId;
        const [newDream] = await conn.query("SELECT * FROM dream_diary_entries WHERE id = ?", [insertId]);
        res.status(201).json(newDream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar registro no diário.' });
    } finally {
        if (conn) conn.release();
    }
});

// ROTA DO PACIENTE para ATUALIZAR um sonho (com regra de 15 dias)
router.put('/:entryId', protect, isPaciente, upload.single('dream_image'), async (req, res) => {
    const { entryId } = req.params;
    const { title, content } = req.body;
    const { userId } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        const [patientProfile] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [userId]);
        if (!patientProfile) return res.status(403).json({ message: 'Perfil de paciente não encontrado.' });

        const [dream] = await conn.query("SELECT * FROM dream_diary_entries WHERE id = ? AND patient_id = ?", [entryId, patientProfile.id]);
        if (!dream) return res.status(404).json({ message: 'Registro não encontrado ou não autorizado.' });

        const createdAt = new Date(dream.created_at);
        const diffDays = Math.ceil(Math.abs(new Date() - createdAt) / (1000 * 60 * 60 * 24));
        if (diffDays > 15) return res.status(403).json({ message: 'Não é possível editar registros com mais de 15 dias.' });

        let imageUrl = dream.image_url;
        if (req.file) imageUrl = req.file.path.replace(/\\/g, "/");

        await conn.query("UPDATE dream_diary_entries SET title = ?, content = ?, image_url = ? WHERE id = ?", [title, content, imageUrl, entryId]);
        const [updatedDream] = await conn.query("SELECT * FROM dream_diary_entries WHERE id = ?", [entryId]);
        res.json(updatedDream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar registro.' });
    } finally {
        if (conn) conn.release();
    }
});

// ROTA DO PACIENTE para DELETAR um sonho
router.delete('/:entryId', protect, isPaciente, async (req, res) => {
    const { entryId } = req.params;
    const { userId } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();
        const [patientProfile] = await conn.query("SELECT id FROM patients WHERE user_id = ?", [userId]);
        if (!patientProfile) return res.status(403).json({ message: 'Perfil de paciente não encontrado.' });

        await conn.query("DELETE FROM dream_diary_entries WHERE id = ? AND patient_id = ?", [entryId, patientProfile.id]);
        res.json({ message: 'Registro deletado com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao deletar registro.' });
    } finally {
        if (conn) conn.release();
    }
});

// ROTA DO PROFISSIONAL para ver os sonhos de um paciente específico
router.get('/professional/:patientId', protect, isProfissional, async (req, res) => {
    const { patientId } = req.params;
    // Adicionar lógica de verificação se o profissional pode ver este paciente
    let conn;
    try {
        conn = await pool.getConnection();
        const dreams = await conn.query("SELECT * FROM dream_diary_entries WHERE patient_id = ? ORDER BY created_at DESC", [patientId]);
        res.json(dreams);
    } catch(err) {
        res.status(500).json({message: 'Erro ao buscar diário do paciente.'})
    } finally {
        if (conn) conn.release();
    }
});


// ROTA DO PROFISSIONAL para ver os sonhos de um paciente específico (VERSÃO SEGURA)
router.get('/professional/:patientId', protect, isProfissional, async (req, res) => {
    const { patientId } = req.params;
    const { userId: professionalUserId } = req.user;
    let conn;
    try {
        conn = await pool.getConnection();

        // 1. Pega o ID de perfil do profissional logado
        const [profProfile] = await conn.query("SELECT id FROM professionals WHERE user_id = ?", [professionalUserId]);
        if (!profProfile) {
            return res.status(403).json({ message: "Perfil de profissional não encontrado." });
        }
        const professionalId = profProfile.id;

        // 2. Verifica se existe um vínculo entre o profissional e o paciente
        const [link] = await conn.query(
            `SELECT p.id FROM patients p
             LEFT JOIN appointments a ON a.patient_id = p.id
             WHERE p.id = ? AND (p.created_by_professional_id = ? OR a.professional_id = ?)
             LIMIT 1`,
            [patientId, professionalId, professionalId]
        );

        if (!link) {
            return res.status(403).json({ message: "Acesso não autorizado a este diário." });
        }

        // 3. Se o vínculo existe, busca os sonhos
        const dreams = await conn.query("SELECT * FROM dream_diary_entries WHERE patient_id = ? ORDER BY created_at DESC", [patientId]);
        res.json(dreams);
    } catch(err) {
        console.error("Erro ao buscar diário para o profissional:", err);
        res.status(500).json({message: 'Erro ao buscar diário do paciente.'})
    } finally {
        if (conn) conn.release();
    }
});


module.exports = router;