const currencyController = require('../controllers/currency.controller');
const cron = require('node-cron');

class CurrencyCron {
  init() {
    // Обновляем курсы каждый день в 12:00
    cron.schedule('0 */2 * * *', async () => {
      console.log('🔄 Проверка и обновление курсов валют (каждые 2 часа)...');
      try {
        await currencyController.updateRates({ query: {} }, {
          json: (data) => console.log('✅ Обновление завершено:', data),
          status: (code) => ({ json: (err) => console.error(`❌ Ошибка ${code}:`, err) })
        });
      } catch (error) {
        console.error('❌ Критическая ошибка в кроне:', error);
      }
    });

    console.log('⏰ Крон-задачи для валют запущены');
  }
}

module.exports = new CurrencyCron();