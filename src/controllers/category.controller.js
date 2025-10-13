const db = require('../db/db');

// Все категории (дефолтные + пользовательские)
const getAllCategories = async (req, res) => {
  try {
    const user_id = req.user.userId;

    // сначала берём дефолтные
    const [defaultRows] = await db.execute(
      `SELECT id, name FROM category WHERE user_id IS NULL ORDER BY name`
    );

    // потом кастомные
    const [userRows] = await db.execute(
      `SELECT id, name FROM category WHERE user_id = ? ORDER BY name`,
      [user_id]
    );

    res.json([...defaultRows, ...userRows]);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Ошибка загрузки категорий' });
  }
};

// Только пользовательские категории
const getUserCategories = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const [rows] = await db.execute(
      `SELECT id, name FROM category WHERE user_id = ? ORDER BY name`,
      [user_id]
    );

    // Если у пользователя нет категорий → вернуть дефолтные
    if (rows.length === 0) {
      return res.status(200).json([
        { id: 1, name: 'Еда' },
        { id: 2, name: 'Транспорт' },
        { id: 3, name: 'Жилье' },
        { id: 4, name: 'Магазины' },
        { id: 5, name: 'Здоровье' },
        { id: 6, name: 'Развлечения' },
        { id: 7, name: 'Одежда' },
        { id: 8, name: 'Техника' },
        { id: 9, name: 'Путешествия' },
        { id: 10, name: 'Образование' },
        { id: 11, name: 'Коммуналка' },
        { id: 12, name: 'Подписки' },
      ]);
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching user categories:', err);
    res.status(500).json({ message: 'Ошибка загрузки категорий' });
  }
};

// Добавить свою категорию
const addUserCategory = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Название обязательно' });
    }

    const [result] = await db.execute(
      `INSERT INTO category (name, user_id) VALUES (?, ?)`,
      [name, user_id]
    );

    res.status(201).json({ id: result.insertId, name });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ message: 'Ошибка добавления категории' });
  }
};

// Удалить категорию
const deleteUserCategory = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const categoryId = req.params.id;

    await db.execute(
      `DELETE FROM category WHERE id = ? AND user_id = ?`,
      [categoryId, user_id]
    );

    res.json({ message: 'Категория удалена' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Ошибка удаления категории' });
  }
};

module.exports = {
  getAllCategories,
  getUserCategories,
  addUserCategory,
  deleteUserCategory
};
