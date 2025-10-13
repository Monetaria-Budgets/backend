const jwt = require('jsonwebtoken');
const db = require('../db/db');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Токен отсутствует. Используйте заголовок: Authorization: Bearer <token>' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const [blacklisted] = await db.execute(
            'SELECT id FROM blacklisted_tokens WHERE token = ? AND expires_at > NOW()',
            [token]
        );
        
        if (blacklisted.length > 0) {
            return res.status(401).json({ error: 'Токен недействителен' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
        
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
};

module.exports = auth;