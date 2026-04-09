import { CATEGORIES } from '../categories.js';
import { categoryIcon } from '../icons.js';
import { todayISO } from '../utils.js';

export function renderExpenseForm(existingExpense = null) {
  const isEdit = !!existingExpense;

  return `
    <div class="glass-overlay ${isEdit ? 'active' : ''}" id="expense-modal">
      <div class="glass-modal" role="dialog" aria-labelledby="form-title">
        <h2 id="form-title" style="font-size: var(--text-xl); font-weight: var(--weight-bold); margin-bottom: var(--space-xl); letter-spacing: -0.02em;">
          ${isEdit ? 'Edit Expense' : 'New Expense'}
        </h2>

        <form id="expense-form" autocomplete="off">
          <input type="hidden" id="expense-id" value="${isEdit ? existingExpense.id : ''}">

          <div class="form-group">
            <label class="form-label" for="expense-amount">Amount</label>
            <div class="amount-input-wrap">
              <span class="currency-symbol">₹</span>
              <input type="number" id="expense-amount" class="glass-input"
                     placeholder="0" min="1" step="1" required
                     value="${isEdit ? existingExpense.amount : ''}"
                     inputmode="numeric">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Category</label>
            <div class="category-grid" id="category-picker">
              ${CATEGORIES.map(cat => `
                <div class="category-option ${isEdit && existingExpense.category === cat.id ? 'selected' : ''}"
                     data-category="${cat.id}" tabindex="0" role="radio"
                     aria-label="${cat.name}">
                  <span class="cat-icon" style="color: ${cat.color};">${categoryIcon(cat.id)}</span>
                  <span class="cat-name">${cat.name.split(' ')[0]}</span>
                </div>
              `).join('')}
            </div>
            <input type="hidden" id="expense-category" value="${isEdit ? existingExpense.category : ''}" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="expense-date">Date</label>
              <input type="date" id="expense-date" class="glass-input"
                     value="${isEdit ? existingExpense.date : todayISO()}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="expense-note">Note</label>
              <input type="text" id="expense-note" class="glass-input"
                     placeholder="What was it for?"
                     value="${isEdit ? existingExpense.note : ''}"
                     maxlength="100">
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="glass-btn glass-btn-secondary" id="btn-cancel-expense">Cancel</button>
            <button type="submit" class="glass-btn glass-btn-primary">${isEdit ? 'Update' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function initExpenseForm(store, onComplete) {
  const modal = document.getElementById('expense-modal');
  const form = document.getElementById('expense-form');
  const categoryPicker = document.getElementById('category-picker');
  const categoryInput = document.getElementById('expense-category');
  const cancelBtn = document.getElementById('btn-cancel-expense');

  function open(expense = null) {
    if (expense) {
      document.getElementById('expense-id').value = expense.id;
      document.getElementById('expense-amount').value = expense.amount;
      document.getElementById('expense-date').value = expense.date;
      document.getElementById('expense-note').value = expense.note;
      categoryInput.value = expense.category;
      categoryPicker.querySelectorAll('.category-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.category === expense.category);
      });
      document.getElementById('form-title').textContent = 'Edit Expense';
      form.querySelector('[type="submit"]').textContent = 'Update';
    } else {
      form.reset();
      document.getElementById('expense-id').value = '';
      document.getElementById('expense-date').value = todayISO();
      categoryInput.value = '';
      categoryPicker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
      document.getElementById('form-title').textContent = 'New Expense';
      form.querySelector('[type="submit"]').textContent = 'Add Expense';
    }
    modal.classList.add('active');
    setTimeout(() => document.getElementById('expense-amount').focus(), 200);
  }

  function close() {
    modal.classList.remove('active');
  }

  categoryPicker.addEventListener('click', (e) => {
    const option = e.target.closest('.category-option');
    if (!option) return;
    categoryPicker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
    categoryInput.value = option.dataset.category;
  });

  categoryPicker.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.target.click();
    }
  });

  cancelBtn.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('expense-id').value;
    const amount = document.getElementById('expense-amount').value;
    const category = categoryInput.value;
    const date = document.getElementById('expense-date').value;
    const note = document.getElementById('expense-note').value;

    if (!amount || !category) {
      if (!category) {
        categoryPicker.style.outline = '1px solid var(--danger)';
        categoryPicker.style.borderRadius = 'var(--radius-md)';
        setTimeout(() => { categoryPicker.style.outline = 'none'; }, 1500);
      }
      return;
    }

    if (id) {
      store.updateExpense(id, { amount: parseFloat(amount), category, date, note });
    } else {
      store.addExpense({ amount, category, date, note });
    }

    close();
    if (onComplete) onComplete();
  });

  return { open, close };
}
