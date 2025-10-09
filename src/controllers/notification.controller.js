const db = require('../db/db'); // подключение к БД

// Получить все уведомления
const getAllNotifications = async (req, res) => {

    const query = 'SELECT id, user_id, message, created_at FROM Notification';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении уведомлений:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении уведомлений' });
        }
        res.json(results);
    });

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
const getNotificationById = (req, res) => {
    const notificationId = req.params.id;

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'ID уведомления должен быть числом' });
    }

    const query = 'SELECT id, user_id, message, created_at FROM Notification WHERE id = ?';
    db.query(query, [notificationId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении уведомления:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении уведомления' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }
        res.json(results[0]);
    });
};



// Получить все уведомления пользователя по его ID
const getNotificationsByUserId = (req, res) => {
    const userId = req.params.userId;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID пользователя должен быть числом' });
    }

    const query = `
        SELECT id, user_id, message, is_read, created_at  -- 🆕 добавили is_read
        FROM Notification 
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении уведомлений пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении уведомлений' });
        }
        res.json(results);
    });
};

// Пометить уведомление как прочитанное
const markNotificationAsRead = (req, res) => {
    const notificationId = req.params.id;

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'ID уведомления должен быть числом' });
    }

    const query = `
        UPDATE Notification 
        SET is_read = TRUE 
        WHERE id = ? AND is_read = FALSE
    `;
    db.query(query, [notificationId], (err, result) => {
        if (err) {
            console.error('Ошибка при обновлении статуса уведомления:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Уведомление не найдено или уже прочитано' });
        }
        res.json({ message: 'Уведомление помечено как прочитанное', id: notificationId });
    });
};

module.exports = {
    getAllNotifications,
    getNotificationById,
    getNotificationsByUserId,
    markNotificationAsRead
};