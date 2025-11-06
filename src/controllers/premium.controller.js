const db = require('../db/db');

// Проверить премиум статус пользователя
const checkPremiumStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Проверка премиум статуса для пользователя:', userId);
    
    if (!userId) {
      console.error('❌ userId не определен');
      return res.status(400).json({ 
        error: 'User ID не определен',
        hasActivePremium: false,
        hadPremiumBefore: false
      });
    }

    // Проверяем все подписки для hadPremiumBefore
    let allSubs = [];
    try {
      [allSubs] = await db.execute(
        'SELECT COUNT(*) as count FROM premiumuser WHERE user_id = ?',
        [userId]
      );
      hadPrem = await db.execute(
        'SELECT is_premium FROM user WHERE id = ?',
        [userId]
      );
      console.log('📊 Всего подписок:', allSubs[0]?.count || 0);
    } catch (dbError) {
      console.error('❌ Ошибка при запросе всех подписок:', dbError);
      // Продолжаем выполнение, считаем что подписок нет
      allSubs = [{ count: 0 }];
    }

    // Получаем активную подписку
    let activeSubs = [];
    try {
      [activeSubs] = await db.execute(
        'SELECT * FROM premiumuser WHERE user_id = ? AND subscription_end > NOW() ORDER BY subscription_end DESC LIMIT 1',
        [userId]
      );
      console.log('✅ Активных подписок:', activeSubs.length);
    } catch (dbError) {
      console.error('❌ Ошибка при запросе активных подписок:', dbError);
      // Продолжаем выполнение, считаем что активных подписок нет
      activeSubs = [];
    }

    const hasActivePremium = activeSubs.length > 0;
    const hadPremiumBefore = hadPrem;

    console.log('🎯 Статус премиум:', { 
      hasActivePremium, 
      hadPremiumBefore,
      userId 
    });

    if (hasActivePremium) {
      const subscription = activeSubs[0];
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
      
      return res.status(200).json({
        hasActivePremium: false,
        hadPremiumBefore: hadPremiumBefore
      });
    }
    
  } catch (err) {
    console.error('❌ Критическая ошибка при проверке премиум статуса:', err);
    console.error('❌ Stack trace:', err.stack);
    
    // Возвращаем безопасный ответ даже при ошибке
    return res.status(200).json({
      hasActivePremium: false,
      hadPremiumBefore: false,
      error: 'Временная ошибка сервера'
    });
  }
};

// Активировать премиум подписку
const activatePremium = async (req, res) => {
  let connection;
  try {
    const userId = req.user.userId;
    console.log('🎯 Активация премиум подписки для пользователя:', userId);
    
    // Получаем соединение для транзакции
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    console.log('🔍 Проверяем существующие подписки...');
    
    // Проверяем, была ли уже подписка
    const [allSubscriptions] = await connection.execute(
      'SELECT COUNT(*) as count FROM premiumuser WHERE user_id = ?',
      [userId]
    );
    
    const hadPremiumBefore = allSubscriptions[0].count > 0;
    
    console.log('📝 Добавляем новую подписку...');
    
    // Добавляем запись в premiumuser (активная подписка на 1 месяц)
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // +30 дней
    
    // Используем существующие колонки (created_at вместо subscription_start)
    const [result] = await connection.execute(
      'INSERT INTO premiumuser (user_id, subscription_end) VALUES (?, ?)',
      [userId, subscriptionEnd]
    );
    
    console.log('🔄 Обновляем статус пользователя...');
    
    // Обновляем поле is_premium
    await connection.execute(
      'UPDATE user SET is_premium = 1 WHERE id = ?',
      [userId]
    );
    
    // Коммитим транзакцию
    await connection.commit();
    
    console.log('✅ Премиум подписка активирована до:', subscriptionEnd);
    
    return res.status(200).json({
      message: 'Премиум подписка успешно активирована',
      isFirstSubscription: !hadPremiumBefore,
      subscriptionEnd: subscriptionEnd.toISOString()
    });
    
  } catch (err) {
    // Откатываем транзакцию в случае ошибки
    if (connection) {
      await connection.rollback();
    }
    
    console.error('❌ Ошибка при активации премиум подписки:', err);
    return res.status(500).json({ 
      error: 'Ошибка сервера при активации премиум подписки',
      details: err.message 
    });
  } finally {
    // Освобождаем соединение
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  checkPremiumStatus,
  activatePremium
};