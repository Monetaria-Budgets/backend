const jwt = require('jsonwebtoken');
const db = require('../db/db');
const bcrypt = require('bcrypt');
const { validateRegister, validateLogin } = require('../validation/auth.validation');

const SALT_ROUNDS = 10;
const tokenBlacklist = new Set();

// Регистрация
const register = async (req, res) => {
    try {
        console.log(">>> REGISTER BODY:", req.body);

        // Валидация
        const { error, value } = validateRegister(req.body);
        if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(d => d.message),
        });
        }

        // Добавление данных
        const { login, email, password } = req.body;

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Внесение данных в таблицу
        const result = await db.query(
            `INSERT INTO "user" (login, name, password, email) VALUES ($1, $2, $3, $4) RETURNING id`,
            [login, login, hashedPassword, email]
        );

        // Вывод результата
        return res.status(201).json({
            id: result.rows[0].id,
            email,
            login,
        });

    }   catch (err) {
        console.error('Registration error:', err);
        if (err.code === '23505') {
            
            if (err.constraint === 'user_login_key') {
                return res.status(409).json({ error: 'Логин уже используется!' });
            }
            if (err.constraint === 'user_email_key') {
                return res.status(409).json({ error: 'Почта уже используется!' });
            }
            if (err.constraint === 'user_pkey') {
                return res.status(500).json({ error: 'Ошибка сервера: конфликт ID. Обратитесь к администратору.' });
            }
        }
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

// Авторизация
const login = async (req, res) => {
    try {
        console.log(">>> LOGIN BODY:", req.body);

        const { error, value } = validateLogin(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(d => d.message),
            });
        }

        const { login, password } = req.body;

        const rows = await db.query(
            'SELECT * FROM "user" WHERE login = $1', 
            [login]
        );

        if (rows.rows.length == 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const user = rows.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const premiumData = await db.query(
            `SELECT 
                u.is_premium as had_premium_before,
                EXISTS (
                    SELECT 1 FROM premiumuser 
                    WHERE user_id = u.id AND subscription_end > CURRENT_TIMESTAMP
                ) as has_active_premium,
                r.name as role_name
             FROM "user" u 
             LEFT JOIN role r ON u.role_id = r.id 
             WHERE u.id = $1`,
            [user.id]
        );

        const userInfo = premiumData.rows[0];

        return res.status(200).json({
            message: 'Успешная авторизация',
            token,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                email: user.email,
                role: userInfo.role_name,
                premium: userInfo.has_active_premium // Текущий активный статус
            }
        });
                    
    } catch (err) {
        console.error('Authorization error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(400).json({ error: 'Токен не предоставлен' });
        }

        await db.query(
            'INSERT INTO blacklisted_tokens (token, expires_at) VALUES ($1, CURRENT_TIMESTAMP + INTERVAL \'7 days\')',
            [token]
        );

        return res.status(200).json({ 
            message: 'Успешный выход из системы' 
        });
        
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { register, login, logout };