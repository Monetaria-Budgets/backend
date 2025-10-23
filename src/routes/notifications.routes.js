const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  createNotification
} = require('../controllers/notification.controller');

// Все роуты требуют аутентификации
router.use(auth);

// GET /notifications/user/me → получить уведомления текущего пользователя
router.get('/user/me', getNotificationsByUserId);

// GET /notifications/user/me/unread-count → количество непрочитанных
router.get('/user/me/unread-count', getUnreadCount);

// PUT /notifications/:id/read → пометить уведомление как прочитанное
router.put('/:id/read', markNotificationAsRead);

// PUT /notifications/user/me/read-all → пометить все как прочитанные
router.put('/user/me/read-all', markAllNotificationsAsRead);

// POST /notifications → создать новое уведомление (админ)
router.post('/', createNotification);

module.exports = router;