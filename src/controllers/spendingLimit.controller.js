const db = require('../db/db');

// Получить все лимиты пользователя
const getSpendingLimits = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📥 Получение лимитов для пользователя:', userId);

    const limitsQuery = `
      SELECT 
        sl.id,
        sl.category_id,
        sl.amount,
        sl.created_at,
        sl.user_id,
        COALESCE((
          SELECT SUM(o.amount) 
          FROM operation o 
          WHERE o.category_id = sl.category_id 
            AND o.user_id = sl.user_id
            AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ), 0) as current_spent
      FROM spendinglimit sl
      WHERE sl.user_id = $1
      ORDER BY sl.created_at DESC
    `;

    const limits = await db.query(limitsQuery, [userId]);
    console.log('✅ Найдено лимитов:', limits.rows.length);

    return res.status(200).json(limits.rows);

  } catch (err) {
    console.error('❌ Ошибка при получении лимитов:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке лимитов' });
  }
};

// Получить категории с лимитами
const getCategoriesWithLimits = async (req, res) => {
  try {
    const userId = req.user.userId;

    const categoriesQuery = `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.user_id,
        c.created_at,
        'expense' as type,
        sl.id as limit_id,
        sl.amount as limit_amount,
        COALESCE((
          SELECT SUM(o.amount) 
          FROM operation o 
          WHERE o.category_id = c.id 
            AND o.user_id = c.user_id
            AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ), 0) as current_spent
      FROM category c
      LEFT JOIN spendinglimit sl ON c.id = sl.category_id AND sl.user_id = c.user_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;

    const categories = await db.query(categoriesQuery, [userId]);
    
    // Форматируем ответ - ИСПРАВЛЕНА ЛОГИКА ПРЕВЫШЕНИЯ
    const formattedCategories = categories.rows.map(cat => {
      const currentSpent = parseFloat(cat.current_spent) || 0;
      const limitAmount = parseFloat(cat.limit_amount) || 0;
      
      console.log(`📊 Категория "${cat.name}": потрачено ${currentSpent}, лимит ${limitAmount}`);
      
      // Лимит превышен если потрачено БОЛЬШЕ чем лимит и лимит установлен
      const isExceeded = cat.limit_id && currentSpent > limitAmount;
      
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        user_id: cat.user_id,
        created_at: cat.created_at,
        type: cat.type,
        spending_limit: cat.limit_id ? {
          id: cat.limit_id,
          category_id: cat.id,
          amount: limitAmount
        } : null,
        current_spent: currentSpent,
        is_exceeded: isExceeded
      };
    });

    const exceededCount = formattedCategories.filter(cat => cat.is_exceeded).length;
    console.log('✅ Категории с лимитами загружены, превышены:', exceededCount);

    return res.status(200).json(formattedCategories);

  } catch (err) {
    console.error('❌ Ошибка при получении категорий с лимитами:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке категорий с лимитами' });
  }
};

// Проверить лимит на создание лимитов
const checkLimitLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('📊 Проверка лимита лимитов для пользователя:', userId);

    // Проверяем премиум статус через таблицу premiumuser
    const premiumQuery = `
      SELECT * FROM premiumuser 
      WHERE user_id = $1 AND subscription_end > CURRENT_TIMESTAMP
    `;
    const premiumResult = await db.query(premiumQuery, [userId]);
    
    const isPremium = premiumResult.rows.length > 0;
    console.log('👤 Премиум статус для лимитов:', isPremium);

    // Считаем текущее количество лимитов
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM spendinglimit 
      WHERE user_id = $1
    `;
    const countResult = await db.query(countQuery, [userId]);
    const current = parseInt(countResult.rows[0].count);

    const limit = isPremium ? 999 : 3;

    console.log('📈 Лимит лимитов:', { current, limit, isPremium });

    return res.status(200).json({
      current,
      limit,
      isPremium
    });

  } catch (err) {
    console.error('❌ Ошибка при проверке лимита лимитов:', err);
    return res.status(500).json({ error: 'Ошибка сервера при проверке лимита' });
  }
};

// Создать лимит
const createSpendingLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category_id, amount } = req.body;

    console.log('🆕 Создание лимита:', { category_id, amount, userId });

    if (!category_id || !amount) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше 0' });
    }

    // Проверяем, что категория принадлежит пользователю
    const categoryQuery = `SELECT * FROM category WHERE id = $1 AND user_id = $2`;
    const categoryResult = await db.query(categoryQuery, [category_id, userId]);

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Проверяем, не установлен ли уже лимит для этой категории
    const existingLimitQuery = `SELECT * FROM spendinglimit WHERE category_id = $1 AND user_id = $2`;
    const existingLimitResult = await db.query(existingLimitQuery, [category_id, userId]);

    if (existingLimitResult.rows.length > 0) {
      return res.status(400).json({ error: 'Лимит для этой категории уже установлен' });
    }

    // Проверяем лимит на создание лимитов
    const premiumQuery = `
      SELECT * FROM premiumuser 
      WHERE user_id = $1 AND subscription_end > CURRENT_TIMESTAMP
    `;
    const premiumResult = await db.query(premiumQuery, [userId]);
    const isPremium = premiumResult.rows.length > 0;

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM spendinglimit 
      WHERE user_id = $1
    `;
    const countResult = await db.query(countQuery, [userId]);
    const currentCount = parseInt(countResult.rows[0].count);

    if (!isPremium && currentCount >= 3) {
      return res.status(403).json({ 
        error: 'Достигнут лимит на установку лимитов. Обновите до премиум для создания большего количества.' 
      });
    }

    const insertQuery = `
      INSERT INTO spendinglimit (category_id, amount, user_id, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id
    `;

    const result = await db.query(insertQuery, [
      category_id,
      amount,
      userId
    ]);

    console.log('✅ Лимит создан с ID:', result.rows[0].id);

    // Получаем созданный лимит с текущими расходами
    const limitQuery = `
      SELECT 
        sl.id,
        sl.category_id,
        sl.amount,
        sl.created_at,
        sl.user_id,
        COALESCE((
          SELECT SUM(o.amount) 
          FROM operation o 
          WHERE o.category_id = sl.category_id 
            AND o.user_id = sl.user_id
            AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ), 0) as current_spent
      FROM spendinglimit sl
      WHERE sl.id = $1
    `;
    
    const limitResult = await db.query(limitQuery, [result.rows[0].id]);

    return res.status(201).json(limitResult.rows[0]);

  } catch (err) {
    console.error('❌ Ошибка при создании лимита:', err);
    return res.status(500).json({ error: 'Ошибка сервера при создании лимита' });
  }
};

// Обновить лимит
const updateSpendingLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limitId = req.params.id;
    const { amount } = req.body;

    console.log('✏️ Обновление лимита:', { limitId, amount, userId });

    // Проверяем, что лимит принадлежит пользователю
    const checkQuery = `
      SELECT sl.* 
      FROM spendinglimit sl
      WHERE sl.id = $1 AND sl.user_id = $2
    `;
    const checkResult = await db.query(checkQuery, [limitId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Лимит не найден' });
    }

    if (amount && amount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть больше 0' });
    }

    const updateQuery = `
      UPDATE spendinglimit 
      SET 
        amount = COALESCE($1, amount)
      WHERE id = $2 AND user_id = $3
    `;

    await db.query(updateQuery, [
      amount || null,
      limitId,
      userId
    ]);

    console.log('✅ Лимит обновлен');

    // Получаем обновленный лимит с текущими расходами
    const limitQuery = `
      SELECT 
        sl.id,
        sl.category_id,
        sl.amount,
        sl.created_at,
        sl.user_id,
        COALESCE((
          SELECT SUM(o.amount) 
          FROM operation o 
          WHERE o.category_id = sl.category_id 
            AND o.user_id = sl.user_id
            AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        ), 0) as current_spent
      FROM spendinglimit sl
      WHERE sl.id = $1
    `;
    const limitResult = await db.query(limitQuery, [limitId]);

    return res.status(200).json(limitResult.rows[0]);

  } catch (err) {
    console.error('❌ Ошибка при обновлении лимита:', err);
    return res.status(500).json({ error: 'Ошибка сервера при обновлении лимита' });
  }
};

// Удалить лимит
const deleteSpendingLimit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limitId = req.params.id;

    console.log('🗑️ Удаление лимита:', { limitId, userId });

    // Проверяем, что лимит принадлежит пользователю
    const checkQuery = `
      SELECT sl.* 
      FROM spendinglimit sl
      WHERE sl.id = $1 AND sl.user_id = $2
    `;
    const [checkResult] = await db.query(checkQuery, [limitId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Лимит не найден' });
    }

    const deleteQuery = `DELETE FROM spendinglimit WHERE id = $1 AND user_id = $2`;
    await db.query(deleteQuery, [limitId, userId]);

    console.log('✅ Лимит удален');

    return res.status(200).json({ message: 'Лимит удален' });

  } catch (err) {
    console.error('❌ Ошибка при удалении лимита:', err);
    return res.status(500).json({ error: 'Ошибка сервера при удалении лимита' });
  }
};

module.exports = {
  getSpendingLimits,
  getCategoriesWithLimits,
  checkLimitLimit,
  createSpendingLimit,
  updateSpendingLimit,
  deleteSpendingLimit
};