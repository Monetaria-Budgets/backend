const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Токен отсутствует. Используйте заголовок: Authorization: Bearer <token>' 
        });
    }

    const token = authHeader.split(' ')[1]; // Получаем часть после "Bearer"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Теперь в req.user — { userId, login, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }
};

module.exports = auth;