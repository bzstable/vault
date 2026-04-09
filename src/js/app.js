import { store } from './store.js';
import { renderNavigation } from './components/navigation.js';
import { renderHeader } from './components/header.js';
import { renderExpenseForm, initExpenseForm } from './components/expenseForm.js';
import { renderExpenseList, renderExpenseGroups, initExpenseList } from './components/expenseList.js';
import { renderInsights, initInsights } from './components/insights.js';
import { renderBudgetSettings, initBudgetSettings } from './components/budgetSettings.js';
import { getCategoryById } from './categories.js';
import { categoryIcon, icon } from './icons.js';
import { formatAmount } from './utils.js';

class App {
  constructor() {
    this.currentPage = 'dashboard';
    this.formController = null;
    this.listController = null;
    this.insightsController = null;
    this.root = document.getElementById('app');

    this._bindEvents();
    this.render();

    store.on('change', () => this._onDataChange());
    store.on('budgetAlert', (data) => this._onBudgetAlert(data));
  }

  _bindEvents() {
    window.addEventListener('hashchange', () => {
      const page = location.hash.replace('#', '') || 'dashboard';
      this.navigate(page);
    });
    const initial = location.hash.replace('#', '') || 'dashboard';
    this.currentPage = initial;
  }

  navigate(page) {
    if (this.currentPage === page) return;
    this.currentPage = page;
    location.hash = page;
    this.render();
  }

  render() {
    this.root.innerHTML = `
      ${renderNavigation(this.currentPage)}
      <main class="main-content">
        ${renderExpenseForm()}
        ${this._renderPage()}
      </main>
    `;
    this._initPage();
    this._initTopBar();
  }

  _initTopBar() {
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;
    const onScroll = () => {
      topBar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  _renderPage() {
    switch (this.currentPage) {
      case 'dashboard':
        return this._renderDashboard();
      case 'expenses':
        return renderExpenseList();
      case 'insights':
        return renderInsights();
      case 'settings':
        return renderBudgetSettings();
      default:
        return this._renderDashboard();
    }
  }

  _renderDashboard() {
    const recentExpenses = store.getExpenses().slice(0, 8);

    return `
      ${renderHeader()}

      <div class="content-grid">
        <div>
          <div class="section anim-fade-up delay-5">
            <div class="section-header">
              <h2 class="section-title">Recent Expenses</h2>
              <span class="section-action" id="view-all-expenses">View all →</span>
            </div>
            <div class="glass-card" style="padding: var(--space-sm);">
              ${renderExpenseGroups(recentExpenses)}
            </div>
          </div>
        </div>

        <div>
          <!-- Week Comparison Mini -->
          <div class="section anim-fade-up delay-6">
            <div class="section-header">
              <h2 class="section-title">This Week</h2>
              <span class="section-action" id="view-insights">Details →</span>
            </div>
            <div class="glass-card">
              ${this._renderWeekMini()}
            </div>
          </div>

          <!-- Category Breakdown Mini -->
          <div class="section anim-fade-up delay-7">
            <div class="section-header">
              <h2 class="section-title">This Month</h2>
            </div>
            <div class="glass-card">
              ${this._renderMiniCategoryBreakdown()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderWeekMini() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const allExpenses = store.getExpenses();
    const thisWeekTotal = allExpenses.filter(e => new Date(e.date) >= weekStart).reduce((s, e) => s + e.amount, 0);
    const lastWeekTotal = allExpenses.filter(e => { const d = new Date(e.date); return d >= lastWeekStart && d < weekStart; }).reduce((s, e) => s + e.amount, 0);

    const changePct = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

    return `
      <div style="text-align: center; padding: var(--space-sm);">
        <div style="font-size: var(--text-2xl); font-weight: var(--weight-bold); letter-spacing: -0.02em;"><span style="color: var(--text-secondary); font-size: var(--text-lg);">₹</span>${formatAmount(thisWeekTotal)}</div>
        <div style="font-size: var(--text-xs); color: ${changePct > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 6px;">
          ${changePct > 0 ? '↑' : changePct < 0 ? '↓' : '–'} ${Math.abs(changePct)}% vs last week
        </div>
      </div>
    `;
  }

  _renderMiniCategoryBreakdown() {
    const catTotals = store.getCategoryTotals(true);
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sorted.length === 0) {
      return `<div style="padding: var(--space-md); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">No data yet</div>`;
    }

    const max = sorted[0][1];
    return sorted.map(([catId, amount]) => {
      const cat = getCategoryById(catId);
      const pct = (amount / max) * 100;
      return `
        <div class="chart-bar-row">
          <div class="chart-bar-label">
            <span style="color: ${cat.color}; display: inline-flex;">${categoryIcon(catId, 14)}</span>
            <span>${cat.name.split(' ')[0]}</span>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="--bar-width: ${pct}%; width: ${pct}%; background: ${cat.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  _initPage() {
    this.formController = initExpenseForm(store, () => this.render());

    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.navigate(btn.dataset.page);
      });
    });

    const addBtn = document.getElementById('btn-add-expense');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.formController.open());
    }

    switch (this.currentPage) {
      case 'expenses':
        this.listController = initExpenseList(this.formController);
        break;
      case 'insights':
        this.insightsController = initInsights();
        break;
      case 'settings':
        initBudgetSettings(() => this.render());
        break;
    }

    const viewAll = document.getElementById('view-all-expenses');
    if (viewAll) viewAll.addEventListener('click', () => this.navigate('expenses'));

    const viewInsights = document.getElementById('view-insights');
    if (viewInsights) viewInsights.addEventListener('click', () => this.navigate('insights'));

    // Dashboard expense actions
    const dashExpenses = document.querySelector('.content-grid');
    if (dashExpenses && this.currentPage === 'dashboard') {
      dashExpenses.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'delete') {
          store.deleteExpense(id);
          this.render();
        } else if (action === 'edit') {
          const expense = store.getExpenseById(id);
          if (expense) this.formController.open(expense);
        }
      });
    }
  }

  _onDataChange() {
    if (this.currentPage === 'expenses' && this.listController) {
      this.listController.refresh();
    }
  }

  _onBudgetAlert({ categoryId, level, usage }) {
    const cat = getCategoryById(categoryId);
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const messages = {
      warning: `${cat.name} budget at ${Math.round(usage.percentage)}%`,
      critical: `${cat.name} budget almost exhausted!`,
      exceeded: `${cat.name} budget exceeded by ₹${formatAmount(Math.abs(usage.remaining))}`,
    };

    const toast = document.createElement('div');
    toast.className = `toast ${level === 'exceeded' ? 'danger' : 'warning'}`;
    toast.innerHTML = `<span style="display: inline-flex;">${icon(level === 'exceeded' ? 'warning' : 'warning', 14)}</span> ${messages[level]}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

export function initApp() {
  return new App();
}
