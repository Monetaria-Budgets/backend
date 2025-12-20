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
      const existingRub = await db.query(
        'SELECT id FROM currency WHERE code = \'RUB\''
      );
      
      if (existingRub.rows.length === 0) {
        await db.query(
          `INSERT INTO currency (code, name, symbol, is_crypto, is_popular, sort_order) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          ['RUB', 'Российский рубль', '₽', 0, 1, 0]
        );
        console.log('Добавлен российский рубль');
      }

      const cbrData = await this.fetchRatesFromCBR();
      const valutes = cbrData.Valute;
      
      let addedCount = 0;
      let updatedCount = 0;

      for (const [code, data] of Object.entries(valutes)) {
        const existingCurrency = await db.query(
          'SELECT id FROM currency WHERE code = $1',
          [code]
        );
        
        const isPopular = this.popularCurrencies.includes(code);
        const sortOrder = isPopular ? this.popularCurrencies.indexOf(code) + 1 : 999;

        if (existingCurrency.rows.length === 0) {
          await db.query(
            `INSERT INTO currency (code, name, symbol, nominal, is_crypto, is_popular, sort_order) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
          await db.query(
            `UPDATE currency 
             SET name = $1, symbol = $2, nominal = $3, is_popular = $4, sort_order = $5
             WHERE code = $6`,
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
      
      // ВАЖНО: Используем дату из данных ЦБ, а не текущую дату
      const cbrDate = new Date(cbrData.Date).toISOString().split('T')[0];
      const currentDate = new Date().toISOString().split('T')[0];
      
      console.log('Дата курсов от ЦБ:', cbrDate);
      console.log('Текущая дата:', currentDate);
      
      let updatedCount = 0;
      let errorCount = 0;

      for (const [code, data] of Object.entries(valutes)) {
        try {
          const currency = await db.query(
            'SELECT id FROM currency WHERE code = $1',
            [code]
          );
          
          if (currency.rows.length === 0) {
            console.warn(`Валюта ${code} не найдена в БД, пропускаем`);
            continue;
          }

          const currencyId = currency.rows[0].id;
          
          // Проверяем данные
          const currentRate = parseFloat(data.Value);
          const previousRate = parseFloat(data.Previous);
          
          if (isNaN(currentRate) || currentRate === 0) {
            console.warn(`Некорректный курс для ${code}:`, currentRate);
            continue;
          }

          const changeAmount = currentRate - previousRate;
          const changePercentage = previousRate !== 0 ? (changeAmount / previousRate) * 100 : 0;

          // Используем дату из ЦБ для вставки
          await db.query(
            `INSERT INTO exchange_rate 
            (currency_id, rate, previous_rate, change_amount, change_percentage, date) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            ON CONFLICT (currency_id, date) DO UPDATE 
            SET rate = EXCLUDED.rate, 
                previous_rate = EXCLUDED.previous_rate, 
                change_amount = EXCLUDED.change_amount, 
                change_percentage = EXCLUDED.change_percentage,
                updated_at = CURRENT_TIMESTAMP`,
            [
              currencyId,
              currentRate,
              previousRate,
              changeAmount,
              changePercentage,
              cbrDate
            ]
          );

          updatedCount++;
          console.log(`Обновлен курс ${code}: ${currentRate} (было: ${previousRate})`);

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
          date: cbrDate,
          currentDate: currentDate
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
      await db.query(`
        CREATE TABLE IF NOT EXISTS exchange_rate (
          id SERIAL PRIMARY KEY,
          currency_id INTEGER NOT NULL REFERENCES currency(id) ON DELETE CASCADE,
          rate DECIMAL(10,4) NOT NULL,
          previous_rate DECIMAL(10,4) DEFAULT NULL,
          change_amount DECIMAL(10,4) DEFAULT 0.0000,
          change_percentage DECIMAL(6,3) DEFAULT 0.000,
          date DATE NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (currency_id, date)
        )
      `);
      
      // Создаем индексы
      await db.query('CREATE INDEX IF NOT EXISTS idx_exchange_rate_date ON exchange_rate(date)');
      await db.query('CREATE INDEX IF NOT EXISTS idx_exchange_rate_currency_id ON exchange_rate(currency_id)');
      
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
      
      // Сначала получаем самую свежую дату из базы
      const latestDateResult = await db.query(
        'SELECT DISTINCT date FROM exchange_rate ORDER BY date DESC LIMIT 1'
      );
      
      const currentDate = latestDateResult.rows.length > 0 
        ? latestDateResult.rows[0].date 
        : new Date().toISOString().split('T')[0];
      
      console.log('Используемая дата для курсов:', currentDate);
      
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
        LEFT JOIN exchange_rate er ON c.id = er.currency_id AND er.date = $1
        WHERE c.code != 'RUB'
      `;
      
      const params = [currentDate];
      
      if (showPopular) {
        query += ' AND c.is_popular = true';
      }
      
      if (search) {
        query += ' AND (c.name ILIKE $2 OR c.code ILIKE $3)';
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

      const rates = await db.query(query, params);
      
      const formattedRates = rates.rows.map(rate => ({
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
      
      const rates = await db.query(
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
         WHERE c.code = $1 
         ORDER BY er.date DESC LIMIT 1`,
        [currencyCode.toUpperCase()]
      );
      
      if (rates.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Валюта не найдена'
        });
      }

      const rate = rates.rows[0];
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
        const currencies = await db.query('SELECT COUNT(*) as count FROM currency WHERE code != \'RUB\'');
        const rates = await db.query('SELECT COUNT(*) as count FROM exchange_rate');
        
        return res.json({
        success: true,
        data: {
            currenciesCount: parseInt(currencies.rows[0].count),
            ratesCount: parseInt(rates.rows[0].count),
            needsInitialization: parseInt(currencies.rows[0].count) === 0
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