const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
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
  deleteAllNotifications, // ← ДОБАВЛЕНО
} = require('../controllers/notification.controller');

// Тест подключения
router.get('/test', auth, testConnection);

// Получить уведомления пользователя
router.get('/', auth, getUserNotifications);

// Получить непрочитанные уведомления
router.get('/unread', auth, getUnreadNotifications);

// Получить количество непрочитанных уведомлений
router.get('/unread-count', auth, getUnreadCount);

// Получить будущие уведомления
router.get('/future', auth, getFutureNotifications); // ← ДОБАВЛЕНО

// Пометить уведомление как прочитанное
router.patch('/:notificationId/read', auth, markAsRead);

// Пометить все уведомления как прочитанные
router.patch('/mark-all-read', auth, markAllAsRead);

// Удалить уведомление
router.delete('/:notificationId', auth, deleteNotification);

// Удалить все уведомления
router.delete('/', auth, deleteAllNotifications);

// Тестовое уведомление (текущему пользователю)
router.post('/test', auth, sendTestNotification);

// Создать отложенное уведомление (текущему пользователю)
router.post('/scheduled', auth, createScheduledNotification);

// Отправить уведомление конкретному пользователю (админ)
router.post('/admin/send-to-user', auth, sendNotificationToUser);

module.exports = router;