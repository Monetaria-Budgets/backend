// controllers/category.controller.js
const db = require('../db/db');

// Получить все категории пользователя
const getCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📥 Получение категорий для пользователя:', userId);

    const categoriesQuery = `
      SELECT 
        id, 
        name, 
        color,
        user_id,
        created_at,
        'expense' as type
      FROM category 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    const [categories] = await db.execute(categoriesQuery, [userId]);
    console.log('✅ Найдено категорий:', categories.length);

    return res.status(200).json(categories);

  } catch (err) {
    console.error('❌ Ошибка при получении категорий:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке категорий' });
  }
};

// Получить категории пользователя (альтернативный endpoint)
const getCategoriesByUserId = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const categoriesQuery = `
      SELECT 
        id, 
        name, 
        color,
        user_id,
        created_at,
        'expense' as type
      FROM category 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    const [categories] = await db.execute(categoriesQuery, [userId]);
    
    return res.status(200).json(categories);

  } catch (err) {
    console.error('Ошибка при получении категорий пользователя:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке категорий' });
  }
};

// Проверить лимит категорий
const checkCategoryLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📊 Проверка лимита для пользователя:', userId);

    // Проверяем, премиум ли пользователь
    const userQuery = `SELECT is_premium FROM user WHERE id = ?`;
    const [userResult] = await db.execute(userQuery, [userId]);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isPremium = userResult[0]?.is_premium === 1;
    console.log('👤 Премиум статус:', isPremium);

    // Считаем текущее количество категорий
    const countQuery = `SELECT COUNT(*) as count FROM category WHERE user_id = ?`;
    const [countResult] = await db.execute(countQuery, [userId]);
    const current = countResult[0].count;

    const limit = isPremium ? 999 : 6;

    console.log('📈 Лимит категорий:', { current, limit, isPremium });

    return res.status(200).json({
      current,
      limit,
      isPremium
    });

  } catch (err) {
    console.error('❌ Ошибка при проверке лимита:', err);
    return res.status(500).json({ error: 'Ошибка сервера при проверке лимита' });
  }
};

// Создать категорию
const createCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, color } = req.body;

    console.log('🆕 Создание категории:', { name, color, userId });

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    if (name.trim().length > 20) {
      return res.status(400).json({ error: 'Название не должно превышать 20 символов' });
    }

    // Проверяем лимит
    const userQuery = `SELECT is_premium FROM user WHERE id = ?`;
    const [userResult] = await db.execute(userQuery, [userId]);
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isPremium = userResult[0]?.is_premium === 1;

    const countQuery = `SELECT COUNT(*) as count FROM category WHERE user_id = ?`;
    const [countResult] = await db.execute(countQuery, [userId]);
    const currentCount = countResult[0].count;

    if (!isPremium && currentCount >= 6) {
      return res.status(403).json({ 
        error: 'Достигнут лимит категорий. Обновите до премиум для создания большего количества.' 
      });
    }

    const insertQuery = `
      INSERT INTO category (name, color, user_id, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    const [result] = await db.execute(insertQuery, [
      name.trim(), 
      color || '#4ECDC4',
      userId
    ]);

    console.log('✅ Категория создана с ID:', result.insertId);

    // Получаем созданную категорию
    const categoryQuery = `
      SELECT 
        id, 
        name, 
        color,
        user_id,
        created_at,
        'expense' as type
      FROM category 
      WHERE id = ?
    `;
    
    const [categoryResult] = await db.execute(categoryQuery, [result.insertId]);

    return res.status(201).json(categoryResult[0]);

  } catch (err) {
    console.error('❌ Ошибка при создании категории:', err);
    return res.status(500).json({ error: 'Ошибка сервера при создании категории' });
  }
};

// Обновить категорию
const updateCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = req.params.id;
    const { name, color } = req.body;

    console.log('✏️ Обновление категории:', { categoryId, name, color, userId });

    // Проверяем, что категория принадлежит пользователю
    const checkQuery = `SELECT * FROM category WHERE id = ? AND user_id = ?`;
    const [checkResult] = await db.execute(checkQuery, [categoryId, userId]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    if (name && name.trim().length > 20) {
      return res.status(400).json({ error: 'Название не должно превышать 20 символов' });
    }

    const updateQuery = `
      UPDATE category 
      SET 
        name = COALESCE(?, name), 
        color = COALESCE(?, color)
      WHERE id = ? AND user_id = ?
    `;

    await db.execute(updateQuery, [
      name ? name.trim() : null, 
      color || null,
      categoryId, 
      userId
    ]);

    console.log('✅ Категория обновлена');

    // Получаем обновленную категорию
    const categoryQuery = `
      SELECT 
        id, 
        name, 
        color,
        user_id,
        created_at,
        'expense' as type
      FROM category 
      WHERE id = ?
    `;
    const [categoryResult] = await db.execute(categoryQuery, [categoryId]);

    return res.status(200).json(categoryResult[0]);

  } catch (err) {
    console.error('❌ Ошибка при обновлении категории:', err);
    return res.status(500).json({ error: 'Ошибка сервера при обновлении категории' });
  }
};

// Удалить категорию
const deleteCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = req.params.id;

    console.log('🗑️ Удаление категории:', { categoryId, userId });

    // Проверяем, что категория принадлежит пользователю
    const checkQuery = `SELECT * FROM category WHERE id = ? AND user_id = ?`;
    const [checkResult] = await db.execute(checkQuery, [categoryId, userId]);

    if (checkResult.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Проверяем, нет ли операций с этой категорией
    const operationsQuery = `SELECT COUNT(*) as count FROM operation WHERE category_id = ?`;
    const [operationsResult] = await db.execute(operationsQuery, [categoryId]);

    if (operationsResult[0].count > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить категорию, так как с ней связаны операции. Сначала удалите или переместите операции.' 
      });
    }

    const deleteQuery = `DELETE FROM category WHERE id = ? AND user_id = ?`;
    await db.execute(deleteQuery, [categoryId, userId]);

    console.log('✅ Категория удалена');

    return res.status(200).json({ message: 'Категория удалена' });

  } catch (err) {
    console.error('❌ Ошибка при удалении категории:', err);
    return res.status(500).json({ error: 'Ошибка сервера при удалении категории' });
  }
};

module.exports = {
  getCategories,
  getCategoriesByUserId,
  checkCategoryLimit,
  createCategory,
  updateCategory,
  deleteCategory
};