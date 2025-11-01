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

        // Проверка уникальности почты и логина
        const [existingRowsForLogin] = await db.execute(
            'SELECT id FROM user WHERE login = ?',
            [login]
        );

        const [existingRowsForEmail] = await db.execute(
            'SELECT id FROM user WHERE email = ?',
            [email]
        );

        if (existingRowsForEmail.length > 0) {
            return res.status(409).json({ error: 'Почта уже используется!' });
        }
        if (existingRowsForLogin.length > 0) {
            return res.status(409).json({ error: 'Логин уже используется!' });
        }

        // Внесение данных в таблицу
        const [result] = await db.execute(
            `INSERT INTO user ( login, name, password, email) VALUES (?, ?, ?, ?)`,
            [login, login, hashedPassword, email]
        );

        // Вывод результата
        return res.status(201).json({
            id: result.insertId,
            email,
            login,
        });

    }   catch (err) {
        if (err) {
            return res.status(400).json({ error: 'Логин или email уже заняты' })
        }
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error' });
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

        const [rows] = await db.execute(
            'SELECT * FROM user WHERE login = ?', 
            [login]
        );

        if (rows.length == 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const token = jwt.sign(
            { userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const [premiumData] = await db.execute(
            `SELECT 
                u.is_premium as had_premium_before,
                EXISTS (
                    SELECT 1 FROM premiumuser 
                    WHERE user_id = u.id AND subscription_end > NOW()
                ) as has_active_premium,
                r.name as role_name
             FROM user u 
             LEFT JOIN role r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [user.id]
        );

        const userInfo = premiumData[0];

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

        await db.execute(
            'INSERT INTO blacklisted_tokens (token, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
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