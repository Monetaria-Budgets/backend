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
    let allSubs;
    let hadPrem;
    try {
      allSubs = await db.query(
        'SELECT COUNT(*) as count FROM premiumuser WHERE user_id = $1',
        [userId]
      );
      
      hadPrem = await db.query(
        'SELECT is_premium FROM "user" WHERE id = $1',
        [userId]
      );
      
      console.log('📊 Всего подписок:', parseInt(allSubs.rows[0]?.count) || 0);
    } catch (dbError) {
      console.error('❌ Ошибка при запросе всех подписок:', dbError);
      // Продолжаем выполнение, считаем что подписок нет
      allSubs = { rows: [{ count: '0' }] };
      hadPrem = { rows: [{ is_premium: false }] };
    }

    // Получаем активную подписку
    let activeSubs;
    try {
      activeSubs = await db.query(
        'SELECT * FROM premiumuser WHERE user_id = $1 AND subscription_end > CURRENT_TIMESTAMP ORDER BY subscription_end DESC LIMIT 1',
        [userId]
      );
      console.log('✅ Активных подписок:', activeSubs.rows.length);
    } catch (dbError) {
      console.error('❌ Ошибка при запросе активных подписок:', dbError);
      // Продолжаем выполнение, считаем что активных подписок нет
      activeSubs = { rows: [] };
    }

    const hasActivePremium = activeSubs.rows.length > 0;
    const hadPremiumBefore = hadPrem.rows[0]?.is_premium === true;

    console.log('🎯 Статус премиум:', { 
      hasActivePremium, 
      hadPremiumBefore,
      userId 
    });

    if (hasActivePremium) {
      const subscription = activeSubs.rows[0];
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
    connection = await db.pool.connect();
    await connection.query('BEGIN');
    
    console.log('🔍 Проверяем существующие подписки...');
    
    // Проверяем, была ли уже подписка
    const allSubscriptions = await connection.query(
      'SELECT COUNT(*) as count FROM premiumuser WHERE user_id = $1',
      [userId]
    );
    
    const hadPremiumBefore = parseInt(allSubscriptions.rows[0].count) > 0;
    
    console.log('📝 Добавляем новую подписку...');
    
    // Добавляем запись в premiumuser (активная подписка на 1 месяц)
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30); // +30 дней
    
    // Используем существующие колонки (created_at вместо subscription_start)
    const result = await connection.query(
      'INSERT INTO premiumuser (user_id, subscription_end) VALUES ($1, $2) RETURNING id',
      [userId, subscriptionEnd]
    );
    
    console.log('🔄 Обновляем статус пользователя...');
    
    // Обновляем поле is_premium
    await connection.query(
      'UPDATE "user" SET is_premium = true WHERE id = $1',
      [userId]
    );
    
    // Коммитим транзакцию
    await connection.query('COMMIT');
    
    console.log('✅ Премиум подписка активирована до:', subscriptionEnd);
    
    return res.status(200).json({
      message: 'Премиум подписка успешно активирована',
      isFirstSubscription: !hadPremiumBefore,
      subscriptionEnd: subscriptionEnd.toISOString()
    });
    
  } catch (err) {
    // Откатываем транзакцию в случае ошибки
    if (connection) {
      await connection.query('ROLLBACK');
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