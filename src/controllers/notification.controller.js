// const db = require('../db/db');
// const { Expo } = require('expo-server-sdk');

// // Получить уведомления пользователя (теперь через миддлвейр)
// const getNotificationsByUserId = async (req, res) => {
//   try {
//     const userId = req.user.userId; // Из миддлвейра auth
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const offset = (page - 1) * limit;

//     const [rows] = await db.execute(
//       `SELECT 
//         n.id, 
//         n.user_id, 
//         n.type_id,
//         nt.name as type_name,
//         n.title, 
//         n.message, 
//         n.data,
//         n.is_read, 
//         n.created_at
//        FROM notification n
//        LEFT JOIN notificationtype nt ON n.type_id = nt.id
//        WHERE n.user_id = ?
//        ORDER BY n.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [userId, limit, offset]
//     );

//     const [countRows] = await db.execute(
//       'SELECT COUNT(*) as total FROM notification WHERE user_id = ?',
//       [userId]
//     );

//     const notifications = rows.map(notification => ({
//       id: notification.id,
//       user_id: notification.user_id,
//       type_id: notification.type_id,
//       type_name: notification.type_name,
//       title: notification.title,
//       message: notification.message,
//       data: notification.data ? JSON.parse(notification.data) : null,
//       is_read: notification.is_read,
//       created_at: notification.created_at
//     }));

//     return res.status(200).json({
//       notifications,
//       pagination: {
//         page,
//         limit,
//         total: countRows[0].total,
//         hasMore: (page * limit) < countRows[0].total
//       }
//     });

//   } catch (err) {
//     console.error('Get notifications by user id error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Пометить уведомление как прочитанное
// const markNotificationAsRead = async (req, res) => {
//   try {
//     const notificationId = req.params.id;
//     const userId = req.user.userId; // Из миддлвейра

//     if (isNaN(notificationId)) {
//       return res.status(400).json({ error: 'ID уведомления должен быть числом' });
//     }

//     // Проверяем, что уведомление принадлежит пользователю
//     const [rows] = await db.execute(
//       'SELECT id FROM notification WHERE id = ? AND user_id = ? AND is_read = FALSE',
//       [notificationId, userId]
//     );

//     if (rows.length === 0) {
//       return res.status(409).json({ error: 'Уведомление не найдено или уже прочитано' });
//     }

//     await db.execute(
//       `UPDATE notification
//        SET is_read = TRUE
//        WHERE id = ? AND user_id = ? AND is_read = FALSE`,
//       [notificationId, userId]
//     );

//     return res.status(200).json({ message: 'Уведомление помечено как прочитанное' });

//   } catch (err) {
//     console.error('Set notification readed error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Получить количество непрочитанных
// const getUnreadCount = async (req, res) => {
//   try {
//     const userId = req.user.userId; // Из миддлвейра

//     const [rows] = await db.execute(
//       'SELECT COUNT(*) as count FROM notification WHERE user_id = ? AND is_read = FALSE',
//       [userId]
//     );

//     return res.status(200).json({ count: rows[0].count });

//   } catch (err) {
//     console.error('Get unread count error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Пометить все как прочитанные
// const markAllNotificationsAsRead = async (req, res) => {
//   try {
//     const userId = req.user.userId; // Из миддлвейра

//     await db.execute(
//       `UPDATE notification 
//        SET is_read = TRUE 
//        WHERE user_id = ? AND is_read = FALSE`,
//       [userId]
//     );

//     return res.status(200).json({ message: 'Все уведомления помечены как прочитанные' });

//   } catch (err) {
//     console.error('Mark all notifications as read error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Создать уведомление (для админа)
// const createNotification = async (req, res) => {
//   try {
//     const { user_id, type_id, title, message, data } = req.body;

//     if (!user_id || !type_id || !message) {
//       return res.status(400).json({ 
//         error: 'Обязательные поля: user_id, type_id, message' 
//       });
//     }

//     // Проверяем существование типа уведомления
//     const [typeRows] = await db.execute(
//       'SELECT id, name FROM notificationtype WHERE id = ?',
//       [type_id]
//     );

//     if (typeRows.length === 0) {
//       return res.status(400).json({ error: 'Неверный тип уведомления' });
//     }

//     const [result] = await db.execute(
//       `INSERT INTO notification (user_id, type_id, title, message, data, is_read, created_at) 
//        VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
//       [user_id, type_id, title || null, message, data ? JSON.stringify(data) : null]
//     );

//     // Отправляем пуш-уведомление
//     await sendPushNotification(user_id, {
//       title: title || getDefaultTitle(typeRows[0].name),
//       body: message,
//       data: data || {}
//     });

//     return res.status(201).json({
//       id: result.insertId,
//       message: 'Уведомление создано'
//     });

//   } catch (err) {
//     console.error('Create notification error:', err);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

// // Вспомогательные функции
// const sendPushNotification = async (userId, notification) => {
//   try {
//     const [tokens] = await db.execute(
//       'SELECT expo_push_token FROM users WHERE id = ? AND expo_push_token IS NOT NULL',
//       [userId]
//     );

//     if (tokens.length === 0) return;

//     const expo = new Expo();
//     const messages = [];

//     for (const token of tokens) {
//       if (!Expo.isExpoPushToken(token.expo_push_token)) {
//         console.error(`Invalid Expo push token for user ${userId}`);
//         continue;
//       }

//       messages.push({
//         to: token.expo_push_token,
//         sound: 'default',
//         title: notification.title,
//         body: notification.body,
//         data: notification.data,
//         badge: 1
//       });
//     }

//     if (messages.length > 0) {
//       const chunks = expo.chunkPushNotifications(messages);
      
//       for (const chunk of chunks) {
//         try {
//           await expo.sendPushNotificationsAsync(chunk);
//         } catch (error) {
//           console.error('Error sending push notification:', error);
//         }
//       }
//     }

//   } catch (err) {
//     console.error('Send push notification error:', err);
//   }
// };

// const getDefaultTitle = (typeName) => {
//   const titles = {
//     'budget_exceeded': 'Превышение бюджета',
//     'promo': 'Специальное предложение',
//     'subscription_expiring': 'Подписка истекает',
//     'system_update': 'Обновление системы'
//   };
//   return titles[typeName] || 'Уведомление';
// };

// module.exports = {
//   getNotificationsByUserId,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
//   getUnreadCount,
//   createNotification
// };