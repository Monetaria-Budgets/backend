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
    const [notifications] = await db.execute(
      `SELECT * FROM notification 
      WHERE user_id = ? 
      AND source = 'push'
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log('🔔 Found notifications:', notifications.length);

    const paginatedNotifications = notifications.slice(offset, offset + limit);
    const [types] = await db.execute('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = paginatedNotifications.map(notif => {
      const type = types.find(t => t.id === notif.type_id);
      return {
        ...notif,
        type_name: type ? type.name : 'unknown'
      };
    });

    return res.status(200).json({
      success: true,
      data: notificationsWithTypes,
      pagination: {
        total: notifications.length,
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

// Получить непрочитанные уведомления
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notifications] = await db.execute(
      `SELECT * FROM notification 
       WHERE user_id = ? 
       AND is_read = 0 
       AND source = 'push'
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())  // ← ДОБАВЛЕНО
       ORDER BY created_at DESC`,
      [userId]
    );

    const [types] = await db.execute('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = notifications.map(notif => {
      const type = types.find(t => t.id === notif.type_id);
      return {
        ...notif,
        type_name: type ? type.name : 'unknown'
      };
    });

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as count FROM notification 
       WHERE user_id = ? 
       AND is_read = 0 
       AND source = "push" 
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())`,  // ← ДОБАВЛЕНО
      [userId]
    );

    return res.status(200).json({
      success: true,
      data: notificationsWithTypes,
      unreadCount: countResult[0].count
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

    const [result] = await db.execute(
      'UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
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

    const [result] = await db.execute(
      `UPDATE notification SET is_read = 1 
       WHERE user_id = ? 
       AND is_read = 0 
       AND source = "push" 
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())`,  // ← ДОБАВЛЕНО
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: `Все уведомления помечены как прочитанные`,
      updatedCount: result.affectedRows
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

    const [result] = await db.execute(
      'DELETE FROM notification WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
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

    const [result] = await db.execute(
      `SELECT COUNT(*) as count FROM notification 
       WHERE user_id = ? 
       AND is_read = 0 
       AND source = 'push'
       AND (scheduled_at IS NULL OR scheduled_at <= NOW())`,  // ← ДОБАВЛЕНО
      [userId]
    );

    console.log(`🔔 Непрочитанных уведомлений для пользователя ${userId}: ${result[0].count}`);

    return res.status(200).json({
      success: true,
      unreadCount: result[0].count
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

    const [typeRows] = await db.execute(
      'SELECT id FROM notificationtype WHERE name = ?',
      [type || 'system_update']
    );

    if (typeRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Тип уведомления не найден'
      });
    }

    const typeId = typeRows[0].id;

    const [insertResult] = await db.execute(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at) VALUES (?, ?, ?, "push", 0, NOW())',
      [userId, typeId, message || 'Тестовое уведомление']
    );

    return res.status(200).json({
      success: true,
      message: 'Тестовое уведомление отправлено',
      notificationId: insertResult.insertId
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

    const mysqlScheduledAt = scheduledDate.toISOString().slice(0, 19).replace('T', ' ');

    const now = new Date();
    if (scheduledDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Время отправки должно быть в будущем'
      });
    }

    const [typeRows] = await db.execute(
      'SELECT id FROM notificationtype WHERE id = ?',
      [type_id]
    );

    if (typeRows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Тип уведомления не найден'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at, scheduled_at) VALUES (?, ?, ?, "push", 0, NOW(), ?)',
      [userId, type_id, message, mysqlScheduledAt]
    );

    console.log('📅 Создано отложенное уведомление:', {
      id: result.insertId,
      scheduledAt: mysqlScheduledAt
    });

    return res.status(201).json({
      success: true,
      message: 'Уведомление запланировано',
      data: {
        id: result.insertId,
        scheduled_at: mysqlScheduledAt
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

    const [userRows] = await db.execute(
      'SELECT id FROM user WHERE id = ?',
      [user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const [typeRows] = await db.execute(
      'SELECT id FROM notificationtype WHERE id = ?',
      [type_id]
    );

    if (typeRows.length === 0) {
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
      mysqlScheduledAt = scheduledDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await db.execute(
      'INSERT INTO notification (user_id, type_id, message, source, is_read, created_at, scheduled_at) VALUES (?, ?, ?, "push", 0, NOW(), ?)',
      [user_id, type_id, message, mysqlScheduledAt]
    );

    console.log('✅ Уведомление создано в БД:', {
      id: result.insertId,
      userId: user_id,
      scheduledAt: mysqlScheduledAt
    });

    return res.status(201).json({
      success: true,
      message: 'Уведомление отправлено пользователю',
      data: {
        id: result.insertId,
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

    const [notifications] = await db.execute(
      `SELECT * FROM notification 
       WHERE user_id = ? 
       AND source = 'push'
       AND scheduled_at IS NOT NULL 
       AND scheduled_at > NOW()
       ORDER BY scheduled_at ASC`,
      [userId]
    );

    const [types] = await db.execute('SELECT * FROM notificationtype');
    
    const notificationsWithTypes = notifications.map(notif => {
      const type = types.find(t => t.id === notif.type_id);
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
};