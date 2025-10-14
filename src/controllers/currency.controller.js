const axios = require('axios');
const db = require('../db/db');

class CurrencyController {
  
  popularCurrencies = ['USD', 'EUR', 'CNY', 'TRY', 'KZT', 'BYN', 'UAH', 'GBP'];

  async fetchRatesFromCBR() {
    try {
      console.log('Получаем данные от ЦБ РФ...');
      const response = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js', {
        timeout: 10000
      });
      console.log('Данные успешно получены');
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении данных от ЦБ РФ:', error.message);
      throw new Error('Не удалось получить курсы валют от ЦБ РФ');
    }
  }

  // Инициализация валют в БД
  async initializeCurrencies(req, res) {
    try {
      console.log('Инициализация валют в БД...');
      
      // Сначала добавляем рубль, если его нет
      const [existingRub] = await db.execute(
        'SELECT id FROM currency WHERE code = "RUB"'
      );
      
      if (existingRub.length === 0) {
        await db.execute(
          `INSERT INTO currency (code, name, symbol, is_crypto, is_popular, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['RUB', 'Российский рубль', '₽', 0, 1, 0]
        );
        console.log('Добавлен российский рубль');
      }

      const cbrData = await this.fetchRatesFromCBR();
      const valutes = cbrData.Valute;
      
      let addedCount = 0;
      let updatedCount = 0;

      for (const [code, data] of Object.entries(valutes)) {
        const [existingCurrency] = await db.execute(
          'SELECT id FROM currency WHERE code = ?',
          [code]
        );
        
        const isPopular = this.popularCurrencies.includes(code);
        const sortOrder = isPopular ? this.popularCurrencies.indexOf(code) + 1 : 999;

        if (existingCurrency.length === 0) {
          await db.execute(
            `INSERT INTO currency (code, name, symbol, nominal, is_crypto, is_popular, sort_order) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              code,
              data.Name,
              data.CharCode,
              data.Nominal || 1,
              0,
              isPopular ? 1 : 0,
              sortOrder
            ]
          );
          addedCount++;
        } else {
          await db.execute(
            `UPDATE currency 
             SET name = ?, symbol = ?, nominal = ?, is_popular = ?, sort_order = ?
             WHERE code = ?`,
            [
              data.Name,
              data.CharCode,
              data.Nominal || 1,
              isPopular ? 1 : 0,
              sortOrder,
              code
            ]
          );
          updatedCount++;
        }
      }

      console.log(`Инициализация завершена: добавлено ${addedCount}, обновлено ${updatedCount} валют`);
      
      return res.json({
        success: true,
        message: 'Валюты инициализированы',
        data: { added: addedCount, updated: updatedCount }
      });

    } catch (error) {
      console.error('Ошибка при инициализации валют:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при инициализации валют',
        error: error.message
      });
    }
  }

  async updateRates(req, res) {
    try {
      console.log('Начало обновления курсов валют...');
      
      await this.createExchangeRateTable();
      
      const cbrData = await this.fetchRatesFromCBR();
      const valutes = cbrData.Valute;
      const currentDate = new Date().toISOString().split('T')[0];
      
      let updatedCount = 0;
      let errorCount = 0;

      for (const [code, data] of Object.entries(valutes)) {
        try {
          const [currency] = await db.execute(
            'SELECT id FROM currency WHERE code = ?',
            [code]
          );
          
          if (currency.length === 0) {
            console.warn(`Валюта ${code} не найдена в БД, пропускаем`);
            continue;
          }

          const currencyId = currency[0].id;
          
          // Берем данные напрямую из ответа ЦБ
          const currentRate = parseFloat(data.Value);
          const previousRate = parseFloat(data.Previous);
          const changeAmount = currentRate - previousRate;
          const changePercentage = previousRate !== 0 ? (changeAmount / previousRate) * 100 : 0;

          await db.execute(
            `INSERT INTO exchange_rate 
            (currency_id, rate, previous_rate, change_amount, change_percentage, date) 
            VALUES (?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            rate = VALUES(rate), 
            previous_rate = VALUES(previous_rate), 
            change_amount = VALUES(change_amount), 
            change_percentage = VALUES(change_percentage),
            updated_at = CURRENT_TIMESTAMP`,
            [
              currencyId,
              currentRate,
              previousRate,
              changeAmount,
              changePercentage,
              currentDate
            ]
          );

          updatedCount++;

        } catch (currencyError) {
          console.error(`Ошибка при обработке валюты ${code}:`, currencyError);
          errorCount++;
        }
      }

      console.log(`Обновление курсов завершено: успешно ${updatedCount}, ошибок ${errorCount}`);
      
      return res.json({
        success: true,
        message: 'Курсы обновлены',
        data: { 
          updated: updatedCount, 
          errors: errorCount,
          date: currentDate 
        }
      });

    } catch (error) {
      console.error('Критическая ошибка при обновлении курсов:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении курсов',
        error: error.message
      });
    }
  }

  async createExchangeRateTable() {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS exchange_rate (
          id int NOT NULL AUTO_INCREMENT,
          currency_id int NOT NULL,
          rate decimal(10,4) NOT NULL,
          previous_rate decimal(10,4) DEFAULT NULL,
          change_amount decimal(10,4) DEFAULT '0.0000',
          change_percentage decimal(6,3) DEFAULT '0.000',
          date date NOT NULL,
          updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uk_currency_date (currency_id, date),
          KEY idx_date (date),
          KEY idx_currency_id (currency_id),
          CONSTRAINT fk_exchange_rate_currency FOREIGN KEY (currency_id) REFERENCES currency (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);
      console.log('Таблица exchange_rate создана/проверена');
    } catch (error) {
      console.error('Ошибка при создании таблицы exchange_rate:', error);
      throw error;
    }
  }

  // Получение курсов для отображения
  async getRates(req, res) {
    try {
      const { 
        popular = 'false', 
        search = '',
        sort = 'default'
      } = req.query;
      
      const showPopular = popular === 'true';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let query = `
        SELECT 
          c.id,
          c.code,
          c.name,
          c.symbol,
          c.nominal,
          c.is_popular,
          c.sort_order,
          er.rate,
          er.previous_rate,
          er.change_amount,
          er.change_percentage,
          er.date,
          er.updated_at
        FROM currency c
        LEFT JOIN exchange_rate er ON c.id = er.currency_id AND er.date = ?
        WHERE c.code != 'RUB'
      `;
      
      const params = [currentDate];
      
      if (showPopular) {
        query += ' AND c.is_popular = 1';
      }
      
      if (search) {
        query += ' AND (c.name LIKE ? OR c.code LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (sort === 'name') {
        query += ` ORDER BY c.name ASC`;
      } else if (sort === 'name_desc') {
        query += ` ORDER BY c.name DESC`;
      } else if (sort === 'change') {
        query += ` ORDER BY ABS(er.change_percentage) DESC`;
      } else {
        query += ` ORDER BY c.is_popular DESC, c.sort_order ASC, c.name ASC`;
      }

      const [rates] = await db.execute(query, params);
      
      const formattedRates = rates.map(rate => ({
        id: rate.id,
        code: rate.code,
        name: rate.name,
        symbol: rate.symbol,
        nominal: rate.nominal,
        rate: rate.rate ? parseFloat(rate.rate).toFixed(4) : null,
        previousRate: rate.previous_rate ? parseFloat(rate.previous_rate).toFixed(4) : null,
        change: rate.change_amount ? parseFloat(rate.change_amount).toFixed(4) : 0,
        changePercentage: rate.change_percentage ? parseFloat(rate.change_percentage).toFixed(3) : 0,
        isPopular: Boolean(rate.is_popular),
        lastUpdated: rate.updated_at
      }));

      return res.json({
        success: true,
        data: formattedRates,
        meta: {
          total: formattedRates.length,
          popular: formattedRates.filter(r => r.isPopular).length,
          date: currentDate
        }
      });

    } catch (error) {
      console.error('Ошибка при получении курсов:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при получении курсов валют',
        error: error.message
      });
    }
  }

  // Получение курса по конкретной валюте
  async getRateByCode(req, res) {
    try {
      const { currencyCode } = req.params;
      
      const [rates] = await db.execute(
        `SELECT 
          c.code,
          c.name,
          c.symbol,
          c.nominal,
          er.rate,
          er.change_amount,
          er.change_percentage,
          er.date,
          er.updated_at
         FROM currency c
         LEFT JOIN exchange_rate er ON c.id = er.currency_id
         WHERE c.code = ? 
         ORDER BY er.date DESC LIMIT 1`,
        [currencyCode.toUpperCase()]
      );
      
      if (rates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Валюта не найдена'
        });
      }

      const rate = rates[0];
      const result = {
        code: rate.code,
        name: rate.name,
        symbol: rate.symbol,
        nominal: rate.nominal,
        rate: rate.rate ? parseFloat(rate.rate).toFixed(2) : null,
        change: rate.change_amount ? parseFloat(rate.change_amount).toFixed(2) : 0,
        changePercentage: rate.change_percentage ? parseFloat(rate.change_percentage).toFixed(2) : 0,
        date: rate.date,
        lastUpdated: rate.updated_at
      };

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Ошибка при получении курса:', error);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при получении курса валюты',
        error: error.message
      });
    }
  }

  async getCurrencyStatus(req, res) {
    try {
        // Проверяем, есть ли валюты в БД
        const [currencies] = await db.execute('SELECT COUNT(*) as count FROM currency WHERE code != "RUB"');
        const [rates] = await db.execute('SELECT COUNT(*) as count FROM exchange_rate');
        
        return res.json({
        success: true,
        data: {
            currenciesCount: currencies[0].count,
            ratesCount: rates[0].count,
            needsInitialization: currencies[0].count === 0
        }
        });
    } catch (error) {
        console.error('Error checking currency status:', error);
        return res.status(500).json({
        success: false,
        message: 'Ошибка при проверке статуса валют',
        error: error.message
        });
    }
    }
}



// Создаем экземпляр контроллера
const currencyController = new CurrencyController();

// Экспортируем методы как отдельные функции
module.exports = {
  initializeCurrencies: (req, res) => currencyController.initializeCurrencies(req, res),
  updateRates: (req, res) => currencyController.updateRates(req, res),
  getRates: (req, res) => currencyController.getRates(req, res),
  getRateByCode: (req, res) => currencyController.getRateByCode(req, res),
  getCurrencyStatus: (req, res) => currencyController.getCurrencyStatus(req, res),
};