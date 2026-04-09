import { store } from '../store.js';
import { formatAmount } from '../utils.js';

export function renderHeader() {
  const monthlyTotal = store.getMonthlyTotal();
  const totalBudget = store.getTotalBudget();
  const remaining = totalBudget - monthlyTotal;
  const isOver = remaining < 0;
  const expenseCount = store.getExpenses().filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return `
    <div class="page-header anim-fade-down">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <button class="glass-btn glass-btn-primary" id="btn-add-expense" aria-label="Add new expense">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
        Add Expense
      </button>
    </div>

    <div class="stats-row">
      <div class="stat-card glass-card anim-fade-up delay-1">
        <div class="stat-label">This Month</div>
        <div class="stat-value"><span class="currency">₹</span><span id="stat-monthly">${formatAmount(monthlyTotal)}</span></div>
        <div class="stat-change ${isOver ? 'up' : 'down'}">
          ${isOver ? `−₹${formatAmount(Math.abs(remaining))}` : `₹${formatAmount(remaining)} remaining`}
        </div>
      </div>
      <div class="stat-card glass-card anim-fade-up delay-2">
        <div class="stat-label">Today</div>
        <div class="stat-value"><span class="currency">₹</span><span id="stat-today">${formatAmount(store.getTotalExpenses({ startDate: new Date().toISOString().split('T')[0] }))}</span></div>
      </div>
      <div class="stat-card glass-card anim-fade-up delay-3">
        <div class="stat-label">Transactions</div>
        <div class="stat-value"><span id="stat-count">${expenseCount}</span></div>
        <div class="stat-change down">This month</div>
      </div>
      <div class="stat-card glass-card anim-fade-up delay-4">
        <div class="stat-label">Budget Used</div>
        <div class="stat-value"><span id="stat-budget-pct">${totalBudget > 0 ? Math.round((monthlyTotal / totalBudget) * 100) : 0}</span><span class="currency">%</span></div>
        <div class="budget-progress-inline">
          <div class="budget-progress-bar">
            <div class="budget-progress-fill" style="width: ${totalBudget > 0 ? Math.min((monthlyTotal / totalBudget) * 100, 100) : 0}%; background: ${isOver ? 'var(--danger)' : monthlyTotal > totalBudget * 0.75 ? 'var(--warning)' : 'var(--accent)'}"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
