import { store } from '../store.js';
import { CATEGORIES, getCategoryById } from '../categories.js';
import { categoryIcon, icon } from '../icons.js';
import { formatAmount, todayISO } from '../utils.js';

export function renderInsights() {
  return `
    <div class="page-header anim-fade-down">
      <div>
        <h1 class="page-title">Insights</h1>
        <p class="page-subtitle">Understand your spending patterns</p>
      </div>
    </div>

    <!-- Time Period Filter -->
    <div class="time-filter-bar anim-fade-up delay-1">
      <div class="time-filter-pills" id="insights-time-pills">
        <button class="time-pill" data-period="7">7D</button>
        <button class="time-pill active" data-period="30">30D</button>
        <button class="time-pill" data-period="90">3M</button>
        <button class="time-pill" data-period="365">1Y</button>
        <button class="time-pill" data-period="all">All</button>
        <button class="time-pill time-pill-calendar" data-period="custom" title="Custom range">
          ${icon('calendar', 14)}
        </button>
      </div>
      <div class="custom-date-range" id="insights-custom-range" style="display: none;">
        <input type="date" class="glass-input date-range-input" id="insights-date-from" aria-label="From date">
        <span style="color: var(--text-tertiary); font-size: var(--text-xs);">to</span>
        <input type="date" class="glass-input date-range-input" id="insights-date-to" value="${todayISO()}" aria-label="To date">
      </div>
    </div>

    <div id="insights-content" class="content-grid" style="margin-top: var(--space-lg);">
    </div>
  `;
}

function getFilteredExpenses(period, customFrom, customTo) {
  let expenses = store.getExpenses();
  if (period === 'custom' && customFrom && customTo) {
    return expenses.filter(e => e.date >= customFrom && e.date <= customTo);
  }
  if (period === 'all') return expenses;

  const days = parseInt(period);
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - days + 1);
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return expenses.filter(e => e.date >= from);
}

function renderInsightsContent(expenses, period) {
  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Weekly totals for sparkline
  const weeklyTotals = computeWeeklyTotals(expenses, period);

  return `
    <div>
      <!-- Donut Chart -->
      <div class="section anim-fade-up delay-1">
        <div class="section-header">
          <h2 class="section-title">Spending Distribution</h2>
          <span class="glass-badge">${getPeriodLabel(period)}</span>
        </div>
        <div class="glass-card">
          ${renderDonutChart(catTotals, total)}
        </div>
      </div>

      <!-- Spending by Category bars -->
      <div class="section anim-fade-up delay-3">
        <div class="section-header">
          <h2 class="section-title">Category Breakdown</h2>
        </div>
        <div class="glass-card">
          ${renderCategoryBars(catTotals, total)}
        </div>
      </div>

      <!-- Weekly Spending Trend -->
      <div class="section anim-fade-up delay-5">
        <div class="section-header">
          <h2 class="section-title">Spending Trend</h2>
        </div>
        <div class="glass-card">
          ${renderSparkline(weeklyTotals)}
          <div style="display: flex; justify-content: space-between; margin-top: var(--space-sm);">
            ${weeklyTotals.map(w => `
              <span style="font-size: 0.6rem; color: var(--text-tertiary); text-align: center; flex: 1;">${w.label}</span>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div>
      <!-- This Week vs Last Week comparison -->
      <div class="section anim-fade-up delay-2">
        <div class="section-header">
          <h2 class="section-title">Week Comparison</h2>
        </div>
        <div class="glass-card">
          ${renderWeekComparison()}
        </div>
      </div>

      <!-- Budget Overview — ALL categories -->
      <div class="section anim-fade-up delay-4">
        <div class="section-header">
          <h2 class="section-title">Budget Overview</h2>
          <span class="glass-badge">This month</span>
        </div>
        <div class="glass-card">
          ${renderBudgetOverview()}
        </div>
      </div>
    </div>
  `;
}

function renderDonutChart(catTotals, total) {
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return `<div style="padding: var(--space-xl); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">No data for this period.</div>`;
  }

  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const arcs = sorted.map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    const pct = total > 0 ? amount / total : 0;
    const dashLen = circumference * pct;
    const dashGap = circumference - dashLen;
    const offset = currentOffset;
    currentOffset += dashLen;
    return `<circle cx="${size/2}" cy="${size/2}" r="${radius}"
              fill="none" stroke="${cat.color}" stroke-width="${strokeWidth}"
              stroke-dasharray="${dashLen} ${dashGap}"
              stroke-dashoffset="${-offset}"
              style="transition: all 0.6s ease;"/>`;
  });

  const legend = sorted.map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
    return `
      <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 6px;">
        <span style="width: 8px; height: 8px; border-radius: 2px; background: ${cat.color}; flex-shrink: 0;"></span>
        <span style="flex: 1; font-size: var(--text-xs); color: var(--text-secondary);">${cat.name.split(' ')[0]}</span>
        <span style="font-size: var(--text-xs); color: var(--text-tertiary);">${pct}%</span>
      </div>
    `;
  });

  return `
    <div style="display: flex; align-items: center; gap: var(--space-xl); padding: var(--space-md);">
      <div style="position: relative; width: ${size}px; height: ${size}px; flex-shrink: 0;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg);">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="${strokeWidth}"/>
          ${arcs.join('')}
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: var(--text-xs); color: var(--text-tertiary);">Total</span>
          <span style="font-size: var(--text-lg); font-weight: var(--weight-bold);">₹${formatAmount(total)}</span>
        </div>
      </div>
      <div style="flex: 1; min-width: 0;">
        ${legend.join('')}
      </div>
    </div>
  `;
}

function renderCategoryBars(catTotals, total) {
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return `<div style="padding: var(--space-lg); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">No expenses for this period.</div>`;
  }

  const max = sorted[0][1];

  return sorted.map(([catId, amount]) => {
    const cat = getCategoryById(catId);
    const pct = max > 0 ? (amount / max) * 100 : 0;
    const totalPct = total > 0 ? Math.round((amount / total) * 100) : 0;
    return `
      <div class="chart-bar-row">
        <div class="chart-bar-label">
          <span style="color: ${cat.color}; display: inline-flex;">${categoryIcon(catId, 14)}</span>
          <span>${cat.name.split(' ')[0]}</span>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="--bar-width: ${pct}%; width: ${pct}%; background: ${cat.color};"></div>
        </div>
        <div class="chart-bar-value">₹${formatAmount(amount)} <span style="opacity:0.5">${totalPct}%</span></div>
      </div>
    `;
  }).join('');
}

function renderWeekComparison() {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);

  const allExpenses = store.getExpenses();

  // Category-wise comparison
  const thisWeek = {};
  const lastWeek = {};
  allExpenses.forEach(e => {
    const d = new Date(e.date);
    if (d >= thisWeekStart) {
      thisWeek[e.category] = (thisWeek[e.category] || 0) + e.amount;
    } else if (d >= lastWeekStart && d < lastWeekEnd) {
      lastWeek[e.category] = (lastWeek[e.category] || 0) + e.amount;
    }
  });

  const categories = [...new Set([...Object.keys(thisWeek), ...Object.keys(lastWeek)])];
  const thisTotal = Object.values(thisWeek).reduce((s, v) => s + v, 0);
  const lastTotal = Object.values(lastWeek).reduce((s, v) => s + v, 0);
  const changePct = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;
  const maxVal = Math.max(...Object.values(thisWeek), ...Object.values(lastWeek), 1);

  if (categories.length === 0) {
    return `<div style="padding: var(--space-lg); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">Not enough data for comparison yet.</div>`;
  }

  return `
    <div style="text-align: center; margin-bottom: var(--space-lg);">
      <div style="font-size: var(--text-3xl); font-weight: var(--weight-bold); letter-spacing: -0.02em;">
        ${changePct > 0 ? '+' : ''}${changePct}%
      </div>
      <div style="font-size: var(--text-xs); color: ${changePct > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top: 4px;">
        ${changePct > 0 ? 'More than last week' : changePct < 0 ? 'Less than last week' : 'Same as last week'}
      </div>
    </div>
    <div style="display: flex; gap: var(--space-lg); font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: var(--space-md);">
      <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 3px; background: var(--accent); border-radius: 2px;"></span> This week</div>
      <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 3px; background: var(--silver); border-radius: 2px; opacity: 0.4;"></span> Last week</div>
    </div>
    ${categories.slice(0, 6).map(catId => {
      const cat = getCategoryById(catId);
      const tw = thisWeek[catId] || 0;
      const lw = lastWeek[catId] || 0;
      return `
        <div style="margin-bottom: var(--space-md);">
          <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: 6px;">
            <span style="color: ${cat.color}; display: inline-flex;">${categoryIcon(catId, 12)}</span>
            <span style="font-size: var(--text-xs); color: var(--text-secondary);">${cat.name.split(' ')[0]}</span>
          </div>
          <div style="display: flex; gap: 4px; flex-direction: column;">
            <div class="chart-bar-track" style="height: 6px;">
              <div class="chart-bar-fill" style="width: ${(tw / maxVal) * 100}%; background: var(--accent); height: 100%;"></div>
            </div>
            <div class="chart-bar-track" style="height: 6px;">
              <div class="chart-bar-fill" style="width: ${(lw / maxVal) * 100}%; background: var(--silver); height: 100%; opacity: 0.4;"></div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-tertiary); margin-top: 4px;">
            <span>₹${formatAmount(tw)}</span>
            <span>₹${formatAmount(lw)}</span>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderSparkline(weeklyTotals) {
  const values = weeklyTotals.map(w => w.total);
  const max = Math.max(...values, 1);
  const width = 320;
  const height = 80;
  const padding = 8;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  if (values.length < 2) {
    return `<div style="padding: var(--space-lg); text-align: center; color: var(--text-tertiary); font-size: var(--text-sm);">Not enough data yet.</div>`;
  }

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * usableW;
    const y = padding + usableH - (v / max) * usableH;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return `
    <div class="sparkline-container">
      <svg class="sparkline-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" class="sparkline-area"/>
        <path d="${pathD}" class="sparkline-path"/>
        ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" class="sparkline-dot" opacity="${i === points.length - 1 ? 1 : 0.3}"/>`).join('')}
      </svg>
    </div>
  `;
}

function computeWeeklyTotals(expenses, period) {
  const weekCount = period === '7' ? 7 : period === '30' ? 4 : period === '90' ? 12 : 8;
  const result = [];
  const now = new Date();

  if (period === '7') {
    // Daily for 7-day view
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const total = expenses.filter(e => e.date === key).reduce((s, e) => s + e.amount, 0);
      result.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), total });
    }
  } else {
    for (let i = weekCount - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const total = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= weekStart && d < weekEnd;
      }).reduce((s, e) => s + e.amount, 0);
      result.push({ label: `W${weekCount - i}`, total });
    }
  }
  return result;
}

function renderBudgetOverview() {
  // ALL categories
  return CATEGORIES.map(cat => {
    const usage = store.getBudgetUsage(cat.id);
    const isOver = usage.percentage >= 100;
    const isWarning = usage.percentage >= 75;
    const color = isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : cat.color;
    return `
      <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
        <span style="color: ${cat.color}; display: inline-flex; flex-shrink: 0;">${categoryIcon(cat.id, 16)}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); margin-bottom: 4px;">
            <span style="color: var(--text-secondary);">${cat.name.split(' ')[0]}</span>
            <span style="color: ${isOver ? 'var(--danger)' : 'var(--text-tertiary)'};">
              ${isOver ? `−₹${formatAmount(Math.abs(usage.remaining))}` : `₹${formatAmount(usage.spent)} / ₹${formatAmount(usage.budget)}`}
            </span>
          </div>
          <div class="budget-progress-bar">
            <div class="budget-progress-fill" style="width: ${Math.min(usage.percentage, 100)}%; background: ${color};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getPeriodLabel(period) {
  const labels = { '7': 'Last 7 days', '30': 'Last 30 days', '90': 'Last 3 months', '365': 'Last year', 'all': 'All time', 'custom': 'Custom' };
  return labels[period] || period;
}

export function initInsights() {
  const timePills = document.getElementById('insights-time-pills');
  const customRange = document.getElementById('insights-custom-range');
  const dateFrom = document.getElementById('insights-date-from');
  const dateTo = document.getElementById('insights-date-to');
  const content = document.getElementById('insights-content');

  let currentPeriod = '30';
  let customFrom = null;
  let customTo = null;

  function refresh() {
    const expenses = getFilteredExpenses(currentPeriod, customFrom, customTo);
    content.innerHTML = renderInsightsContent(expenses, currentPeriod);
  }

  refresh();

  if (timePills) {
    timePills.addEventListener('click', (e) => {
      const pill = e.target.closest('.time-pill');
      if (!pill) return;
      timePills.querySelectorAll('.time-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPeriod = pill.dataset.period;
      customRange.style.display = currentPeriod === 'custom' ? 'flex' : 'none';
      refresh();
    });
  }

  if (dateFrom && dateTo) {
    const onChange = () => {
      customFrom = dateFrom.value;
      customTo = dateTo.value;
      if (customFrom && customTo) refresh();
    };
    dateFrom.addEventListener('change', onChange);
    dateTo.addEventListener('change', onChange);
  }

  return { refresh };
}
