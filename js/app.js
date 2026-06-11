/* ===== 日付ユーティリティ ===== */

const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function daysUntil(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/* ===== データモデル ===== */

// 起動時から登録済みのフェイクデータ
// nextDate = 今日 + N日 で計算するため、いつ実行しても「あと◯日」が正しく表示される
let items = [
  {
    id: 1,
    name: 'トイレットペーパー',
    lastStore: 'マルエツ',
    cycledays: 30,
    nextDate: addDays(today, 2),
  },
  {
    id: 2,
    name: '食器用洗剤',
    lastStore: 'マルエツ',
    cycledays: 60,
    nextDate: addDays(today, 5),
  },
  {
    id: 3,
    name: 'シャンプー',
    lastStore: 'ウエルシア',
    cycledays: 45,
    nextDate: addDays(today, 12),
  },
];

// スキャン用プリセットレシート
const presetReceipt = {
  store: 'マルエツ ◯◯店',
  date: today,
  items: [
    { id: 'r1', name: 'トイレットペーパー 12ロール', price: 398 },
    { id: 'r2', name: '食器用洗剤', price: 298 },
    { id: 'r3', name: '牛乳', price: 208 },
    { id: 'r4', name: '卵', price: 228 },
    { id: 'r5', name: '食パン', price: 158 },
  ],
};

// 画面3→4で受け渡すデータ
let newlyScannedItems = [];

/* ===== 画面遷移 ===== */

function showScreen(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${n}`);
  target.classList.add('active');
  target.scrollTop = 0;

  if (n === 1) renderHome();
  if (n === 3) renderScanResult();
  if (n === 4) renderCycleSetup();
}

/* ===== 画面1：ホーム ===== */

function renderHome() {
  const sorted = [...items].sort(
    (a, b) => new Date(a.nextDate) - new Date(b.nextDate)
  );

  // 通知バナー（一番期限が近い商品）
  const banner = document.getElementById('notification-banner');
  if (sorted.length > 0) {
    const first = sorted[0];
    const days = daysUntil(first.nextDate);
    banner.innerHTML = `
      <span class="notif-icon">🔔</span>
      <span><strong>${first.name}</strong>、あと${days}日で切れそう</span>
    `;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }

  // 商品カード一覧
  const list = document.getElementById('items-list');
  list.innerHTML = '';

  if (sorted.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#BBB;margin-top:40px;font-size:14px;">商品がまだ登録されていません</p>';
    return;
  }

  const label = document.createElement('p');
  label.className = 'items-list-label';
  label.textContent = '期限が近い順';
  list.appendChild(label);

  sorted.forEach(item => {
    const days = daysUntil(item.nextDate);
    const urgent = days <= 3;

    const card = document.createElement('div');
    card.className = `item-card${urgent ? ' item-card--urgent' : ''}`;
    card.innerHTML = `
      <div class="item-info">
        <span class="item-name">${item.name}</span>
        <span class="item-store">📍 ${item.lastStore}</span>
      </div>
      <div class="item-days${urgent ? ' item-days--urgent' : ''}">
        <span class="days-num">${days}</span>
        <span class="days-label">日後</span>
      </div>
    `;
    list.appendChild(card);
  });
}

/* ===== 画面2：撮影 ===== */

function fakeCapture() {
  const btn = document.getElementById('shutter-btn');
  const overlay = document.getElementById('loading-overlay');

  btn.disabled = true;
  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
    btn.disabled = false;
    showScreen(3);
  }, 1300);
}

/* ===== 画面3：読み取り結果 ===== */

function renderScanResult() {
  document.getElementById('scan-date').textContent = formatDate(presetReceipt.date);
  document.getElementById('scan-store').textContent = presetReceipt.store;

  const container = document.getElementById('scan-items');
  container.innerHTML = '';

  presetReceipt.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'scan-item';
    row.innerHTML = `
      <label class="scan-item-label">
        <input type="checkbox" class="scan-checkbox" data-id="${item.id}" checked>
        <span class="scan-item-name">${item.name}</span>
        <span class="scan-item-price">¥${item.price}</span>
      </label>
    `;
    container.appendChild(row);
  });
}

function recordItems() {
  const checked = document.querySelectorAll('.scan-checkbox:checked');
  newlyScannedItems = [];

  checked.forEach(cb => {
    const found = presetReceipt.items.find(i => i.id === cb.dataset.id);
    if (found) newlyScannedItems.push({ ...found });
  });

  showScreen(4);
}

/* ===== 画面4：サイクル設定 ===== */

function renderCycleSetup() {
  const container = document.getElementById('cycle-items');
  container.innerHTML = '';

  if (newlyScannedItems.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#BBB;margin-top:40px;font-size:14px;">商品が選択されていません</p>';
    return;
  }

  newlyScannedItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cycle-item';
    div.dataset.itemId = item.id;
    div.innerHTML = `
      <label class="cycle-checkbox-label">
        <input type="checkbox" class="cycle-checkbox" data-id="${item.id}">
        <span class="cycle-item-name">${item.name}</span>
      </label>
      <div class="cycle-options" id="cycle-opts-${item.id}" style="display:none">
        <p class="cycle-label">使い切るまでの日数</p>
        <div class="cycle-presets">
          ${[7, 14, 30, 60].map(d => `
            <button
              class="cycle-preset-btn"
              data-days="${d}"
              data-item="${item.id}"
              onclick="selectCycle(this)"
            >${d}日</button>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(div);

    // チェック状態に応じてサイクル選択を表示/非表示
    const cb = div.querySelector('.cycle-checkbox');
    cb.addEventListener('change', function () {
      const opts = document.getElementById(`cycle-opts-${item.id}`);
      opts.style.display = this.checked ? 'block' : 'none';
    });
  });
}

function selectCycle(btn) {
  const itemId = btn.dataset.item;
  document.querySelectorAll(`.cycle-preset-btn[data-item="${itemId}"]`)
    .forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function saveCycles() {
  const checked = document.querySelectorAll('.cycle-checkbox:checked');

  checked.forEach(cb => {
    const itemId = cb.dataset.id;
    const selectedBtn = document.querySelector(
      `.cycle-preset-btn.selected[data-item="${itemId}"]`
    );
    if (!selectedBtn) return;

    const cycleDays = parseInt(selectedBtn.dataset.days, 10);
    const scanned = newlyScannedItems.find(i => i.id === itemId);
    if (!scanned) return;

    // 商品名の正規化（"トイレットペーパー 12ロール" → "トイレットペーパー"）
    const baseName = scanned.name.replace(/\s+\d+.*$/, '').trim();

    // 既存アイテムと名前でマッチング
    const existingIdx = items.findIndex(
      i => i.name === baseName
        || scanned.name.includes(i.name)
        || i.name.includes(baseName)
    );

    if (existingIdx >= 0) {
      // 既存アイテムを更新
      items[existingIdx].nextDate  = addDays(today, cycleDays);
      items[existingIdx].cycledays = cycleDays;
      items[existingIdx].lastStore = presetReceipt.store;
    } else {
      // 新規追加
      items.push({
        id: Date.now() + Math.random(),
        name: baseName,
        lastStore: presetReceipt.store,
        cycledays: cycleDays,
        nextDate: addDays(today, cycleDays),
      });
    }
  });

  showScreen(1);
}

/* ===== 初期化 ===== */
showScreen(0);
