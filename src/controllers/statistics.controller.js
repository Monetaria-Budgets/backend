const db = require('../db/db');

// Вспомогательная функция для обработки категорий
const processCategories = (categoriesResult) => {
  const incomeCategories = [];
  const expenseCategories = [];
  
  let totalIncome = 0;
  let totalExpense = 0;

  // Сначала считаем общие суммы
  categoriesResult.forEach(row => {
    if (row.type === 'Доход') {
      totalIncome += parseFloat(row.amount);
    } else {
      totalExpense += parseFloat(row.amount);
    }
  });

  // Затем формируем категории с процентами
  categoriesResult.forEach((row, index) => {
    const category = {
      name: row.name,
      amount: parseFloat(row.amount),
      type: row.type === 'Доход' ? 'income' : 'expense',
      color: row.color || '#666666',
      transactionCount: row.transaction_count
    };

    if (row.type === 'Доход') {
      category.percentage = totalIncome > 0 ? Math.round((category.amount / totalIncome) * 100) : 0;
      incomeCategories.push(category);
    } else {
      category.percentage = totalExpense > 0 ? Math.round((category.amount / totalExpense) * 100) : 0;
      expenseCategories.push(category);
    }
  });

  // Сортируем по убыванию суммы и объединяем
  return [
    ...incomeCategories.sort((a, b) => b.amount - a.amount),
    ...expenseCategories.sort((a, b) => b.amount - a.amount)
  ];
};

// Функция для расчета расширенных метрик
const calculateAdvancedMetrics = (transactions, categories, summary, period) => {
  const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
  const incomeTransactions = transactions.filter(tx => tx.type === 'income');
  
  // Определяем категории обязательных и дискреционных расходов
  const essentialCategories = ['Еда', 'Продукты', 'Транспорт', 'Общественный транспорт', 'Такси', 
                              'Жилье', 'Аренда', 'Ипотека', 'Коммуналка', 'Электричество', 'Вода', 'Газ', 'Интернет',
                              'Здоровье', 'Медицина', 'Лекарства', 'Страхование', 'Образование'];
  
  const discretionaryCategories = ['Развлечения', 'Рестораны', 'Кафе', 'Одежда', 'Обувь', 'Хобби', 
                                  'Путешествия', 'Красота', 'Спорт', 'Подарки', 'Отдых', 'Кино', 'Музыка'];

  // Расчет обязательных и дискреционных расходов
  const essentialExpenses = categories
    .filter(cat => cat.type === 'expense' && essentialCategories.some(essential => cat.name.includes(essential)))
    .reduce((sum, cat) => sum + cat.amount, 0);
    
  const discretionaryExpenses = categories
    .filter(cat => cat.type === 'expense' && discretionaryCategories.some(discretionary => cat.name.includes(discretionary)))
    .reduce((sum, cat) => sum + cat.amount, 0);

  // Основные финансовые соотношения
  const essentialToIncome = summary.income > 0 ? (essentialExpenses / summary.income) * 100 : 0;
  const discretionaryToIncome = summary.income > 0 ? (discretionaryExpenses / summary.income) * 100 : 0;
  const netFlowToIncome = summary.income > 0 ? (summary.netFlow / summary.income) * 100 : 0;
  const expenseToIncomeRatio = summary.income > 0 ? (summary.expense / summary.income) * 100 : 0;

  // Анализ регулярности доходов
  const incomeDates = incomeTransactions.map(tx => new Date(tx.created_at).getTime());
  const incomeDateSpread = incomeDates.length > 1 ? 
    (Math.max(...incomeDates) - Math.min(...incomeDates)) / (1000 * 60 * 60 * 24) : 0;
  
  const incomeRegularity = incomeTransactions.length > 1 ? 
    Math.min(100, (incomeTransactions.length / (incomeDateSpread / 30)) * 10) : 0;

  // Анализ распределения расходов
  const expenseAmounts = expenseTransactions.map(tx => tx.amount);
  const avgExpense = expenseAmounts.length > 0 ? 
    expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length : 0;
  
  const expenseStdDev = expenseAmounts.length > 0 ? 
    Math.sqrt(expenseAmounts.reduce((sum, amount) => sum + Math.pow(amount - avgExpense, 2), 0) / expenseAmounts.length) : 0;
  
  const expenseConsistency = avgExpense > 0 ? Math.max(0, 100 - (expenseStdDev / avgExpense) * 100) : 0;

  // Расчет финансовой стабильности
  const financialStability = Math.min(100, 
    (Math.max(0, netFlowToIncome) * 0.4) + 
    (Math.max(0, 100 - essentialToIncome) * 0.3) +
    (incomeRegularity * 0.2) +
    (expenseConsistency * 0.1)
  );

  // Оценка финансового здоровья
  let financialHealthRating = 'good';
  let financialHealthScore = 0;

  if (financialStability >= 80) {
    financialHealthRating = 'excellent';
    financialHealthScore = 5;
  } else if (financialStability >= 60) {
    financialHealthRating = 'good';
    financialHealthScore = 4;
  } else if (financialStability >= 40) {
    financialHealthRating = 'fair';
    financialHealthScore = 3;
  } else if (financialStability >= 20) {
    financialHealthRating = 'poor';
    financialHealthScore = 2;
  } else {
    financialHealthRating = 'critical';
    financialHealthScore = 1;
  }

  // Рекомендации
  const recommendations = [];
  
  if (netFlowToIncome < 10) {
    recommendations.push('Старайтесь сберегать минимум 10% от доходов');
  }
  
  if (essentialToIncome > 50) {
    recommendations.push('Снизьте обязательные расходы до 50% от доходов');
  }
  
  if (discretionaryToIncome > 30) {
    recommendations.push('Контролируйте дискреционные расходы');
  }
  
  if (summary.netFlow < 0) {
    recommendations.push('Срочно сократите расходы - отрицательный баланс');
  }
  
  if (incomeRegularity < 50) {
    recommendations.push('Рассмотрите источники регулярного дохода');
  }
  
  if (recommendations.length === 0 && financialStability >= 70) {
    recommendations.push('Отличные результаты! Продолжайте в том же духе');
  }

  return {
    // Расширенные метрики
    essentialExpenses,
    discretionaryExpenses,
    essentialToIncome: Math.round(essentialToIncome * 100) / 100,
    discretionaryToIncome: Math.round(discretionaryToIncome * 100) / 100,
    netFlowToIncome: Math.round(netFlowToIncome * 100) / 100,
    expenseToIncomeRatio: Math.round(expenseToIncomeRatio * 100) / 100,
    
    // Анализ стабильности
    incomeRegularity: Math.round(incomeRegularity * 100) / 100,
    expenseConsistency: Math.round(expenseConsistency * 100) / 100,
    financialStability: Math.round(financialStability * 100) / 100,
    
    // Оценки
    financialHealthRating,
    financialHealthScore,
    
    // Рекомендации
    recommendations: recommendations.slice(0, 3)
  };
};

// Получить базовую статистику по периоду
const getBasicStatistics = async (userId, period) => {
  let dateCondition = '';
  let groupByClause = 'DATE(o.created_at)';
  let dateSelectClause = 'DATE(o.created_at) AS date';

  switch (period) {
    case 'week':
      dateCondition = `
        o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `;
      break;
    case 'month':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      break;
    case 'quarter':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE)
      `;
      break;
    case 'year':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      groupByClause = 'EXTRACT(MONTH FROM o.created_at)';
      dateSelectClause = 'DATE(DATE_TRUNC(\'month\', MIN(o.created_at))) AS date';
      break;
    default:
      throw new Error('Неверный период');
  }

  const summaryQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) - 
      COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS net_flow
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND (${dateCondition})
  `;

  const dynamicsQuery = `
    SELECT 
      ${dateSelectClause},
      SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) AS income,
      SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) AS expense
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND (${dateCondition})
    GROUP BY ${groupByClause}
    ORDER BY MIN(DATE(o.created_at)) ASC
  `;

  const [summaryResult, dynamicsResult] = await Promise.all([
    db.query(summaryQuery, [userId]),
    db.query(dynamicsQuery, [userId])
  ]);

  const summaryData = summaryResult.rows[0] || { total_income: 0, total_expense: 0, net_flow: 0 };
  const dynamicsData = dynamicsResult.rows;

  // Строим кумулятивный баланс для графика
  let cumulativeBalance = 0;
  const chartData = dynamicsData.map(row => {
    cumulativeBalance += (row.income || 0) - (row.expense || 0);
    return {
      date: row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : row.date, 
      balance: cumulativeBalance
    };
  });

  return {
    summary: {
      netFlow: parseFloat(summaryData.net_flow),
      income: parseFloat(summaryData.total_income),
      expense: parseFloat(summaryData.total_expense)
    },
    dynamics: chartData
  };
};

// Получить статистику по категориям
const getCategoryStats = async (userId, period) => {
  let dateCondition = '';

  switch (period) {
    case 'week':
      dateCondition = `
        o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `;
      break;
    case 'month':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      break;
    case 'quarter':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE)
      `;
      break;
    case 'year':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      break;
    default:
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
  }

  const categoriesQuery = `
    SELECT 
      c.name,
      c.color,
      ot.name as type,
      SUM(o.amount) as amount,
      COUNT(o.id) as transaction_count
    FROM operation o
    JOIN category c ON o.category_id = c.id
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND (${dateCondition})
    GROUP BY c.name, c.color, ot.name
    ORDER BY ot.name, SUM(o.amount) DESC
  `;

  const categoriesResult = await db.query(categoriesQuery, [userId]);
  return processCategories(categoriesResult.rows);
};

// Получить ВСЕ транзакции за период
const getAllTransactionsForPeriod = async (userId, period) => {
  let dateCondition = '';

  switch (period) {
    case 'week':
      dateCondition = `
        o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `;
      break;
    case 'month':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      break;
    case 'quarter':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE)
      `;
      break;
    case 'year':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      break;
    default:
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
  }

  const transactionsQuery = `
    SELECT 
      o.id,
      o.amount,
      o.description,
      o.created_at,
      c.name as category,
      ot.name as operation_type
    FROM operation o
    JOIN category c ON o.category_id = c.id
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND (${dateCondition})
    ORDER BY o.created_at DESC
  `;

  console.log(`🔍 Получение ВСЕХ транзакций для пользователя ${userId} за период ${period}`);
  
  const transactionsResult = await db.query(transactionsQuery, [userId]);

  console.log(`✅ Получено ${transactionsResult.rows.length} транзакций за период`);

  return transactionsResult.rows.map(row => ({
    id: row.id,
    amount: parseFloat(row.amount),
    description: row.description,
    created_at: row.created_at,
    category: row.category,
    type: row.operation_type === 'Доход' ? 'income' : 'expense'
  }));
};

// Получить дополнительные метрики
const getAdditionalMetrics = async (userId, period) => {
  let dateCondition = '';

  switch (period) {
    case 'week':
      dateCondition = `
        o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `;
      break;
    case 'month':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      break;
    case 'quarter':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE)
      `;
      break;
    case 'year':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      break;
    default:
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
  }

  const metricsQuery = `
    SELECT 
      COUNT(o.id) as transaction_count,
      COUNT(CASE WHEN ot.name = 'Доход' THEN o.id END) as income_count,
      COUNT(CASE WHEN ot.name = 'Расход' THEN o.id END) as expense_count,
      AVG(o.amount) as average_transaction,
      MAX(o.amount) as largest_transaction,
      SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) as total_income,
      SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) as total_expense,
      COUNT(DISTINCT DATE(o.created_at)) as active_days,
      COUNT(DISTINCT c.name) as unique_categories,
      COUNT(DISTINCT CASE WHEN ot.name = 'Доход' THEN c.name END) as unique_income_categories,
      COUNT(DISTINCT CASE WHEN ot.name = 'Расход' THEN c.name END) as unique_expense_categories
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    JOIN category c ON o.category_id = c.id
    WHERE o.user_id = $1
      AND (${dateCondition})
  `;

  const metricsResult = await db.query(metricsQuery, [userId]);
  const metrics = metricsResult.rows[0] || {
    transaction_count: '0',
    income_count: '0',
    expense_count: '0',
    average_transaction: '0',
    largest_transaction: '0',
    total_income: '0',
    total_expense: '0',
    active_days: '0',
    unique_categories: '0',
    unique_income_categories: '0',
    unique_expense_categories: '0'
  };

  const savingsRate = parseFloat(metrics.total_income) > 0 
    ? ((parseFloat(metrics.total_income) - parseFloat(metrics.total_expense)) / parseFloat(metrics.total_income)) * 100 
    : 0;

  return {
    savingsRate: Math.max(0, savingsRate),
    averageTransaction: parseFloat(metrics.average_transaction) || 0,
    largestTransaction: parseFloat(metrics.largest_transaction) || 0,
    transactionCount: parseInt(metrics.transaction_count) || 0,
    incomeCount: parseInt(metrics.income_count) || 0,
    expenseCount: parseInt(metrics.expense_count) || 0,
    activeDays: parseInt(metrics.active_days) || 0,
    uniqueCategories: parseInt(metrics.unique_categories) || 0,
    uniqueIncomeCategories: parseInt(metrics.unique_income_categories) || 0,
    uniqueExpenseCategories: parseInt(metrics.unique_expense_categories) || 0
  };
};

// Получить статистику по лимитам и превышениям
const getLimitsStatistics = async (userId, period) => {
  let dateCondition = '';

  switch (period) {
    case 'week':
      dateCondition = `
        o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
        AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
      `;
      break;
    case 'month':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      break;
    case 'quarter':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(QUARTER FROM o.created_at) = EXTRACT(QUARTER FROM CURRENT_DATE)
      `;
      break;
    case 'year':
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      break;
    default:
      dateCondition = `
        EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM o.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
  }

  // Получаем все лимиты пользователя с текущими расходами
  const limitsQuery = `
    SELECT 
      sl.id,
      sl.category_id,
      sl.amount as limit_amount,
      c.name as category_name,
      c.color as category_color,
      COALESCE((
        SELECT SUM(o.amount) 
        FROM operation o 
        WHERE o.category_id = sl.category_id 
          AND o.user_id = sl.user_id
          AND (${dateCondition})
      ), 0) as current_spent
    FROM spendinglimit sl
    JOIN category c ON sl.category_id = c.id
    WHERE sl.user_id = $1
  `;

  const limitsResult = await db.query(limitsQuery, [userId]);

  const limitsStats = {
    totalLimits: limitsResult.rows.length,
    exceededLimits: 0,
    nearExceededLimits: 0,
    totalLimitAmount: 0,
    totalSpent: 0,
    totalExceededAmount: 0,
    limits: []
  };

  limitsResult.rows.forEach(limit => {
    const currentSpent = parseFloat(limit.current_spent);
    const limitAmount = parseFloat(limit.limit_amount);
    const percentage = limitAmount > 0 ? (currentSpent / limitAmount) * 100 : 0;
    const isExceeded = currentSpent > limitAmount;
    const isNearExceeded = percentage >= 80 && percentage <= 100;
    const exceededAmount = isExceeded ? currentSpent - limitAmount : 0;

    limitsStats.totalLimitAmount += limitAmount;
    limitsStats.totalSpent += currentSpent;
    limitsStats.totalExceededAmount += exceededAmount;

    if (isExceeded) {
      limitsStats.exceededLimits++;
    } else if (isNearExceeded) {
      limitsStats.nearExceededLimits++;
    }

    limitsStats.limits.push({
      id: limit.id,
      categoryId: limit.category_id,
      categoryName: limit.category_name,
      categoryColor: limit.category_color,
      limitAmount,
      currentSpent,
      percentage: Math.round(percentage * 100) / 100,
      isExceeded,
      isNearExceeded,
      exceededAmount,
      remainingAmount: Math.max(0, limitAmount - currentSpent)
    });
  });

  // Рассчитываем дополнительные метрики
  limitsStats.limitsUtilization = limitsStats.totalLimitAmount > 0 ? 
    (limitsStats.totalSpent / limitsStats.totalLimitAmount) * 100 : 0;
  limitsStats.averageLimitUsage = limitsStats.limits.length > 0 ?
    limitsStats.limits.reduce((sum, limit) => sum + limit.percentage, 0) / limitsStats.limits.length : 0;

  // Сортируем по проценту использования (от большего к меньшему)
  limitsStats.limits.sort((a, b) => b.percentage - a.percentage);

  return limitsStats;
};

// Вспомогательные функции для кастомного периода
const getCategoryStatsCustom = async (userId, startDate, endDate) => {
  const categoriesQuery = `
    SELECT 
      c.name,
      c.color,
      ot.name as type,
      SUM(o.amount) as amount,
      COUNT(o.id) as transaction_count
    FROM operation o
    JOIN category c ON o.category_id = c.id
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND o.created_at >= $2 AND o.created_at <= $3
    GROUP BY c.name, c.color, ot.name
    ORDER BY ot.name, SUM(o.amount) DESC
  `;

  const categoriesResult = await db.query(categoriesQuery, [userId, startDate, endDate]);
  return processCategories(categoriesResult.rows);
};

const getAllTransactionsCustom = async (userId, startDate, endDate) => {
  const transactionsQuery = `
    SELECT 
      o.id,
      o.amount,
      o.description,
      o.created_at,
      c.name as category,
      ot.name as operation_type
    FROM operation o
    JOIN category c ON o.category_id = c.id
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND o.created_at >= $2 AND o.created_at <= $3
    ORDER BY o.created_at DESC
  `;

  console.log(`🔍 Получение ВСЕХ транзакций для пользователя ${userId} за период ${startDate} - ${endDate}`);
  
  const transactionsResult = await db.query(transactionsQuery, [userId, startDate, endDate]);

  console.log(`✅ Получено ${transactionsResult.rows.length} транзакций за кастомный период`);

  return transactionsResult.rows.map(row => ({
    id: row.id,
    amount: parseFloat(row.amount),
    description: row.description,
    created_at: row.created_at,
    category: row.category,
    type: row.operation_type === 'Доход' ? 'income' : 'expense'
  }));
};

const getAdditionalMetricsCustom = async (userId, startDate, endDate) => {
  const metricsQuery = `
    SELECT 
      COUNT(o.id) as transaction_count,
      COUNT(CASE WHEN ot.name = 'Доход' THEN o.id END) as income_count,
      COUNT(CASE WHEN ot.name = 'Расход' THEN o.id END) as expense_count,
      AVG(o.amount) as average_transaction,
      MAX(o.amount) as largest_transaction,
      SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) as total_income,
      SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) as total_expense,
      COUNT(DISTINCT DATE(o.created_at)) as active_days,
      COUNT(DISTINCT c.name) as unique_categories,
      COUNT(DISTINCT CASE WHEN ot.name = 'Доход' THEN c.name END) as unique_income_categories,
      COUNT(DISTINCT CASE WHEN ot.name = 'Расход' THEN c.name END) as unique_expense_categories
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    JOIN category c ON o.category_id = c.id
    WHERE o.user_id = $1
      AND o.created_at >= $2 AND o.created_at <= $3
  `;

  const metricsResult = await db.query(metricsQuery, [userId, startDate, endDate]);
  const metrics = metricsResult.rows[0] || {
    transaction_count: '0',
    income_count: '0',
    expense_count: '0',
    average_transaction: '0',
    largest_transaction: '0',
    total_income: '0',
    total_expense: '0',
    active_days: '0',
    unique_categories: '0',
    unique_income_categories: '0',
    unique_expense_categories: '0'
  };

  const savingsRate = parseFloat(metrics.total_income) > 0 
    ? ((parseFloat(metrics.total_income) - parseFloat(metrics.total_expense)) / parseFloat(metrics.total_income)) * 100 
    : 0;

  return {
    savingsRate: Math.max(0, savingsRate),
    averageTransaction: parseFloat(metrics.average_transaction) || 0,
    largestTransaction: parseFloat(metrics.largest_transaction) || 0,
    transactionCount: parseInt(metrics.transaction_count) || 0,
    incomeCount: parseInt(metrics.income_count) || 0,
    expenseCount: parseInt(metrics.expense_count) || 0,
    activeDays: parseInt(metrics.active_days) || 0,
    uniqueCategories: parseInt(metrics.unique_categories) || 0,
    uniqueIncomeCategories: parseInt(metrics.unique_income_categories) || 0,
    uniqueExpenseCategories: parseInt(metrics.unique_expense_categories) || 0
  };
};

const getLimitsStatisticsCustom = async (userId, startDate, endDate) => {
  const limitsQuery = `
    SELECT 
      sl.id,
      sl.category_id,
      sl.amount as limit_amount,
      c.name as category_name,
      c.color as category_color,
      COALESCE((
        SELECT SUM(o.amount) 
        FROM operation o 
        WHERE o.category_id = sl.category_id 
          AND o.user_id = sl.user_id
          AND o.created_at >= $1 AND o.created_at <= $2
      ), 0) as current_spent
    FROM spendinglimit sl
    JOIN category c ON sl.category_id = c.id
    WHERE sl.user_id = $3
  `;

  const limitsResult = await db.query(limitsQuery, [startDate, endDate, userId]);

  const limitsStats = {
    totalLimits: limitsResult.rows.length,
    exceededLimits: 0,
    nearExceededLimits: 0,
    totalLimitAmount: 0,
    totalSpent: 0,
    totalExceededAmount: 0,
    limits: []
  };

  limitsResult.rows.forEach(limit => {
    const currentSpent = parseFloat(limit.current_spent);
    const limitAmount = parseFloat(limit.limit_amount);
    const percentage = limitAmount > 0 ? (currentSpent / limitAmount) * 100 : 0;
    const isExceeded = currentSpent > limitAmount;
    const isNearExceeded = percentage >= 80 && percentage <= 100;
    const exceededAmount = isExceeded ? currentSpent - limitAmount : 0;

    limitsStats.totalLimitAmount += limitAmount;
    limitsStats.totalSpent += currentSpent;
    limitsStats.totalExceededAmount += exceededAmount;

    if (isExceeded) {
      limitsStats.exceededLimits++;
    } else if (isNearExceeded) {
      limitsStats.nearExceededLimits++;
    }

    limitsStats.limits.push({
      id: limit.id,
      categoryId: limit.category_id,
      categoryName: limit.category_name,
      categoryColor: limit.category_color,
      limitAmount,
      currentSpent,
      percentage: Math.round(percentage * 100) / 100,
      isExceeded,
      isNearExceeded,
      exceededAmount,
      remainingAmount: Math.max(0, limitAmount - currentSpent)
    });
  });

  // Рассчитываем дополнительные метрики
  limitsStats.limitsUtilization = limitsStats.totalLimitAmount > 0 ? 
    (limitsStats.totalSpent / limitsStats.totalLimitAmount) * 100 : 0;
  limitsStats.averageLimitUsage = limitsStats.limits.length > 0 ?
    limitsStats.limits.reduce((sum, limit) => sum + limit.percentage, 0) / limitsStats.limits.length : 0;

  // Сортируем по проценту использования (от большего к меньшему)
  limitsStats.limits.sort((a, b) => b.percentage - a.percentage);

  return limitsStats;
};

const getBasicStatisticsCustom = async (userId, startDate, endDate) => {
  const summaryQuery = `
    SELECT 
      COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) - 
      COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS net_flow
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND o.created_at >= $2 AND o.created_at <= $3
  `;

  const dynamicsQuery = `
    SELECT 
      DATE(o.created_at) AS date,
      SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) AS income,
      SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) AS expense
    FROM operation o
    JOIN operationtype ot ON o.operation_type_id = ot.id
    WHERE o.user_id = $1
      AND o.created_at >= $2 AND o.created_at <= $3
    GROUP BY DATE(o.created_at)
    ORDER BY DATE(o.created_at) ASC
  `;

  const [summaryResult, dynamicsResult] = await Promise.all([
    db.query(summaryQuery, [userId, startDate, endDate]),
    db.query(dynamicsQuery, [userId, startDate, endDate])
  ]);

  const summaryData = summaryResult.rows[0] || { 
    total_income: 0, 
    total_expense: 0, 
    net_flow: 0 
  };

  const dynamicsData = dynamicsResult.rows;

  // Строим кумулятивный баланс для графика
  let cumulativeBalance = 0;
  const chartData = dynamicsData.map(row => {
    cumulativeBalance += (row.income || 0) - (row.expense || 0);
    return {
      date: row.date instanceof Date 
        ? row.date.toISOString().split('T')[0] 
        : row.date, 
      balance: cumulativeBalance
    };
  });

  return {
    summary: {
      netFlow: parseFloat(summaryData.net_flow),
      income: parseFloat(summaryData.total_income),
      expense: parseFloat(summaryData.total_expense)
    },
    dynamics: chartData
  };
};

// Основная функция получения статистики
const getStatisticsByPeriod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || 'month';

    const basicStats = await getBasicStatistics(userId, period);

    return res.status(200).json({
      period,
      summary: basicStats.summary,
      dynamics: basicStats.dynamics
    });

  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке статистики' });
  }
};

// Расширенная статистика
const getExtendedStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || 'month';

    console.log(`📊 Получение расширенной статистики для пользователя ${userId}, период: ${period}`);

    // Если это кастомный период
    if (period === 'custom' && req.query.startDate && req.query.endDate) {
      return getCustomPeriodStatistics(req, res);
    }

    // Получаем все данные параллельно для производительности
    const [basicStats, categories, allTransactions, additionalMetrics, limitsStats] = await Promise.all([
      getBasicStatistics(userId, period),
      getCategoryStats(userId, period),
      getAllTransactionsForPeriod(userId, period),
      getAdditionalMetrics(userId, period),
      getLimitsStatistics(userId, period)
    ]);

    // Расширенные метрики с оценками
    const advancedMetrics = calculateAdvancedMetrics(
      allTransactions, 
      categories, 
      basicStats.summary,
      period
    );

    const extendedStats = {
      period,
      summary: basicStats.summary,
      dynamics: basicStats.dynamics,
      categories,
      recentTransactions: allTransactions.slice(0, 5),
      allTransactions,
      ...additionalMetrics,
      ...advancedMetrics,
      limitsStats
    };

    console.log(`✅ Расширенная статистика загружена:`, {
      transactions: extendedStats.transactionCount,
      incomeCount: extendedStats.incomeCount,
      expenseCount: extendedStats.expenseCount,
      categories: extendedStats.categories.length,
      limits: extendedStats.limitsStats.totalLimits,
      exceededLimits: extendedStats.limitsStats.exceededLimits,
      income: extendedStats.summary.income,
      expense: extendedStats.summary.expense,
      financialHealth: extendedStats.financialHealthRating,
      stability: extendedStats.financialStability
    });

    return res.status(200).json(extendedStats);

  } catch (err) {
    console.error('❌ Ошибка при получении расширенной статистики:', err);
    
    // Fallback: пытаемся вернуть хотя бы базовую статистику
    try {
      const userId = req.user.userId;
      const period = req.query.period || 'month';
      
      const basicStats = await getBasicStatistics(userId, period);
      const limitsStats = await getLimitsStatistics(userId, period);
      
      return res.status(200).json({
        period,
        summary: basicStats.summary,
        dynamics: basicStats.dynamics,
        categories: [],
        recentTransactions: [],
        allTransactions: [],
        savingsRate: 0,
        averageTransaction: 0,
        largestTransaction: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        activeDays: 0,
        uniqueCategories: 0,
        essentialExpenses: 0,
        discretionaryExpenses: 0,
        essentialToIncome: 0,
        discretionaryToIncome: 0,
        netFlowToIncome: 0,
        expenseToIncomeRatio: 0,
        incomeRegularity: 0,
        expenseConsistency: 0,
        financialStability: 0,
        financialHealthRating: 'fair',
        financialHealthScore: 3,
        limitsStats,
        recommendations: ['Начните добавлять транзакции для анализа']
      });
      
    } catch (fallbackError) {
      console.error('❌ Fallback также не сработал:', fallbackError);
      return res.status(500).json({ 
        error: 'Ошибка сервера при загрузке статистики',
        details: err.message 
      });
    }
  }
};

// Получить статистику за кастомный период
const getCustomPeriodStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Необходимо указать startDate и endDate' 
      });
    }

    // Валидация дат
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Неверный формат даты' });
    }

    if (start > end) {
      return res.status(400).json({ error: 'Начальная дата не может быть больше конечной' });
    }

    // Получаем все данные параллельно
    const [basicStats, categories, allTransactions, additionalMetrics, limitsStats] = await Promise.all([
      getBasicStatisticsCustom(userId, startDate, endDate),
      getCategoryStatsCustom(userId, startDate, endDate),
      getAllTransactionsCustom(userId, startDate, endDate),
      getAdditionalMetricsCustom(userId, startDate, endDate),
      getLimitsStatisticsCustom(userId, startDate, endDate)
    ]);

    // Расширенные метрики с оценками
    const advancedMetrics = calculateAdvancedMetrics(
      allTransactions, 
      categories, 
      basicStats.summary,
      'custom'
    );

    const result = {
      period: 'custom',
      periodLabel: `${startDate} - ${endDate}`,
      summary: basicStats.summary,
      dynamics: basicStats.dynamics,
      categories,
      recentTransactions: allTransactions.slice(0, 5),
      allTransactions,
      ...additionalMetrics,
      ...advancedMetrics,
      limitsStats
    };

    return res.status(200).json(result);

  } catch (err) {
    console.error('Ошибка при получении статистики за кастомный период:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке статистики' });
  }
};

// Получить статистику за все время
const getLifetimeStatistics = async (req, res) => {
  try {
    const userId = req.user.userId;

    const lifetimeQuery = `
      SELECT 
        COUNT(o.id) as total_transactions,
        SUM(o.amount) as total_amount,
        SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) as lifetime_income,
        SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) as lifetime_expense,
        MIN(o.created_at) as first_transaction,
        MAX(o.created_at) as last_transaction,
        COUNT(DISTINCT DATE(o.created_at)) as total_active_days,
        EXTRACT(DAY FROM (MAX(o.created_at) - MIN(o.created_at))) as tracking_period_days
      FROM operation o
      JOIN operationtype ot ON o.operation_type_id = ot.id
      WHERE o.user_id = $1
    `;

    const lifetimeResult = await db.query(lifetimeQuery, [userId]);
    const lifetimeData = lifetimeResult.rows[0] || {
      total_transactions: '0',
      total_amount: '0',
      lifetime_income: '0',
      lifetime_expense: '0',
      first_transaction: null,
      last_transaction: null,
      total_active_days: '0',
      tracking_period_days: '0'
    };

    // Самые популярные категории
    const popularCategoriesQuery = `
      SELECT 
        c.name,
        c.color,
        COUNT(o.id) as count,
        SUM(o.amount) as total_amount,
        ot.name as type
      FROM operation o
      JOIN category c ON o.category_id = c.id
      JOIN operationtype ot ON o.operation_type_id = ot.id
      WHERE o.user_id = $1
      GROUP BY c.name, c.color, ot.name
      ORDER BY COUNT(o.id) DESC
      LIMIT 10
    `;

    const popularCategoriesResult = await db.query(popularCategoriesQuery, [userId]);

    // Месяцы с наибольшими доходами и расходами
    const topMonthsQuery = `
      SELECT 
        TO_CHAR(o.created_at, 'YYYY-MM') as month,
        SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) as income,
        SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) as expense,
        COUNT(o.id) as transactions
      FROM operation o
      JOIN operationtype ot ON o.operation_type_id = ot.id
      WHERE o.user_id = $1
      GROUP BY TO_CHAR(o.created_at, 'YYYY-MM')
      ORDER BY (SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) - SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END)) DESC
      LIMIT 5
    `;

    const topMonthsResult = await db.query(topMonthsQuery, [userId]);

    const lifetimeNetWorth = parseFloat(lifetimeData.lifetime_income) - parseFloat(lifetimeData.lifetime_expense);
    const avgDailyTransactions = parseFloat(lifetimeData.tracking_period_days) > 0 ? 
      parseFloat(lifetimeData.total_transactions) / parseFloat(lifetimeData.tracking_period_days) : 0;
    const savingsRateLifetime = parseFloat(lifetimeData.lifetime_income) > 0 ? 
      (lifetimeNetWorth / parseFloat(lifetimeData.lifetime_income)) * 100 : 0;

    return res.status(200).json({
      lifetime: {
        totalTransactions: parseInt(lifetimeData.total_transactions),
        lifetimeIncome: parseFloat(lifetimeData.lifetime_income),
        lifetimeExpense: parseFloat(lifetimeData.lifetime_expense),
        netWorth: lifetimeNetWorth,
        firstTransaction: lifetimeData.first_transaction,
        lastTransaction: lifetimeData.last_transaction,
        totalActiveDays: parseInt(lifetimeData.total_active_days),
        trackingPeriodDays: parseInt(lifetimeData.tracking_period_days),
        avgDailyTransactions: Math.round(avgDailyTransactions * 100) / 100,
        savingsRate: Math.round(savingsRateLifetime * 100) / 100
      },
      popularCategories: popularCategoriesResult.rows.map(row => ({
        name: row.name,
        color: row.color || '#666666',
        count: parseInt(row.count),
        totalAmount: parseFloat(row.total_amount),
        type: row.type === 'Доход' ? 'income' : 'expense'
      })),
      topMonths: topMonthsResult.rows.map(row => ({
        month: row.month,
        income: parseFloat(row.income),
        expense: parseFloat(row.expense),
        netFlow: parseFloat(row.income) - parseFloat(row.expense),
        transactions: parseInt(row.transactions)
      }))
    });

  } catch (err) {
    console.error('Ошибка при получении пожизненной статистики:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке статистики' });
  }
};

// Получить только статистику по лимитам
const getLimitsStatisticsEndpoint = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || 'month';
    const { startDate, endDate } = req.query;

    let limitsStats;
    if (period === 'custom' && startDate && endDate) {
      limitsStats = await getLimitsStatisticsCustom(userId, startDate, endDate);
    } else {
      limitsStats = await getLimitsStatistics(userId, period);
    }

    return res.status(200).json(limitsStats);

  } catch (err) {
    console.error('Ошибка при получении статистики по лимитам:', err);
    return res.status(500).json({ error: 'Ошибка сервера при загрузке статистики по лимитам' });
  }
};

module.exports = {
  getStatisticsByPeriod,
  getExtendedStatistics,
  getLifetimeStatistics,
  getCustomPeriodStatistics,
  getLimitsStatistics: getLimitsStatisticsEndpoint
};