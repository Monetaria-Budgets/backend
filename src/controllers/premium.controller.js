// controllers/premium.controller.js
const db = require('../db/db');

// Проверить премиум статус пользователя
const checkPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('👑 Проверка премиум статуса для пользователя:', userId);

    // Проверяем наличие активной подписки в premiumuser
    const premiumQuery = `
      SELECT * FROM premiumuser 
      WHERE user_id = ? AND subscription_end > NOW()
      ORDER BY subscription_end DESC
      LIMIT 1
    `;
    const [premiumResult] = await db.execute(premiumQuery, [userId]);
    
    const isPremium = premiumResult.length > 0;
    
    if (isPremium) {
      const subscription = premiumResult[0];
      const subscriptionEnd = new Date(subscription.subscription_end);
      const now = new Date();
      const daysRemaining = Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24));
      
      console.log('✅ Пользователь премиум, дней осталось:', daysRemaining);
      
      return res.status(200).json({
        isPremium: true,
        subscriptionEnd: subscription.subscription_end,
        daysRemaining: Math.max(0, daysRemaining)
      });
    } else {
      console.log('❌ Пользователь не премиум');
      return res.status(200).json({
        isPremium: false
      });
    }

  } catch (err) {
    console.error('❌ Ошибка при проверке премиум статуса:', err);
    return res.status(500).json({ error: 'Ошибка сервера при проверке премиум статуса' });
  }
};

module.exports = {
  checkPremiumStatus
};