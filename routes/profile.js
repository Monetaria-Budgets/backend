const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');

router.get('/profile', auth, (req, res) => {
    const userId = req.user.userId;

    const query = `
        SELECT id, login, email, is_premium, role_id
        FROM User 
        WHERE id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.json({ user: results[0] });
    });
});

module.exports = router;