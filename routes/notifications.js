const express = require('express');
const router = express.Router();
const { 
    getAllNotifications, 
    getNotificationById,
    getNotificationsByUserId,
    markNotificationAsRead
} = require('../controllers/notificationController');

// GET /notifications → получить все уведомления
router.get('/', getAllNotifications);

// GET /notifications/:id → получить уведомление по ID
router.get('/:id', getNotificationById);

// 🆕 GET /notifications/user/:userId → получить все уведомления пользователя по его ID
router.get('/user/:userId', getNotificationsByUserId);

// 🆕 PUT /notifications/:id/read → пометить уведомление как прочитанное
router.put('/:id/read', markNotificationAsRead);

module.exports = router;