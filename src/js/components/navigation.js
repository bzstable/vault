import { icon } from '../icons.js';

export function renderNavigation(activePage = 'dashboard') {
  const items = [
    { id: 'dashboard',  iconName: 'dashboard', label: 'Dashboard' },
    { id: 'expenses',   iconName: 'list',      label: 'Expenses' },
    { id: 'insights',   iconName: 'insights',  label: 'Insights' },
    { id: 'settings',   iconName: 'settings',  label: 'Settings' },
  ];

  return `
    <nav class="sidebar" role="navigation" aria-label="Main navigation">
      <div class="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="6" width="20" height="16" rx="3" stroke="var(--accent)" stroke-width="1.5" fill="none"/>
          <circle cx="14" cy="14" r="3" stroke="var(--accent)" stroke-width="1.2" fill="none"/>
          <line x1="14" y1="11" x2="14" y2="6" stroke="var(--accent)" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="sidebar-nav">
        ${items.map(item => `
          <button class="nav-item glass-tooltip ${activePage === item.id ? 'active' : ''}"
                  data-page="${item.id}"
                  data-tooltip="${item.label}"
                  aria-label="${item.label}"
                  id="nav-${item.id}">
            ${icon(item.iconName, 20)}
          </button>
        `).join('')}
      </div>
    </nav>

    <header class="top-bar" id="top-bar">
      <div class="top-bar-inner">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="6" width="20" height="16" rx="3" stroke="var(--accent)" stroke-width="1.5" fill="none"/>
          <circle cx="14" cy="14" r="3" stroke="var(--accent)" stroke-width="1.2" fill="none"/>
          <line x1="14" y1="11" x2="14" y2="6" stroke="var(--accent)" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <span class="top-bar-title">Vault</span>
      </div>
    </header>
  `;
}
