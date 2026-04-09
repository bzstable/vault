import { store } from '../store.js';
import { CATEGORIES, getCategoryById } from '../categories.js';
import { categoryIcon, icon } from '../icons.js';
import { formatAmount } from '../utils.js';

export function renderBudgetSettings() {
  const budgets = store.getBudgets();

  return `
    <div class="page-header anim-fade-down">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-subtitle">Manage budgets & data</p>
      </div>
    </div>

    <div class="content-grid">
      <div>
        <!-- Monthly Budgets -->
        <div class="section anim-fade-up delay-1">
          <div class="section-header">
            <h2 class="section-title">Monthly Budgets</h2>
            <span class="glass-badge">Per category</span>
          </div>
          <div class="glass-card" id="budget-list">
            ${CATEGORIES.map(cat => {
              const usage = store.getBudgetUsage(cat.id);
              const isOver = usage.percentage >= 100;
              return `
                <div class="budget-item">
                  <div class="budget-cat-icon" style="background: ${cat.color}18; color: ${cat.color};">
                    ${categoryIcon(cat.id)}
                  </div>
                  <div class="budget-cat-name">${cat.name}</div>
                  <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <span style="font-size: var(--text-xs); color: var(--text-tertiary);">₹</span>
                      <input type="number" class="glass-input budget-input"
                             data-category="${cat.id}"
                             value="${budgets[cat.id] || 0}"
                             min="0" step="500"
                             aria-label="Budget for ${cat.name}">
                    </div>
                    <span style="font-size: 0.65rem; color: ${isOver ? 'var(--danger)' : 'var(--text-tertiary)'};">
                      ${isOver ? `−₹${formatAmount(Math.abs(usage.remaining))}` : `Spent: ₹${formatAmount(usage.spent)}`}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <div>
        <!-- Total Budget Summary -->
        <div class="section anim-fade-up delay-2">
          <div class="section-header">
            <h2 class="section-title">Budget Summary</h2>
          </div>
          <div class="glass-card">
            <div style="text-align: center; padding: var(--space-md);">
              <div style="font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em;">Total Monthly Budget</div>
              <div style="font-size: var(--text-3xl); font-weight: var(--weight-bold); color: var(--text-primary); margin: var(--space-sm) 0; letter-spacing: -0.02em;">
                <span style="font-size: var(--text-xl); color: var(--text-secondary);">₹</span>${formatAmount(store.getTotalBudget())}
              </div>
              ${(() => {
                const rem = store.getTotalBudget() - store.getMonthlyTotal();
                const isOver = rem < 0;
                return `<div style="font-size: var(--text-sm); color: ${isOver ? 'var(--danger)' : 'var(--text-tertiary)'};">
                  Spent: ₹${formatAmount(store.getMonthlyTotal())} · ${isOver ? `−₹${formatAmount(Math.abs(rem))}` : `Remaining: ₹${formatAmount(rem)}`}
                </div>`;
              })()}
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="section anim-fade-up delay-3">
          <div class="section-header">
            <h2 class="section-title">Data</h2>
          </div>
          <div class="glass-card" style="display: flex; flex-direction: column; gap: var(--space-md);">
            <button class="glass-btn glass-btn-secondary" id="btn-export" style="width: 100%;">
              ${icon('download', 14)}
              Export Data (JSON)
            </button>
            <label class="glass-btn glass-btn-secondary" style="width: 100%; cursor: pointer;">
              ${icon('upload', 14)}
              Import Data
              <input type="file" id="btn-import" accept=".json" style="display: none;">
            </label>
            <button class="glass-btn glass-btn-danger" id="btn-clear-all" style="width: 100%;">
              ${icon('trash', 14)}
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog (in-page) -->
    <div class="glass-overlay" id="confirm-dialog">
      <div class="glass-modal" style="max-width: 380px; text-align: center;">
        <div style="margin-bottom: var(--space-lg);">
          <div style="width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(248,113,113,0.1); display: inline-flex; align-items: center; justify-content: center; color: var(--danger); margin-bottom: var(--space-md);">
            ${icon('warning', 24)}
          </div>
          <h3 style="font-size: var(--text-lg); font-weight: var(--weight-semibold); margin-bottom: var(--space-sm);">Clear All Data?</h3>
          <p style="font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6;">
            This will permanently delete all your expenses, budgets, and settings. This action cannot be undone.
          </p>
        </div>
        <div class="form-actions" style="margin-top: var(--space-lg);">
          <button class="glass-btn glass-btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="glass-btn glass-btn-danger" id="confirm-delete">Delete Everything</button>
        </div>
      </div>
    </div>
  `;
}

export function initBudgetSettings(onRefresh) {
  const budgetList = document.getElementById('budget-list');
  const confirmDialog = document.getElementById('confirm-dialog');

  // Budget input changes
  if (budgetList) {
    budgetList.addEventListener('change', (e) => {
      if (e.target.classList.contains('budget-input')) {
        store.setBudget(e.target.dataset.category, e.target.value);
        if (onRefresh) onRefresh();
      }
    });
  }

  // Export
  const exportBtn = document.getElementById('btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    });
  }

  // Import
  const importInput = document.getElementById('btn-import');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = store.importData(ev.target.result);
        if (success) {
          showToast('Data imported successfully', 'success');
          if (onRefresh) onRefresh();
        } else {
          showToast('Invalid file format', 'danger');
        }
      };
      reader.readAsText(file);
    });
  }

  // Clear all — in-page dialog instead of browser confirm()
  const clearBtn = document.getElementById('btn-clear-all');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmDelete = document.getElementById('confirm-delete');

  if (clearBtn && confirmDialog) {
    clearBtn.addEventListener('click', () => {
      confirmDialog.classList.add('active');
    });

    confirmCancel.addEventListener('click', () => {
      confirmDialog.classList.remove('active');
    });

    confirmDialog.addEventListener('click', (e) => {
      if (e.target === confirmDialog) confirmDialog.classList.remove('active');
    });

    confirmDelete.addEventListener('click', () => {
      localStorage.clear();
      confirmDialog.classList.remove('active');
      location.reload();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && confirmDialog.classList.contains('active')) {
        confirmDialog.classList.remove('active');
      }
    });
  }
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const iconMap = { success: 'check', warning: 'warning', danger: 'close' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="display: inline-flex;">${icon(iconMap[type] || 'check', 14)}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
