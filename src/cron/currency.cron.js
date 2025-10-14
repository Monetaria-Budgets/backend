const currencyController = require('../controllers/currency.controller');
const cron = require('node-cron');

class CurrencyCron {
  init() {
    // Обновляем курсы каждый день в 12:00
    cron.schedule('0 12 * * *', async () => {
      console.log('🔄 Запуск автоматического обновления курсов валют...');
      try {
        await currencyController.updateRates();
        console.log('✅ Автоматическое обновление курсов завершено');
      } catch (error) {
        console.error('❌ Ошибка в кроне обновления курсов:', error);
      }
    });

    console.log('⏰ Крон-задачи для валют запущены');
  }
}

module.exports = new CurrencyCron();