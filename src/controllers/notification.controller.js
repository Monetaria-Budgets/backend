const db = require('../db/db');

// Получить все уведомления пользователя
const getUserNotifications = async (req, res) => {
  try {
    console.log('🔔 GET /notifications - User ID:', req.user.userId);
    
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    console.log('🔔 Query params:', { userId, limit, offset });

    // ИСПРАВЛЕННЫЙ ЗАПРОС - добавляем фильтр по scheduled_at
    const notifications = await db.query(
      `SELECT * FROM notification 
      WHERE user_id = $1 
      AND source = 'push'
      AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log('🔔 Found notifications:', notifications.rows.length);

    const paginatedNotifications = notifications.rows.slice(offset, offset + limit);
    const types = await db.query('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = paginatedNotifications.map(notif => {
      const type = types.rows.find(t => t.id === notif.type_id);
      return {
        ...notif,
        type_name: type ? type.name : 'unknown'
      };
    });

    return res.status(200).json({
      success: true,
      data: notificationsWithTypes,
      pagination: {
        total: notifications.rows.length,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Удалить все уведомления пользователя
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      'DELETE FROM notification WHERE user_id = $1 AND source = \'push\'',
      [userId]
    );

    console.log(`🗑️ Удалены все уведомления пользователя ${userId}: ${result.rowCount} шт.`);

    return res.status(200).json({
      success: true,
      message: `Все уведомления удалены (${result.rowCount} шт.)`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Получить непрочитанные уведомления
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await db.query(
      `SELECT * FROM notification 
       WHERE user_id = $1 
       AND is_read = false 
       AND source = 'push'
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
       ORDER BY created_at DESC`,
      [userId]
    );

    const types = await db.query('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = notifications.rows.map(notif => {
      const type = types.rows.find(t => t.id === notif.type_id);
      return {
        ...notif,
        type_name: type ? type.name : 'unknown'
      };
    });

    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM notification 
       WHERE user_id = $1 
       AND is_read = false 
       AND source = 'push' 
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: notificationsWithTypes,
      unreadCount: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Пометить уведомление как прочитанное
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.notificationId);

    const result = await db.query(
      'UPDATE notification SET is_read = true WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Уведомление не найдено'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Уведомление помечено как прочитанное'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Пометить все уведомления как прочитанные
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `UPDATE notification SET is_read = true 
       WHERE user_id = $1 
       AND is_read = false 
       AND source = 'push' 
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: `Все уведомления помечены как прочитанные`,
      updatedCount: result.rowCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Удалить уведомление
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.notificationId);

    const result = await db.query(
      'DELETE FROM notification WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Уведомление не найдено'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Уведомление удалено'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Получить количество непрочитанных уведомлений
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT COUNT(*) as count FROM notification 
       WHERE user_id = $1 
       AND is_read = false 
       AND source = 'push'
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      unreadCount: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Тестовая функция для отправки уведомления текущему пользователю
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message, type } = req.body;

    const typeRows = await db.query(
      'SELECT id FROM notificationtype WHERE name = $1',
      [type || 'system_update']
    );

    if (typeRows.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Тип уведомления не найден'
      });
    }

    const typeId = typeRows.rows[0].id;

    const insertResult = await db.query(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at) VALUES ($1, $2, $3, \'push\', false, CURRENT_TIMESTAMP) RETURNING id',
      [userId, typeId, message || 'Тестовое уведомление']
    );

    return res.status(200).json({
      success: true,
      message: 'Тестовое уведомление отправлено',
      notificationId: insertResult.rows[0].id
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Создать отложенное уведомление
const createScheduledNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type_id, message, scheduled_at } = req.body;

    if (!type_id || !message || !scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'Все поля обязательны: type_id, message, scheduled_at'
      });
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Неверный формат даты'
      });
    }

    const now = new Date();
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Время отправки должно быть в будущем'
      });
    }

    const typeRows = await db.query(
      'SELECT id FROM notificationtype WHERE id = $1',
      [type_id]
    );

    if (typeRows.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Тип уведомления не найден'
      });
    }

    const result = await db.query(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at, scheduled_at) VALUES ($1, $2, $3, \'push\', false, CURRENT_TIMESTAMP, $4) RETURNING id',
      [userId, type_id, message, scheduledDate]
    );

    console.log('📅 Создано отложенное уведомление:', {
      id: result.rows[0].id,
      scheduledAt: scheduledDate
    });

    return res.status(201).json({
      success: true,
      message: 'Уведомление запланировано',
      data: {
        id: result.rows[0].id,
        scheduled_at: scheduledDate
      }
    });
  } catch (error) {
    console.error('Create scheduled notification error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Отправить уведомление конкретному пользователю (админ)
const sendNotificationToUser = async (req, res) => {
  try {
    const { user_id, type_id, message, scheduled_at } = req.body;

    console.log('📨 Admin sending notification to user:', { user_id, type_id, message, scheduled_at });

    if (!user_id || !type_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: user_id, type_id, message'
      });
    }

    const userRows = await db.query(
      'SELECT id FROM "user" WHERE id = $1',
      [user_id]
    );

    if (userRows.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const typeRows = await db.query(
      'SELECT id FROM notificationtype WHERE id = $1',
      [type_id]
    );

    if (typeRows.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Тип уведомления не найден'
      });
    }

    let mysqlScheduledAt = null;
    if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Неверный формат даты'
        });
      }
      mysqlScheduledAt = scheduledDate;
    }

    const result = await db.query(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at, scheduled_at) VALUES ($1, $2, $3, \'push\', false, CURRENT_TIMESTAMP, $4) RETURNING id',
      [user_id, type_id, message, mysqlScheduledAt]
    );

    console.log('✅ Уведомление создано в БД:', {
      id: result.rows[0].id,
      userId: user_id,
      scheduledAt: mysqlScheduledAt
    });

    return res.status(201).json({
      success: true,
      message: 'Уведомление отправлено пользователю',
      data: {
        id: result.rows[0].id,
        user_id: user_id,
        scheduled_at: mysqlScheduledAt
      }
    });
  } catch (error) {
    console.error('❌ Send notification to user error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Получить будущие (запланированные) уведомления
const getFutureNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await db.query(
      `SELECT * FROM notification 
       WHERE user_id = $1 
       AND source = 'push'
       AND scheduled_at IS NOT NULL 
       AND scheduled_at > CURRENT_TIMESTAMP
       ORDER BY scheduled_at ASC`,
      [userId]
    );

    const types = await db.query('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = notifications.rows.map(notif => {
      const type = types.rows.find(t => t.id === notif.type_id);
      return {
        ...notif,
        type_name: type ? type.name : 'unknown'
      };
    });

    return res.status(200).json({
      success: true,
      data: notificationsWithTypes
    });
  } catch (error) {
    console.error('Get future notifications error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Простой тест подключения
const testConnection = async (req, res) => {
  try {
    console.log('🔔 GET /notifications/test - User ID:', req.user.userId);
    
    return res.status(200).json({
      success: true,
      message: 'Notifications API is working!',
      user: {
        id: req.user.userId,
        login: req.user.login
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  sendTestNotification,
  testConnection,
  createScheduledNotification,
  sendNotificationToUser,
  getFutureNotifications, 
  deleteAllNotifications
};