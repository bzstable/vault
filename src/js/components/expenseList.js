import { store } from '../store.js';
import { getCategoryById, CATEGORIES } from '../categories.js';
import { categoryIcon, icon } from '../icons.js';
import { formatAmount, formatDateGroup, getDateKey, debounce, todayISO } from '../utils.js';

export function renderExpenseList() {
  return `
    <div class="page-header anim-fade-down">
      <div>
        <h1 class="page-title">Expenses</h1>
        <p class="page-subtitle">All your transactions</p>
      </div>
      <button class="glass-btn glass-btn-primary" id="btn-add-expense-list" aria-label="Add expense">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
        Add Expense
      </button>
    </div>

    <!-- Time Period Filter -->
    <div class="time-filter-bar anim-fade-up delay-1">
      <div class="time-filter-pills" id="time-filter-pills">
        <button class="time-pill active" data-period="7">7D</button>
        <button class="time-pill" data-period="30">30D</button>
        <button class="time-pill" data-period="90">3M</button>
        <button class="time-pill" data-period="365">1Y</button>
        <button class="time-pill" data-period="all">All</button>
        <button class="time-pill time-pill-calendar" data-period="custom" title="Custom range">
          ${icon('calendar', 14)}
        </button>
      </div>
      <div class="custom-date-range" id="custom-date-range" style="display: none;">
        <input type="date" class="glass-input date-range-input" id="date-from" aria-label="From date">
        <span style="color: var(--text-tertiary); font-size: var(--text-xs);">to</span>
        <input type="date" class="glass-input date-range-input" id="date-to" value="${todayISO()}" aria-label="To date">
      </div>
    </div>

    <!-- Period Summary -->
    <div class="period-summary glass-panel anim-fade-up delay-2" id="period-summary"></div>

    <div class="search-bar anim-fade-up delay-3">
      <div class="search-input-wrap">
        <span class="search-icon">${icon('search', 14)}</span>
        <input type="text" class="glass-input" id="search-expenses" placeholder="Search expenses..." aria-label="Search expenses">
      </div>
    </div>

    <div class="filter-chips anim-fade-up delay-4" id="category-filters">
      <button class="filter-chip active" data-filter="all">All</button>
      ${CATEGORIES.map(c => `
        <button class="filter-chip" data-filter="${c.id}">
          <span style="color: ${c.color}; display: inline-flex;">${categoryIcon(c.id, 12)}</span>
          ${c.name.split(' ')[0]}
        </button>
      `).join('')}
    </div>

    <div id="expenses-container" style="margin-top: var(--space-lg);">
    </div>
  `;
}

export function renderExpenseGroups(expenses) {
  if (expenses.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon" style="opacity: 0.15;">${icon('list', 48)}</div>
        <div class="empty-state-title">No expenses found</div>
        <div class="empty-state-desc">Try adjusting your search or filters, or add a new expense.</div>
      </div>
    `;
  }

  const groups = {};
  expenses.forEach(e => {
    const key = getDateKey(e.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key, gi) => {
    const dayTotal = groups[key].reduce((s, e) => s + e.amount, 0);
    return `
      <div class="date-group anim-fade-up delay-${Math.min(gi + 1, 6)}">
        <div class="date-label" style="display: flex; justify-content: space-between;">
          <span>${formatDateGroup(key)}</span>
          <span style="color: var(--text-secondary);">₹${formatAmount(dayTotal)}</span>
        </div>
        ${groups[key].map(expense => renderExpenseItem(expense)).join('')}
      </div>
    `;
  }).join('');
}

function renderExpenseItem(expense) {
  const cat = getCategoryById(expense.category);
  return `
    <div class="expense-item" data-id="${expense.id}">
      <div class="expense-icon" style="background: ${cat.color}18; color: ${cat.color};">
        ${categoryIcon(expense.category)}
      </div>
      <div class="expense-details">
        <div class="expense-name">${expense.note || cat.name}</div>
        <div class="expense-meta">
          <span>${cat.name}</span>
        </div>
      </div>
      <div class="expense-amount">
        <span class="currency">₹</span>${formatAmount(expense.amount)}
      </div>
      <div class="expense-actions">
        <button class="expense-action-btn edit" data-action="edit" data-id="${expense.id}" aria-label="Edit expense" title="Edit">
          ${icon('edit', 14)}
        </button>
        <button class="expense-action-btn delete" data-action="delete" data-id="${expense.id}" aria-label="Delete expense" title="Delete">
          ${icon('trash', 14)}
        </button>
      </div>
    </div>
  `;
}

function renderPeriodSummary(expenses, periodLabel) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const count = expenses.length;
  const avg = count > 0 ? Math.round(total / count) : 0;
  return `
    <div style="display: flex; justify-content: space-around; padding: var(--space-md) var(--space-lg); text-align: center;">
      <div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em;">${periodLabel} Total</div>
        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); margin-top: 4px;"><span style="color: var(--text-secondary); font-size: var(--text-base);">₹</span>${formatAmount(total)}</div>
      </div>
      <div style="width: 1px; background: var(--glass-border);"></div>
      <div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em;">Transactions</div>
        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); margin-top: 4px;">${count}</div>
      </div>
      <div style="width: 1px; background: var(--glass-border);"></div>
      <div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em;">Avg / Transaction</div>
        <div style="font-size: var(--text-xl); font-weight: var(--weight-bold); margin-top: 4px;"><span style="color: var(--text-secondary); font-size: var(--text-base);">₹</span>${formatAmount(avg)}</div>
      </div>
    </div>
  `;
}

function getDateRange(period) {
  const now = new Date();
  const to = todayISO();
  let from;

  if (period === 'all') return { from: null, to: null, label: 'All Time' };

  const days = parseInt(period);
  const d = new Date(now);
  d.setDate(d.getDate() - days + 1);
  from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const labels = { '7': '7 Day', '30': '30 Day', '90': '3 Month', '365': '1 Year' };
  return { from, to, label: labels[period] || `${days}D` };
}

export function initExpenseList(formController) {
  const searchInput = document.getElementById('search-expenses');
  const filtersContainer = document.getElementById('category-filters');
  const container = document.getElementById('expenses-container');
  const timeFilterPills = document.getElementById('time-filter-pills');
  const customDateRange = document.getElementById('custom-date-range');
  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');
  const periodSummary = document.getElementById('period-summary');

  let currentFilter = 'all';
  let currentSearch = '';
  let currentPeriod = '7';
  let customFrom = null;
  let customTo = null;

  function getFilteredExpenses() {
    let expenses = store.getExpenses();

    // Time period filter
    if (currentPeriod === 'custom' && customFrom && customTo) {
      expenses = expenses.filter(e => e.date >= customFrom && e.date <= customTo);
    } else if (currentPeriod !== 'all') {
      const { from, to } = getDateRange(currentPeriod);
      if (from) expenses = expenses.filter(e => e.date >= from && e.date <= to);
    }

    // Category filter
    if (currentFilter !== 'all') {
      expenses = expenses.filter(e => e.category === currentFilter);
    }

    // Search filter
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      expenses = expenses.filter(e =>
        e.note.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }

    return expenses;
  }

  function refresh() {
    const expenses = getFilteredExpenses();
    container.innerHTML = renderExpenseGroups(expenses);

    const periodLabel = currentPeriod === 'custom' ? 'Custom' :
      currentPeriod === 'all' ? 'All Time' :
      getDateRange(currentPeriod).label;
    periodSummary.innerHTML = renderPeriodSummary(expenses, periodLabel);
  }

  // Initial render
  refresh();

  // Search
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      currentSearch = e.target.value;
      refresh();
    }, 250));
  }

  // Category filter chips
  if (filtersContainer) {
    filtersContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      refresh();
    });
  }

  // Time period pills
  if (timeFilterPills) {
    timeFilterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.time-pill');
      if (!pill) return;
      timeFilterPills.querySelectorAll('.time-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPeriod = pill.dataset.period;

      if (currentPeriod === 'custom') {
        customDateRange.style.display = 'flex';
      } else {
        customDateRange.style.display = 'none';
      }
      refresh();
    });
  }

  // Custom date range
  if (dateFrom && dateTo) {
    const onDateChange = () => {
      customFrom = dateFrom.value;
      customTo = dateTo.value;
      if (customFrom && customTo) refresh();
    };
    dateFrom.addEventListener('change', onDateChange);
    dateTo.addEventListener('change', onDateChange);
  }

  // Expense actions (edit / delete)
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'delete') {
        store.deleteExpense(id);
        refresh();
      } else if (action === 'edit') {
        const expense = store.getExpenseById(id);
        if (expense && formController) {
          formController.open(expense);
        }
      }
    });
  }

  // Add button
  const addBtn = document.getElementById('btn-add-expense-list');
  if (addBtn && formController) {
    addBtn.addEventListener('click', () => formController.open());
  }

  return { refresh };
}
