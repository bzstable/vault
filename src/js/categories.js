import { icon } from './icons.js';

export const CATEGORIES = [
  { id: 'food',          name: 'Food & Dining',     color: 'var(--cat-food)',          defaultBudget: 8000 },
  { id: 'transport',     name: 'Transport',          color: 'var(--cat-transport)',     defaultBudget: 3000 },
  { id: 'bills',         name: 'Bills & Utilities',  color: 'var(--cat-bills)',         defaultBudget: 5000 },
  { id: 'shopping',      name: 'Shopping',            color: 'var(--cat-shopping)',     defaultBudget: 4000 },
  { id: 'entertainment', name: 'Entertainment',       color: 'var(--cat-entertainment)', defaultBudget: 3000 },
  { id: 'health',        name: 'Health',              color: 'var(--cat-health)',        defaultBudget: 2000 },
  { id: 'education',     name: 'Education',           color: 'var(--cat-education)',     defaultBudget: 2000 },
  { id: 'travel',        name: 'Travel',              color: 'var(--cat-travel)',        defaultBudget: 5000 },
  { id: 'savings',       name: 'Savings',             color: 'var(--cat-savings)',       defaultBudget: 10000 },
  { id: 'other',         name: 'Other',               color: 'var(--cat-other)',         defaultBudget: 2000 },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function getCategoryColor(id) {
  return getCategoryById(id).color;
}

export function getCategoryIcon(id, size) {
  return icon(id, size);
}
