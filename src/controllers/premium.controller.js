const db = require('../db/db');

// Проверить премиум статус пользователя
const checkPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 ДЕТАЛЬНАЯ ПРОВЕРКА пользователя:', userId);
    
    // 1. Проверим самого пользователя
    const [userData] = await db.execute(
      'SELECT id, login, is_premium FROM user WHERE id = ?',
      [userId]
    );
    console.log('👤 Данные пользователя:', userData[0]);
    
    // 2. Проверим ВСЕ подписки
    const [allSubs] = await db.execute(
      'SELECT * FROM premiumuser WHERE user_id = ? ORDER BY subscription_end DESC',
      [userId]
    );
    console.log('📋 Все подписки:', allSubs);
    
    // 3. Проверим активные подписки с ДЕТАЛЬНОЙ информацией о времени
    const [activeSubs] = await db.execute(
      `SELECT *, 
       NOW() as db_current_time,
       TIMESTAMPDIFF(SECOND, NOW(), subscription_end) as diff_seconds,
       subscription_end > NOW() as is_active
       FROM premiumuser 
       WHERE user_id = ? AND subscription_end > NOW()`,
      [userId]
    );
    console.log('✅ Активные подписки:', activeSubs);
    
    // 4. Проверим запрос который используется в основном коде
    const [mainQuerySubs] = await db.execute(
      'SELECT * FROM premiumuser WHERE user_id = ? AND subscription_end > NOW() ORDER BY subscription_end DESC LIMIT 1',
      [userId]
    );
    console.log('🎯 Основной запрос результат:', mainQuerySubs);
    
    const hasActivePremium = mainQuerySubs.length > 0;
    const hadPremiumBefore = allSubs.length > 0;
    
    console.log('🎯 ФИНАЛЬНЫЙ СТАТУС:');
    console.log('   - hasActivePremium:', hasActivePremium);
    console.log('   - hadPremiumBefore:', hadPremiumBefore);
    console.log('   - userId из токена:', req.user.userId);
    console.log('   - userId из базы:', userData[0]?.id);
    
    if (hasActivePremium) {
      const subscription = mainQuerySubs[0];
      const subscriptionEnd = new Date(subscription.subscription_end);
      const now = new Date();
      const daysRemaining = Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24));
      
      console.log('🎉 Пользователь премиум, дней осталось:', daysRemaining);
      
      return res.status(200).json({
        hasActivePremium: true,
        hadPremiumBefore: hadPremiumBefore,
        subscriptionEnd: subscription.subscription_end,
        daysRemaining: Math.max(0, daysRemaining)
      });
    } else {
      console.log('❌ Пользователь не имеет активной подписки');
      console.log('❌ Почему? mainQuerySubs.length =', mainQuerySubs.length);
      return res.status(200).json({
        hasActivePremium: false,
        hadPremiumBefore: hadPremiumBefore
      });
    }
    
  } catch (err) {
    console.error('❌ Ошибка при проверке премиум статуса:', err);
    return res.status(500).json({ error: 'Ошибка сервера при проверке премиум статуса' });
  }
};

// Активировать премиум подписку
const activatePremium = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🎯 Активация премиум подписки для пользователя:', userId);
    
    // Проверяем, была ли уже подписка
    const [allSubscriptions] = await db.execute(
      'SELECT COUNT(*) as count FROM premiumuser WHERE user_id = ?',
      [userId]
    );
    
    const hadPremiumBefore = allSubscriptions[0].count > 0;
    
    // Добавляем запись в premiumuser (активная подписка на 1 месяц)
    const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const [result] = await db.execute(
      'INSERT INTO premiumuser (user_id, subscription_start, subscription_end) VALUES (?, NOW(), ?)',
      [userId, subscriptionEnd]
    );
    
    // Обновляем поле is_premium
    await db.execute(
      'UPDATE user SET is_premium = 1 WHERE id = ?',
      [userId]
    );
    
    console.log('✅ Премиум подписка активирована до:', subscriptionEnd);
    
    return res.status(200).json({
      message: 'Премиум подписка успешно активирована',
      isFirstSubscription: !hadPremiumBefore,
      subscriptionEnd: subscriptionEnd.toISOString()
    });
    
  } catch (err) {
    console.error('❌ Ошибка при активации премиум подписки:', err);
    return res.status(500).json({ error: 'Ошибка сервера при активации премиум подписки' });
  }
};

module.exports = {
  checkPremiumStatus,
  activatePremium
};