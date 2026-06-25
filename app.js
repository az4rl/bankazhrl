/* ==================== DATABASE ==================== */
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  getWallets() { const w = this.get('df_wallets'); if (!w || !Object.keys(w).length) return {}; return w; },
  getSettings() { return this.get('df_settings') || { targetBNI: 0, dailyLimit: 0, workDaysLeft: 0, totalWorkdays: 0, name: '' }; },
  getObligations() { return this.get('df_obligations') || []; },
  getTransactions() { return this.get('df_transactions') || []; },
  getBudgets() { return this.get('df_budgets') || {}; },
  getTemplates() { return this.get('df_templates') || []; },
  getWalletMeta() { return this.get('df_wallet_meta') || {}; },
  getGoals() { return this.get('df_goals') || []; },
  getRecurring() { return this.get('df_recurring') || []; },
  getNWAssets() { return this.get('df_nw_assets') || []; },
  getNWDebts() { return this.get('df_nw_debts') || []; },
  getNWHistory() { return this.get('df_nw_history') || []; },
  getSplitPersons() { return this.get('df_split_persons') || ['Saya']; },
  saveWalletMeta(v) { this.set('df_wallet_meta', v); },
  saveWallets(v) { this.set('df_wallets', v); },
  saveSettings(v) { this.set('df_settings', v); },
  saveObligations(v) { this.set('df_obligations', v); },
  saveTransactions(v) { this.set('df_transactions', v); },
  saveBudgets(v) { this.set('df_budgets', v); },
  saveTemplates(v) { this.set('df_templates', v); },
  saveGoals(v) { this.set('df_goals', v); },
  saveRecurring(v) { this.set('df_recurring', v); },
  saveNWAssets(v) { this.set('df_nw_assets', v); },
  saveNWDebts(v) { this.set('df_nw_debts', v); },
  saveNWHistory(v) { this.set('df_nw_history', v); },
  saveSplitPersons(v) { this.set('df_split_persons', v); },
  generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
};

/* ==================== CONSTANTS ==================== */
const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbwEmqCzLn4s09pW0lvqlWnU1sJP3iMJJ5Q-Xk8JuX0Uddy21wG-LHpm6L2G2y9z4Gac/exec';

const CATEGORIES = {
  expense: [
    { id: 'makan', label: 'Makan', icon: 'fa-solid fa-utensils' },
    { id: 'bensin', label: 'Bensin', icon: 'fa-solid fa-gas-pump' },
    { id: 'parkir', label: 'Parkir', icon: 'fa-solid fa-square-parking' },
    { id: 'belanja', label: 'Belanja', icon: 'fa-solid fa-bag-shopping' },
    { id: 'wifi', label: 'WiFi', icon: 'fa-solid fa-wifi' },
    { id: 'listrik', label: 'Listrik', icon: 'fa-solid fa-bolt' },
    { id: 'transportasi', label: 'Ojol', icon: 'fa-solid fa-motorcycle' },
    { id: 'kesehatan', label: 'Sehat', icon: 'fa-solid fa-heart-pulse' },
    { id: 'hiburan', label: 'Hiburan', icon: 'fa-solid fa-film' },
    { id: 'kopi', label: 'Kopi', icon: 'fa-solid fa-mug-hot' },
    { id: 'laundry', label: 'Laundry', icon: 'fa-solid fa-shirt' },
    { id: 'lainnya', label: 'Lainnya', icon: 'fa-solid fa-ellipsis' }
  ],
  income: [
    { id: 'gaji', label: 'Gaji', icon: 'fa-solid fa-money-bill-wave' },
    { id: 'freelance', label: 'Freelance', icon: 'fa-solid fa-laptop' },
    { id: 'bonus', label: 'Bonus', icon: 'fa-solid fa-gift' },
    { id: 'cashback', label: 'Cashback', icon: 'fa-solid fa-rotate-left' },
    { id: 'lainnya', label: 'Lainnya', icon: 'fa-solid fa-ellipsis' }
  ],
  transfer: []
};

const CAT_ICONS = {};
[...CATEGORIES.expense, ...CATEGORIES.income].forEach(c => { CAT_ICONS[c.id] = c.icon; });

const EXCHANGE_RATES = { IDR: 1, USD: 16300, SGD: 12100, EUR: 17600, MYR: 3500, JPY: 108 };

/* ==================== UTILITIES ==================== */
function formatRp(n, compact = false) {
  const num = Math.abs(Number(n) || 0);
  if (compact && num >= 1000000) return (Number(n) < 0 ? '-' : '') + 'Rp' + (num / 1000000).toFixed(1).replace('.0', '') + 'jt';
  if (compact && num >= 1000) return (Number(n) < 0 ? '-' : '') + 'Rp' + (num / 1000).toFixed(0) + 'rb';
  return (Number(n) < 0 ? '-Rp' : 'Rp') + Math.floor(Math.abs(Number(n) || 0)).toLocaleString('id-ID');
}
function parseRpInput(str) { return parseInt((str || '').replace(/[^\d]/g, ''), 10) || 0; }
function formatInputRp(input) {
  const val = parseRpInput(input.value);
  input.value = val === 0 ? '' : val.toLocaleString('id-ID');
}
function todayDateStr() { return new Date().toISOString().split('T')[0]; }
function formatDate(str) {
  if (!str) return '';
  return new Date(str + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateGroup(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  const today = todayDateStr();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  if (str === today) return 'Hari Ini';
  if (str === yStr) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}
function getMonthKey(dateStr) { return dateStr ? dateStr.slice(0, 7) : ''; }
function getCurrentMonthKey() { return todayDateStr().slice(0, 7); }
function formatMonthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${months[parseInt(m) - 1]} ${y}`;
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'wallet_' + Date.now().toString(36);
}
function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

function toast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-circle-info'}"></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 300); }, 3200);
}
function showModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = ''; document.body.style.overflow = 'hidden'; }
}
function hideModal(id) {
  const el = document.getElementById(id);
  if (el) { el.style.display = 'none'; document.body.style.overflow = ''; }
}
function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = msg;
  showModal('confirmModal');
  const okBtn = document.getElementById('confirmOk');
  const newOk = okBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  newOk.addEventListener('click', () => { hideModal('confirmModal'); onOk(); });
}
function getWalletName(key) {
  const meta = DB.getWalletMeta();
  return (meta[key] && meta[key].name) ? meta[key].name : (key === 'cash' ? 'Cash' : (key || '').toUpperCase());
}

/* ==================== CHARTS ==================== */
let walletDonutChart = null, budgetChart = null, cicilanChart = null, networthChartInst = null;

/* ==================== COMPUTE ==================== */
function computeDuitFree() {
  const w = DB.getWallets();
  const meta = DB.getWalletMeta();
  const s = DB.getSettings();
  const obs = DB.getObligations();
  const totalDana = Object.values(w).reduce((a, v) => a + (Number(v) || 0), 0);
  let available = 0;
  Object.keys(w).forEach(k => {
    const bal = Number(w[k] || 0);
    const m = meta[k] || {};
    if (m.type === 'bank' && Number(m.target)) {
      available += Math.max(0, bal - Number(m.target));
    } else {
      available += bal;
    }
  });
  const unpaidObs = obs.filter(o => !o.isPaid).reduce((a, o) => a + o.amount, 0);
  const totalKewajiban = ((s.workDaysLeft || 0) * (s.dailyLimit || 0)) + unpaidObs;
  const duitFree = available - totalKewajiban;
  return { totalDana, totalKewajiban, duitFree, unpaidObs };
}

function computeBurnoutPrediction() {
  const txs = DB.getTransactions();
  const { duitFree } = computeDuitFree();
  const currentMonth = getCurrentMonthKey();
  const monthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense');
  if (!monthTxs.length) return null;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const avgPerDay = monthTxs.reduce((a, t) => a + t.amount, 0) / dayOfMonth;
  if (avgPerDay <= 0) return null;
  const daysLeft = duitFree / avgPerDay;
  if (daysLeft <= 0) return 'Sudah minus!';
  const burnoutDate = new Date(today.getTime() + daysLeft * 86400000);
  return burnoutDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ==================== FINANCIAL HEALTH SCORE ==================== */
function computeHealthScore() {
  const txs = DB.getTransactions();
  const budgets = DB.getBudgets();
  const currentMonth = getCurrentMonthKey();
  const monthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth);
  const income = monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  // Saving Rate: 0-30pts
  const savingRate = income > 0 ? (income - expense) / income : 0;
  const savingScore = Math.min(30, Math.round(savingRate * 100));

  // Budget compliance: 0-25pts
  const budgetEntries = Object.entries(budgets);
  let budgetScore = 25;
  if (budgetEntries.length > 0) {
    const overBudget = budgetEntries.filter(([cat, limit]) => {
      const spent = monthTxs.filter(t => t.type === 'expense' && t.category === cat).reduce((a, t) => a + t.amount, 0);
      return spent > limit;
    }).length;
    budgetScore = Math.max(0, 25 - overBudget * 8);
  }

  // Consistency: 0-20pts (days with transactions this month)
  const today = new Date();
  const daysThisMonth = today.getDate();
  const activeDays = new Set(monthTxs.map(t => t.date)).size;
  const consistencyScore = Math.min(20, Math.round((activeDays / Math.max(daysThisMonth, 1)) * 20));

  // Burnout risk: 0-25pts
  const { duitFree, totalKewajiban } = computeDuitFree();
  let burnoutScore = 25;
  if (totalKewajiban > 0) {
    const ratio = duitFree / totalKewajiban;
    burnoutScore = ratio > 0.5 ? 25 : ratio > 0 ? Math.round(ratio * 50) : 0;
  }

  const total = Math.min(100, savingScore + budgetScore + consistencyScore + burnoutScore);
  return { total, savingScore, budgetScore, consistencyScore, burnoutScore, savingRate };
}

function renderHealthScore() {
  const { total, savingScore, budgetScore, consistencyScore, burnoutScore, savingRate } = computeHealthScore();
  const numEl = document.getElementById('healthScoreNum');
  const arcEl = document.getElementById('healthScoreArc');
  const descEl = document.getElementById('healthScoreDesc');
  const breakEl = document.getElementById('healthScoreBreakdown');
  if (!numEl) return;

  numEl.textContent = total;
  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (total / 100) * circumference;
  arcEl.style.strokeDashoffset = offset;
  arcEl.style.stroke = total >= 75 ? '#10b981' : total >= 50 ? '#f59e0b' : '#ef4444';

  const label = total >= 80 ? 'Keuangan Sehat 🎉' : total >= 60 ? 'Cukup Baik 👍' : total >= 40 ? 'Perlu Perhatian ⚠️' : 'Kritis! 🚨';
  if (descEl) descEl.textContent = label;

  if (breakEl) {
    breakEl.innerHTML = `
      <div class="health-score-item"><i class="fa-solid fa-piggy-bank"></i>Saving Rate: ${Math.round(savingRate * 100)}% (${savingScore}/30)</div>
      <div class="health-score-item"><i class="fa-solid fa-bullseye"></i>Budget: ${budgetScore}/25</div>
      <div class="health-score-item"><i class="fa-solid fa-calendar-check"></i>Konsistensi: ${consistencyScore}/20</div>
      <div class="health-score-item"><i class="fa-solid fa-battery-half"></i>Burnout Risk: ${burnoutScore}/25</div>
    `;
  }
}

/* ==================== EXPENSE HEATMAP ==================== */
function renderExpenseHeatmap() {
  const el = document.getElementById('expenseHeatmap');
  if (!el) return;
  const txs = DB.getTransactions();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = daysInMonth(year, month);

  const spendByDay = {};
  txs.forEach(t => {
    if (t.type !== 'expense') return;
    const d = new Date(t.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      spendByDay[day] = (spendByDay[day] || 0) + t.amount;
    }
  });

  const maxVal = Math.max(...Object.values(spendByDay), 1);
  const cells = [];
  // Pad to start on correct weekday
  const firstDow = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDow; i++) cells.push(`<div class="heatmap-cell" style="opacity:0"></div>`);

  for (let d = 1; d <= totalDays; d++) {
    const val = spendByDay[d] || 0;
    const ratio = val / maxVal;
    const level = ratio === 0 ? 0 : ratio < 0.25 ? 1 : ratio < 0.5 ? 2 : ratio < 0.75 ? 3 : 4;
    const tip = val > 0 ? `${d}: ${formatRp(val, true)}` : `${d}: Rp0`;
    cells.push(`<div class="heatmap-cell" data-level="${level}" title="${tip}"></div>`);
  }
  el.innerHTML = cells.join('');
}

/* ==================== DASHBOARD GOALS ==================== */
function renderDashGoals() {
  const goals = DB.getGoals();
  const el = document.getElementById('dashGoalsList');
  if (!el) return;
  if (!goals.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Belum ada target. Buat target di halaman Goals.</div>';
    return;
  }
  el.innerHTML = goals.slice(0, 3).map(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
    return `
      <div class="dash-goal-item">
        <div class="dash-goal-header">
          <div class="dash-goal-name"><span>${g.emoji || '🎯'}</span> ${g.name}</div>
          <div class="dash-goal-pct">${pct}%</div>
        </div>
        <div class="dash-goal-progress-wrap"><div class="dash-goal-progress" style="width:${pct}%"></div></div>
        <div class="dash-goal-amounts"><span>${formatRp(g.current, true)}</span><span>${formatRp(g.target, true)}</span></div>
      </div>
    `;
  }).join('');
}

/* ==================== DASHBOARD RECURRING REMINDERS ==================== */
function renderDashRecurring() {
  const recurrings = DB.getRecurring();
  const el = document.getElementById('dashRecurringList');
  if (!el) return;
  const today = new Date();
  const currentDay = today.getDate();
  if (!recurrings.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Belum ada transaksi rutin.</div>';
    return;
  }
  const upcoming = recurrings.map(r => {
    let daysUntil = r.day - currentDay;
    if (daysUntil < 0) daysUntil += 30;
    return { ...r, daysUntil };
  }).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 4);

  el.innerHTML = upcoming.map(r => {
    const isOverdue = r.daysUntil === 0;
    const dotClass = isOverdue ? 'overdue' : 'upcoming';
    const dueLabel = isOverdue ? 'Hari ini!' : r.daysUntil === 1 ? 'Besok' : `${r.daysUntil} hari lagi`;
    return `
      <div class="dash-recurring-item">
        <div class="dash-recurring-left">
          <div class="dash-recurring-dot ${dotClass}"></div>
          <div class="dash-recurring-info">
            <div class="dash-recurring-name">${r.name}</div>
            <div class="dash-recurring-due">Tgl ${r.day} · ${dueLabel}</div>
          </div>
        </div>
        <div class="dash-recurring-right">
          <div class="dash-recurring-amount">${formatRp(r.amount, true)}</div>
          <button class="btn-primary btn-sm" onclick="recordRecurring('${r.id}')">Catat</button>
        </div>
      </div>
    `;
  }).join('');
}

function recordRecurring(id) {
  const recurrings = DB.getRecurring();
  const r = recurrings.find(x => x.id === id);
  if (!r) return;
  const wallets = DB.getWallets();
  const txs = DB.getTransactions();
  if (r.type === 'expense' && (wallets[r.wallet] || 0) < r.amount) { toast('Saldo tidak mencukupi', 'warning'); return; }
  if (r.type === 'expense') wallets[r.wallet] -= r.amount;
  else wallets[r.wallet] = (wallets[r.wallet] || 0) + r.amount;
  txs.push({ id: DB.generateId(), type: r.type, amount: r.amount, sourceWallet: r.wallet, destWallet: null, category: r.category || 'lainnya', note: r.name + ' (Rutin)', date: todayDateStr() });
  DB.saveWallets(wallets);
  DB.saveTransactions(txs);
  toast(`${r.name} dicatat ke transaksi`, 'success');
  renderDashboard();
}

/* ==================== DASHBOARD ==================== */
function renderDashboard() {
  const w = DB.getWallets();
  const s = DB.getSettings();
  const obs = DB.getObligations();
  const txs = DB.getTransactions();
  const totalBalance = Object.values(w).reduce((a, v) => a + (Number(v) || 0), 0);
  const { duitFree, unpaidObs } = computeDuitFree();

  document.getElementById('totalBalanceAmount').textContent = formatRp(totalBalance);
  document.getElementById('duitfreeAmount').textContent = formatRp(duitFree);

  const card = document.getElementById('duitfreeCard');
  if (duitFree < 0) {
    card.classList.add('minus');
    document.getElementById('duitfreeStatus').textContent = 'Peringatan: Keuangan Minus!';
    const nd = document.getElementById('notifDot');
    if (nd) nd.style.display = '';
  } else {
    card.classList.remove('minus');
    document.getElementById('duitfreeStatus').textContent = duitFree === 0 ? 'Pas-pasan' : 'Saldo Aman ✓';
    const nd = document.getElementById('notifDot');
    if (nd) nd.style.display = 'none';
  }

  // Wallet cards
  const wg = document.getElementById('walletsGrid');
  if (wg) {
    const meta = DB.getWalletMeta();
    wg.innerHTML = Object.keys(w).map(key => {
      const name = getWalletName(key);
      const m = meta[key] || {};
      const targetLabel = m.target ? `Target: ${formatRp(m.target, true)}` : 'Bebas dipakai';
      return `
        <div class="wallet-card">
          <div class="wallet-header">
            <div class="wallet-icon ${key}"><i class="fa-solid fa-wallet"></i></div>
            <span class="wallet-name">${name}</span>
          </div>
          <div class="wallet-amount">${formatRp(w[key])}</div>
          <div class="wallet-locked"><i class="fa-solid fa-lock"></i><span>${targetLabel}</span></div>
        </div>
      `;
    }).join('');
  }

  const wdLeft = document.getElementById('workdaysLeftDisplay');
  const dlDisp = document.getElementById('dailyLimitDisplay');
  if (wdLeft) wdLeft.textContent = s.workDaysLeft || 0;
  if (dlDisp) dlDisp.textContent = formatRp(s.dailyLimit || 0);

  const today = todayDateStr();
  const todaySpent = txs.filter(t => t.date === today && t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const rdq = document.getElementById('remainingDailyQuota');
  if (rdq) rdq.textContent = formatRp(Math.max(0, (s.dailyLimit || 0) - todaySpent));

  const bp = document.getElementById('burnoutPrediction');
  if (bp) bp.textContent = computeBurnoutPrediction() || 'Belum ada data';

  const totalWd = s.totalWorkdays || 22;
  const pct = totalWd > 0 ? Math.min(100, ((totalWd - (s.workDaysLeft || 0)) / totalWd) * 100) : 0;
  const wb = document.getElementById('workdaysBar');
  if (wb) wb.style.width = pct + '%';

  renderDonut(w, totalBalance);
  const ccv = document.getElementById('chartCenterVal');
  if (ccv) ccv.textContent = formatRp(totalBalance, true);

  renderDashboardBudgetBars();
  renderHealthScore();
  renderExpenseHeatmap();
  renderDashGoals();
  renderDashRecurring();

  // Obligations
  const obList = document.getElementById('obligationsList');
  if (obList) {
    if (!obs.length) {
      obList.innerHTML = '<div class="empty-state"><i class="fa-solid fa-check-circle"></i><p>Tidak ada kewajiban</p></div>';
    } else {
      obList.innerHTML = obs.map(o => `
        <div class="obligation-item ${o.isPaid ? 'paid' : ''}">
          <div class="obligation-left">
            <div class="obligation-checkbox ${o.isPaid ? 'checked' : ''}" onclick="toggleObligation('${o.id}')">
              ${o.isPaid ? '<i class="fa-solid fa-check" style="font-size:10px"></i>' : ''}
            </div>
            <span class="obligation-name">${o.name}</span>
          </div>
          <span class="obligation-amount">${formatRp(o.amount)}</span>
        </div>
      `).join('');
    }
  }
  const tou = document.getElementById('totalObligationsUnpaid');
  if (tou) tou.textContent = formatRp(unpaidObs);

  // Recent transactions
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const recentEl = document.getElementById('recentTransactions');
  if (recentEl) {
    if (!sorted.length) {
      recentEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-receipt"></i><p>Belum ada transaksi</p></div>';
    } else {
      recentEl.innerHTML = sorted.map(t => renderTxItem(t)).join('');
      recentEl.querySelectorAll('.tx-item').forEach(el => el.addEventListener('click', () => openEditModal(el.dataset.id)));
    }
  }

  const nameEl = document.querySelector('.welcome-heading');
  if (nameEl) nameEl.textContent = s.name ? `Hai, ${s.name} 👋` : 'Selamat Datang 👋';

  populateWalletSelects();
}

function populateWalletSelects() {
  const wallets = DB.getWallets();
  const keys = Object.keys(wallets);
  const optionHtml = keys.map(k => `<option value="${k}">${getWalletName(k)}</option>`).join('');
  ['txSourceWallet','txDestWallet','modalTxSourceWallet','modalTxDestWallet','editTxWallet','filterWallet','recurWallet'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = (id === 'filterWallet' ? '<option value="">Semua Dompet</option>' : '') + optionHtml;
    if (prev && [...el.options].some(o => o.value === prev)) el.value = prev;
  });
}

function renderDashboardBudgetBars() {
  const budgets = DB.getBudgets();
  const txs = DB.getTransactions();
  const currentMonth = getCurrentMonthKey();
  const el = document.getElementById('dashboardBudgetBars');
  if (!el) return;
  const entries = Object.entries(budgets);
  if (!entries.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Belum ada budget. Set di halaman Budget.</div>';
    return;
  }
  const monthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense');
  el.innerHTML = entries.map(([cat, limit]) => {
    const spent = monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0);
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const cls = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe';
    const icon = CAT_ICONS[cat] || 'fa-solid fa-circle-dot';
    return `
      <div class="db-budget-row">
        <div class="db-budget-label"><i class="${icon}" style="margin-right:4px"></i>${cat.charAt(0).toUpperCase()+cat.slice(1)}</div>
        <div class="db-budget-bar-wrap"><div class="db-budget-bar ${cls}" style="width:${pct}%"></div></div>
        <div class="db-budget-amounts">${formatRp(spent, true)} / ${formatRp(limit, true)}</div>
      </div>
    `;
  }).join('');
}

function renderDonut(w, total) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('walletDonutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const keys = Object.keys(w);
  const data = keys.map(k => Number(w[k] || 0));
  const labels = keys.map(k => getWalletName(k));
  const hasData = data.some(v => v > 0);
  const colorPool = ['rgba(43,110,246,0.85)','rgba(16,185,129,0.85)','rgba(139,92,246,0.85)','rgba(245,158,11,0.85)','rgba(251,113,133,0.85)'];
  const bg = hasData ? keys.map((_, i) => colorPool[i % colorPool.length]) : keys.map(() => 'rgba(255,255,255,0.05)');
  if (walletDonutChart) walletDonutChart.destroy();
  walletDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: hasData ? data : keys.map(() => 1), backgroundColor: bg, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.label}: ${formatRp(c.raw)}` } } }
    }
  });
}

function renderTxItem(t) {
  const catIcon = CAT_ICONS[t.category] || 'fa-solid fa-circle-dot';
  const walletLabel = getWalletName(t.sourceWallet);
  const destLabel = getWalletName(t.destWallet);
  const amountStr = t.type === 'expense' ? '-' + formatRp(t.amount) : t.type === 'income' ? '+' + formatRp(t.amount) : '→ ' + formatRp(t.amount);
  const sub = t.note ? t.note : (t.type === 'transfer' ? `${walletLabel} → ${destLabel}` : walletLabel);
  const tagsHtml = (t.tags && t.tags.length) ? `<div class="tx-tags">${t.tags.map(tg => `<span class="tx-tag">${tg}</span>`).join('')}</div>` : '';
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon ${t.type}"><i class="${catIcon}"></i></div>
      <div class="tx-meta">
        <div class="tx-title">${t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : t.type === 'transfer' ? 'Transfer' : 'Transaksi'}</div>
        <div class="tx-sub">${sub} · ${formatDate(t.date)}</div>
        ${tagsHtml}
      </div>
      <div class="tx-amount ${t.type}">${amountStr}</div>
    </div>
  `;
}

function toggleObligation(id) {
  const obs = DB.getObligations();
  const ob = obs.find(o => o.id === id);
  if (!ob) return;
  ob.isPaid = !ob.isPaid;
  DB.saveObligations(obs);
  renderDashboard();
  toast(ob.isPaid ? `${ob.name} ditandai lunas` : `${ob.name} dibatalkan`, ob.isPaid ? 'success' : 'info');
}

/* ==================== WALLETS ==================== */
function renderWalletSettings() {
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const list = document.getElementById('walletsSettingsList');
  if (!list) return;
  const keys = Object.keys(wallets);
  if (!keys.length) { list.innerHTML = '<div class="empty-state">Belum ada dompet.</div>'; return; }
  list.innerHTML = keys.map(k => {
    const m = meta[k] || {};
    const name = m.name || (k === 'cash' ? 'Cash' : k.toUpperCase());
    const type = m.type || 'cash';
    const target = m.target ? m.target : '';
    return `
      <div class="wallet-settings-row" data-wallet="${k}" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
        <input class="form-input wallet-name-input" data-wallet="${k}" value="${name}" style="min-width:90px;flex:1" />
        <select class="form-input wallet-type-select" data-wallet="${k}" style="min-width:90px;flex:0.7">
          <option value="bank" ${type==='bank'?'selected':''}>Bank</option>
          <option value="cash" ${type==='cash'?'selected':''}>Cash</option>
          <option value="ewallet" ${type==='ewallet'?'selected':''}>E-Wallet</option>
        </select>
        <div class="amount-input-wrap" style="flex:1;min-width:100px"><span class="currency-prefix">Rp</span><input class="form-input amount-input wallet-balance-input" data-wallet="${k}" value="${Number(wallets[k]||0).toLocaleString('id-ID')}" /></div>
        <input class="form-input wallet-target-input" data-wallet="${k}" placeholder="Target lock" value="${target ? Number(target).toLocaleString('id-ID') : ''}" style="min-width:80px;flex:0.7" />
        <button class="btn-icon-sm wallet-delete-btn" data-wallet="${k}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }).join('');
  list.querySelectorAll('.wallet-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Hapus Dompet', `Hapus dompet "${btn.dataset.wallet}"?`, () => deleteWallet(btn.dataset.wallet));
    });
  });
  list.querySelectorAll('.amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));
}

function deleteWallet(key) {
  const wallets = DB.getWallets(); delete wallets[key];
  const meta = DB.getWalletMeta(); delete meta[key];
  DB.saveWallets(wallets); DB.saveWalletMeta(meta);
  renderWalletSettings(); renderDashboard();
  toast('Dompet dihapus', 'info');
}

function addWalletFromForm() {
  const nameEl = document.getElementById('newWalletName');
  const typeEl = document.getElementById('newWalletType');
  const balEl = document.getElementById('newWalletBalance');
  if (!nameEl) return;
  const name = nameEl.value.trim();
  if (!name) { toast('Masukkan nama dompet', 'error'); return; }
  const key = slugify(name);
  const wallets = DB.getWallets();
  if (wallets[key] !== undefined) { toast('Nama dompet sudah ada', 'warning'); return; }
  wallets[key] = parseRpInput(balEl?.value || '0');
  const meta = DB.getWalletMeta();
  meta[key] = { name, type: typeEl?.value || 'cash', target: 0 };
  DB.saveWallets(wallets); DB.saveWalletMeta(meta);
  if (nameEl) nameEl.value = '';
  if (balEl) balEl.value = '';
  renderWalletSettings(); renderDashboard();
  toast(`Dompet "${name}" ditambahkan`, 'success');
}

/* ==================== TRANSACTIONS ==================== */
let currentTxType = 'expense', currentTxCategory = '';
let modalTxType = 'expense', modalTxCategory = '';

function buildCategoryGrid(containerId, type, selectedCat, onSelect) {
  const cats = CATEGORIES[type] || [];
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = cats.map(c => `
    <button type="button" class="category-chip ${selectedCat === c.id ? 'selected' : ''}" data-cat="${c.id}">
      <i class="${c.icon}"></i>${c.label}
    </button>
  `).join('');
  el.querySelectorAll('.category-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.category-chip').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(btn.dataset.cat);
    });
  });
}

function setTxType(type, context) {
  if (context === 'modal') { modalTxType = type; modalTxCategory = ''; }
  else { currentTxType = type; currentTxCategory = ''; }
  const isModal = context === 'modal';
  document.getElementById(isModal ? 'modalDestGroup' : 'destWalletGroup').style.display = type === 'transfer' ? '' : 'none';
  document.getElementById(isModal ? 'modalCategoryGroup' : 'categoryGroup').style.display = type === 'transfer' ? 'none' : '';
  document.getElementById(isModal ? 'modalSourceLabel' : 'sourceWalletLabel').textContent = type === 'transfer' ? 'Dari Dompet' : 'Dompet';
  const stg = document.getElementById('saveTemplateGroup');
  if (!isModal && stg) stg.style.display = type === 'transfer' ? 'none' : '';
  if (type !== 'transfer') {
    buildCategoryGrid(isModal ? 'modalCategoryGrid' : 'categoryGrid', type, '', cat => {
      if (context === 'modal') modalTxCategory = cat;
      else currentTxCategory = cat;
    });
  }
}

function parseTags(tagStr) {
  return (tagStr || '').split(/\s+/).filter(t => t.startsWith('#')).map(t => t.toLowerCase());
}

function submitTransaction(type, dateId, amountId, srcWalletId, destWalletId, noteId, catGetter, tagsId) {
  const amount = parseRpInput(document.getElementById(amountId)?.value);
  const date = document.getElementById(dateId)?.value;
  const sourceWallet = document.getElementById(srcWalletId)?.value;
  const note = document.getElementById(noteId)?.value.trim() || '';
  const category = catGetter();
  const tags = tagsId ? parseTags(document.getElementById(tagsId)?.value || '') : [];

  if (!amount || amount <= 0) { toast('Masukkan nominal yang valid', 'error'); return false; }
  if (!date) { toast('Pilih tanggal', 'error'); return false; }
  if (type !== 'transfer' && !category) { toast('Pilih kategori', 'warning'); return false; }

  const wallets = DB.getWallets();
  const txs = DB.getTransactions();

  if (type === 'expense') {
    if ((wallets[sourceWallet] || 0) < amount) { toast('Saldo tidak mencukupi', 'warning'); return false; }
    wallets[sourceWallet] -= amount;
  } else if (type === 'income') {
    wallets[sourceWallet] = (wallets[sourceWallet] || 0) + amount;
  } else if (type === 'transfer') {
    const destWallet = document.getElementById(destWalletId)?.value;
    if (sourceWallet === destWallet) { toast('Dompet asal dan tujuan sama', 'error'); return false; }
    if ((wallets[sourceWallet] || 0) < amount) { toast('Saldo tidak mencukupi', 'warning'); return false; }
    wallets[sourceWallet] -= amount;
    wallets[destWallet] = (wallets[destWallet] || 0) + amount;
    txs.push({ id: DB.generateId(), type, amount, sourceWallet, destWallet, category: 'transfer', note, date, tags });
    DB.saveWallets(wallets); DB.saveTransactions(txs);
    return true;
  }
  txs.push({ id: DB.generateId(), type, amount, sourceWallet, destWallet: null, category, note, date, tags });
  DB.saveWallets(wallets); DB.saveTransactions(txs);
  checkBudgetAlert(category, amount);
  return true;
}

function checkBudgetAlert(category, amount) {
  const budgets = DB.getBudgets();
  if (!budgets[category]) return;
  const txs = DB.getTransactions();
  const cm = getCurrentMonthKey();
  const spent = txs.filter(t => getMonthKey(t.date) === cm && t.type === 'expense' && t.category === category).reduce((a, t) => a + t.amount, 0);
  const limit = budgets[category];
  const pct = (spent / limit) * 100;
  if (pct >= 100) setTimeout(() => toast(`Budget ${category} habis!`, 'error'), 600);
  else if (pct >= 80) setTimeout(() => toast(`Budget ${category} tersisa ${Math.round(100-pct)}%`, 'warning'), 600);
}

/* ==================== MULTI-CURRENCY ==================== */
function updateCurrencyConvert() {
  const currency = document.getElementById('txCurrency')?.value || 'IDR';
  const amountRaw = parseRpInput(document.getElementById('txAmount')?.value);
  const rate = EXCHANGE_RATES[currency] || 1;
  const converted = amountRaw * rate;
  const el = document.getElementById('txConvertedAmount');
  if (el) el.value = converted > 0 ? converted.toLocaleString('id-ID') : '';
}

/* ==================== EDIT MODAL ==================== */
function openEditModal(id) {
  const txs = DB.getTransactions();
  const tx = txs.find(t => t.id === id);
  if (!tx) return;
  document.getElementById('editTxId').value = id;
  document.getElementById('editTxAmount').value = tx.amount.toLocaleString('id-ID');
  document.getElementById('editTxDate').value = tx.date;
  const ewSel = document.getElementById('editTxWallet');
  if (ewSel) { populateWalletSelects(); setTimeout(() => { ewSel.value = tx.sourceWallet; }, 10); }
  document.getElementById('editTxNote').value = tx.note || '';
  showModal('editModal');
}

/* ==================== HISTORY ==================== */
function renderHistory() {
  const txs = DB.getTransactions();
  const filterMonth = document.getElementById('filterMonth')?.value || '';
  const filterWallet = document.getElementById('filterWallet')?.value || '';
  const filterType = document.getElementById('filterType')?.value || '';
  const filterCat = document.getElementById('filterCat')?.value || '';
  const searchQ = (document.getElementById('searchQuery')?.value || '').toLowerCase().trim();

  let filtered = txs.filter(t => {
    if (filterMonth && getMonthKey(t.date) !== filterMonth) return false;
    if (filterWallet && t.sourceWallet !== filterWallet) return false;
    if (filterType && t.type !== filterType) return false;
    if (filterCat && t.category !== filterCat) return false;
    if (searchQ) {
      const noteMatch = (t.note || '').toLowerCase().includes(searchQ);
      const tagMatch = (t.tags || []).some(tg => tg.includes(searchQ));
      const amountMatch = t.amount.toString().includes(searchQ.replace(/\D/g, ''));
      const catMatch = (t.category || '').includes(searchQ);
      if (!noteMatch && !tagMatch && !amountMatch && !catMatch) return false;
    }
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalIn = filtered.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const net = totalIn - totalOut;

  const hs = document.getElementById('historyStats');
  if (hs) hs.innerHTML = `
    <div class="stat-chip"><div class="stat-chip-label">Pemasukan</div><div class="stat-chip-value green">${formatRp(totalIn, true)}</div></div>
    <div class="stat-chip"><div class="stat-chip-label">Pengeluaran</div><div class="stat-chip-value red">${formatRp(totalOut, true)}</div></div>
    <div class="stat-chip"><div class="stat-chip-label">Selisih</div><div class="stat-chip-value ${net >= 0 ? 'green' : 'red'}">${net >= 0 ? '+' : ''}${formatRp(net, true)}</div></div>
  `;

  const listEl = document.getElementById('historyList');
  if (!listEl) return;
  if (!filtered.length) { listEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Tidak ada transaksi</p></div>'; return; }

  const grouped = {};
  filtered.forEach(t => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });

  listEl.innerHTML = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(dateKey => {
    const items = grouped[dateKey];
    const dayTotal = items.reduce((a, t) => t.type === 'income' ? a + t.amount : t.type === 'expense' ? a - t.amount : a, 0);
    return `
      <div class="history-date-group">
        <div class="history-date-header">${formatDateGroup(dateKey)}<span style="float:right;color:${dayTotal >= 0 ? 'var(--green)' : 'var(--red)'}">${dayTotal >= 0 ? '+' : ''}${formatRp(dayTotal, true)}</span></div>
        ${items.map(t => {
          const catIcon = CAT_ICONS[t.category] || 'fa-solid fa-circle-dot';
          const wl = getWalletName(t.sourceWallet);
          const dl = getWalletName(t.destWallet);
          const amountStr = t.type === 'expense' ? '-' + formatRp(t.amount) : t.type === 'income' ? '+' + formatRp(t.amount) : '→ ' + formatRp(t.amount);
          const sub = t.note ? t.note : (t.type === 'transfer' ? `${wl} → ${dl}` : wl);
          const tagsHtml = (t.tags && t.tags.length) ? `<div class="tx-tags">${t.tags.map(tg => `<span class="tx-tag">${tg}</span>`).join('')}</div>` : '';
          return `
            <div class="history-tx-item" data-id="${t.id}">
              <div class="tx-icon ${t.type}"><i class="${catIcon}"></i></div>
              <div class="tx-meta">
                <div class="tx-title">${t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'Transfer'}</div>
                <div class="tx-sub">${sub} · <span class="badge">${wl}</span></div>
                ${tagsHtml}
              </div>
              <div class="tx-amount ${t.type}">${amountStr}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.history-tx-item').forEach(el => el.addEventListener('click', () => openEditModal(el.dataset.id)));
}

function populateMonthFilter() {
  const txs = DB.getTransactions();
  const months = [...new Set(txs.map(t => getMonthKey(t.date)))].sort((a, b) => b.localeCompare(a));
  const currentMonth = getCurrentMonthKey();
  const el = document.getElementById('filterMonth');
  if (!el) return;
  el.innerHTML = `<option value="${currentMonth}">${formatMonthLabel(currentMonth)}</option>` +
    months.filter(m => m !== currentMonth).map(m => `<option value="${m}">${formatMonthLabel(m)}</option>`).join('');
}

function populateCatFilter() {
  const el = document.getElementById('filterCat');
  if (!el) return;
  el.innerHTML = '<option value="">Semua Kategori</option>' +
    CATEGORIES.expense.map(c => `<option value="${c.id}">${c.label}</option>`).join('') +
    CATEGORIES.income.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

/* ==================== CALENDAR ==================== */
let calendarDate = new Date(), selectedCalDay = null;

function renderCalendar() {
  const txs = DB.getTransactions();
  const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
  const calLabel = document.getElementById('calMonthLabel');
  if (calLabel) calLabel.textContent = new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const days = daysInMonth(year, month);
  const today = todayDateStr();
  const txByDay = {};
  txs.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (!txByDay[t.date]) txByDay[t.date] = [];
      txByDay[t.date].push(t);
    }
  });
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  const hdr = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => `<div class="cal-day-header">${d}</div>`).join('');
  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += `<div class="cal-day other-month"><div class="cal-day-num">${new Date(year,month,-firstDay+i+1).getDate()}</div></div>`;
  for (let d = 1; d <= days; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dt = txByDay[ds] || [];
    const totalOut = dt.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    let dots = dt.some(t => t.type === 'expense') ? '<div class="cal-dot expense"></div>' : '';
    dots += dt.some(t => t.type === 'income') ? '<div class="cal-dot income"></div>' : '';
    dots += dt.some(t => t.type === 'transfer') ? '<div class="cal-dot transfer"></div>' : '';
    cells += `<div class="cal-day ${ds === today ? 'today' : ''} ${ds === selectedCalDay ? 'selected' : ''}" data-date="${ds}">
      <div class="cal-day-num">${d}</div>
      ${dots ? `<div class="cal-day-dots">${dots}</div>` : ''}
      ${totalOut > 0 ? `<div class="cal-day-amount">${formatRp(totalOut, true)}</div>` : ''}
    </div>`;
  }
  grid.innerHTML = hdr + cells;
  grid.querySelectorAll('.cal-day:not(.other-month)').forEach(el => {
    el.addEventListener('click', () => { selectedCalDay = el.dataset.date; renderCalendar(); showCalDayDetail(el.dataset.date, txByDay[el.dataset.date] || []); });
  });
  if (selectedCalDay) {
    const sm = new Date(selectedCalDay + 'T00:00:00').getMonth();
    if (sm === month) showCalDayDetail(selectedCalDay, txByDay[selectedCalDay] || []);
  }
}

function showCalDayDetail(dateStr, dayTxs) {
  const el = document.getElementById('calDayDetail');
  if (!el) return;
  if (!dayTxs.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Tidak ada transaksi</p></div>'; return; }
  el.innerHTML = dayTxs.map(t => renderTxItem(t)).join('');
  el.querySelectorAll('.tx-item').forEach(item => item.addEventListener('click', () => openEditModal(item.dataset.id)));
}

/* ==================== BUDGET ==================== */
function renderBudgetPage() {
  const budgets = DB.getBudgets();
  const txs = DB.getTransactions();
  const cm = getCurrentMonthKey();
  const monthTxs = txs.filter(t => getMonthKey(t.date) === cm && t.type === 'expense');
  const el = document.getElementById('budgetList');
  const entries = Object.entries(budgets);
  if (el) {
    if (!entries.length) {
      el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bullseye"></i><p>Belum ada budget.</p></div>';
    } else {
      el.innerHTML = entries.map(([cat, limit]) => {
        const spent = monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0);
        const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        const cls = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe';
        return `
          <div class="budget-item">
            <div class="budget-item-header">
              <div class="budget-item-left">
                <div class="budget-item-icon"><i class="${CAT_ICONS[cat] || 'fa-solid fa-circle-dot'}"></i></div>
                <div>
                  <div class="budget-item-name">${cat.charAt(0).toUpperCase()+cat.slice(1)}</div>
                  <div class="budget-item-amounts">${formatRp(spent, true)} dari ${formatRp(limit, true)}</div>
                </div>
              </div>
              <div class="budget-item-right">
                <div class="budget-pct" style="color:var(--${cls === 'danger' ? 'red' : cls === 'warning' ? 'yellow' : 'green'})">${Math.round(pct)}%</div>
                <button class="btn-icon-sm" onclick="deleteBudget('${cat}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <div class="budget-progress-wrap"><div class="budget-progress ${cls}" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('');
    }
  }
  const bcs = document.getElementById('budgetCatSelect');
  if (bcs) bcs.innerHTML = CATEGORIES.expense.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
  renderBudgetChart(budgets, monthTxs);
}

function deleteBudget(cat) {
  const b = DB.getBudgets(); delete b[cat]; DB.saveBudgets(b);
  renderBudgetPage(); toast(`Budget ${cat} dihapus`, 'success');
}

function renderBudgetChart(budgets, monthTxs) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('budgetChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const entries = Object.entries(budgets);
  if (!entries.length) return;
  const labels = entries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1));
  const spentData = entries.map(([cat]) => monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0));
  const limitData = entries.map(([, limit]) => limit);
  if (budgetChart) budgetChart.destroy();
  budgetChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Terpakai', data: spentData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
      { label: 'Budget', data: limitData, backgroundColor: 'rgba(99,102,241,0.3)', borderRadius: 6 }
    ]},
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8b8fa8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8b8fa8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8b8fa8', font: { size: 11 }, callback: v => formatRp(v, true) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

/* ==================== GOALS ==================== */
function renderGoalsPage() {
  const goals = DB.getGoals();
  const el = document.getElementById('goalsList');
  if (!el) return;
  if (!goals.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-trophy"></i><p>Belum ada target tabungan.</p></div>'; return; }
  el.innerHTML = goals.map(g => {
    const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
    let etaText = '';
    if (g.deadline) {
      const daysLeft = daysBetween(todayDateStr(), g.deadline);
      const remaining = g.target - g.current;
      if (daysLeft > 0 && remaining > 0) {
        const perDay = remaining / daysLeft;
        etaText = `Perlu menabung ${formatRp(Math.ceil(perDay), true)}/hari`;
      } else if (remaining <= 0) etaText = '🎉 Target tercapai!';
      else etaText = 'Deadline terlewat';
    }
    return `
      <div class="goal-item">
        <div class="goal-delete"><button class="btn-icon-sm" onclick="deleteGoal('${g.id}')"><i class="fa-solid fa-trash"></i></button></div>
        <div class="goal-item-header">
          <div class="goal-emoji">${g.emoji || '🎯'}</div>
          <div class="goal-info">
            <div class="goal-name">${g.name}</div>
            <div class="goal-meta">${g.deadline ? `Deadline: ${formatDate(g.deadline)}` : 'Tanpa deadline'} ${etaText ? '· ' + etaText : ''}</div>
          </div>
        </div>
        <div class="goal-amounts"><span>Terkumpul: <strong>${formatRp(g.current, true)}</strong></span><span>Target: ${formatRp(g.target, true)}</span></div>
        <div class="goal-progress-wrap"><div class="goal-progress" style="width:${pct}%"></div></div>
        <div class="goal-status">${pct}% tercapai ${pct >= 100 ? '🎉' : ''}</div>
        <div class="goal-topup-row">
          <div class="amount-input-wrap" style="flex:1"><span class="currency-prefix">Rp</span><input class="form-input amount-input goal-topup-input" id="topup_${g.id}" placeholder="Tambah tabungan..." inputmode="numeric" /></div>
          <button class="btn-primary btn-sm" onclick="topupGoal('${g.id}')">Tambah</button>
        </div>
      </div>
    `;
  }).join('');
  document.querySelectorAll('.goal-topup-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));
}

function deleteGoal(id) {
  showConfirm('Hapus Goal', 'Yakin hapus target ini?', () => {
    DB.saveGoals(DB.getGoals().filter(g => g.id !== id));
    renderGoalsPage(); renderDashGoals(); toast('Goal dihapus', 'success');
  });
}

function topupGoal(id) {
  const inp = document.getElementById('topup_' + id);
  const amount = parseRpInput(inp?.value || '');
  if (!amount || amount <= 0) { toast('Masukkan nominal', 'error'); return; }
  const goals = DB.getGoals();
  const g = goals.find(x => x.id === id);
  if (!g) return;
  g.current = (g.current || 0) + amount;
  DB.saveGoals(goals);
  if (inp) inp.value = '';
  renderGoalsPage(); renderDashGoals();
  toast(`+${formatRp(amount, true)} ke "${g.name}"`, 'success');
  if (g.current >= g.target) setTimeout(() => toast(`🎉 Target "${g.name}" tercapai!`, 'success'), 500);
}

/* ==================== RECURRING ==================== */
function renderRecurringPage() {
  const recurrings = DB.getRecurring();
  const el = document.getElementById('recurringList');
  if (!el) return;
  if (!recurrings.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-rotate"></i><p>Belum ada transaksi rutin.</p></div>'; return; }
  el.innerHTML = recurrings.map(r => `
    <div class="recurring-item">
      <div class="recurring-left">
        <div class="recurring-icon ${r.type}"><i class="${CAT_ICONS[r.category] || 'fa-solid fa-rotate'}"></i></div>
        <div>
          <div class="recurring-name">${r.name}</div>
          <div class="recurring-meta">Tgl ${r.day} · ${getWalletName(r.wallet)} · ${r.category || '-'}</div>
        </div>
      </div>
      <div class="recurring-right">
        <div class="recurring-amount ${r.type}">${r.type === 'expense' ? '-' : '+'}${formatRp(r.amount, true)}</div>
        <div class="recurring-actions">
          <button class="btn-primary btn-sm" onclick="recordRecurring('${r.id}')"><i class="fa-solid fa-check"></i>Catat</button>
          <button class="btn-icon-sm" onclick="deleteRecurring('${r.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function deleteRecurring(id) {
  showConfirm('Hapus Rutin', 'Hapus transaksi rutin ini?', () => {
    DB.saveRecurring(DB.getRecurring().filter(r => r.id !== id));
    renderRecurringPage(); toast('Transaksi rutin dihapus', 'success');
  });
}

function populateRecurringSelects() {
  const rcat = document.getElementById('recurCategory');
  if (rcat) rcat.innerHTML = CATEGORIES.expense.map(c => `<option value="${c.id}">${c.label}</option>`).join('') + CATEGORIES.income.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
}

/* ==================== NET WORTH ==================== */
function computeNetWorth() {
  const wallets = DB.getWallets();
  const extraAssets = DB.getNWAssets();
  const debts = DB.getNWDebts();
  const walletTotal = Object.values(wallets).reduce((a, v) => a + (Number(v) || 0), 0);
  const extraTotal = extraAssets.reduce((a, x) => a + (Number(x.value) || 0), 0);
  const totalAsset = walletTotal + extraTotal;
  const totalDebt = debts.reduce((a, d) => a + (Number(d.value) || 0), 0);
  return { totalAsset, totalDebt, netWorth: totalAsset - totalDebt };
}

function renderNetWorthPage() {
  const { totalAsset, totalDebt, netWorth } = computeNetWorth();
  const ta = document.getElementById('nwTotalAsset');
  const td = document.getElementById('nwTotalDebt');
  const nw = document.getElementById('nwNetWorth');
  const ns = document.getElementById('nwStatus');
  if (ta) ta.textContent = formatRp(totalAsset);
  if (td) td.textContent = formatRp(totalDebt);
  if (nw) nw.textContent = formatRp(netWorth);
  if (ns) ns.textContent = netWorth >= 0 ? 'Net Worth Positif ✓' : 'Net Worth Negatif ⚠️';

  const assets = DB.getNWAssets();
  const debts = DB.getNWDebts();
  const wallets = DB.getWallets();
  const walletTotal = Object.values(wallets).reduce((a, v) => a + (Number(v) || 0), 0);

  const assetList = document.getElementById('nwAssetList');
  if (assetList) {
    let html = `<div class="nw-list-item"><div class="nw-list-item-name">💳 Semua Dompet</div><div class="nw-list-item-amount" style="color:var(--green)">${formatRp(walletTotal, true)}</div></div>`;
    assets.forEach(a => {
      html += `<div class="nw-list-item">
        <div class="nw-list-item-name">${a.name}</div>
        <div class="nw-list-item-amount" style="color:var(--green)">${formatRp(a.value, true)}</div>
        <button class="btn-icon-sm" onclick="deleteNWItem('asset','${a.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    });
    assetList.innerHTML = html || '<div style="font-size:12px;color:var(--text-muted)">Belum ada aset tambahan</div>';
  }

  const debtList = document.getElementById('nwDebtList');
  if (debtList) {
    if (!debts.length) { debtList.innerHTML = '<div style="font-size:12px;color:var(--text-muted)">Belum ada hutang</div>'; }
    else {
      debtList.innerHTML = debts.map(d => `
        <div class="nw-list-item">
          <div class="nw-list-item-name">${d.name}</div>
          <div class="nw-list-item-amount" style="color:var(--red)">${formatRp(d.value, true)}</div>
          <button class="btn-icon-sm" onclick="deleteNWItem('debt','${d.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('');
    }
  }

  renderNWChart();
}

function deleteNWItem(type, id) {
  if (type === 'asset') DB.saveNWAssets(DB.getNWAssets().filter(a => a.id !== id));
  else DB.saveNWDebts(DB.getNWDebts().filter(d => d.id !== id));
  saveNWSnapshot(); renderNetWorthPage();
}

function saveNWSnapshot() {
  const { netWorth } = computeNetWorth();
  const history = DB.getNWHistory();
  const today = todayDateStr().slice(0, 7);
  const existing = history.findIndex(h => h.month === today);
  if (existing >= 0) history[existing].value = netWorth;
  else history.push({ month: today, value: netWorth });
  history.sort((a, b) => a.month.localeCompare(b.month));
  DB.saveNWHistory(history.slice(-12));
}

function renderNWChart() {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('networthChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const history = DB.getNWHistory();
  if (networthChartInst) networthChartInst.destroy();
  networthChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => formatMonthLabel(h.month)),
      datasets: [{
        label: 'Net Worth',
        data: history.map(h => h.value),
        borderColor: 'rgba(43,110,246,0.9)',
        backgroundColor: 'rgba(43,110,246,0.1)',
        fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: 'rgba(43,110,246,0.9)'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b8fa8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8b8fa8', font: { size: 10 }, callback: v => formatRp(v, true) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

/* ==================== SPLIT BILL ==================== */
let splitPersons = [];
function renderSplitPersonList() {
  const el = document.getElementById('splitPersonList');
  if (!el) return;
  el.innerHTML = splitPersons.map((p, i) => `
    <div class="split-person-item">
      <div class="split-person-name">${p}</div>
      <button class="btn-icon-sm" onclick="removeSplitPerson(${i})"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('') || '<div style="font-size:12px;color:var(--text-muted);padding:8px">Tambahkan peserta di bawah</div>';
}
function removeSplitPerson(i) { splitPersons.splice(i, 1); renderSplitPersonList(); }
function calculateSplit() {
  const totalEl = document.getElementById('splitTotal');
  const discountEl = document.getElementById('splitDiscount');
  const taxEl = document.getElementById('splitTax');
  const total = parseRpInput(totalEl?.value || '0');
  const discount = parseRpInput(discountEl?.value || '0');
  const taxPct = parseFloat(taxEl?.value || '0') || 0;
  if (!total || !splitPersons.length) { toast('Isi total dan peserta', 'warning'); return; }
  const afterDiscount = total - discount;
  const afterTax = afterDiscount * (1 + taxPct / 100);
  const perPerson = afterTax / splitPersons.length;
  const res = document.getElementById('splitResult');
  if (!res) return;
  res.style.display = '';
  res.innerHTML = `
    <div class="split-result-card">
      <div class="split-result-header">
        <div style="font-weight:700;font-size:15px">${document.getElementById('splitTitle')?.value || 'Split Bill'}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Total: ${formatRp(total)} - Diskon: ${formatRp(discount)} + Pajak ${taxPct}% = <strong>${formatRp(afterTax)}</strong></div>
      </div>
      ${splitPersons.map(p => `
        <div class="split-result-item">
          <div class="split-result-name">${p}</div>
          <div class="split-result-amount">${formatRp(Math.ceil(perPerson))}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ==================== CICILAN ==================== */
let cicilanChart = null;
function hitungCicilan() {
  const pokok = parseRpInput(document.getElementById('cicilanPokok')?.value);
  const dp = parseRpInput(document.getElementById('cicilanDP')?.value);
  const bungaPersen = parseFloat(document.getElementById('cicilanBunga')?.value) || 0;
  const tenor = parseInt(document.getElementById('cicilanTenor')?.value) || 0;
  const tipe = document.getElementById('cicilanTipe')?.value || 'flat';
  if (!pokok || !tenor) { toast('Masukkan data lengkap', 'error'); return; }
  const pinjaman = pokok - dp;
  if (pinjaman <= 0) { toast('DP melebihi harga', 'error'); return; }
  const bungaBulan = (bungaPersen / 100) / 12;
  let rows = [], cicilanPerBulan;
  if (tipe === 'flat') {
    const bpb = pinjaman * (bungaPersen / 100) / 12;
    const ppb = pinjaman / tenor;
    cicilanPerBulan = ppb + bpb;
    let sisa = pinjaman;
    for (let i = 1; i <= tenor; i++) { sisa -= ppb; rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok: ppb, bunga: bpb, sisa: Math.max(0, sisa) }); }
  } else {
    if (bungaBulan === 0) {
      cicilanPerBulan = pinjaman / tenor;
      let sisa = pinjaman;
      for (let i = 1; i <= tenor; i++) { sisa -= cicilanPerBulan; rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok: cicilanPerBulan, bunga: 0, sisa: Math.max(0, sisa) }); }
    } else {
      cicilanPerBulan = pinjaman * (bungaBulan * Math.pow(1 + bungaBulan, tenor)) / (Math.pow(1 + bungaBulan, tenor) - 1);
      let sisa = pinjaman;
      for (let i = 1; i <= tenor; i++) {
        const bunga = sisa * bungaBulan, pokok = cicilanPerBulan - bunga;
        sisa -= pokok;
        rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok, bunga, sisa: Math.max(0, sisa) });
      }
    }
  }
  const totalBayar = cicilanPerBulan * tenor + dp;
  const cpb = document.getElementById('cicilanPerBulan');
  const ct = document.getElementById('cicilanTotal');
  if (cpb) cpb.textContent = formatRp(cicilanPerBulan);
  if (ct) ct.textContent = formatRp(totalBayar);
  const tbody = document.querySelector('#amortizationTable tbody');
  if (tbody) tbody.innerHTML = rows.map(r => `<tr><td>${r.bulan}</td><td>${formatRp(r.angsuran, true)}</td><td>${formatRp(r.pokok, true)}</td><td>${formatRp(r.bunga, true)}</td><td>${formatRp(r.sisa, true)}</td></tr>`).join('');
  renderCicilanChart(rows);
  const cr = document.getElementById('cicilanResult');
  if (cr) cr.style.display = '';
}

function renderCicilanChart(rows) {
  if (typeof Chart === 'undefined') return;
  const canvas = document.getElementById('cicilanChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (cicilanChart) cicilanChart.destroy();
  cicilanChart = new Chart(ctx, {
    type: 'line',
    data: { labels: rows.map(r => `Bln ${r.bulan}`), datasets: [{ label: 'Sisa Hutang', data: rows.map(r => r.sisa), borderColor: 'rgba(99,102,241,0.9)', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8b8fa8', font: { size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8b8fa8', font: { size: 10 }, callback: v => formatRp(v, true) }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
  });
}

/* ==================== TEMPLATES ==================== */
function renderQuickTemplateBar() {
  const templates = DB.getTemplates();
  const el = document.getElementById('quickTemplateBar');
  if (!el) return;
  if (!templates.length) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = templates.map(t => `<div class="template-chip" data-id="${t.id}"><i class="${CAT_ICONS[t.category] || 'fa-solid fa-circle-dot'}"></i>${t.name}</div>`).join('');
  el.querySelectorAll('.template-chip').forEach(chip => chip.addEventListener('click', () => applyTemplate(chip.dataset.id)));
}

function applyTemplate(id) {
  const tpl = DB.getTemplates().find(t => t.id === id);
  if (!tpl) return;
  const amt = document.getElementById('txAmount');
  if (amt) amt.value = tpl.amount.toLocaleString('id-ID');
  const dt = document.getElementById('txDate');
  if (dt) dt.value = todayDateStr();
  const sw = document.getElementById('txSourceWallet');
  if (sw) { const keys = Object.keys(DB.getWallets()); sw.value = keys.includes(tpl.wallet) ? tpl.wallet : keys[0] || ''; }
  const note = document.getElementById('txNote');
  if (note) note.value = tpl.note || '';
  document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === tpl.type));
  setTxType(tpl.type, 'page');
  currentTxCategory = tpl.category;
  setTimeout(() => {
    document.querySelectorAll('#categoryGrid .category-chip').forEach(c => c.classList.toggle('selected', c.dataset.cat === tpl.category));
  }, 50);
  toast(`Template "${tpl.name}" diterapkan`, 'success');
}

function renderTemplateModal() {
  const templates = DB.getTemplates();
  const el = document.getElementById('templateList');
  if (!el) return;
  if (!templates.length) { el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bolt"></i><p>Belum ada template.</p></div>'; return; }
  el.innerHTML = templates.map(t => `
    <div class="template-list-item" data-id="${t.id}">
      <div class="template-list-item-left">
        <div class="template-list-item-name"><i class="${CAT_ICONS[t.category] || 'fa-solid fa-circle-dot'}" style="margin-right:6px"></i>${t.name}</div>
        <div class="template-list-item-meta">${t.category} · ${getWalletName(t.wallet)} · ${t.type}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="template-list-item-amount">${formatRp(t.amount, true)}</div>
        <button class="btn-icon-sm" onclick="deleteTemplate('${t.id}');event.stopPropagation()"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('.template-list-item').forEach(item => {
    item.addEventListener('click', () => { applyTemplate(item.dataset.id); hideModal('templateModal'); navigateTo('transactions'); });
  });
}

function deleteTemplate(id) {
  DB.saveTemplates(DB.getTemplates().filter(t => t.id !== id));
  renderTemplateModal(); renderQuickTemplateBar();
  toast('Template dihapus', 'success');
}

/* ==================== AI INSIGHT ==================== */
async function callAI(prompt, data) {
  try {
    const res = await fetch(DEFAULT_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ai_insight', prompt, data }),
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('Request gagal: ' + res.statusText);
    const json = await res.json();
    return json.result || 'Tidak ada respons dari AI';
  } catch (e) { toast('Error AI: ' + e.message, 'error'); throw e; }
}

function buildAIData() {
  const txs = DB.getTransactions();
  const wallets = DB.getWallets();
  const settings = DB.getSettings();
  const obligations = DB.getObligations();
  const budgets = DB.getBudgets();
  const goals = DB.getGoals();
  const { duitFree } = computeDuitFree();
  const cm = getCurrentMonthKey();
  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentTxs = txs.filter(t => new Date(t.date) >= threeMonthsAgo);
  const cmTxs = txs.filter(t => getMonthKey(t.date) === cm);
  const spendingByCategory = {};
  cmTxs.filter(t => t.type === 'expense').forEach(t => { spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount; });
  const dailySpending = {};
  cmTxs.filter(t => t.type === 'expense').forEach(t => { dailySpending[t.date] = (dailySpending[t.date] || 0) + t.amount; });
  const { total: healthScore } = computeHealthScore();
  const summary = {};
  recentTxs.forEach(t => {
    const mk = getMonthKey(t.date);
    if (!summary[mk]) summary[mk] = { income: 0, expense: 0 };
    if (t.type === 'income') summary[mk].income += t.amount;
    if (t.type === 'expense') summary[mk].expense += t.amount;
  });
  return { wallets, settings, duitFree, obligations, budgets, goals, healthScore, currentMonth: { income: cmTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0), expense: cmTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0), spendingByCategory, dailySpending, transactionCount: cmTxs.length }, last3MonthsSummary: summary };
}

const AI_PROMPTS = {
  summary: 'Buat ringkasan komprehensif keuangan bulan ini. Soroti tren pengeluaran per kategori, bandingkan dengan bulan sebelumnya, dan berikan penilaian kesehatan keuangan secara keseluruhan.',
  predict: 'Berdasarkan pola pengeluaran bulan ini, prediksi kondisi keuangan di akhir bulan. Hitung estimasi sisa saldo dan kapan dana mungkin habis.',
  tips: 'Identifikasi 3-5 peluang konkret untuk berhemat berdasarkan pola pengeluaran. Berikan estimasi penghematan yang bisa dicapai.',
  anomaly: 'Deteksi pengeluaran yang tidak biasa atau anomali dalam data transaksi. Flagging hari/kategori yang mencurigakan.',
  cashflow: 'Analisis arus kas 3 bulan terakhir. Apakah tren membaik atau memburuk? Berikan rekomendasi untuk memperbaiki cash flow.',
  goal: 'Evaluasi target tabungan yang ditetapkan. Apakah realistis? Berikan saran untuk mencapai target.'
};

async function runAIInsight(promptKey, customPrompt) {
  const rs = document.getElementById('aiResultSection');
  const loading = document.getElementById('aiLoadingIndicator');
  const content = document.getElementById('aiResultContent');
  if (!rs) return;
  rs.style.display = '';
  if (loading) loading.style.display = 'flex';
  if (content) { content.innerHTML = ''; content.style.display = 'none'; }
  rs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  try {
    const data = buildAIData();
    const prompt = customPrompt || AI_PROMPTS[promptKey];
    const result = await callAI(prompt, data);
    if (loading) loading.style.display = 'none';
    if (content) { content.style.display = ''; content.innerHTML = result; }
  } catch (e) {
    if (loading) loading.style.display = 'none';
    if (content) { content.style.display = ''; content.innerHTML = `<div style="color:var(--red)"><i class="fa-solid fa-circle-xmark" style="margin-right:8px"></i>${e.message}</div>`; }
  }
}

/* ==================== SETTINGS ==================== */
function renderSettings() {
  const s = DB.getSettings();
  const obs = DB.getObligations();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('settingTargetBni', s.targetBNI ? s.targetBNI.toLocaleString('id-ID') : '');
  set('settingDailyLimit', s.dailyLimit ? s.dailyLimit.toLocaleString('id-ID') : '');
  set('settingWorkdays', s.workDaysLeft ?? '');
  set('settingTotalWorkdays', s.totalWorkdays ?? '');
  set('settingName', s.name || '');
  const obsEl = document.getElementById('obligationsSettings');
  if (obsEl) {
    if (!obs.length) { obsEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-list-check"></i><p>Belum ada kewajiban tetap</p></div>'; }
    else {
      obsEl.innerHTML = obs.map(o => `
        <div class="obligation-setting-item">
          <span class="obligation-setting-name">${o.name} ${o.isPaid ? '<span style="color:var(--green);font-size:11px">(Lunas)</span>' : ''}</span>
          <span class="obligation-setting-amount">${formatRp(o.amount)}</span>
          <button class="btn-icon-sm" onclick="deleteObligation('${o.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('');
    }
  }
  renderWalletSettings();
}

function deleteObligation(id) {
  showConfirm('Hapus Kewajiban', 'Yakin hapus kewajiban ini?', () => {
    DB.saveObligations(DB.getObligations().filter(o => o.id !== id));
    renderSettings(); renderDashboard();
    toast('Kewajiban dihapus', 'success');
  });
}

/* ==================== PDF REPORT ==================== */
async function generatePDFReport() {
  const txs = DB.getTransactions();
  const cm = getCurrentMonthKey();
  const monthTxs = txs.filter(t => getMonthKey(t.date) === cm);
  const income = monthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = monthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const net = income - expense;
  const s = DB.getSettings();
  const { duitFree } = computeDuitFree();
  const { total: healthScore } = computeHealthScore();
  const spendByCategory = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => { spendByCategory[t.category] = (spendByCategory[t.category] || 0) + t.amount; });
  const topCats = Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const container = document.getElementById('pdfReportContainer');
  if (!container) return;
  container.innerHTML = `
    <div style="font-family:Arial,sans-serif;color:#111;max-width:760px;margin:0 auto">
      <div style="background:#1a3a6e;color:white;padding:28px 32px;border-radius:12px 12px 0 0">
        <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px">MyWallet</div>
        <div style="font-size:14px;opacity:0.8;margin-top:4px">Laporan Keuangan Bulanan</div>
        <div style="font-size:16px;font-weight:700;margin-top:8px">${formatMonthLabel(cm)} ${s.name ? '· ' + s.name : ''}</div>
      </div>
      <div style="background:#f8fafc;padding:24px 32px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0">
          <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px">Pemasukan</div>
          <div style="font-size:20px;font-weight:800;color:#10b981">${formatRp(income)}</div>
        </div>
        <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0">
          <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px">Pengeluaran</div>
          <div style="font-size:20px;font-weight:800;color:#ef4444">${formatRp(expense)}</div>
        </div>
        <div style="background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0">
          <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:4px">Selisih</div>
          <div style="font-size:20px;font-weight:800;color:${net >= 0 ? '#10b981' : '#ef4444'}">${net >= 0 ? '+' : ''}${formatRp(net)}</div>
        </div>
      </div>
      <div style="background:white;padding:24px 32px;border-top:1px solid #e2e8f0">
        <div style="font-size:14px;font-weight:800;margin-bottom:16px;color:#0f172a">📊 Pengeluaran per Kategori</div>
        ${topCats.map(([cat, amt]) => `
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px">
            <span style="text-transform:capitalize">${cat}</span>
            <strong>${formatRp(amt)}</strong>
          </div>
        `).join('')}
      </div>
      <div style="background:#f8fafc;padding:20px 32px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0">
        <div style="font-size:13px;color:#64748b">Financial Health Score: <strong style="color:#2b6ef6;font-size:18px">${healthScore}/100</strong></div>
        <div style="font-size:13px;color:#64748b">Saldo Bebas: <strong>${formatRp(duitFree)}</strong></div>
      </div>
      <div style="background:#1a3a6e;color:rgba(255,255,255,0.6);padding:12px 32px;text-align:right;font-size:11px;border-radius:0 0 12px 12px">
        Generated by MyWallet · ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  `;

  // Use print approach for PDF
  const printWin = window.open('', '_blank');
  if (!printWin) { toast('Aktifkan popup untuk PDF', 'warning'); return; }
  printWin.document.write(`<!DOCTYPE html><html><head><title>Laporan ${formatMonthLabel(cm)}</title><style>body{margin:0;padding:20px;background:#fff}*{box-sizing:border-box}@media print{body{padding:0}}</style></head><body>${container.innerHTML}</body></html>`);
  printWin.document.close();
  setTimeout(() => { printWin.print(); }, 300);
  toast('Laporan siap dicetak/disimpan sebagai PDF', 'success');
}

/* ==================== NOTIFICATIONS ==================== */
async function enableNotifications() {
  const statusEl = document.getElementById('notifStatusText');
  if (!('Notification' in window)) {
    if (statusEl) statusEl.textContent = 'Browser tidak mendukung notifikasi';
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    if (statusEl) statusEl.textContent = '✓ Notifikasi aktif!';
    toast('Notifikasi diaktifkan', 'success');
    scheduleNotifications();
  } else {
    if (statusEl) statusEl.textContent = 'Notifikasi ditolak. Aktifkan di pengaturan browser.';
  }
}

function scheduleNotifications() {
  const obs = DB.getObligations();
  const budgets = DB.getBudgets();
  const txs = DB.getTransactions();
  const today = todayDateStr();
  const cm = getCurrentMonthKey();
  const todayTxs = txs.filter(t => t.date === today);
  if (!todayTxs.length) {
    setTimeout(() => {
      if (Notification.permission === 'granted') new Notification('MyWallet 📝', { body: 'Belum ada transaksi hari ini. Yuk catat pengeluaranmu!' });
    }, 2000);
  }
  const unpaid = obs.filter(o => !o.isPaid);
  if (unpaid.length) {
    setTimeout(() => {
      if (Notification.permission === 'granted') new Notification('MyWallet 🔔', { body: `${unpaid.length} kewajiban belum dibayar: ${unpaid.map(o => o.name).join(', ')}` });
    }, 3000);
  }
  const monthTxs = txs.filter(t => getMonthKey(t.date) === cm && t.type === 'expense');
  Object.entries(budgets).forEach(([cat, limit]) => {
    const spent = monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0);
    const pct = (spent / limit) * 100;
    if (pct >= 80) {
      setTimeout(() => {
        if (Notification.permission === 'granted') new Notification('MyWallet ⚠️', { body: `Budget ${cat} sudah ${Math.round(pct)}% terpakai!` });
      }, 4000);
    }
  });
}

/* ==================== CHAT ==================== */
let pendingChatTxs = [], chatSelectedDate = null;

function guessCategoryFromText(text) {
  if (!text) return '';
  const t = text.toLowerCase();
  for (const c of [...CATEGORIES.expense, ...CATEGORIES.income]) {
    if (c.label && t.includes(c.label.toLowerCase())) return c.id;
    if (c.id && t.includes(c.id)) return c.id;
  }
  return '';
}

function parseChatToTransactions(text) {
  const cleaned = (text || '').toLowerCase();
  const parts = cleaned.replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();

  const findWalletKey = token => {
    if (!token) return null;
    const kt = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!kt) return null;
    if (wallets[kt] !== undefined) return kt;
    for (const k of Object.keys(meta)) {
      const m = meta[k] || {};
      const name = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (name && name.includes(kt)) return k;
      if (m.synonyms) {
        const syns = Array.isArray(m.synonyms) ? m.synonyms : String(m.synonyms).split(',').map(s => s.trim());
        for (const s of syns) {
          if (!s) continue;
          const ss = s.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (ss && (ss === kt || ss.includes(kt) || kt.includes(ss))) return k;
        }
      }
    }
    if (['cash', 'tunai'].includes(kt)) return Object.keys(wallets).find(k => k === 'cash') || null;
    if (kt.includes('shopee') || kt.includes('spay')) return Object.keys(wallets).find(k => k.includes('spay')) || null;
    if (kt.includes('bni') || kt.includes('bank')) return Object.keys(wallets).find(k => k.includes('bni')) || null;
    return null;
  };

  const incomeWords = ['terima','dapat','masuk','menerima','gaji','gajian','bonus','diterima','nambah','tambah'];
  const transferWords = ['transfer','kirim','pindah','topup','top up','isi'];
  const intents = [];

  for (let i = 0; i < parts.length; i++) {
    let p = parts[i].replace(/^rp/, '').replace(/^rps?/, '');
    const m = p.match(/^(\d+(?:[\.,]\d+)?)(k?)$/);
    if (m) {
      let num = parseFloat(m[1].replace(',', '.')) || 0;
      if (m[2] === 'k') num *= 1000;
      if (num < 100) continue;
      let nearbyWallets = [];
      for (let j = Math.max(0, i - 4); j <= Math.min(parts.length - 1, i + 4); j++) {
        const w = findWalletKey(parts[j]);
        if (w && !nearbyWallets.includes(w)) nearbyWallets.push(w);
      }
      const windowText = parts.slice(Math.max(0, i - 6), Math.min(parts.length, i + 7)).join(' ');
      const hasTransferVerb = transferWords.some(v => windowText.includes(v));
      let src = null, dst = null;
      const dariIdx = windowText.indexOf('dari');
      const keIdx = windowText.indexOf(' ke ');
      if (dariIdx !== -1 && keIdx !== -1) {
        src = findWalletKey(windowText.slice(dariIdx + 4, keIdx).trim().split(/\s+/)[0]) || null;
        dst = findWalletKey(windowText.slice(keIdx + 3).trim().split(/\s+/)[0]) || null;
      }
      if (!src && !dst && nearbyWallets.length >= 2 && hasTransferVerb) { src = nearbyWallets[0]; dst = nearbyWallets[1]; }
      let type = 'expense';
      if (incomeWords.some(w => cleaned.includes(w))) type = 'income';
      if (hasTransferVerb || (src && dst)) type = 'transfer';
      const category = guessCategoryFromText(cleaned) || (type === 'income' ? 'gaji' : 'lainnya');
      const firstWallet = nearbyWallets[0] || null;
      const confidence = ((type === 'transfer' && src && dst) || (type !== 'transfer' && firstWallet)) ? 'high' : 'low';
      intents.push({ type, amount: Math.round(num), sourceWallet: type === 'income' ? null : (src || firstWallet), destWallet: type === 'transfer' ? (dst || nearbyWallets[1] || null) : null, category, confidence });
    }
  }
  return intents;
}

function appendChatLog(msg, who = 'user') {
  const el = document.getElementById('chatLog');
  if (!el) return;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'margin-bottom:6px';
  wrapper.innerHTML = `<div style="font-size:12px;padding:6px 10px;border-radius:8px;max-width:90%;${who==='user'?'margin-left:auto;background:var(--accent-dim);color:var(--accent-light)':'background:var(--bg-card2);color:var(--text-secondary)'}">${msg}</div>`;
  el.appendChild(wrapper);
  el.scrollTop = el.scrollHeight;
}

function applyIntent(intent) {
  const wallets = DB.getWallets();
  const txs = DB.getTransactions();
  const meta = DB.getWalletMeta();
  const date = intent.date || todayDateStr();
  if (intent.type === 'expense') {
    const src = intent.sourceWallet;
    if (!src) return { ok: false, msg: 'Dompet tidak ditemukan' };
    if ((wallets[src] || 0) < intent.amount) return { ok: false, msg: 'Saldo tidak mencukupi' };
    wallets[src] -= intent.amount;
    txs.push({ id: DB.generateId(), type: 'expense', amount: intent.amount, sourceWallet: src, destWallet: null, category: intent.category || 'lainnya', note: 'via chat', date, tags: [] });
    DB.saveWallets(wallets); DB.saveTransactions(txs);
    return { ok: true, label: getWalletName(src) };
  }
  if (intent.type === 'income') {
    const dest = intent.destWallet || intent.sourceWallet || Object.keys(wallets)[0];
    if (!dest) return { ok: false, msg: 'Dompet tidak ditemukan' };
    wallets[dest] = (wallets[dest] || 0) + intent.amount;
    txs.push({ id: DB.generateId(), type: 'income', amount: intent.amount, sourceWallet: dest, destWallet: null, category: intent.category || 'gaji', note: 'via chat', date, tags: [] });
    DB.saveWallets(wallets); DB.saveTransactions(txs);
    return { ok: true, label: getWalletName(dest) };
  }
  if (intent.type === 'transfer') {
    const src = intent.sourceWallet, dst = intent.destWallet;
    if (!src || !dst) return { ok: false, msg: 'Dompet asal/tujuan tidak lengkap' };
    if ((wallets[src] || 0) < intent.amount) return { ok: false, msg: 'Saldo tidak mencukupi' };
    wallets[src] -= intent.amount;
    wallets[dst] = (wallets[dst] || 0) + intent.amount;
    txs.push({ id: DB.generateId(), type: 'transfer', amount: intent.amount, sourceWallet: src, destWallet: dst, category: 'transfer', note: 'via chat', date, tags: [] });
    DB.saveWallets(wallets); DB.saveTransactions(txs);
    return { ok: true, labelSrc: getWalletName(src), labelDst: getWalletName(dst) };
  }
  return { ok: false, msg: 'Tipe tidak dikenali' };
}

function renderPendingChatUI() {
  const el = document.getElementById('chatLog');
  if (!el) return;
  el.querySelectorAll('.pending-chat-container').forEach(c => c.remove());
  if (!pendingChatTxs.length) return;
  const container = document.createElement('div');
  container.className = 'pending-chat-container';
  container.style.cssText = 'padding:8px;border:1px solid var(--border);background:var(--bg-card2);border-radius:8px;margin-top:6px';
  let inner = '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text-secondary)">Konfirmasi transaksi:</div><div style="display:flex;flex-direction:column;gap:8px">';
  pendingChatTxs.forEach(p => {
    const it = p.intent;
    let desc = '';
    if (it.type === 'expense') desc = `Keluar ${formatRp(it.amount)} dari ${getWalletName(it.sourceWallet)}`;
    else if (it.type === 'income') desc = `Masuk ${formatRp(it.amount)} ke ${getWalletName(it.destWallet || it.sourceWallet)}`;
    else if (it.type === 'transfer') desc = `Transfer ${formatRp(it.amount)} ${getWalletName(it.sourceWallet)} → ${getWalletName(it.destWallet)}`;
    inner += `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;font-size:12px"><span>${desc}</span><span style="display:flex;gap:4px"><button class="btn-primary btn-sm" onclick="confirmPendingChat('${p.id}')">✓</button><button class="btn-secondary btn-sm" onclick="ignorePendingChat('${p.id}')">✗</button></span></div>`;
  });
  inner += '</div>';
  container.innerHTML = inner;
  el.appendChild(container);
  el.scrollTop = el.scrollHeight;
}

function confirmPendingChat(pid) {
  const idx = pendingChatTxs.findIndex(p => p.id === pid);
  if (idx === -1) return;
  const item = pendingChatTxs[idx];
  const res = applyIntent(item.intent);
  if (!res.ok) { appendChatLog(`Gagal: ${res.msg}`, 'bot'); }
  else if (item.intent.type === 'transfer') appendChatLog(`✓ Transfer ${formatRp(item.intent.amount)} ${res.labelSrc}→${res.labelDst}`, 'bot');
  else appendChatLog(`✓ ${item.intent.type === 'income' ? '+' : '-'}${formatRp(item.intent.amount)}`, 'bot');
  pendingChatTxs.splice(idx, 1);
  renderPendingChatUI(); renderDashboard();
}

function ignorePendingChat(pid) {
  const idx = pendingChatTxs.findIndex(p => p.id === pid);
  if (idx === -1) return;
  appendChatLog(`Diabaikan`, 'bot');
  pendingChatTxs.splice(idx, 1);
  renderPendingChatUI();
}

function handleChatInput() {
  const input = document.getElementById('chatInput');
  if (!input) return;
  const txt = input.value.trim();
  if (!txt) return;
  appendChatLog(txt, 'user');
  const intents = parseChatToTransactions(txt);
  if (!intents.length) {
    appendChatLog('Tidak ada nominal yang dikenali. Coba: "habis 19k cash" atau "transfer 50k bni ke spay"', 'bot');
    input.value = '';
    return;
  }
  const wallets = DB.getWallets();
  const toApply = [], toConfirm = [];
  intents.forEach(it => {
    if (it.type === 'expense') {
      const wk = it.sourceWallet || Object.keys(wallets)[0];
      if (wk && (wallets[wk] || 0) >= it.amount && it.confidence === 'high') toApply.push({ ...it, sourceWallet: wk });
      else toConfirm.push({ ...it, sourceWallet: wk });
    } else if (it.type === 'income') {
      const dst = it.destWallet || it.sourceWallet || Object.keys(wallets)[0];
      if (dst && it.confidence === 'high') toApply.push({ ...it, sourceWallet: dst });
      else toConfirm.push({ ...it, destWallet: dst });
    } else if (it.type === 'transfer') {
      if (it.sourceWallet && it.destWallet && it.confidence === 'high' && (wallets[it.sourceWallet] || 0) >= it.amount) toApply.push(it);
      else toConfirm.push(it);
    }
  });
  const dateToUse = chatSelectedDate || todayDateStr();
  if (toApply.length) {
    toApply.forEach(a => {
      const res = applyIntent({ ...a, date: dateToUse });
      if (!res.ok) appendChatLog(`Gagal: ${res.msg}`, 'bot');
      else if (a.type === 'transfer') appendChatLog(`✓ Transfer ${formatRp(a.amount)}`, 'bot');
      else appendChatLog(`✓ ${a.type === 'income' ? '+' : '-'}${formatRp(a.amount)}`, 'bot');
    });
    renderDashboard();
  }
  if (toConfirm.length) {
    toConfirm.forEach(it => pendingChatTxs.push({ id: DB.generateId(), intent: { ...it, date: dateToUse } }));
    appendChatLog('Mohon konfirmasi transaksi berikut:', 'bot');
    renderPendingChatUI();
  }
  input.value = '';
  chatSelectedDate = null;
  const dateInput = document.getElementById('chatDate');
  if (dateInput) dateInput.value = '';
}

/* ==================== CHAT WIDGET TOGGLE (mobile-safe) ==================== */
function openChatWidget() {
  const box = document.getElementById('chatBox');
  const toggle = document.getElementById('chatToggle');
  if (!box) return;
  box.style.display = 'flex';
  if (toggle) toggle.style.display = 'none';
  setTimeout(() => {
    const inp = document.getElementById('chatInput');
    if (inp) inp.focus();
  }, 100);
}

function closeChatWidget() {
  const box = document.getElementById('chatBox');
  const toggle = document.getElementById('chatToggle');
  if (box) box.style.display = 'none';
  if (toggle) toggle.style.display = '';
}

/* ==================== ONBOARDING ==================== */
function renderOnboardingModal() {
  const settings = DB.getSettings();
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const el = document.getElementById('onboardingModal');
  if (!el) return;
  const container = el.querySelector('.modal-body');
  if (!container) return;
  const customWallets = Object.keys(wallets).filter(k => meta[k] && meta[k].name);
  const rows = customWallets.map(k => {
    const m = meta[k] || {};
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
      <input class="form-input onboard-wallet-name" data-wallet="${k}" value="${(m.name||k).replace(/"/g,'')}" style="flex:1;min-width:100px">
      <div class="amount-input-wrap" style="flex:1;min-width:100px"><span class="currency-prefix">Rp</span><input class="form-input amount-input onboard-wallet-balance" data-wallet="${k}" value="${Number(wallets[k]||0).toLocaleString('id-ID')}"></div>
      <input class="form-input onboard-wallet-syn" data-wallet="${k}" placeholder="Sinonim (koma)" value="${m.synonyms? (Array.isArray(m.synonyms)? m.synonyms.join(',') : m.synonyms) : ''}" style="flex:1;min-width:100px">
    </div>`;
  }).join('');
  container.innerHTML = `
    <div style="padding-bottom:12px"><b>Selamat datang di MyWallet! 👋</b><br/>Atur nama dan dompetmu untuk memulai.</div>
    <div style="margin-bottom:12px"><input id="onboardName" class="form-input" placeholder="Nama Anda" value="${settings.name || ''}"></div>
    ${rows ? `<div style="margin-bottom:8px;font-size:12px;color:var(--text-secondary)">Dompet:</div>` : ''}
    <div style="max-height:200px;overflow:auto;margin-bottom:12px">${rows || '<div style="font-size:13px;color:var(--text-muted);padding:8px 0;text-align:center">Belum ada dompet.</div>'}</div>
    <div style="margin-bottom:8px;font-size:12px;color:var(--text-secondary)">Tambah Dompet:</div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <input id="onboardNewWalletName" class="form-input" placeholder="Nama (cth: BNI, Dana)" style="flex:1;min-width:100px">
      <div class="amount-input-wrap" style="flex:0.8;min-width:100px"><span class="currency-prefix">Rp</span><input id="onboardNewWalletBalance" class="form-input amount-input" placeholder="Saldo awal" value="0"></div>
      <button id="onboardAddWallet" class="btn-secondary btn-sm">+ Tambah</button>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
      <button class="btn-secondary" id="onboardingSkipBtn">Lewati</button>
      <button class="btn-primary" id="onboardingSaveBtn">Simpan & Mulai</button>
    </div>
  `;
  container.querySelectorAll('.amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));
  container.querySelector('#onboardAddWallet')?.addEventListener('click', () => {
    const ni = container.querySelector('#onboardNewWalletName');
    const bi = container.querySelector('#onboardNewWalletBalance');
    const name = (ni?.value || '').trim();
    if (!name) { toast('Masukkan nama dompet', 'error'); return; }
    const key = slugify(name);
    const w = DB.getWallets(), m = DB.getWalletMeta();
    if (w[key]) { toast('Dompet sudah ada', 'warning'); return; }
    w[key] = parseRpInput(bi?.value || '0');
    m[key] = { name, type: 'wallet', synonyms: [] };
    DB.saveWallets(w); DB.saveWalletMeta(m);
    if (ni) ni.value = '';
    if (bi) bi.value = '0';
    renderOnboardingModal(); toast('Dompet ditambahkan', 'success');
  });
  container.querySelector('#onboardingSaveBtn')?.addEventListener('click', handleOnboardSave);
  container.querySelector('#onboardingSkipBtn')?.addEventListener('click', () => {
    DB.saveSettings({ ...DB.getSettings(), _onboarded: 1 });
    hideModal('onboardingModal');
  });
}

function showOnboardingIfNeeded() {
  const s = DB.getSettings();
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const walletKeys = Object.keys(wallets).filter(k => wallets[k] !== 0 || meta[k]?.name);
  if (!s.name || walletKeys.length === 0) { renderOnboardingModal(); showModal('onboardingModal'); }
}

function handleOnboardSave() {
  const name = (document.getElementById('onboardName')?.value || '').trim();
  const wallets = DB.getWallets(), meta = DB.getWalletMeta();
  document.querySelectorAll('.onboard-wallet-name').forEach(inp => {
    const k = inp.dataset.wallet;
    if (!meta[k]) meta[k] = {};
    meta[k].name = inp.value.trim() || k;
  });
  document.querySelectorAll('.onboard-wallet-balance').forEach(inp => { wallets[inp.dataset.wallet] = parseRpInput(inp.value); });
  document.querySelectorAll('.onboard-wallet-syn').forEach(inp => {
    const k = inp.dataset.wallet;
    meta[k] = meta[k] || {};
    meta[k].synonyms = inp.value.trim() ? inp.value.split(',').map(s => s.trim()).filter(Boolean) : [];
  });
  DB.saveWallets(wallets); DB.saveWalletMeta(meta);
  DB.saveSettings({ ...DB.getSettings(), name: name || DB.getSettings().name || '', _onboarded: 1 });
  hideModal('onboardingModal');
  renderWalletSettings(); renderDashboard();
  toast('Selamat datang! 🎉', 'success');
}

/* ==================== EXPORT / IMPORT ==================== */
function exportData() {
  const data = { wallets: DB.getWallets(), settings: DB.getSettings(), obligations: DB.getObligations(), transactions: DB.getTransactions(), budgets: DB.getBudgets(), templates: DB.getTemplates(), goals: DB.getGoals(), recurring: DB.getRecurring(), nwAssets: DB.getNWAssets(), nwDebts: DB.getNWDebts(), nwHistory: DB.getNWHistory(), exportedAt: new Date().toISOString(), version: '3.0' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `mywallet-backup-${todayDateStr()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('Data diekspor', 'success');
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.wallets) DB.saveWallets(data.wallets);
      if (data.settings) DB.saveSettings(data.settings);
      if (data.obligations) DB.saveObligations(data.obligations);
      if (data.transactions) DB.saveTransactions(data.transactions);
      if (data.budgets) DB.saveBudgets(data.budgets);
      if (data.templates) DB.saveTemplates(data.templates);
      if (data.goals) DB.saveGoals(data.goals);
      if (data.recurring) DB.saveRecurring(data.recurring);
      if (data.nwAssets) DB.saveNWAssets(data.nwAssets);
      if (data.nwDebts) DB.saveNWDebts(data.nwDebts);
      if (data.nwHistory) DB.saveNWHistory(data.nwHistory);
      toast('Data dipulihkan!', 'success');
      navigateTo('dashboard');
    } catch { toast('File tidak valid', 'error'); }
  };
  reader.readAsText(file);
}

/* ==================== THEME ==================== */
function initTheme() {
  const saved = localStorage.getItem('df_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeUI(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('df_theme', next);
  updateThemeUI(next);
}

function updateThemeUI(theme) {
  const isDark = theme === 'dark';
  document.querySelectorAll('#themeIconSidebar, #themeIconTop').forEach(i => { i.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'; });
  const txt = document.getElementById('themeTextSidebar');
  if (txt) txt.textContent = isDark ? 'Dark Mode' : 'Light Mode';
}

function setCurrentDate() {
  const el = document.getElementById('currentDateDisplay');
  if (el) el.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ==================== SIDEBAR ==================== */
function openSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  document.getElementById('sidebarOverlay')?.classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

/* ==================== PWA ==================== */
let pwaPrompt = null;
function initPWA() {
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const updateInstallState = () => {
    const btn = document.getElementById('settingsInstallBtn');
    const installed = document.getElementById('settingsInstalledText');
    const hint = document.getElementById('settingsInstallHint');
    if (!btn) return;
    if (isStandalone()) { btn.style.display = 'none'; if (installed) installed.style.display = 'block'; if (hint) hint.textContent = 'Sudah terinstall.'; return; }
    btn.style.display = 'inline-flex';
    if (installed) installed.style.display = 'none';
    if (hint) hint.textContent = pwaPrompt ? 'Klik Install untuk menambahkan ke homescreen.' : 'Buka menu browser → Install app atau Add to Home Screen.';
  };
  const promptInstall = async () => {
    if (!pwaPrompt) { toast('Gunakan menu browser: Install app', 'info'); return; }
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') { document.getElementById('pwa-install-bar').style.display = 'none'; toast('MyWallet terinstall!', 'success'); }
    pwaPrompt = null; updateInstallState();
  };
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); pwaPrompt = e;
    const dismissed = localStorage.getItem('df_pwa_dismissed');
    const bar = document.getElementById('pwa-install-bar');
    if (!dismissed && bar) bar.style.display = 'flex';
    updateInstallState();
  });
  window.addEventListener('appinstalled', () => {
    pwaPrompt = null;
    const bar = document.getElementById('pwa-install-bar');
    if (bar) bar.style.display = 'none';
    updateInstallState();
  });
  document.getElementById('pwa-install-btn')?.addEventListener('click', promptInstall);
  document.getElementById('settingsInstallBtn')?.addEventListener('click', promptInstall);
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    const bar = document.getElementById('pwa-install-bar');
    if (bar) bar.style.display = 'none';
    localStorage.setItem('df_pwa_dismissed', '1');
  });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  updateInstallState();
}

/* ==================== NAVIGATION ==================== */
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', transactions: 'Catat Transaksi', history: 'Riwayat', settings: 'Pengaturan', calendar: 'Kalender', budget: 'Budget', cicilan: 'Kalkulator Cicilan', ai: 'AI Insight', goals: 'Target Tabungan', recurring: 'Transaksi Rutin', networth: 'Net Worth', splitbill: 'Split Bill' };
  const pt = document.getElementById('pageTitle');
  if (pt) pt.textContent = titles[page] || '';
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
  if (page === 'dashboard') renderDashboard();
  if (page === 'history') { populateMonthFilter(); populateCatFilter(); renderHistory(); }
  if (page === 'settings') renderSettings();
  if (page === 'transactions') {
    const txDate = document.getElementById('txDate');
    if (txDate) txDate.value = todayDateStr();
    setTxType('expense', 'page');
    document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === 'expense'));
    renderQuickTemplateBar(); populateWalletSelects();
  }
  if (page === 'calendar') { selectedCalDay = todayDateStr(); renderCalendar(); }
  if (page === 'budget') renderBudgetPage();
  if (page === 'goals') renderGoalsPage();
  if (page === 'recurring') { renderRecurringPage(); populateRecurringSelects(); populateWalletSelects(); }
  if (page === 'networth') { saveNWSnapshot(); renderNetWorthPage(); }
  if (page === 'splitbill') renderSplitPersonList();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==================== MAIN INIT ==================== */
function initApp() {
  initTheme();
  setCurrentDate();
  initPWA();

  // Sidebar overlay
  const overlay = document.createElement('div');
  overlay.id = 'sidebarOverlay'; overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', closeSidebar);

  // Navigation
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });

  document.getElementById('mobileMenuBtn')?.addEventListener('click', openSidebar);
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    if (window.innerWidth < 769) openSidebar();
  });
  document.getElementById('themeToggleSidebar')?.addEventListener('click', toggleTheme);
  document.getElementById('themeToggleTop')?.addEventListener('click', toggleTheme);

  // Transaction Modal
  document.getElementById('openTransactionModal')?.addEventListener('click', () => {
    modalTxCategory = ''; modalTxType = 'expense';
    const fields = { modalTxAmount: '', modalTxNote: '' };
    Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
    const mdt = document.getElementById('modalTxDate');
    if (mdt) mdt.value = todayDateStr();
    document.getElementById('modalDestGroup').style.display = 'none';
    document.getElementById('modalCategoryGroup').style.display = '';
    document.querySelectorAll('.type-tab[data-context="modal"]').forEach(b => b.classList.toggle('active', b.dataset.type === 'expense'));
    setTxType('expense', 'modal');
    populateWalletSelects();
    showModal('transactionModal');
  });

  document.getElementById('openTemplateModal')?.addEventListener('click', () => { renderTemplateModal(); showModal('templateModal'); });

  // Chat widget — mobile-safe
  document.getElementById('openChatBtn')?.addEventListener('click', openChatWidget);
  document.getElementById('chatToggle')?.addEventListener('click', openChatWidget);
  document.getElementById('chatClose')?.addEventListener('click', closeChatWidget);
  document.getElementById('chatSend')?.addEventListener('click', handleChatInput);
  document.getElementById('chatInput')?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatInput(); } });
  document.getElementById('chatDateBtn')?.addEventListener('click', () => {
    const di = document.getElementById('chatDate');
    chatSelectedDate = di?.value || todayDateStr();
    appendChatLog(`📅 Tanggal: ${new Date(chatSelectedDate + 'T00:00:00').toLocaleDateString('id-ID')}`, 'bot');
  });
  document.getElementById('chatDate')?.addEventListener('change', () => document.getElementById('chatDateBtn')?.click());

  // Modal closes
  document.getElementById('closeModal')?.addEventListener('click', () => hideModal('transactionModal'));
  document.getElementById('closeEditModal')?.addEventListener('click', () => hideModal('editModal'));
  document.getElementById('closeConfirmModal')?.addEventListener('click', () => hideModal('confirmModal'));
  document.getElementById('confirmCancel')?.addEventListener('click', () => hideModal('confirmModal'));
  document.getElementById('closeTemplateModal')?.addEventListener('click', () => hideModal('templateModal'));

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) hideModal(m.id); });
  });

  // Modal tabs
  document.querySelectorAll('.type-tab[data-context="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-tab[data-context="modal"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTxType(btn.dataset.type, 'modal');
    });
  });

  document.getElementById('modalTxAmount')?.addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('modalTransactionForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const ok = submitTransaction(modalTxType, 'modalTxDate', 'modalTxAmount', 'modalTxSourceWallet', 'modalTxDestWallet', 'modalTxNote', () => modalTxCategory, null);
    if (ok) {
      hideModal('transactionModal');
      toast('Transaksi dicatat!', 'success');
      const { duitFree } = computeDuitFree();
      if (duitFree < 0) setTimeout(() => toast('⚠️ Saldo bebas minus!', 'warning'), 500);
      renderDashboard();
    }
  });

  // Page tabs
  const txDateEl = document.getElementById('txDate');
  if (txDateEl) txDateEl.value = todayDateStr();
  setTxType('expense', 'page');
  document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === 'expense');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTxType(btn.dataset.type, 'page');
    });
  });

  // Amount inputs
  document.querySelectorAll('input.amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  // Currency convert
  document.getElementById('enableCurrencyConvert')?.addEventListener('change', function() {
    const row = document.getElementById('currencyConvertRow');
    if (row) row.style.display = this.checked ? '' : 'none';
  });
  document.getElementById('txCurrency')?.addEventListener('change', updateCurrencyConvert);
  document.getElementById('txAmount')?.addEventListener('input', function() { formatInputRp(this); updateCurrencyConvert(); });

  // Save as template
  document.getElementById('saveAsTemplate')?.addEventListener('change', function() {
    const tn = document.getElementById('templateName');
    if (tn) tn.style.display = this.checked ? '' : 'none';
  });

  // Transaction form
  document.getElementById('transactionForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const ok = submitTransaction(currentTxType, 'txDate', 'txAmount', 'txSourceWallet', 'txDestWallet', 'txNote', () => currentTxCategory, 'txTags');
    if (ok) {
      const saveAsTpl = document.getElementById('saveAsTemplate')?.checked;
      if (saveAsTpl && currentTxType !== 'transfer') {
        const tplName = document.getElementById('templateName')?.value.trim() || currentTxCategory || 'Template';
        const templates = DB.getTemplates();
        templates.push({ id: DB.generateId(), name: tplName, type: currentTxType, amount: parseRpInput(document.getElementById('txAmount')?.value), category: currentTxCategory, wallet: document.getElementById('txSourceWallet')?.value, note: document.getElementById('txNote')?.value.trim() || '' });
        DB.saveTemplates(templates);
        toast(`Template "${tplName}" disimpan`, 'success');
        const sa = document.getElementById('saveAsTemplate');
        if (sa) sa.checked = false;
        const tn = document.getElementById('templateName');
        if (tn) { tn.style.display = 'none'; tn.value = ''; }
        renderQuickTemplateBar();
      }
      const amtEl = document.getElementById('txAmount');
      if (amtEl) amtEl.value = '';
      const noteEl = document.getElementById('txNote');
      if (noteEl) noteEl.value = '';
      const tagsEl = document.getElementById('txTags');
      if (tagsEl) tagsEl.value = '';
      currentTxCategory = '';
      setTxType(currentTxType, 'page');
      document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === currentTxType));
      toast('Transaksi dicatat!', 'success');
      const { duitFree } = computeDuitFree();
      if (duitFree < 0) setTimeout(() => toast('⚠️ Saldo bebas minus!', 'warning'), 500);
      renderDashboard();
    }
  });

  // Edit form
  document.getElementById('editTxAmount')?.addEventListener('input', function() { formatInputRp(this); });
  document.getElementById('editTransactionForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('editTxId')?.value;
    const newAmount = parseRpInput(document.getElementById('editTxAmount')?.value);
    const newDate = document.getElementById('editTxDate')?.value;
    const newNote = document.getElementById('editTxNote')?.value.trim() || '';
    const newWallet = document.getElementById('editTxWallet')?.value;
    if (!newAmount || newAmount <= 0) { toast('Nominal tidak valid', 'error'); return; }
    const txs = DB.getTransactions();
    const idx = txs.findIndex(t => t.id === id);
    if (idx === -1) return;
    const old = txs[idx];
    const wallets = DB.getWallets();
    if (old.type === 'expense') {
      wallets[old.sourceWallet] = (wallets[old.sourceWallet] || 0) + old.amount;
      if ((wallets[newWallet] || 0) < newAmount) { toast('Saldo tidak mencukupi', 'warning'); wallets[old.sourceWallet] -= old.amount; return; }
      wallets[newWallet] -= newAmount;
    } else if (old.type === 'income') {
      wallets[old.sourceWallet] = (wallets[old.sourceWallet] || 0) - old.amount;
      wallets[newWallet] = (wallets[newWallet] || 0) + newAmount;
    }
    txs[idx] = { ...old, amount: newAmount, date: newDate, note: newNote, sourceWallet: newWallet };
    DB.saveWallets(wallets); DB.saveTransactions(txs);
    hideModal('editModal');
    toast('Transaksi diperbarui', 'success');
    renderDashboard();
    if (document.getElementById('page-history')?.classList.contains('active')) renderHistory();
    if (document.getElementById('page-calendar')?.classList.contains('active')) renderCalendar();
  });

  document.getElementById('deleteTransaction')?.addEventListener('click', () => {
    const id = document.getElementById('editTxId')?.value;
    showConfirm('Hapus Transaksi', 'Saldo akan dikembalikan. Lanjutkan?', () => {
      const txs = DB.getTransactions();
      const idx = txs.findIndex(t => t.id === id);
      if (idx === -1) return;
      const old = txs[idx];
      const wallets = DB.getWallets();
      if (old.type === 'expense') wallets[old.sourceWallet] = (wallets[old.sourceWallet] || 0) + old.amount;
      else if (old.type === 'income') wallets[old.sourceWallet] = (wallets[old.sourceWallet] || 0) - old.amount;
      else if (old.type === 'transfer') { wallets[old.sourceWallet] = (wallets[old.sourceWallet] || 0) + old.amount; if (old.destWallet) wallets[old.destWallet] = (wallets[old.destWallet] || 0) - old.amount; }
      txs.splice(idx, 1);
      DB.saveWallets(wallets); DB.saveTransactions(txs);
      hideModal('editModal');
      toast('Transaksi dihapus', 'success');
      renderDashboard();
      if (document.getElementById('page-history')?.classList.contains('active')) renderHistory();
      if (document.getElementById('page-calendar')?.classList.contains('active')) renderCalendar();
    });
  });

  // History filters
  ['filterMonth','filterWallet','filterType','filterCat','searchQuery'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderHistory);
  });
  document.getElementById('searchQuery')?.addEventListener('input', renderHistory);

  // Calendar
  document.getElementById('calPrev')?.addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() - 1); selectedCalDay = null; renderCalendar(); });
  document.getElementById('calNext')?.addEventListener('click', () => { calendarDate.setMonth(calendarDate.getMonth() + 1); selectedCalDay = null; renderCalendar(); });

  // Budget
  document.getElementById('saveBudget')?.addEventListener('click', () => {
    const cat = document.getElementById('budgetCatSelect')?.value;
    const amount = parseRpInput(document.getElementById('budgetAmount')?.value);
    if (!amount || amount <= 0) { toast('Masukkan nominal budget', 'error'); return; }
    const budgets = DB.getBudgets();
    budgets[cat] = amount;
    DB.saveBudgets(budgets);
    const ba = document.getElementById('budgetAmount');
    if (ba) ba.value = '';
    renderBudgetPage();
    toast(`Budget ${cat}: ${formatRp(amount, true)}`, 'success');
  });
  document.getElementById('budgetAmount')?.addEventListener('input', function() { formatInputRp(this); });

  // Goals
  document.getElementById('saveGoal')?.addEventListener('click', () => {
    const name = document.getElementById('goalName')?.value.trim();
    const target = parseRpInput(document.getElementById('goalTarget')?.value);
    const current = parseRpInput(document.getElementById('goalCurrent')?.value);
    const deadline = document.getElementById('goalDeadline')?.value || '';
    const emoji = document.getElementById('goalEmoji')?.value.trim() || '🎯';
    if (!name || !target) { toast('Isi nama dan nominal target', 'error'); return; }
    const goals = DB.getGoals();
    goals.push({ id: DB.generateId(), name, target, current, deadline, emoji });
    DB.saveGoals(goals);
    ['goalName','goalTarget','goalCurrent','goalDeadline'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const ge = document.getElementById('goalEmoji'); if (ge) ge.value = '';
    renderGoalsPage(); renderDashGoals();
    toast(`Goal "${name}" dibuat!`, 'success');
  });
  document.querySelectorAll('#page-goals .amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  // Recurring
  document.getElementById('saveRecurring')?.addEventListener('click', () => {
    const name = document.getElementById('recurName')?.value.trim();
    const type = document.getElementById('recurType')?.value || 'expense';
    const amount = parseRpInput(document.getElementById('recurAmount')?.value);
    const day = parseInt(document.getElementById('recurDay')?.value) || 1;
    const category = document.getElementById('recurCategory')?.value || 'lainnya';
    const wallet = document.getElementById('recurWallet')?.value;
    if (!name || !amount) { toast('Isi nama dan nominal', 'error'); return; }
    const recurrings = DB.getRecurring();
    recurrings.push({ id: DB.generateId(), name, type, amount, day, category, wallet });
    DB.saveRecurring(recurrings);
    ['recurName','recurAmount','recurDay'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderRecurringPage();
    toast(`Transaksi rutin "${name}" ditambahkan`, 'success');
  });
  document.getElementById('recurAmount')?.addEventListener('input', function() { formatInputRp(this); });

  // Net Worth
  document.getElementById('addNwAsset')?.addEventListener('click', () => {
    const name = document.getElementById('nwAssetName')?.value.trim();
    const value = parseRpInput(document.getElementById('nwAssetValue')?.value);
    if (!name || !value) { toast('Isi nama dan nilai aset', 'error'); return; }
    const assets = DB.getNWAssets();
    assets.push({ id: DB.generateId(), name, value });
    DB.saveNWAssets(assets);
    const an = document.getElementById('nwAssetName'); if (an) an.value = '';
    const av = document.getElementById('nwAssetValue'); if (av) av.value = '';
    saveNWSnapshot(); renderNetWorthPage();
    toast('Aset ditambahkan', 'success');
  });
  document.getElementById('addNwDebt')?.addEventListener('click', () => {
    const name = document.getElementById('nwDebtName')?.value.trim();
    const value = parseRpInput(document.getElementById('nwDebtValue')?.value);
    if (!name || !value) { toast('Isi nama dan nilai hutang', 'error'); return; }
    const debts = DB.getNWDebts();
    debts.push({ id: DB.generateId(), name, value });
    DB.saveNWDebts(debts);
    const dn = document.getElementById('nwDebtName'); if (dn) dn.value = '';
    const dv = document.getElementById('nwDebtValue'); if (dv) dv.value = '';
    saveNWSnapshot(); renderNetWorthPage();
    toast('Hutang ditambahkan', 'success');
  });
  document.querySelectorAll('#page-networth .amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  // Split Bill
  splitPersons = ['Saya'];
  document.getElementById('addSplitPerson')?.addEventListener('click', () => {
    const inp = document.getElementById('splitPersonName');
    const name = inp?.value.trim();
    if (!name) { toast('Masukkan nama', 'error'); return; }
    splitPersons.push(name);
    if (inp) inp.value = '';
    renderSplitPersonList();
  });
  document.getElementById('splitPersonName')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('addSplitPerson')?.click(); } });
  document.getElementById('calculateSplit')?.addEventListener('click', calculateSplit);
  document.querySelectorAll('#page-splitbill .amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  // Cicilan
  document.getElementById('hitungCicilan')?.addEventListener('click', hitungCicilan);
  document.querySelectorAll('#page-cicilan .amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  // AI
  document.querySelectorAll('.ai-prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ai-prompt-card').forEach(c => c.style.borderColor = '');
      card.style.borderColor = 'var(--accent)';
      runAIInsight(card.dataset.prompt, null);
    });
  });
  document.getElementById('aiCustomSend')?.addEventListener('click', () => {
    const prompt = document.getElementById('aiCustomPrompt')?.value.trim();
    if (!prompt) { toast('Masukkan pertanyaan', 'warning'); return; }
    runAIInsight(null, prompt);
    const el = document.getElementById('aiCustomPrompt'); if (el) el.value = '';
  });
  document.getElementById('aiCustomPrompt')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('aiCustomSend')?.click(); });

  // Settings
  document.querySelectorAll('#page-settings .amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));

  document.getElementById('addWalletBtn')?.addEventListener('click', addWalletFromForm);
  document.getElementById('newWalletBalance')?.addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('saveWallets')?.addEventListener('click', () => {
    const rows = document.querySelectorAll('#walletsSettingsList .wallet-settings-row');
    const wallets = DB.getWallets(), meta = DB.getWalletMeta();
    rows.forEach(row => {
      const key = row.dataset.wallet;
      const name = (row.querySelector('.wallet-name-input')?.value || key).trim();
      const type = row.querySelector('.wallet-type-select')?.value || 'cash';
      const balance = parseRpInput(row.querySelector('.wallet-balance-input')?.value);
      const target = parseRpInput(row.querySelector('.wallet-target-input')?.value || '');
      wallets[key] = balance;
      meta[key] = { name, type, target: target || 0 };
    });
    DB.saveWallets(wallets); DB.saveWalletMeta(meta);
    toast('Dompet diperbarui', 'success');
    renderDashboard(); renderWalletSettings();
  });

  document.getElementById('saveSettings')?.addEventListener('click', () => {
    DB.saveSettings({
      targetBNI: parseRpInput(document.getElementById('settingTargetBni')?.value),
      dailyLimit: parseRpInput(document.getElementById('settingDailyLimit')?.value),
      workDaysLeft: parseInt(document.getElementById('settingWorkdays')?.value) || 0,
      totalWorkdays: parseInt(document.getElementById('settingTotalWorkdays')?.value) || 22,
      name: document.getElementById('settingName')?.value.trim() || ''
    });
    toast('Pengaturan disimpan', 'success');
    renderDashboard();
  });

  document.getElementById('addObligation')?.addEventListener('click', () => {
    const name = document.getElementById('newObligationName')?.value.trim();
    const amount = parseRpInput(document.getElementById('newObligationAmount')?.value);
    if (!name) { toast('Masukkan nama kewajiban', 'error'); return; }
    if (!amount) { toast('Masukkan nominal', 'error'); return; }
    const obs = DB.getObligations();
    obs.push({ id: DB.generateId(), name, amount, isPaid: false });
    DB.saveObligations(obs);
    const nn = document.getElementById('newObligationName'); if (nn) nn.value = '';
    const na = document.getElementById('newObligationAmount'); if (na) na.value = '';
    renderSettings(); renderDashboard();
    toast(`Kewajiban "${name}" ditambahkan`, 'success');
  });
  document.getElementById('newObligationAmount')?.addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('enableNotifBtn')?.addEventListener('click', enableNotifications);

  document.getElementById('resetMonth')?.addEventListener('click', () => {
    showConfirm('Mulai Bulan Baru', 'Status kewajiban dan hari kerja akan direset. Lanjutkan?', () => {
      const obs = DB.getObligations().map(o => ({ ...o, isPaid: false }));
      const s = DB.getSettings();
      s.workDaysLeft = s.totalWorkdays || 22;
      DB.saveObligations(obs); DB.saveSettings(s);
      renderSettings(); renderDashboard();
      toast('Bulan baru dimulai! 💪', 'success');
    });
  });

  document.getElementById('clearAllData')?.addEventListener('click', () => {
    showConfirm('Hapus Semua Data', '⚠️ SEMUA data akan dihapus permanen! Backup dulu ya.', () => {
      ['df_wallets','df_settings','df_obligations','df_transactions','df_budgets','df_templates','df_goals','df_recurring','df_nw_assets','df_nw_debts','df_nw_history','df_wallet_meta'].forEach(k => localStorage.removeItem(k));
      toast('Semua data dihapus', 'info');
      navigateTo('dashboard');
    });
  });

  document.getElementById('exportData')?.addEventListener('click', exportData);
  document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importDataInput')?.click());
  document.getElementById('importDataInput')?.addEventListener('change', e => importData(e.target.files?.[0]));
  document.getElementById('exportPDFBtn')?.addEventListener('click', generatePDFReport);

  document.querySelectorAll('.view-all-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); navigateTo('history'); });
  });

  // Init data
  renderWalletSettings();
  showOnboardingIfNeeded();
  renderDashboard();

  // Schedule notifications if already granted
  if (Notification?.permission === 'granted') scheduleNotifications();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
