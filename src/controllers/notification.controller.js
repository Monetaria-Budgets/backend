const db = require('../db/db'); // подключение к БД

// Получить все уведомления
const getAllNotifications = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, user_id, message, created_at FROM notification');

        const notifications = rows.map(notification => ({
            id: notification.id,
            user: notification.user_id,
            message: notification.message,
            created_at: notification.created_at
        }));

        return res.status(200).json(notifications);

    }   catch (err) {
        console.error('Get all notifications error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

// Получить уведомление по ID
const getNotificationById = async (req, res) => {
    try {
        const notificationId = req.params.id;

        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'ID уведомления должен быть числом' });
        }

        const [rows] = await db.execute(
            'SELECT id, user_id, message, created_at FROM notification WHERE id = ?',
            [notificationId]
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Уведомление не найдено!' });
        }

        const notification = rows[0];

        return res.status(200).json({
            id: notification.id,
            user_id: notification.user_id,
            message: notification.message,
            created_at: notification.created_at
        });

    }   catch (err) {
        console.error('Get notification error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};



// Получить все уведомления пользователя по его ID
const getNotificationsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID пользователя должен быть числом' });
        }

        const [rows] = await db.execute(
            `SELECT id, user_id, message, is_read, created_at
            FROM notification 
            WHERE user_id = ?
            ORDER BY created_at DESC`
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Уведомления пользователя не найдены!' });
        }


        const notifications = rows.map(notification => ({
            id: notification.id,
            user_id: notification.user_id,
            message: notification.message,
            created_at: notification.created_at
        }));

        return res.status(200).json(notifications)

    }   catch (err) {
        console.error('Get notifications by user id error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

// Пометить уведомление как прочитанное
const markNotificationAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;

        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'ID уведомления должен быть числом' });
        }

        const [rows] = await db.execute(
            'SELECT id FROM notification where id = ? AND is_read = FALSE',
            [notificationId]
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Уведомление не найдено или уже прочитано' });
        }

        await db.execute(
            `UPDATE notification
            SET is_read = TRUE
            WHERE id = ? AND is_read = FALSE`,
            [notificationId]
        );

        return res.status(200).json({ message: 'Уведомление отсечено как прочитанное' });

    }   catch (err) {
        console.error('Set notification readed error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

module.exports = {
    getAllNotifications,
    getNotificationById,
    getNotificationsByUserId,
    markNotificationAsRead
};