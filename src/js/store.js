import { generateId, todayISO, isCurrentMonth } from './utils.js';
import { CATEGORIES } from './categories.js';

const STORAGE_KEY = 'vault_expenses';
const BUDGET_KEY = 'vault_budgets';

class Store {
  constructor() {
    this._listeners = {};
    this._expenses = this._load(STORAGE_KEY, []);
    this._budgets = this._load(BUDGET_KEY, this._defaultBudgets());

    // Seed sample data on first run
    if (this._expenses.length === 0) {
      this._seedSampleData();
    }
  }

  // ── Event Emitter ──
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }

  // ── Persistence ──
  _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  _saveExpenses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._expenses));
  }

  _saveBudgets() {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(this._budgets));
  }

  // ── Expenses CRUD ──
  getExpenses() {
    return [...this._expenses].sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
  }

  getExpenseById(id) {
    return this._expenses.find(e => e.id === id);
  }

  addExpense({ amount, category, date, note }) {
    const expense = {
      id: generateId(),
      amount: parseFloat(amount),
      category,
      date: date || todayISO(),
      note: note || '',
      createdAt: Date.now(),
    };
    this._expenses.push(expense);
    this._saveExpenses();
    this._emit('change', { action: 'add', expense });
    this._checkBudgetAlert(category);
    return expense;
  }

  updateExpense(id, updates) {
    const idx = this._expenses.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this._expenses[idx] = { ...this._expenses[idx], ...updates };
    this._saveExpenses();
    this._emit('change', { action: 'update', expense: this._expenses[idx] });
    return this._expenses[idx];
  }

  deleteExpense(id) {
    this._expenses = this._expenses.filter(e => e.id !== id);
    this._saveExpenses();
    this._emit('change', { action: 'delete', id });
  }

  // ── Queries ──
  getTotalExpenses(filter = {}) {
    return this._filterExpenses(filter).reduce((sum, e) => sum + e.amount, 0);
  }

  getMonthlyTotal() {
    return this._expenses
      .filter(e => isCurrentMonth(e.date))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getWeeklyExpenses() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return this._expenses.filter(e => new Date(e.date) >= startOfWeek);
  }

  getCategoryTotals(monthOnly = true) {
    const expenses = monthOnly
      ? this._expenses.filter(e => isCurrentMonth(e.date))
      : this._expenses;

    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }

  getDailyTotals(days = 30) {
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const total = this._expenses
        .filter(e => e.date === key)
        .reduce((s, e) => s + e.amount, 0);
      result.push({ date: key, total });
    }
    return result;
  }

  getWeeklyTotals(weeks = 8) {
    const result = [];
    const now = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const total = this._expenses
        .filter(e => {
          const d = new Date(e.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((s, e) => s + e.amount, 0);
      result.push({
        label: `W${weeks - i}`,
        total,
        start: weekStart.toISOString().split('T')[0],
      });
    }
    return result;
  }

  _filterExpenses({ search, category, startDate, endDate }) {
    let expenses = this._expenses;
    if (search) {
      const q = search.toLowerCase();
      expenses = expenses.filter(e =>
        e.note.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    if (category && category !== 'all') {
      expenses = expenses.filter(e => e.category === category);
    }
    if (startDate) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.date <= endDate);
    }
    return expenses;
  }

  searchExpenses(query, category = 'all') {
    return this.getExpenses().filter(e => {
      const matchesSearch = !query ||
        e.note.toLowerCase().includes(query.toLowerCase()) ||
        e.category.toLowerCase().includes(query.toLowerCase());
      const matchesCat = category === 'all' || e.category === category;
      return matchesSearch && matchesCat;
    });
  }

  // ── Budgets ──
  _defaultBudgets() {
    const budgets = {};
    CATEGORIES.forEach(c => {
      budgets[c.id] = c.defaultBudget;
    });
    return budgets;
  }

  getBudgets() {
    return { ...this._budgets };
  }

  setBudget(categoryId, amount) {
    this._budgets[categoryId] = parseFloat(amount) || 0;
    this._saveBudgets();
    this._emit('budgetChange', { categoryId, amount: this._budgets[categoryId] });
  }

  getBudgetUsage(categoryId) {
    const budget = this._budgets[categoryId] || 0;
    const spent = this._expenses
      .filter(e => e.category === categoryId && isCurrentMonth(e.date))
      .reduce((s, e) => s + e.amount, 0);
    return {
      budget,
      spent,
      remaining: budget - spent,
      percentage: budget > 0 ? Math.min((spent / budget) * 100, 100) : 0,
    };
  }

  getTotalBudget() {
    return Object.values(this._budgets).reduce((s, v) => s + v, 0);
  }

  _checkBudgetAlert(categoryId) {
    const usage = this.getBudgetUsage(categoryId);
    if (usage.percentage >= 100) {
      this._emit('budgetAlert', { categoryId, level: 'exceeded', usage });
    } else if (usage.percentage >= 90) {
      this._emit('budgetAlert', { categoryId, level: 'critical', usage });
    } else if (usage.percentage >= 75) {
      this._emit('budgetAlert', { categoryId, level: 'warning', usage });
    }
  }

  // ── Smart Insights ──
  getInsights() {
    const insights = [];
    const catTotals = this.getCategoryTotals(true);
    const monthlyTotal = this.getMonthlyTotal();

    // Top spending category
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      const pct = Math.round((topCat[1] / monthlyTotal) * 100);
      const cat = CATEGORIES.find(c => c.id === topCat[0]);
      if (cat && pct > 30) {
        insights.push({
          icon: cat.emoji,
          text: `<strong>${cat.name}</strong> accounts for ${pct}% of your spending this month. Consider setting a stricter budget.`,
        });
      }
    }

    // Week comparison
    const weeklyData = this.getWeeklyTotals(2);
    if (weeklyData.length === 2 && weeklyData[0].total > 0) {
      const change = ((weeklyData[1].total - weeklyData[0].total) / weeklyData[0].total) * 100;
      if (change > 20) {
        insights.push({
          icon: '📈',
          text: `Your spending increased by <strong>${Math.round(change)}%</strong> compared to last week. Watch out for impulse purchases.`,
        });
      } else if (change < -15) {
        insights.push({
          icon: '🎉',
          text: `Great job! You spent <strong>${Math.round(Math.abs(change))}% less</strong> this week compared to last week.`,
        });
      }
    }

    // Budget alerts
    CATEGORIES.forEach(cat => {
      const usage = this.getBudgetUsage(cat.id);
      if (usage.percentage >= 90 && usage.percentage < 100) {
        insights.push({
          icon: '⚠️',
          text: `You've used <strong>${Math.round(usage.percentage)}%</strong> of your ${cat.name.toLowerCase()} budget. Only ₹${Math.round(usage.remaining)} remaining.`,
        });
      } else if (usage.percentage >= 100) {
        insights.push({
          icon: '🚨',
          text: `<strong>${cat.name}</strong> budget exceeded! You've overspent by ₹${Math.round(Math.abs(usage.remaining))}.`,
        });
      }
    });

    // Daily average
    const dailyTotals = this.getDailyTotals(30).filter(d => d.total > 0);
    if (dailyTotals.length > 0) {
      const avg = Math.round(dailyTotals.reduce((s, d) => s + d.total, 0) / dailyTotals.length);
      insights.push({
        icon: '📊',
        text: `Your average daily spending is <strong>₹${avg.toLocaleString('en-IN')}</strong> over the past 30 days.`,
      });
    }

    return insights;
  }

  // ── Export / Import ──
  exportData() {
    return JSON.stringify({ expenses: this._expenses, budgets: this._budgets }, null, 2);
  }

  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.expenses) this._expenses = data.expenses;
      if (data.budgets) this._budgets = data.budgets;
      this._saveExpenses();
      this._saveBudgets();
      this._emit('change', { action: 'import' });
      return true;
    } catch {
      return false;
    }
  }

  // ── Sample Data ──
  _seedSampleData() {
    const now = new Date();
    const samples = [
      { amount: 450,  category: 'food',          note: 'Lunch at Café Mocha',         daysAgo: 0 },
      { amount: 120,  category: 'transport',     note: 'Uber to office',              daysAgo: 0 },
      { amount: 2500, category: 'bills',         note: 'Electricity bill',            daysAgo: 1 },
      { amount: 1800, category: 'shopping',      note: 'New headphones',              daysAgo: 1 },
      { amount: 350,  category: 'food',          note: 'Dinner with friends',         daysAgo: 2 },
      { amount: 500,  category: 'entertainment', note: 'Movie tickets',               daysAgo: 2 },
      { amount: 150,  category: 'food',          note: 'Coffee & brownie',            daysAgo: 3 },
      { amount: 3500, category: 'health',        note: 'Doctor consultation',         daysAgo: 3 },
      { amount: 200,  category: 'transport',     note: 'Metro recharge',              daysAgo: 4 },
      { amount: 750,  category: 'food',          note: 'Groceries',                   daysAgo: 4 },
      { amount: 1200, category: 'education',     note: 'Udemy course',                daysAgo: 5 },
      { amount: 600,  category: 'food',          note: 'Order from Swiggy',           daysAgo: 5 },
      { amount: 4500, category: 'travel',        note: 'Train tickets - Goa',         daysAgo: 6 },
      { amount: 180,  category: 'food',          note: 'Tea & snacks',                daysAgo: 7 },
      { amount: 950,  category: 'shopping',      note: 'Book from Amazon',            daysAgo: 8 },
      { amount: 1500, category: 'bills',         note: 'Internet bill',               daysAgo: 9 },
      { amount: 320,  category: 'food',          note: 'Biryani for lunch',           daysAgo: 10 },
      { amount: 5000, category: 'savings',       note: 'Monthly SIP',                 daysAgo: 12 },
      { amount: 2200, category: 'shopping',      note: 'Running shoes',               daysAgo: 14 },
      { amount: 800,  category: 'entertainment', note: 'Spotify annual plan',         daysAgo: 15 },
      { amount: 400,  category: 'food',          note: 'Pizza Friday',                daysAgo: 16 },
      { amount: 1000, category: 'bills',         note: 'Phone recharge',              daysAgo: 18 },
      { amount: 650,  category: 'transport',     note: 'Fuel top-up',                 daysAgo: 20 },
      { amount: 3000, category: 'health',        note: 'Pharmacy — medicines',        daysAgo: 22 },
      { amount: 280,  category: 'food',          note: 'Chai & samosa',               daysAgo: 25 },
    ];

    samples.forEach(s => {
      const d = new Date(now);
      d.setDate(d.getDate() - s.daysAgo);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      this._expenses.push({
        id: generateId(),
        amount: s.amount,
        category: s.category,
        date: dateStr,
        note: s.note,
        createdAt: d.getTime(),
      });
    });

    this._saveExpenses();
  }
}

// Singleton
export const store = new Store();
