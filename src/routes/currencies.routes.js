const express = require('express');
const {
  initializeCurrencies,
  updateRates,
  getRates,
  getRateByCode,
  getCurrencyStatus
} = require('../controllers/currency.controller');

const router = express.Router();

// Инициализация валют (запустить один раз)
router.post('/initialize', initializeCurrencies);

// Обновление курсов валют
router.post('/update-rates', updateRates);

// Получение всех курсов
router.get('/rates', getRates);

// Получение курса по конкретной валюте
router.get('/rates/:currencyCode', getRateByCode);

router.get('/status', getCurrencyStatus);


module.exports = router;