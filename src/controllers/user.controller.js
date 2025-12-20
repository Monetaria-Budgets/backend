const db = require('../db/db');
const bcrypt = require('bcrypt');

// Получить всех пользователей
const getAllUsers = async (req, res) => {
  try {
    const rows = await db.query('SELECT id, login, name, email FROM "user"');
    
    const users = rows.rows.map(user => ({
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
    }));

    return res.status(200).json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Получить пользователя по ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID должен быть числом' });
    }

    const rows = await db.query(
      `SELECT 
        u.id, 
        u.login, 
        u.name,
        u.email, 
        u.is_premium, 
        u.currency_id, 
        r.name as role, 
        cs.name as color_scheme
      FROM "user" u
      LEFT JOIN role r ON u.role_id = r.id
      LEFT JOIN colorscheme cs ON u."ColorScheme_id" = cs.id  
      LEFT JOIN currency c ON u.currency_id = c.id 
      WHERE u.id = $1`,
      [userId]
    );

    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден!' });
    }

    const user = rows.rows[0];

    return res.status(200).json({
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
      premium: user.is_premium,
      role: user.role,
      color_scheme: user.color_scheme
    });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Обновить пользователя по ID
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password, is_premium, role_id, ColorScheme_id, currency_id } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID должен быть числом' });
    }

    // Проверка прав доступа (только свой профиль или админ)
    if (req.user.userId != userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push(`password = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }
    if (is_premium !== undefined) {
      fields.push(`is_premium = $${paramIndex}`);
      values.push(is_premium === true || is_premium === 1);
      paramIndex++;
    }
    if (role_id !== undefined && req.user.role === 'admin') {
      // Только админ может менять роль
      fields.push(`role_id = $${paramIndex}`);
      values.push(role_id);
      paramIndex++;
    }
    if (ColorScheme_id !== undefined) {
      fields.push(`"ColorScheme_id" = $${paramIndex}`);
      values.push(ColorScheme_id);
      paramIndex++;
    }
    if (currency_id !== undefined) {
      fields.push(`currency_id = $${paramIndex}`);
      values.push(currency_id);
      paramIndex++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    values.push(userId);
    const userIdParam = paramIndex;

    const query = `UPDATE "user" SET ${fields.join(', ')} WHERE id = $${userIdParam}`;

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден или не изменён' });
    }

    return res.status(200).json({
      message: 'Пользователь успешно обновлён',
      id: userId
    });
  } catch (err) {
    console.error('Ошибка обновления пользователя:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Удалить пользователя по ID
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'ID должен быть числом' });
    }

    // Проверка прав доступа
    if (req.user.userId != userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const rows = await db.query(
      'SELECT id FROM "user" WHERE id = $1',
      [userId]
    );

    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден!' });
    }

    await db.query('DELETE FROM "user" WHERE id = $1', [userId]);

    return res.status(200).json({ message: 'Пользователь успешно удалён' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Текущий пользователь
const getUserHimself = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rows = await db.query(
      `SELECT 
        u.id,
        u.login,
        u.name,
        u.email,
        u.is_premium,
        u.currency_id,
        r.name as role,
        cs.name as color_scheme,
        c.code as currency_code,
        c.name as currency_name
      FROM "user" u
      LEFT JOIN role r ON u.role_id = r.id
      LEFT JOIN colorscheme cs ON u."ColorScheme_id" = cs.id
      LEFT JOIN currency c ON u.currency_id = c.id
      WHERE u.id = $1`,
      [userId]
    );

    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден!' });
    }

    const user = rows.rows[0];

    return res.status(200).json({
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
      premium: user.is_premium,
      role: user.role,
      color_scheme: user.color_scheme,
      currency: {
        id: user.currency_id,
        code: user.currency_code,
        name: user.currency_name
      }
    });
  } catch (err) {
    console.error('GET user himself error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { 
  getAllUsers,
  getUserById, 
  updateUserProfile,    
  deleteUser,
  getUserHimself
};