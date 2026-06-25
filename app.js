const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  getWallets() { const w = this.get('df_wallets'); if (!Object.keys(w || {}).length) return { }; return w || { }; },
  getSettings() { return this.get('df_settings') || { targetBNI: 0, dailyLimit: 0, workDaysLeft: 0, totalWorkdays: 0, name: '' }; },
  getObligations() { return this.get('df_obligations') || []; },
  getTransactions() { return this.get('df_transactions') || []; },
  getBudgets() { return this.get('df_budgets') || {}; },
  getTemplates() { return this.get('df_templates') || []; },
  getWalletMeta() { return this.get('df_wallet_meta') || {}; },
  saveWalletMeta(v) { this.set('df_wallet_meta', v); },
  saveWallets(v) { this.set('df_wallets', v); },
  saveSettings(v) { this.set('df_settings', v); },
  saveObligations(v) { this.set('df_obligations', v); },
  saveTransactions(v) { this.set('df_transactions', v); },
  saveBudgets(v) { this.set('df_budgets', v); },
  saveTemplates(v) { this.set('df_templates', v); },
  generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
};

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

function toast(msg, type = 'info') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]}"></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('hiding'); setTimeout(() => el.remove(), 300); }, 3200);
}

function showModal(id) { document.getElementById(id).style.display = ''; document.body.style.overflow = 'hidden'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = ''; }

function showConfirm(title, msg, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = msg;
  showModal('confirmModal');
  const okBtn = document.getElementById('confirmOk');
  const newOk = okBtn.cloneNode(true);
  okBtn.replaceWith(newOk);
  newOk.addEventListener('click', () => { hideModal('confirmModal'); onOk(); });
}

let walletDonutChart = null;
let budgetChart = null;
let cicilanChart = null;

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
  const totalKewajiban = (s.workDaysLeft * s.dailyLimit) + unpaidObs;
  const duitFree = available - totalKewajiban;
  return { totalDana, totalKewajiban, duitFree, unpaidObs };
}

function computeBurnoutPrediction() {
  const s = DB.getSettings();
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
    document.getElementById('notifDot').style.display = '';
  } else {
    card.classList.remove('minus');
    document.getElementById('duitfreeStatus').textContent = duitFree === 0 ? 'Pas-pasan' : 'Saldo Aman ✓';
    document.getElementById('notifDot').style.display = 'none';
  }

  const wg = document.getElementById('walletsGrid');
  const wallets = Object.keys(w);
  wg.innerHTML = wallets.map(key => {
    const name = (key === 'cash') ? 'Cash' : (key === 'spay' ? 'ShopeePay' : key.toUpperCase());
    return `
      <div class="wallet-card" data-wallet="${key}">
        <div class="wallet-header">
          <div class="wallet-icon ${key}"><i class="fa-solid fa-wallet"></i></div>
          <span class="wallet-name">${name}</span>
        </div>
        <div class="wallet-amount" data-amount-id="${key}">${formatRp(w[key])}</div>
        <div class="wallet-locked">
          <i class="fa-solid fa-lock"></i>
          <span data-locked-id="${key}">Target: ${formatRp(s.targetBNI, true)}</span>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('workdaysLeftDisplay').textContent = s.workDaysLeft;
  document.getElementById('dailyLimitDisplay').textContent = formatRp(s.dailyLimit);

  const today = todayDateStr();
  const todaySpent = txs.filter(t => t.date === today && t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  document.getElementById('remainingDailyQuota').textContent = formatRp(Math.max(0, s.dailyLimit - todaySpent));

  const burnout = computeBurnoutPrediction();
  document.getElementById('burnoutPrediction').textContent = burnout || 'Belum ada data';

  const totalWd = s.totalWorkdays || 22;
  const pct = totalWd > 0 ? Math.min(100, ((totalWd - s.workDaysLeft) / totalWd) * 100) : 0;
  document.getElementById('workdaysBar').style.width = pct + '%';

  renderDonut(w, totalBalance);
  document.getElementById('chartCenterVal').textContent = formatRp(totalBalance, true);

  renderDashboardBudgetBars();

  const obList = document.getElementById('obligationsList');
  if (obs.length === 0) {
    obList.innerHTML = '<div class="empty-state"><i class="fa-solid fa-check-circle"></i><p>Tidak ada kewajiban</p></div>';
  } else {
    obList.innerHTML = obs.map(o => `
      <div class="obligation-item ${o.isPaid ? 'paid' : ''}" data-id="${o.id}">
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
  document.getElementById('totalObligationsUnpaid').textContent = formatRp(unpaidObs);

  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const recentEl = document.getElementById('recentTransactions');
  if (sorted.length === 0) {
    recentEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-receipt"></i><p>Belum ada transaksi</p></div>';
  } else {
    recentEl.innerHTML = sorted.map(t => renderTxItem(t)).join('');
    recentEl.querySelectorAll('.tx-item').forEach(el => {
      el.addEventListener('click', () => openEditModal(el.dataset.id));
    });
  }

  const nameEl = document.querySelector('.welcome-heading');
  if (nameEl && s.name) nameEl.textContent = `Hai, ${s.name} 👋`;
  else if (nameEl) nameEl.textContent = 'Selamat Datang 👋';

  populateWalletSelects();
}

function populateWalletSelects() {
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const keys = Object.keys(wallets);
  const optionHtml = keys.map(k => `<option value="${k}">${(meta[k] && meta[k].name) ? meta[k].name : (k === 'cash' ? 'Cash' : k.toUpperCase())}</option>`).join('');
  ['txSourceWallet','txDestWallet','modalTxSourceWallet','modalTxDestWallet','editTxWallet','filterWallet'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = (id === 'filterWallet' ? '<option value="">Semua Dompet</option>' : '') + optionHtml;
    if (prev && [...el.options].some(o => o.value === prev)) el.value = prev;
  });
}

function renderOnboardingModal() {
  const settings = DB.getSettings();
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const el = document.getElementById('onboardingModal');
  if (!el) return;
  const container = el.querySelector('.modal-body');
  
  const customizedWallets = Object.keys(wallets).filter(k => meta[k] && meta[k].name);
  const rows = customizedWallets.map(k => {
    const m = meta[k] || {};
    return `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
        <input class="form-input onboard-wallet-name" data-wallet="${k}" value="${(m.name||k).replace(/"/g,'')}">
        <input class="form-input amount-input onboard-wallet-balance" data-wallet="${k}" value="${Number(wallets[k]||0).toLocaleString('id-ID')}">
        <input class="form-input onboard-wallet-syn" data-wallet="${k}" placeholder="Sinonim, koma-separasi" value="${m.synonyms? (Array.isArray(m.synonyms)? m.synonyms.join(',') : m.synonyms) : ''}">
      </div>`;
  }).join('');

  container.innerHTML = `
    <div style="padding-bottom:12px"><b>Selamat datang di MyWallet!</b><br/>Masukkan nama Anda dan atur dompet yang ingin dikelola.</div>
    <div style="margin-bottom:12px"><input id="onboardName" class="form-input" placeholder="Nama Anda" value="${settings.name || ''}"></div>
    ${rows ? `<div style="margin-bottom:8px;font-size:12px;color:var(--text-secondary)">Dompet yang dikustomisasi:</div>` : ''}
    <div style="max-height:240px;overflow-auto;margin-bottom:12px">${rows || '<div style="font-size:13px;color:var(--text-muted);padding:12px;text-align:center">Belum ada dompet. Buat dompet pertama Anda di bawah.</div>'}</div>
    <div style="margin-bottom:8px;font-size:12px;color:var(--text-secondary)">Tambah Dompet Baru:</div>
    <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
      <input id="newWalletName" class="form-input" placeholder="Nama dompet (cth: BNI, Dana)" style="flex:1;min-width:120px">
      <input id="newWalletBalance" class="form-input amount-input" placeholder="Saldo awal" value="0" style="flex:0.8;min-width:80px">
      <button id="onboardAddWallet" class="btn-secondary" style="padding:8px 12px;font-size:12px;white-space:nowrap">+ Tambah</button>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end"><button class="btn-secondary" id="onboardingSkipBtn">Lewati</button><button class="btn-primary" id="onboardingSaveBtn">Simpan</button></div>
  `;
  
  container.querySelectorAll('.amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));
  
  const addWalletBtn = container.querySelector('#onboardAddWallet');
  if (addWalletBtn) {
    addWalletBtn.addEventListener('click', () => {
      const nameInput = container.querySelector('#newWalletName');
      const balanceInput = container.querySelector('#newWalletBalance');
      const name = (nameInput?.value || '').trim();
      if (!name) { toast('Masukkan nama dompet', 'error'); return; }
      
      const key = slugify(name);
      const w = DB.getWallets();
      const m = DB.getWalletMeta();
      if (w[key]) { toast('Dompet sudah ada', 'warning'); return; }
      
      w[key] = parseRpInput(balanceInput?.value || '0');
      m[key] = { name: name, type: 'wallet', synonyms: [] };
      DB.saveWallets(w);
      DB.saveWalletMeta(m);
      nameInput.value = '';
      balanceInput.value = '0';
      renderOnboardingModal();
      toast('Dompet ditambahkan', 'success');
    });
  }
  
  const saveBtn = container.querySelector('#onboardingSaveBtn');
  const skipBtn = container.querySelector('#onboardingSkipBtn');
  if (saveBtn) saveBtn.addEventListener('click', handleOnboardSave);
  if (skipBtn) skipBtn.addEventListener('click', () => { DB.saveSettings(Object.assign({}, DB.getSettings(), { _onboarded: 1 })); hideModal('onboardingModal'); });
}

function showOnboardingIfNeeded() {
  const s = DB.getSettings();
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const walletKeys = Object.keys(wallets).filter(k => wallets[k] !== 0 || meta[k]?.name);
  const needsOnboarding = !s || !s.name || walletKeys.length === 0;
  if (needsOnboarding) {
    renderOnboardingModal();
    showModal('onboardingModal');
  }
}

function handleOnboardSave() {
  const name = (document.getElementById('onboardName')?.value || '').trim();
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  document.querySelectorAll('.onboard-wallet-name').forEach(inp => {
    const key = inp.dataset.wallet;
    const val = inp.value.trim();
    if (!meta[key]) meta[key] = {};
    meta[key].name = val || key;
  });
  document.querySelectorAll('.onboard-wallet-balance').forEach(inp => {
    const key = inp.dataset.wallet;
    wallets[key] = parseRpInput(inp.value);
  });
  document.querySelectorAll('.onboard-wallet-syn').forEach(inp => {
    const key = inp.dataset.wallet;
    const v = inp.value.trim();
    meta[key] = meta[key] || {};
    meta[key].synonyms = v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
  });
  DB.saveWallets(wallets);
  DB.saveWalletMeta(meta);
  DB.saveSettings(Object.assign({}, DB.getSettings(), { name: name || DB.getSettings().name || '', _onboarded: 1 }));
  hideModal('onboardingModal');
  renderWalletSettings();
  renderDashboard();
  toast('Onboarding selesai', 'success');
}

function renderDashboardBudgetBars() {
  const budgets = DB.getBudgets();
  const txs = DB.getTransactions();
  const currentMonth = getCurrentMonthKey();
  const el = document.getElementById('dashboardBudgetBars');

  const activeBudgets = Object.entries(budgets);
  if (!activeBudgets.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px 0">Belum ada budget. Set di halaman Budget.</div>';
    return;
  }

  const monthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense');
  el.innerHTML = activeBudgets.map(([cat, limit]) => {
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
  const ctx = document.getElementById('walletDonutChart').getContext('2d');
  const meta = DB.getWalletMeta();
  const keys = Object.keys(w);
  const data = keys.map(k => Number(w[k] || 0));
  const labels = keys.map(k => (meta[k] && meta[k].name) ? meta[k].name : (k === 'cash' ? 'Cash' : k.toUpperCase()));
  const hasData = data.some(v => v > 0);
  const colorPool = ['rgba(43,110,246,0.85)','rgba(16,185,129,0.85)','rgba(2f,209,102,0.85)','rgba(139,92,246,0.85)','rgba(251,113,133,0.85)'];
  const bg = hasData ? keys.map((_, i) => colorPool[i % colorPool.length]) : keys.map(() => 'rgba(255,255,255,0.05)');
  if (walletDonutChart) walletDonutChart.destroy();
  walletDonutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: hasData ? data : keys.map(() => 1), backgroundColor: bg, borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatRp(ctx.raw)}` } } }
    }
  });
}

function renderTxItem(t) {
  const catIcon = CAT_ICONS[t.category] || 'fa-solid fa-circle-dot';
  const meta = DB.getWalletMeta();
  const walletLabel = (meta[t.sourceWallet] && meta[t.sourceWallet].name) ? meta[t.sourceWallet].name : t.sourceWallet || '';
  const destLabel = (meta[t.destWallet] && meta[t.destWallet].name) ? meta[t.destWallet].name : (t.destWallet || '');
  const amountStr = t.type === 'expense' ? '-' + formatRp(t.amount) : t.type === 'income' ? '+' + formatRp(t.amount) : '→ ' + formatRp(t.amount);
  const sub = t.note ? t.note : (t.type === 'transfer' ? `${walletLabel} → ${destLabel}` : walletLabel);
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon ${t.type}"><i class="${catIcon}"></i></div>
      <div class="tx-meta">
        <div class="tx-title">${t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : t.type === 'transfer' ? 'Transfer' : 'Transaksi'}</div>
        <div class="tx-sub">${sub} · ${formatDate(t.date)}</div>
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

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'wallet_' + Date.now().toString(36);
}

function renderWalletSettings() {
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const list = document.getElementById('walletsSettingsList');
  if (!list) return;
  const keys = Object.keys(wallets);
  if (!keys.length) { list.innerHTML = '<div class="empty-state">Belum ada dompet. Tambah dompet baru di bawah.</div>'; return; }
  list.innerHTML = keys.map(k => {
    const m = meta[k] || {};
    const name = m.name || (k === 'cash' ? 'Cash' : k.toUpperCase());
    const type = m.type || 'cash';
    const target = m.target ? m.target : '';
    return `
      <div class="wallet-settings-row" data-wallet="${k}" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input class="form-input wallet-name-input" data-wallet="${k}" value="${name}" />
        <select class="form-input wallet-type-select" data-wallet="${k}">
          <option value="bank" ${type==='bank'?'selected':''}>Bank</option>
          <option value="cash" ${type==='cash'?'selected':''}>Cash</option>
          <option value="ewallet" ${type==='ewallet'?'selected':''}>E-Wallet</option>
        </select>
        <input class="form-input amount-input wallet-balance-input" data-wallet="${k}" value="${Number(wallets[k]||0).toLocaleString('id-ID')}" />
        <input class="form-input wallet-target-input" data-wallet="${k}" placeholder="Target (opsional)" value="${target ? Number(target).toLocaleString('id-ID') : ''}" />
        <button class="btn-secondary btn-sm wallet-delete-btn" data-wallet="${k}">Hapus</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.wallet-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const key = btn.dataset.wallet;
      showConfirm('Hapus Dompet', `Hapus dompet "${key}"? Transaksi terkait tidak akan diubah.`, () => deleteWallet(key));
    });
  });
  list.querySelectorAll('.amount-input').forEach(inp => inp.addEventListener('input', () => formatInputRp(inp)));
}

function deleteWallet(key) {
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  delete wallets[key];
  delete meta[key];
  DB.saveWallets(wallets);
  DB.saveWalletMeta(meta);
  renderWalletSettings();
  renderDashboard();
  toast('Dompet dihapus', 'info');
}

function addWalletFromForm() {
  const nameEl = document.getElementById('newWalletName');
  const typeEl = document.getElementById('newWalletType');
  const balEl = document.getElementById('newWalletBalance');
  const name = nameEl.value.trim();
  if (!name) { toast('Masukkan nama dompet', 'error'); return; }
  const key = slugify(name);
  const wallets = DB.getWallets();
  if (wallets[key] !== undefined) { toast('Dompet sudah ada, gunakan nama lain', 'warning'); return; }
  const balance = parseRpInput(balEl.value);
  wallets[key] = balance;
  const meta = DB.getWalletMeta();
  meta[key] = { name, type: typeEl.value, target: 0 };
  DB.saveWallets(wallets);
  DB.saveWalletMeta(meta);
  nameEl.value = '';
  balEl.value = '';
  renderWalletSettings();
  renderDashboard();
  toast(`Dompet "${name}" ditambahkan`, 'success');
}

let currentTxType = 'expense';
let currentTxCategory = '';
let modalTxType = 'expense';
let modalTxCategory = '';

function buildCategoryGrid(containerId, type, selectedCat, onSelect) {
  const cats = CATEGORIES[type] || [];
  const el = document.getElementById(containerId);
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
  const destId = isModal ? 'modalDestGroup' : 'destWalletGroup';
  const catGroup = isModal ? 'modalCategoryGroup' : 'categoryGroup';
  const catGrid = isModal ? 'modalCategoryGrid' : 'categoryGrid';
  const srcLabel = isModal ? 'modalSourceLabel' : 'sourceWalletLabel';
  const saveTplGroup = document.getElementById('saveTemplateGroup');

  document.getElementById(destId).style.display = type === 'transfer' ? '' : 'none';
  document.getElementById(catGroup).style.display = type === 'transfer' ? 'none' : '';
  document.getElementById(srcLabel).textContent = type === 'transfer' ? 'Dari Dompet' : 'Dompet';
  if (!isModal && saveTplGroup) saveTplGroup.style.display = type === 'transfer' ? 'none' : '';

  if (type !== 'transfer') {
    buildCategoryGrid(catGrid, type, '', (cat) => {
      if (context === 'modal') modalTxCategory = cat;
      else currentTxCategory = cat;
    });
  }
}

function submitTransaction(type, dateId, amountId, srcWalletId, destWalletId, noteId, catGetter) {
  const amount = parseRpInput(document.getElementById(amountId).value);
  const date = document.getElementById(dateId).value;
  const sourceWallet = document.getElementById(srcWalletId).value;
  const note = document.getElementById(noteId).value.trim();
  const category = catGetter();

  if (!amount || amount <= 0) { toast('Masukkan nominal yang valid', 'error'); return false; }
  if (!date) { toast('Pilih tanggal transaksi', 'error'); return false; }
  if (type !== 'transfer' && !category) { toast('Pilih kategori transaksi', 'warning'); return false; }

  const wallets = DB.getWallets();
  const txs = DB.getTransactions();

  if (type === 'expense') {
    if ((wallets[sourceWallet] || 0) < amount) { toast('Saldo tidak mencukupi', 'warning'); return false; }
    wallets[sourceWallet] -= amount;
  } else if (type === 'income') {
    wallets[sourceWallet] = (wallets[sourceWallet] || 0) + amount;
  } else if (type === 'transfer') {
    const destWallet = document.getElementById(destWalletId).value;
    if (sourceWallet === destWallet) { toast('Dompet asal dan tujuan tidak boleh sama', 'error'); return false; }
    if ((wallets[sourceWallet] || 0) < amount) { toast('Saldo tidak mencukupi', 'warning'); return false; }
    wallets[sourceWallet] -= amount;
    wallets[destWallet] = (wallets[destWallet] || 0) + amount;
    txs.push({ id: DB.generateId(), type, amount, sourceWallet, destWallet, category: 'transfer', note, date });
    DB.saveWallets(wallets);
    DB.saveTransactions(txs);
    return true;
  }

  txs.push({ id: DB.generateId(), type, amount, sourceWallet, destWallet: null, category, note, date });
  DB.saveWallets(wallets);
  DB.saveTransactions(txs);

  checkBudgetAlert(category, amount);
  return true;
}

function checkBudgetAlert(category, amount) {
  const budgets = DB.getBudgets();
  if (!budgets[category]) return;
  const txs = DB.getTransactions();
  const currentMonth = getCurrentMonthKey();
  const spent = txs.filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense' && t.category === category).reduce((a, t) => a + t.amount, 0) + amount;
  const limit = budgets[category];
  const pct = (spent / limit) * 100;
  if (pct >= 100) setTimeout(() => toast(`Budget ${category} sudah habis! (${formatRp(spent, true)}/${formatRp(limit, true)})`, 'error'), 600);
  else if (pct >= 80) setTimeout(() => toast(`Budget ${category} tersisa ${Math.round(100 - pct)}%`, 'warning'), 600);
}

let pendingChatTxs = [];
let chatSelectedDate = null;

function guessCategoryFromText(text) {
  if (!text) return '';
  const t = text.toLowerCase();
  for (const c of CATEGORIES.expense) {
    if ((c.label || '').toLowerCase() && t.includes(c.label.toLowerCase())) return c.id;
    if ((c.id || '') && t.includes(c.id.toLowerCase())) return c.id;
  }
  for (const c of CATEGORIES.income) {
    if ((c.label || '').toLowerCase() && t.includes(c.label.toLowerCase())) return c.id;
    if ((c.id || '') && t.includes(c.id.toLowerCase())) return c.id;
  }
  return '';
}

function parseChatToTransactions(text) {
  const cleaned = (text || '').toLowerCase();
  const parts = cleaned.replace(/[.,]/g, ' ').split(/\s+/).filter(Boolean);
  const wallets = DB.getWallets();
  const meta = DB.getWalletMeta();
  const selectedDate = chatSelectedDate || todayDateStr();

  const findWalletKey = token => {
    if (!token) return null;
    const keyToken = token.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!keyToken) return null;
    if (wallets[keyToken] !== undefined) return keyToken;
    for (const k of Object.keys(meta)) {
      const m = meta[k] || {};
      const name = (m.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (name && name.includes(keyToken)) return k;
      if (m.synonyms) {
        const syns = Array.isArray(m.synonyms) ? m.synonyms : String(m.synonyms).split(',').map(s => s.trim());
        for (const s of syns) {
          if (!s) continue;
          const ss = s.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (ss && (ss === keyToken || ss.includes(keyToken) || keyToken.includes(ss))) return k;
        }
      }
    }
    if (['cash', 'tunai'].includes(keyToken)) return Object.keys(wallets).find(k => k === 'cash') || null;
    if (keyToken.includes('shopee') || keyToken.includes('spay')) return Object.keys(wallets).find(k => k.includes('spay')) || null;
    if (keyToken.includes('bni') || keyToken.includes('bank')) return Object.keys(wallets).find(k => k.includes('bni')) || null;
    return null;
  };

  const incomeWords = ['terima','dapat','masuk','menerima','gaji','gajian','bonus','diterima','penerimaan','nambah','tambah'];
  const transferWords = ['transfer','kirim','pindah','pindahkan','topup','top up','isi'];
  const expenseWords = ['habis','pakai','bayar','beli','belanja','keluar','tarik','pakai','bayar'];

  const intents = [];

  for (let i = 0; i < parts.length; i++) {
    let p = parts[i];
    if (/^\d{1,2}$/.test(p)) {
      const num = parseInt(p);
      if (num <= 31 && !parts[i].endsWith('k') && parts[i + 1] !== 'k') continue;
    }
    p = p.replace(/^rp/, '').replace(/^rps?/, '');
    const m = p.match(/^(\d+(?:[\.,]\d+)?)(k?)$/);
    if (m) {
      let num = parseFloat(m[1].replace(',', '.')) || 0;
      if (m[2] === 'k') num = num * 1000;
      let nearbyWallets = [];
      for (let j = Math.max(0, i - 4); j <= Math.min(parts.length - 1, i + 4); j++) {
        const w = findWalletKey(parts[j]);
        if (w && !nearbyWallets.includes(w)) nearbyWallets.push(w);
      }
      let src = null, dst = null;
      const windowText = parts.slice(Math.max(0, i - 6), Math.min(parts.length, i + 7)).join(' ');
      const hasTransferVerb = transferWords.some(v => windowText.includes(v));
      const dariIdx = windowText.indexOf('dari');
      const keIdx = windowText.indexOf(' ke ');
      if (dariIdx !== -1 && keIdx !== -1) {
        const afterDari = windowText.slice(dariIdx + 4, keIdx).trim().split(/\s+/)[0];
        const afterKe = windowText.slice(keIdx + 3).trim().split(/\s+/)[0];
        src = findWalletKey(afterDari) || null;
        dst = findWalletKey(afterKe) || null;
      }
      if (!src && !dst && nearbyWallets.length >= 2 && hasTransferVerb) {
        src = nearbyWallets[0]; dst = nearbyWallets[1];
      }

      const firstWallet = nearbyWallets[0] || null;

      let type = 'expense';
      if (incomeWords.some(w => cleaned.includes(w))) type = 'income';
      if (hasTransferVerb || (src && dst)) type = 'transfer';

      const category = guessCategoryFromText(cleaned) || (type === 'income' ? 'gaji' : 'lainnya');

      const confidence = ((type === 'transfer' && src && dst) || ((type !== 'transfer') && firstWallet)) ? 'high' : 'low';

      intents.push({ type, amount: Math.round(num), sourceWallet: type === 'income' ? null : (src || firstWallet), destWallet: type === 'transfer' ? (dst || (nearbyWallets[1] || null)) : null, category, confidence });
    }
  }

  return intents;
}

function appendChatLog(msg, who = 'user') {
  const el = document.getElementById('chatLog');
  if (!el) return;
  const wrapper = document.createElement('div');
  wrapper.style.marginBottom = '6px';
  wrapper.innerHTML = `<div style="font-size:12px;color:${who==='user'? 'var(--text-primary)':'var(--text-secondary)'}">${msg}</div>`;
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
    if (!src) return { ok: false, msg: 'Dompet sumber tidak ditemukan' };
    if ((wallets[src] || 0) < intent.amount) return { ok: false, msg: 'Saldo tidak mencukupi' };
    wallets[src] -= intent.amount;
    txs.push({ id: DB.generateId(), type: 'expense', amount: intent.amount, sourceWallet: src, destWallet: null, category: intent.category || 'lainnya', note: 'Dicatat via chat', date });
    DB.saveWallets(wallets);
    DB.saveTransactions(txs);
    return { ok: true, label: (meta[src] && meta[src].name) ? meta[src].name : src };
  }

  if (intent.type === 'income') {
    const dest = intent.destWallet || intent.sourceWallet;
    if (!dest) return { ok: false, msg: 'Dompet tujuan tidak ditemukan' };
    wallets[dest] = (wallets[dest] || 0) + intent.amount;
    txs.push({ id: DB.generateId(), type: 'income', amount: intent.amount, sourceWallet: dest, destWallet: null, category: intent.category || 'gaji', note: 'Dicatat via chat', date });
    DB.saveWallets(wallets);
    DB.saveTransactions(txs);
    return { ok: true, label: (meta[dest] && meta[dest].name) ? meta[dest].name : dest };
  }

  if (intent.type === 'transfer') {
    const src = intent.sourceWallet;
    const dst = intent.destWallet;
    if (!src || !dst) return { ok: false, msg: 'Dompet asal/tujuan tidak lengkap' };
    if ((wallets[src] || 0) < intent.amount) return { ok: false, msg: 'Saldo tidak mencukupi di dompet asal' };
    wallets[src] -= intent.amount;
    wallets[dst] = (wallets[dst] || 0) + intent.amount;
    txs.push({ id: DB.generateId(), type: 'transfer', amount: intent.amount, sourceWallet: src, destWallet: dst, category: 'transfer', note: 'Dicatat via chat', date });
    DB.saveWallets(wallets);
    DB.saveTransactions(txs);
    return { ok: true, labelSrc: (meta[src] && meta[src].name) ? meta[src].name : src, labelDst: (meta[dst] && meta[dst].name) ? meta[dst].name : dst };
  }

  return { ok: false, msg: 'Tipe intent tidak dikenali' };
}

function renderPendingChatUI() {
  const el = document.getElementById('chatLog');
  if (!el) return;
  el.querySelectorAll('.pending-chat-container').forEach(c => c.remove());
  if (!pendingChatTxs.length) return;
  const container = document.createElement('div');
  container.className = 'pending-chat-container';
  container.style.padding = '8px';
  container.style.border = '1px solid var(--border)';
  container.style.background = 'var(--bg-card)';
  container.style.borderRadius = '8px';
  container.style.marginTop = '6px';

  const meta = DB.getWalletMeta();

  let inner = '<div style="font-size:13px;font-weight:600;margin-bottom:8px">Periksa transaksi berikut sebelum disimpan:</div>';
  inner += '<div style="display:flex;flex-direction:column;gap:8px">';
  pendingChatTxs.forEach(p => {
    const it = p.intent;
    let desc = '';
    if (it.type === 'expense') desc = `Pengeluaran ${formatRp(it.amount)} dari ${((meta[it.sourceWallet] && meta[it.sourceWallet].name) || it.sourceWallet)}`;
    else if (it.type === 'income') desc = `Pemasukan ${formatRp(it.amount)} ke ${((meta[it.destWallet] && meta[it.destWallet].name) || it.destWallet || it.sourceWallet)}`;
    else if (it.type === 'transfer') desc = `Transfer ${formatRp(it.amount)} dari ${((meta[it.sourceWallet] && meta[it.sourceWallet].name) || it.sourceWallet)} → ${((meta[it.destWallet] && meta[it.destWallet].name) || it.destWallet)}`;
    inner += `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between"><div style="font-size:13px">${desc}</div><div><button class="btn-primary btn-sm" data-pid="${p.id}" onclick="confirmPendingChat('${p.id}')">Simpan</button> <button class="btn-secondary btn-sm" data-pid="${p.id}" onclick="ignorePendingChat('${p.id}')">Lewati</button></div></div>`;
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
  if (!res.ok) {
    appendChatLog(`Gagal menyimpan: ${res.msg}`, 'bot');
    pendingChatTxs.splice(idx, 1);
    renderPendingChatUI();
    return;
  }
  if (item.intent.type === 'transfer') appendChatLog(`Dicatat transfer: ${formatRp(item.intent.amount)} dari ${res.labelSrc} → ${res.labelDst}`, 'bot');
  else appendChatLog(`Dicatat: ${item.intent.type === 'income' ? '+' : '-'}${formatRp(item.intent.amount)} ${item.intent.type === 'income' ? 'ke' : 'dari'} ${res.label || ''}`, 'bot');
  pendingChatTxs.splice(idx, 1);
  renderPendingChatUI();
  renderDashboard();
}

function ignorePendingChat(pid) {
  const idx = pendingChatTxs.findIndex(p => p.id === pid);
  if (idx === -1) return;
  const item = pendingChatTxs[idx];
  appendChatLog(`Diabaikan: ${item.intent.type} ${formatRp(item.intent.amount)}`, 'bot');
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
    appendChatLog('Maaf, tidak menemukan nominal/dompet pada input. Coba: "habis 19k cash dan 10k spay"', 'bot');
    input.value = '';
    return;
  }

  const wallets = DB.getWallets();
  const toApply = [];
  const toConfirm = [];

  intents.forEach(it => {
    if (it.type === 'expense') {
      const wk = it.sourceWallet || Object.keys(wallets)[0];
      if (wk && (wallets[wk] || 0) >= it.amount && it.confidence === 'high') toApply.push(Object.assign({}, it, { sourceWallet: wk }));
      else toConfirm.push(Object.assign({}, it, { sourceWallet: wk }));
    } else if (it.type === 'income') {
      const dst = it.destWallet || it.sourceWallet || Object.keys(wallets)[0];
      if (dst && it.confidence === 'high') toApply.push(Object.assign({}, it, { sourceWallet: dst }));
      else toConfirm.push(Object.assign({}, it, { destWallet: dst }));
    } else if (it.type === 'transfer') {
      if (it.sourceWallet && it.destWallet && it.confidence === 'high' && (wallets[it.sourceWallet] || 0) >= it.amount) toApply.push(it);
      else toConfirm.push(it);
    }
  });

  if (toApply.length) {
    toApply.forEach(a => {
      const aWithDate = Object.assign({}, a, { date: chatSelectedDate || todayDateStr() });
      const res = applyIntent(aWithDate);
      if (!res.ok) appendChatLog(`Gagal menyimpan: ${res.msg}`, 'bot');
      else {
        if (a.type === 'transfer') appendChatLog(`Dicatat transfer: ${formatRp(a.amount)}`, 'bot');
        else appendChatLog(`Dicatat: ${a.type === 'income' ? '+' : '-'}${formatRp(a.amount)}`, 'bot');
      }
    });
    renderDashboard();
  }

  if (toConfirm.length) {
    toConfirm.forEach(it => pendingChatTxs.push({ id: DB.generateId(), intent: Object.assign({}, it, { date: chatSelectedDate || todayDateStr() }) }));
    appendChatLog('Beberapa transaksi perlu konfirmasi. Silakan periksa dan tekan "Simpan" jika benar.', 'bot');
    renderPendingChatUI();
  }

  input.value = '';
  chatSelectedDate = null;
  const dateInput = document.getElementById('chatDate');
  if (dateInput) dateInput.value = '';
}

function openEditModal(id) {
  const txs = DB.getTransactions();
  const tx = txs.find(t => t.id === id);
  if (!tx) return;
  document.getElementById('editTxId').value = id;
  document.getElementById('editTxAmount').value = tx.amount.toLocaleString('id-ID');
  document.getElementById('editTxDate').value = tx.date;
  document.getElementById('editTxWallet').value = tx.sourceWallet;
  document.getElementById('editTxNote').value = tx.note || '';
  showModal('editModal');
}

function renderHistory() {
  const txs = DB.getTransactions();
  const filterMonth = document.getElementById('filterMonth').value;
  const filterWallet = document.getElementById('filterWallet').value;
  const filterType = document.getElementById('filterType').value;
  const filterCat = document.getElementById('filterCat').value;

  let filtered = txs.filter(t => {
    if (filterMonth && getMonthKey(t.date) !== filterMonth) return false;
    if (filterWallet && t.sourceWallet !== filterWallet) return false;
    if (filterType && t.type !== filterType) return false;
    if (filterCat && t.category !== filterCat) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalIn = filtered.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const net = totalIn - totalOut;

  document.getElementById('historyStats').innerHTML = `
    <div class="stat-chip"><div class="stat-chip-label">Pemasukan</div><div class="stat-chip-value green">${formatRp(totalIn, true)}</div></div>
    <div class="stat-chip"><div class="stat-chip-label">Pengeluaran</div><div class="stat-chip-value red">${formatRp(totalOut, true)}</div></div>
    <div class="stat-chip"><div class="stat-chip-label">Selisih</div><div class="stat-chip-value ${net >= 0 ? 'green' : 'red'}">${formatRp(net, true)}</div></div>
  `;

  const listEl = document.getElementById('historyList');
  if (!filtered.length) { listEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Tidak ada transaksi ditemukan</p></div>'; return; }

  const grouped = {};
  filtered.forEach(t => { if (!grouped[t.date]) grouped[t.date] = []; grouped[t.date].push(t); });

  listEl.innerHTML = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(dateKey => {
    const items = grouped[dateKey];
    const dayTotal = items.reduce((a, t) => t.type === 'income' ? a + t.amount : t.type === 'expense' ? a - t.amount : a, 0);
    const meta = DB.getWalletMeta();
    const wallets = DB.getWallets();
    const walletLabels = Object.keys(wallets).reduce((acc, k) => { acc[k] = (meta[k] && meta[k].name) ? meta[k].name : (k === 'cash' ? 'Cash' : k.toUpperCase()); return acc; }, {});
    return `
      <div class="history-date-group">
        <div class="history-date-header">${formatDateGroup(dateKey)}<span style="float:right;color:${dayTotal >= 0 ? 'var(--green)' : 'var(--red)'}">${dayTotal >= 0 ? '+' : ''}${formatRp(dayTotal, true)}</span></div>
        ${items.map(t => {
          const catIcon = CAT_ICONS[t.category] || 'fa-solid fa-circle-dot';
          const walletLabel = walletLabels[t.sourceWallet] || t.sourceWallet;
          const destLabel = walletLabels[t.destWallet] || '';
          const amountStr = t.type === 'expense' ? '-' + formatRp(t.amount) : t.type === 'income' ? '+' + formatRp(t.amount) : '→ ' + formatRp(t.amount);
          const sub = t.note ? t.note : (t.type === 'transfer' ? `${walletLabel} → ${destLabel}` : walletLabel);
          return `
            <div class="history-tx-item" data-id="${t.id}">
              <div class="tx-icon ${t.type}"><i class="${catIcon}"></i></div>
              <div class="tx-meta">
                <div class="tx-title">${t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : 'Transfer'}</div>
                <div class="tx-sub">${sub} · <span class="badge ${t.sourceWallet}">${walletLabel}</span></div>
              </div>
              <div class="tx-amount ${t.type}">${amountStr}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.history-tx-item').forEach(el => {
    el.addEventListener('click', () => openEditModal(el.dataset.id));
  });
}

function populateMonthFilter() {
  const txs = DB.getTransactions();
  const months = [...new Set(txs.map(t => getMonthKey(t.date)))].sort((a, b) => b.localeCompare(a));
  const currentMonth = getCurrentMonthKey();
  const el = document.getElementById('filterMonth');
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

function formatMonthLabel(ym) {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

let calendarDate = new Date();
let selectedCalDay = null;

function renderCalendar() {
  const txs = DB.getTransactions();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById('calMonthLabel').textContent = new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayDateStr();

  const txByDay = {};
  txs.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = t.date;
      if (!txByDay[key]) txByDay[key] = [];
      txByDay[key].push(t);
    }
  });

  const grid = document.getElementById('calendarGrid');
  const dayHeaders = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  let html = dayHeaders.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, -firstDay + i + 1);
    html += `<div class="cal-day other-month"><div class="cal-day-num">${prevDate.getDate()}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === today;
    const isSelected = dateStr === selectedCalDay;
    const dayTxs = txByDay[dateStr] || [];
    const totalOut = dayTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const hasIncome = dayTxs.some(t => t.type === 'income');
    const hasExpense = dayTxs.some(t => t.type === 'expense');
    const hasTransfer = dayTxs.some(t => t.type === 'transfer');
    let dots = '';
    if (hasExpense) dots += '<div class="cal-dot expense"></div>';
    if (hasIncome) dots += '<div class="cal-dot income"></div>';
    if (hasTransfer) dots += '<div class="cal-dot transfer"></div>';
    html += `
      <div class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
        <div class="cal-day-num">${d}</div>
        ${dots ? `<div class="cal-day-dots">${dots}</div>` : ''}
        ${totalOut > 0 ? `<div class="cal-day-amount">${formatRp(totalOut, true)}</div>` : ''}
      </div>
    `;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.other-month)').forEach(el => {
    el.addEventListener('click', () => {
      selectedCalDay = el.dataset.date;
      renderCalendar();
      showCalDayDetail(el.dataset.date, txByDay[el.dataset.date] || []);
    });
  });

  if (selectedCalDay) {
    const month2 = new Date(selectedCalDay + 'T00:00:00').getMonth();
    if (month2 === month) showCalDayDetail(selectedCalDay, txByDay[selectedCalDay] || []);
  }
}

function showCalDayDetail(dateStr, dayTxs) {
  const el = document.getElementById('calDayDetail');
  if (!dayTxs.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i><p>Tidak ada transaksi</p></div>';
    return;
  }
  el.innerHTML = dayTxs.map(t => renderTxItem(t)).join('');
  el.querySelectorAll('.tx-item').forEach(item => {
    item.addEventListener('click', () => openEditModal(item.dataset.id));
  });
}

function renderBudgetPage() {
  const budgets = DB.getBudgets();
  const txs = DB.getTransactions();
  const currentMonth = getCurrentMonthKey();
  const monthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth && t.type === 'expense');

  const el = document.getElementById('budgetList');
  const entries = Object.entries(budgets);

  if (!entries.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bullseye"></i><p>Belum ada budget. Tambahkan di atas.</p></div>';
  } else {
    el.innerHTML = entries.map(([cat, limit]) => {
      const spent = monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0);
      const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
      const cls = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : 'safe';
      const icon = CAT_ICONS[cat] || 'fa-solid fa-circle-dot';
      return `
        <div class="budget-item">
          <div class="budget-item-header">
            <div class="budget-item-left">
              <div class="budget-item-icon"><i class="${icon}"></i></div>
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

  const budgetCatSelect = document.getElementById('budgetCatSelect');
  budgetCatSelect.innerHTML = CATEGORIES.expense.map(c => `<option value="${c.id}">${c.label}</option>`).join('');

  renderBudgetChart(budgets, monthTxs);
}

function deleteBudget(cat) {
  const budgets = DB.getBudgets();
  delete budgets[cat];
  DB.saveBudgets(budgets);
  renderBudgetPage();
  toast(`Budget ${cat} dihapus`, 'success');
}

function renderBudgetChart(budgets, monthTxs) {
  const ctx = document.getElementById('budgetChart').getContext('2d');
  const entries = Object.entries(budgets);
  if (!entries.length) return;

  const labels = entries.map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1));
  const spentData = entries.map(([cat, _]) => monthTxs.filter(t => t.category === cat).reduce((a, t) => a + t.amount, 0));
  const limitData = entries.map(([_, limit]) => limit);

  if (budgetChart) budgetChart.destroy();
  budgetChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Terpakai', data: spentData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
        { label: 'Budget', data: limitData, backgroundColor: 'rgba(99,102,241,0.3)', borderRadius: 6 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8b8fa8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8b8fa8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8b8fa8', font: { size: 11 }, callback: v => formatRp(v, true) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

let cicilanData = null;

function hitungCicilan() {
  const pokok = parseRpInput(document.getElementById('cicilanPokok').value);
  const dp = parseRpInput(document.getElementById('cicilanDP').value);
  const bungaPersen = parseFloat(document.getElementById('cicilanBunga').value) || 0;
  const tenor = parseInt(document.getElementById('cicilanTenor').value) || 0;
  const tipe = document.getElementById('cicilanTipe').value;

  if (!pokok || !tenor) { toast('Masukkan data lengkap', 'error'); return; }

  const pinjaman = pokok - dp;
  if (pinjaman <= 0) { toast('DP melebihi harga', 'error'); return; }

  const bungaBulan = (bungaPersen / 100) / 12;
  let cicilanPerBulan;
  let rows = [];

  if (tipe === 'flat') {
    const bungaPerBulan = pinjaman * (bungaPersen / 100) / 12;
    const pokokPerBulan = pinjaman / tenor;
    cicilanPerBulan = pokokPerBulan + bungaPerBulan;
    let sisa = pinjaman;
    for (let i = 1; i <= tenor; i++) {
      sisa -= pokokPerBulan;
      rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok: pokokPerBulan, bunga: bungaPerBulan, sisa: Math.max(0, sisa) });
    }
  } else {
    if (bungaBulan === 0) {
      cicilanPerBulan = pinjaman / tenor;
      let sisa = pinjaman;
      for (let i = 1; i <= tenor; i++) {
        sisa -= cicilanPerBulan;
        rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok: cicilanPerBulan, bunga: 0, sisa: Math.max(0, sisa) });
      }
    } else {
      cicilanPerBulan = pinjaman * (bungaBulan * Math.pow(1 + bungaBulan, tenor)) / (Math.pow(1 + bungaBulan, tenor) - 1);
      let sisa = pinjaman;
      for (let i = 1; i <= tenor; i++) {
        const bunga = sisa * bungaBulan;
        const pokok = cicilanPerBulan - bunga;
        sisa -= pokok;
        rows.push({ bulan: i, angsuran: cicilanPerBulan, pokok, bunga, sisa: Math.max(0, sisa) });
      }
    }
  }

  cicilanData = { rows, cicilanPerBulan, total: cicilanPerBulan * tenor + dp };

  document.getElementById('cicilanPerBulan').textContent = formatRp(cicilanPerBulan);
  document.getElementById('cicilanTotal').textContent = formatRp(cicilanData.total);

  const tbody = document.querySelector('#amortizationTable tbody');
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.bulan}</td>
      <td>${formatRp(r.angsuran, true)}</td>
      <td>${formatRp(r.pokok, true)}</td>
      <td>${formatRp(r.bunga, true)}</td>
      <td>${formatRp(r.sisa, true)}</td>
    </tr>
  `).join('');

  renderCicilanChart(rows);
  document.getElementById('cicilanResult').style.display = '';
}

function renderCicilanChart(rows) {
  const ctx = document.getElementById('cicilanChart').getContext('2d');
  if (cicilanChart) cicilanChart.destroy();
  cicilanChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: rows.map(r => `Bln ${r.bulan}`),
      datasets: [{
        label: 'Sisa Hutang',
        data: rows.map(r => r.sisa),
        borderColor: 'rgba(99,102,241,0.9)',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true, tension: 0.4, pointRadius: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b8fa8', font: { size: 10 }, maxTicksLimit: 12 }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8b8fa8', font: { size: 10 }, callback: v => formatRp(v, true) }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderQuickTemplateBar() {
  const templates = DB.getTemplates();
  const el = document.getElementById('quickTemplateBar');
  if (!el) return;
  if (!templates.length) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = templates.map(t => `
    <div class="template-chip" data-id="${t.id}">
      <i class="${CAT_ICONS[t.category] || 'fa-solid fa-circle-dot'}"></i>
      ${t.name}
    </div>
  `).join('');
  el.querySelectorAll('.template-chip').forEach(chip => {
    chip.addEventListener('click', () => applyTemplate(chip.dataset.id));
  });
}

function applyTemplate(id) {
  const templates = DB.getTemplates();
  const tpl = templates.find(t => t.id === id);
  if (!tpl) return;

  document.getElementById('txAmount').value = tpl.amount.toLocaleString('id-ID');
  document.getElementById('txDate').value = todayDateStr();
  const wallets = DB.getWallets();
  const walletKeys = Object.keys(wallets);
  document.getElementById('txSourceWallet').value = walletKeys.includes(tpl.wallet) ? tpl.wallet : (walletKeys[0] || 'cash');
  document.getElementById('txNote').value = tpl.note || '';

  document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === tpl.type));
  setTxType(tpl.type, 'page');
  currentTxCategory = tpl.category;

  setTimeout(() => {
    const grid = document.getElementById('categoryGrid');
    if (grid) {
      grid.querySelectorAll('.category-chip').forEach(c => {
        c.classList.toggle('selected', c.dataset.cat === tpl.category);
      });
    }
  }, 50);

  toast(`Template "${tpl.name}" diterapkan`, 'success');
}

function renderTemplateModal() {
  const templates = DB.getTemplates();
  const el = document.getElementById('templateList');
  if (!templates.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bolt"></i><p>Belum ada template. Buat transaksi dan centang "Simpan sebagai template".</p></div>';
    return;
  }
  el.innerHTML = templates.map(t => {
    const wallets = DB.getWallets();
    const meta = DB.getWalletMeta();
    const walletLabels = Object.keys(wallets).reduce((acc, k) => { acc[k] = (meta[k] && meta[k].name) ? meta[k].name : (k === 'cash' ? 'Cash' : k.toUpperCase()); return acc; }, {});
    return `
      <div class="template-list-item" data-id="${t.id}">
        <div class="template-list-item-left">
          <div class="template-list-item-name"><i class="${CAT_ICONS[t.category] || 'fa-solid fa-circle-dot'}" style="margin-right:6px"></i>${t.name}</div>
          <div class="template-list-item-meta">${t.category} · ${walletLabels[t.wallet] || t.wallet} · ${t.type}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="template-list-item-amount">${formatRp(t.amount, true)}</div>
          <button class="btn-icon-sm" onclick="deleteTemplate('${t.id}');event.stopPropagation()"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.template-list-item').forEach(item => {
    item.addEventListener('click', () => {
      applyTemplate(item.dataset.id);
      hideModal('templateModal');
      navigateTo('transactions');
    });
  });
}

function deleteTemplate(id) {
  const templates = DB.getTemplates().filter(t => t.id !== id);
  DB.saveTemplates(templates);
  renderTemplateModal();
  renderQuickTemplateBar();
  toast('Template dihapus', 'success');
}

async function callAI(prompt, data) {
  const gasUrl = DEFAULT_GAS_URL;

  try {
    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai_insight', prompt, data })
    });

    if (!res.ok) throw new Error('Request gagal: ' + res.statusText);

    const json = await res.json();
    return json.result || 'Tidak ada respons dari AI';
  } catch (e) {
    toast('Error: ' + e.message, 'error');
    throw e;
  }
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  const titles = {
    dashboard: 'Dashboard', transactions: 'Catat Transaksi',
    history: 'Riwayat', settings: 'Pengaturan',
    calendar: 'Kalender', budget: 'Budget', cicilan: 'Kalkulator Cicilan', ai: 'AI Insight'
  };
  document.getElementById('pageTitle').textContent = titles[page] || '';

  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  if (page === 'dashboard') renderDashboard();
  if (page === 'history') { populateMonthFilter(); populateCatFilter(); renderHistory(); }
  if (page === 'settings') renderSettings();
  if (page === 'transactions') {
    document.getElementById('txDate').value = todayDateStr();
    setTxType('expense', 'page');
    document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === 'expense'));
    renderQuickTemplateBar();
    populateWalletSelects();
  }
  if (page === 'calendar') { selectedCalDay = todayDateStr(); renderCalendar(); }
  if (page === 'budget') renderBudgetPage();

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildAIData() {
  const txs = DB.getTransactions();
  const wallets = DB.getWallets();
  const settings = DB.getSettings();
  const obligations = DB.getObligations();
  const budgets = DB.getBudgets();
  const { duitFree } = computeDuitFree();
  const currentMonth = getCurrentMonthKey();
  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTxs = txs.filter(t => new Date(t.date) >= threeMonthsAgo);
  const currentMonthTxs = txs.filter(t => getMonthKey(t.date) === currentMonth);

  const spendingByCategory = {};
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
  });

  const dailySpending = {};
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    dailySpending[t.date] = (dailySpending[t.date] || 0) + t.amount;
  });

  return {
    wallets,
    settings,
    duitFree,
    obligations,
    budgets,
    currentMonth: {
      income: currentMonthTxs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0),
      expense: currentMonthTxs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
      spendingByCategory,
      dailySpending,
      transactionCount: currentMonthTxs.length
    },
    last3MonthsSummary: (() => {
      const summary = {};
      recentTxs.forEach(t => {
        const mk = getMonthKey(t.date);
        if (!summary[mk]) summary[mk] = { income: 0, expense: 0 };
        if (t.type === 'income') summary[mk].income += t.amount;
        if (t.type === 'expense') summary[mk].expense += t.amount;
      });
      return summary;
    })()
  };
}

const AI_PROMPTS = {
  summary: 'Buat ringkasan komprehensif keuangan bulan ini. Soroti tren pengeluaran per kategori, bandingkan dengan bulan sebelumnya jika ada data, dan berikan penilaian kesehatan keuangan secara keseluruhan.',
  predict: 'Berdasarkan pola pengeluaran bulan ini, prediksi kondisi keuangan di akhir bulan. Hitung estimasi sisa saldo di MyWallet dan kapan mungkin dana habis jika pola berlanjut.',
  tips: 'Identifikasi 3-5 peluang konkret untuk berhemat berdasarkan pola pengeluaran. Berikan estimasi penghematan yang bisa dicapai.',
  anomaly: 'Deteksi pengeluaran yang tidak biasa atau anomali dalam data transaksi. Bandingkan dengan rata-rata dan flagging hari/kategori yang mencurigakan.',
  cashflow: 'Analisis arus kas 3 bulan terakhir. Apakah tren membaik atau memburuk? Berikan rekomendasi untuk memperbaiki cash flow.',
  goal: 'Evaluasi target tabungan BNI yang ditetapkan. Apakah realistis berdasarkan pola pengeluaran saat ini? Berikan saran untuk mencapai target.'
};

async function runAIInsight(promptKey, customPrompt) {
  const resultSection = document.getElementById('aiResultSection');
  const loading = document.getElementById('aiLoadingIndicator');
  const content = document.getElementById('aiResultContent');

  resultSection.style.display = '';
  loading.style.display = 'flex';
  content.innerHTML = '';
  content.style.display = 'none';

  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const data = buildAIData();
    const prompt = customPrompt || AI_PROMPTS[promptKey];
    const result = await callAI(prompt, data);
    loading.style.display = 'none';
    content.style.display = '';
    content.innerHTML = result;
  } catch (e) {
    loading.style.display = 'none';
    content.style.display = '';
    content.innerHTML = `<div style="color:var(--red)"><i class="fa-solid fa-circle-xmark" style="margin-right:8px"></i>${e.message}</div>`;
  }
}

function renderSettings() {
  const s = DB.getSettings();
  const obs = DB.getObligations();

  document.getElementById('settingTargetBni').value = s.targetBNI ? s.targetBNI.toLocaleString('id-ID') : '';
  document.getElementById('settingDailyLimit').value = s.dailyLimit ? s.dailyLimit.toLocaleString('id-ID') : '';
  document.getElementById('settingWorkdays').value = s.workDaysLeft ?? '';
  document.getElementById('settingTotalWorkdays').value = s.totalWorkdays ?? '';
  document.getElementById('settingName').value = s.name || '';

  const obsEl = document.getElementById('obligationsSettings');
  if (!obs.length) {
    obsEl.innerHTML = '<div class="empty-state"><i class="fa-solid fa-list-check"></i><p>Belum ada kewajiban tetap</p></div>';
  } else {
    obsEl.innerHTML = obs.map(o => `
      <div class="obligation-setting-item">
        <span class="obligation-setting-name">${o.name} ${o.isPaid ? '<span style="color:var(--green);font-size:11px">(Lunas)</span>' : ''}</span>
        <span class="obligation-setting-amount">${formatRp(o.amount)}</span>
        <button class="btn-icon-sm" onclick="deleteObligation('${o.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('');
  }
}

function deleteObligation(id) {
  showConfirm('Hapus Kewajiban', 'Yakin ingin menghapus kewajiban ini?', () => {
    DB.saveObligations(DB.getObligations().filter(o => o.id !== id));
    renderSettings();
    renderDashboard();
    toast('Kewajiban dihapus', 'success');
  });
}

function exportData() {
  const data = {
    wallets: DB.getWallets(),
    settings: DB.getSettings(),
    obligations: DB.getObligations(),
    transactions: DB.getTransactions(),
    budgets: DB.getBudgets(),
    templates: DB.getTemplates(),
    exportedAt: new Date().toISOString(),
    version: '2.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mywallet-backup-${todayDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data berhasil diekspor', 'success');
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
      toast('Data berhasil dipulihkan', 'success');
      navigateTo('dashboard');
    } catch { toast('File tidak valid', 'error'); }
  };
  reader.readAsText(file);
}

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
  document.querySelectorAll('#themeIconSidebar, #themeIconTop').forEach(i => {
    i.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });
  const txt = document.getElementById('themeTextSidebar');
  if (txt) txt.textContent = isDark ? 'Dark Mode' : 'Light Mode';
  if (walletDonutChart) { const w = DB.getWallets(); renderDonut(w, w.bni + w.cash + w.spay); }
}

function setCurrentDate() {
  const d = new Date();
  document.getElementById('currentDateDisplay').textContent = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.classList.remove('open');
}

let pwaPrompt = null;

function initPWA() {
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const updateInstallState = () => {
    const btn = document.getElementById('settingsInstallBtn');
    const installed = document.getElementById('settingsInstalledText');
    const hint = document.getElementById('settingsInstallHint');
    if (!btn) return;

    if (isStandalone()) {
      btn.style.display = 'none';
      if (installed) installed.style.display = 'block';
      if (hint) hint.textContent = 'Aplikasi sudah berjalan dari homescreen.';
      return;
    }

    btn.style.display = 'inline-flex';
    if (installed) installed.style.display = 'none';
    if (hint) {
      hint.textContent = pwaPrompt
        ? 'Klik tombol install untuk menambahkan MyWallet ke homescreen.'
        : 'Jika prompt tidak muncul, buka menu browser lalu pilih Install app atau Add to Home Screen.';
    }
  };

  const promptInstall = async () => {
    if (!pwaPrompt) {
      toast('Gunakan menu browser: Install app atau Add to Home Screen', 'info');
      updateInstallState();
      return;
    }
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      document.getElementById('pwa-install-bar').style.display = 'none';
      toast('MyWallet berhasil diinstall!', 'success');
    }
    pwaPrompt = null;
    updateInstallState();
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    pwaPrompt = e;
    const dismissed = localStorage.getItem('df_pwa_dismissed');
    if (!dismissed) document.getElementById('pwa-install-bar').style.display = 'flex';
    updateInstallState();
  });

  window.addEventListener('appinstalled', () => {
    pwaPrompt = null;
    document.getElementById('pwa-install-bar').style.display = 'none';
    updateInstallState();
  });

  document.getElementById('pwa-install-btn')?.addEventListener('click', promptInstall);
  document.getElementById('settingsInstallBtn')?.addEventListener('click', promptInstall);

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    document.getElementById('pwa-install-bar').style.display = 'none';
    localStorage.setItem('df_pwa_dismissed', '1');
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  updateInstallState();
}

function initApp() {
  initTheme();
  setCurrentDate();
  initPWA();

  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.id = 'sidebarOverlay';
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);
  sidebarOverlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });

  document.getElementById('mobileMenuBtn')?.addEventListener('click', openSidebar);
  document.getElementById('notifBtn')?.addEventListener('click', openSidebar);
  document.getElementById('themeToggleSidebar').addEventListener('click', toggleTheme);
  document.getElementById('themeToggleTop').addEventListener('click', toggleTheme);

  document.getElementById('openTransactionModal').addEventListener('click', () => {
    modalTxCategory = '';
    modalTxType = 'expense';
    document.getElementById('modalTxAmount').value = '';
    document.getElementById('modalTxDate').value = todayDateStr();
    document.getElementById('modalTxNote').value = '';
    document.getElementById('modalDestGroup').style.display = 'none';
    document.getElementById('modalCategoryGroup').style.display = '';
    document.querySelectorAll('.type-tab[data-context="modal"]').forEach(b => b.classList.toggle('active', b.dataset.type === 'expense'));
    setTxType('expense', 'modal');
    populateWalletSelects();
    showModal('transactionModal');
  });

  document.getElementById('openTemplateModal').addEventListener('click', () => {
    renderTemplateModal();
    showModal('templateModal');
  });

  document.getElementById('openChatBtn')?.addEventListener('click', () => {
    document.getElementById('chatBox').style.display = '';
    document.getElementById('chatToggle').style.display = 'none';
    document.getElementById('chatInput').focus();
  });

  document.getElementById('chatSend')?.addEventListener('click', () => handleChatInput());
  document.getElementById('chatInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleChatInput(); });
  document.getElementById('chatClose')?.addEventListener('click', () => { document.getElementById('chatBox').style.display = 'none'; document.getElementById('chatToggle').style.display = ''; });
  document.getElementById('chatToggle')?.addEventListener('click', () => {
    const box = document.getElementById('chatBox');
    const toggle = document.getElementById('chatToggle');
    if (box.style.display === 'none' || !box.style.display) { box.style.display = 'flex'; toggle.style.display = 'none'; document.getElementById('chatInput').focus(); }
  });
  document.getElementById('chatDateBtn')?.addEventListener('click', () => {
    const dateInput = document.getElementById('chatDate');
    chatSelectedDate = dateInput.value || todayDateStr();
    appendChatLog(`Tanggal transaksi: ${new Date(chatSelectedDate + 'T00:00:00').toLocaleDateString('id-ID')}`, 'bot');
  });
  document.getElementById('chatDate')?.addEventListener('change', () => {
    const btn = document.getElementById('chatDateBtn');
    if (btn) btn.click();
  });

  document.getElementById('addWalletBtn')?.addEventListener('click', () => addWalletFromForm());
  document.getElementById('newWalletBalance')?.addEventListener('input', (e) => formatInputRp(e.target));
  renderWalletSettings();
  showOnboardingIfNeeded();

  document.getElementById('closeModal').addEventListener('click', () => hideModal('transactionModal'));
  document.getElementById('closeEditModal').addEventListener('click', () => hideModal('editModal'));
  document.getElementById('closeConfirmModal').addEventListener('click', () => hideModal('confirmModal'));
  document.getElementById('confirmCancel').addEventListener('click', () => hideModal('confirmModal'));
  document.getElementById('closeTemplateModal').addEventListener('click', () => hideModal('templateModal'));
  document.getElementById('closeCalDayModal').addEventListener('click', () => hideModal('calDayModal'));

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) hideModal(m.id); });
  });

  document.querySelectorAll('.type-tab[data-context="modal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-tab[data-context="modal"]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTxType(btn.dataset.type, 'modal');
    });
  });

  document.getElementById('modalTxAmount').addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('modalTransactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const ok = submitTransaction(modalTxType, 'modalTxDate', 'modalTxAmount', 'modalTxSourceWallet', 'modalTxDestWallet', 'modalTxNote', () => modalTxCategory);
    if (ok) {
      hideModal('transactionModal');
      toast('Transaksi berhasil dicatat!', 'success');
      const { duitFree } = computeDuitFree();
      if (duitFree < 0) setTimeout(() => toast('Peringatan: Saldo AF kamu minus!', 'warning'), 500);
      renderDashboard();
    }
  });

  document.getElementById('txDate').value = todayDateStr();
  setTxType('expense', 'page');
  document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === 'expense');
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setTxType(btn.dataset.type, 'page');
    });
  });

  document.querySelectorAll('input.amount-input').forEach(inp => {
    inp.addEventListener('input', () => formatInputRp(inp));
  });

  document.getElementById('saveAsTemplate').addEventListener('change', function() {
    document.getElementById('templateName').style.display = this.checked ? '' : 'none';
  });

  document.getElementById('transactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const ok = submitTransaction(currentTxType, 'txDate', 'txAmount', 'txSourceWallet', 'txDestWallet', 'txNote', () => currentTxCategory);
    if (ok) {
      const saveAsTpl = document.getElementById('saveAsTemplate').checked;
      if (saveAsTpl && currentTxType !== 'transfer') {
        const tplName = document.getElementById('templateName').value.trim() || (currentTxCategory || 'Template');
        const templates = DB.getTemplates();
        templates.push({
          id: DB.generateId(),
          name: tplName,
          type: currentTxType,
          amount: parseRpInput(document.getElementById('txAmount').value),
          category: currentTxCategory,
          wallet: document.getElementById('txSourceWallet').value,
          note: document.getElementById('txNote').value.trim()
        });
        DB.saveTemplates(templates);
        toast(`Template "${tplName}" disimpan`, 'success');
        document.getElementById('saveAsTemplate').checked = false;
        document.getElementById('templateName').style.display = 'none';
        document.getElementById('templateName').value = '';
        renderQuickTemplateBar();
      }

      document.getElementById('txAmount').value = '';
      document.getElementById('txNote').value = '';
      currentTxCategory = '';
      setTxType(currentTxType, 'page');
      document.querySelectorAll('.type-tab:not([data-context="modal"])').forEach(b => b.classList.toggle('active', b.dataset.type === currentTxType));
      toast('Transaksi berhasil dicatat!', 'success');
      const { duitFree } = computeDuitFree();
      if (duitFree < 0) setTimeout(() => toast('Peringatan: Saldo AF kamu minus!', 'warning'), 500);
      renderDashboard();
    }
  });

  document.getElementById('editTransactionForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('editTxId').value;
    const newAmount = parseRpInput(document.getElementById('editTxAmount').value);
    const newDate = document.getElementById('editTxDate').value;
    const newNote = document.getElementById('editTxNote').value.trim();
    const newWallet = document.getElementById('editTxWallet').value;

    if (!newAmount || newAmount <= 0) { toast('Nominal tidak valid', 'error'); return; }

    const txs = DB.getTransactions();
    const idx = txs.findIndex(t => t.id === id);
    if (idx === -1) return;

    const old = txs[idx];
    const wallets = DB.getWallets();

    if (old.type === 'expense') {
      wallets[old.sourceWallet] += old.amount;
      if (wallets[newWallet] < newAmount) { toast('Saldo tidak mencukupi', 'warning'); wallets[old.sourceWallet] -= old.amount; return; }
      wallets[newWallet] -= newAmount;
    } else if (old.type === 'income') {
      wallets[old.sourceWallet] -= old.amount;
      wallets[newWallet] += newAmount;
    }

    txs[idx] = { ...old, amount: newAmount, date: newDate, note: newNote, sourceWallet: newWallet };
    DB.saveWallets(wallets);
    DB.saveTransactions(txs);
    hideModal('editModal');
    toast('Transaksi diperbarui', 'success');
    renderDashboard();
    if (document.getElementById('page-history').classList.contains('active')) renderHistory();
    if (document.getElementById('page-calendar').classList.contains('active')) renderCalendar();
  });

  document.getElementById('editTxAmount').addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('deleteTransaction').addEventListener('click', () => {
    const id = document.getElementById('editTxId').value;
    showConfirm('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini? Saldo akan dikembalikan.', () => {
      const txs = DB.getTransactions();
      const idx = txs.findIndex(t => t.id === id);
      if (idx === -1) return;
      const old = txs[idx];
      const wallets = DB.getWallets();
      if (old.type === 'expense') wallets[old.sourceWallet] += old.amount;
      else if (old.type === 'income') wallets[old.sourceWallet] -= old.amount;
      else if (old.type === 'transfer') { wallets[old.sourceWallet] += old.amount; wallets[old.destWallet] -= old.amount; }
      txs.splice(idx, 1);
      DB.saveWallets(wallets);
      DB.saveTransactions(txs);
      hideModal('editModal');
      toast('Transaksi dihapus', 'success');
      renderDashboard();
      if (document.getElementById('page-history').classList.contains('active')) renderHistory();
      if (document.getElementById('page-calendar').classList.contains('active')) renderCalendar();
    });
  });

  document.getElementById('filterMonth').addEventListener('change', renderHistory);
  document.getElementById('filterWallet').addEventListener('change', renderHistory);
  document.getElementById('filterType').addEventListener('change', renderHistory);
  document.getElementById('filterCat').addEventListener('change', renderHistory);

  document.getElementById('calPrev').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    selectedCalDay = null;
    renderCalendar();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    selectedCalDay = null;
    renderCalendar();
  });

  document.getElementById('saveBudget').addEventListener('click', () => {
    const cat = document.getElementById('budgetCatSelect').value;
    const amount = parseRpInput(document.getElementById('budgetAmount').value);
    if (!amount || amount <= 0) { toast('Masukkan nominal budget', 'error'); return; }
    const budgets = DB.getBudgets();
    budgets[cat] = amount;
    DB.saveBudgets(budgets);
    document.getElementById('budgetAmount').value = '';
    renderBudgetPage();
    toast(`Budget ${cat} diset ${formatRp(amount, true)}`, 'success');
  });

  document.getElementById('budgetAmount').addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('hitungCicilan').addEventListener('click', hitungCicilan);
  document.querySelectorAll('#page-cicilan .amount-input').forEach(inp => {
    inp.addEventListener('input', () => formatInputRp(inp));
  });

  document.querySelectorAll('.ai-prompt-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ai-prompt-card').forEach(c => c.style.borderColor = '');
      card.style.borderColor = 'var(--accent)';
      runAIInsight(card.dataset.prompt, null);
    });
  });

  document.getElementById('aiCustomSend').addEventListener('click', () => {
    const prompt = document.getElementById('aiCustomPrompt').value.trim();
    if (!prompt) { toast('Masukkan pertanyaan', 'warning'); return; }
    runAIInsight(null, prompt);
    document.getElementById('aiCustomPrompt').value = '';
  });

  document.getElementById('aiCustomPrompt').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('aiCustomSend').click();
  });

  document.querySelectorAll('#page-settings .amount-input').forEach(inp => {
    inp.addEventListener('input', () => formatInputRp(inp));
  });

  document.getElementById('saveWallets').addEventListener('click', () => {
    const rows = document.querySelectorAll('#walletsSettingsList .wallet-settings-row');
    const wallets = DB.getWallets();
    const meta = DB.getWalletMeta();
    rows.forEach(row => {
      const key = row.dataset.wallet;
      const name = (row.querySelector('.wallet-name-input')?.value || key).trim();
      const type = row.querySelector('.wallet-type-select')?.value || 'cash';
      const balance = parseRpInput(row.querySelector('.wallet-balance-input')?.value);
      const target = parseRpInput(row.querySelector('.wallet-target-input')?.value || '');
      wallets[key] = balance;
      meta[key] = { name, type, target: target || 0 };
    });
    DB.saveWallets(wallets);
    DB.saveWalletMeta(meta);
    toast('Saldo dompet diperbarui', 'success');
    renderDashboard();
    renderWalletSettings();
  });

  document.getElementById('saveSettings').addEventListener('click', () => {
    DB.saveSettings({
      targetBNI: parseRpInput(document.getElementById('settingTargetBni').value),
      dailyLimit: parseRpInput(document.getElementById('settingDailyLimit').value),
      workDaysLeft: parseInt(document.getElementById('settingWorkdays').value) || 0,
      totalWorkdays: parseInt(document.getElementById('settingTotalWorkdays').value) || 22,
      name: document.getElementById('settingName').value.trim()
    });
    toast('Pengaturan disimpan', 'success');
    renderDashboard();
  });

  document.getElementById('addObligation').addEventListener('click', () => {
    const name = document.getElementById('newObligationName').value.trim();
    const amount = parseRpInput(document.getElementById('newObligationAmount').value);
    if (!name) { toast('Masukkan nama kewajiban', 'error'); return; }
    if (!amount || amount <= 0) { toast('Masukkan nominal yang valid', 'error'); return; }
    const obs = DB.getObligations();
    obs.push({ id: DB.generateId(), name, amount, isPaid: false });
    DB.saveObligations(obs);
    document.getElementById('newObligationName').value = '';
    document.getElementById('newObligationAmount').value = '';
    renderSettings();
    renderDashboard();
    toast(`Kewajiban "${name}" ditambahkan`, 'success');
  });

  document.getElementById('newObligationAmount').addEventListener('input', function() { formatInputRp(this); });

  document.getElementById('resetMonth').addEventListener('click', () => {
    showConfirm('Mulai Bulan Baru', 'Ini akan mereset status kewajiban dan sisa hari kerja. Lanjutkan?', () => {
      const obs = DB.getObligations().map(o => ({ ...o, isPaid: false }));
      const s = DB.getSettings();
      s.workDaysLeft = s.totalWorkdays || 0;
      DB.saveObligations(obs);
      DB.saveSettings(s);
      renderSettings();
      renderDashboard();
      toast('Bulan baru dimulai! Semangat 💪', 'success');
    });
  });

  document.getElementById('clearAllData').addEventListener('click', () => {
    showConfirm('Hapus Semua Data', 'PERINGATAN: Semua data akan dihapus permanen! Pastikan sudah backup dulu.', () => {
      ['df_wallets','df_settings','df_obligations','df_transactions','df_budgets','df_templates'].forEach(k => localStorage.removeItem(k));
      toast('Semua data dihapus', 'info');
      navigateTo('dashboard');
    });
  });

  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importDataInput').click());
  document.getElementById('importDataInput').addEventListener('change', e => importData(e.target.files[0]));

  document.querySelectorAll('.view-all-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); navigateTo('history'); });
  });

  renderDashboard();
}

document.addEventListener('DOMContentLoaded', initApp);
