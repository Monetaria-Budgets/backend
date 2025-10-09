const jwt = require('jsonwebtoken');
const db = require('../db/db');
const { validateRegister, validateLogin } = require('../validation/auth.validation');

const SALT_ROUNDS = 10;

// Регистрация
const register = async (req, res) => {
    try {
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
        const [existingRowsForLogin] = db.execute(
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

        // Внесение аданных в таблицу
        const [result] = await db.execute(
            `INSERT INTO User ( login, password, email) VALUES (?, ?, ?)`,
            [login, hashedPassword, email]
        );

        // Вывод результата
        return res.status(201).json({
            id: result.insertId,
            email,
            login
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
        // Валидация
        const { error, value } = validateLogin(req.body);
        if (error) {
        return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map(d => d.message),
        });
        }

        // Добавление данных
        const { login, password } = req.body;

        // Поиск пользователя по логину
        const [rows] = await pool.execute(
            'SELECT * FROM person WHERE login = ?',
            [login]
        );

        if (rows.length == 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const user = rows[0];

        // Сравнение паролей
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        const role = user.role_id === 2 ? 'Админ' : 'Пользователь';
        const premiumStatus = user.role_id === 1 ? 'Премиум' : 'Не премиум';

        // Проверка данных и авторизация
        return res.status(200).json({
            message: 'Успешная авторизация',
            token,
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                role,
                premium
            }
        })
        
    }   catch (err) {
        console.error('Authorization error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
    
    
};

module.exports = { register, login };