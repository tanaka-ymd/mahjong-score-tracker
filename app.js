// ===== State =====
let state = loadState();

function loadState() {
  const defaults = { playerCount: 4, players: [], games: [], uma: '10-30', oka: '25000-30000', chipRate: 0 };
  try {
    const saved = localStorage.getItem('mahjong-tracker');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old data that lacks playerCount
      if (!parsed.playerCount && parsed.players && parsed.players.length > 0) {
        parsed.playerCount = parsed.players.length;
      }
      return { ...defaults, ...parsed };
    }
  } catch (e) {}
  return defaults;
}

function saveState() {
  localStorage.setItem('mahjong-tracker', JSON.stringify(state));
}

// ===== Uma/Oka Options =====
const UMA_OPTIONS = {
  4: [
    { value: '5-10', label: '5-10' },
    { value: '5-15', label: '5-15' },
    { value: '5-20', label: '5-20' },
    { value: '5-25', label: '5-25' },
    { value: '5-30', label: '5-30' },
    { value: '10-15', label: '10-15' },
    { value: '10-20', label: '10-20（ワンツー）' },
    { value: '10-25', label: '10-25' },
    { value: '10-30', label: '10-30（ゴットー）' },
    { value: '15-20', label: '15-20' },
    { value: '15-25', label: '15-25' },
    { value: '15-30', label: '15-30' },
    { value: '20-25', label: '20-25' },
    { value: '20-30', label: '20-30（ニサンマン）' },
    { value: '0-0', label: 'なし' }
  ],
  3: [
    { value: '5-10', label: '5-10（+10/±0/-10）' },
    { value: '5-15', label: '5-15（+15/±0/-15）' },
    { value: '5-20', label: '5-20（+20/±0/-20）' },
    { value: '10-20', label: '10-20（+20/±0/-20）' },
    { value: '10-30', label: '10-30（+30/±0/-30）' },
    { value: '15-30', label: '15-30（+30/±0/-30）' },
    { value: '0-0', label: 'なし' }
  ]
};

const OKA_OPTIONS = {
  4: [
    { value: '25000-30000', label: '25000持ち 30000返し' },
    { value: '25000-50000', label: '25000持ち 50000返し' },
    { value: '30000-30000', label: '30000持ち 30000返し' },
    { value: '30000-50000', label: '30000持ち 50000返し' },
    { value: '25000-25000', label: '25000持ち 25000返し' }
  ],
  3: [
    { value: '35000-40000', label: '35000持ち 40000返し' },
    { value: '35000-50000', label: '35000持ち 50000返し' },
    { value: '30000-40000', label: '30000持ち 40000返し' },
    { value: '30000-50000', label: '30000持ち 50000返し' },
    { value: '35000-35000', label: '35000持ち 35000返し' },
    { value: '25000-30000', label: '25000持ち 30000返し' }
  ]
};

const CHIP_RATE_OPTIONS = [
  { value: 0, label: 'なし' },
  { value: 100, label: '1枚 = 100pt' },
  { value: 200, label: '1枚 = 200pt' },
  { value: 300, label: '1枚 = 300pt' },
  { value: 400, label: '1枚 = 400pt' },
  { value: 500, label: '1枚 = 500pt' }
];

function populateSelectOptions(selectId, options, currentValue) {
  const select = document.getElementById(selectId);
  select.innerHTML = '';
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    select.appendChild(el);
  });
  // Try to restore previous value
  const hasValue = options.some(o => o.value === currentValue);
  if (hasValue) {
    select.value = currentValue;
  }
}

// ===== Tab Navigation =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// ===== Mode Select (3人 / 4人) =====
let selectedMode = state.playerCount || 4;

function updateModeUI() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.mode, 10) === selectedMode);
  });
  const row4 = document.getElementById('pname-row-3');
  if (selectedMode === 3) {
    row4.classList.add('hidden');
  } else {
    row4.classList.remove('hidden');
  }
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMode = parseInt(btn.dataset.mode, 10);
    updateModeUI();
  });
});

// ===== Player Setup =====
const btnSavePlayers = document.getElementById('btn-save-players');
const playerSetup = document.getElementById('player-setup');
const gameInput = document.getElementById('game-input');

// Restore state
if (state.players.length >= 3) {
  selectedMode = state.playerCount || state.players.length;
  updateModeUI();
  state.players.forEach((name, i) => {
    const el = document.getElementById(`pname-${i}`);
    if (el) el.value = name;
  });
  showGameInput();
} else {
  updateModeUI();
}

btnSavePlayers.addEventListener('click', () => {
  const count = selectedMode;
  const names = [];
  for (let i = 0; i < count; i++) {
    const name = document.getElementById(`pname-${i}`).value.trim() || `P${i + 1}`;
    names.push(name);
  }

  if (new Set(names).size !== count) {
    alert('プレイヤー名が重複しています');
    return;
  }

  state.playerCount = count;
  state.players = names;
  state.games = [];
  saveState();
  showGameInput();
  renderScoreboard();
});

function showGameInput() {
  playerSetup.style.display = 'none';
  gameInput.style.display = 'block';

  const count = state.playerCount;

  // Populate uma/oka options
  populateSelectOptions('uma-select', UMA_OPTIONS[count], state.uma);
  populateSelectOptions('oka-select', OKA_OPTIONS[count], state.oka);

  // Populate chip rate options
  const chipSelect = document.getElementById('chip-rate-select');
  chipSelect.innerHTML = '';
  CHIP_RATE_OPTIONS.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    chipSelect.appendChild(el);
  });
  chipSelect.value = state.chipRate || 0;

  const scoreInputs = document.getElementById('score-inputs');
  scoreInputs.innerHTML = '';
  state.players.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
      <label>${name}</label>
      <input type="number" id="score-${i}" placeholder="点数" inputmode="numeric" step="100">
    `;
    scoreInputs.appendChild(row);
  });

  // Chip inputs
  const chipInputs = document.getElementById('chip-inputs');
  chipInputs.innerHTML = '';
  state.players.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
      <label>${name}</label>
      <input type="number" id="chip-${i}" placeholder="±枚数" inputmode="numeric" value="0">
    `;
    chipInputs.appendChild(row);
  });

  updateChipSectionVisibility();
  document.getElementById('game-number').textContent = `(第${state.games.length + 1}局)`;
}

function updateChipSectionVisibility() {
  const chipRate = parseInt(document.getElementById('chip-rate-select').value, 10);
  const chipSection = document.getElementById('chip-section');
  chipSection.style.display = chipRate > 0 ? 'block' : 'none';
}

// ===== Game Input =====
document.getElementById('btn-add-game').addEventListener('click', () => {
  const errorEl = document.getElementById('input-error');
  errorEl.textContent = '';

  const count = state.playerCount;
  const scores = [];
  for (let i = 0; i < count; i++) {
    const val = document.getElementById(`score-${i}`).value;
    if (val === '') {
      errorEl.textContent = '全員の点数を入力してください';
      return;
    }
    scores.push(parseInt(val, 10));
  }

  if (scores.some(s => isNaN(s))) {
    errorEl.textContent = '数値を入力してください';
    return;
  }

  const total = scores.reduce((a, b) => a + b, 0);
  const okaStr = document.getElementById('oka-select').value;
  const startPoints = parseInt(okaStr.split('-')[0], 10);
  const expected = startPoints * count;

  if (Math.abs(total - expected) > 1000) {
    if (!confirm(`合計点が${total}点です（期待値${expected}点と${total - expected}点差）。\nこのまま記録しますか？`)) {
      return;
    }
  }

  state.uma = document.getElementById('uma-select').value;
  state.oka = okaStr;
  state.chipRate = parseInt(document.getElementById('chip-rate-select').value, 10);

  const chips = [];
  for (let i = 0; i < count; i++) {
    chips.push(parseInt(document.getElementById(`chip-${i}`).value, 10) || 0);
  }

  const game = calculateGame(scores, state.uma, state.oka, count);
  game.chips = chips;
  state.games.push(game);
  saveState();

  for (let i = 0; i < count; i++) {
    document.getElementById(`score-${i}`).value = '';
    document.getElementById(`chip-${i}`).value = '0';
  }
  document.getElementById('game-number').textContent = `(第${state.games.length + 1}局)`;

  renderScoreboard();

  // Switch to scoreboard
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="scoreboard"]').classList.add('active');
  document.getElementById('scoreboard').classList.add('active');
});

function calculateGame(rawScores, umaStr, okaStr, count) {
  const [startPoints, returnPoints] = okaStr.split('-').map(Number);
  const [umaSmall, umaBig] = umaStr.split('-').map(Number);

  const adjusted = rawScores.map(s => (s - returnPoints) / 1000);

  const indexed = adjusted.map((score, i) => ({ score, index: i }));
  indexed.sort((a, b) => b.score - a.score);

  const rankings = new Array(count);
  indexed.forEach((item, rank) => {
    rankings[item.index] = rank + 1;
  });

  // Uma depends on player count
  let umaValues;
  if (count === 4) {
    umaValues = [umaBig, umaSmall, -umaSmall, -umaBig];
  } else {
    // 3 players: 1st gets +umaBig, 2nd gets 0, 3rd gets -umaBig
    umaValues = [umaBig, 0, -umaBig];
  }

  const finalScores = new Array(count);
  indexed.forEach((item, rank) => {
    finalScores[item.index] = adjusted[item.index] + umaValues[rank];
  });

  // Oka (top bonus)
  if (startPoints !== returnPoints) {
    const oka = ((returnPoints - startPoints) * count) / 1000;
    finalScores[indexed[0].index] += oka;
  }

  return {
    rawScores,
    rankings,
    finalScores: finalScores.map(s => Math.round(s * 10) / 10),
    timestamp: Date.now()
  };
}

// ===== Scoreboard =====
function renderScoreboard() {
  const noData = document.getElementById('no-data');
  const content = document.getElementById('scoreboard-content');
  const count = state.playerCount;

  if (state.games.length === 0 || state.players.length === 0) {
    noData.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  content.style.display = 'block';

  const totals = new Array(count).fill(0);
  const chipTotals = new Array(count).fill(0);
  const firstPlaces = new Array(count).fill(0);
  const lastPlaces = new Array(count).fill(0);

  state.games.forEach(game => {
    game.finalScores.forEach((score, i) => {
      totals[i] += score;
    });
    if (game.chips) {
      game.chips.forEach((c, i) => {
        chipTotals[i] += c;
      });
    }
    game.rankings.forEach((rank, i) => {
      if (rank === 1) firstPlaces[i]++;
      if (rank === count) lastPlaces[i]++;
    });
  });

  totals.forEach((t, i) => totals[i] = Math.round(t * 10) / 10);
  const chipRate = state.chipRate || 0;
  const hasChips = chipTotals.some(c => c !== 0);

  const ranked = state.players.map((name, i) => ({
    name, index: i, total: totals[i], chip: chipTotals[i], first: firstPlaces[i], last: lastPlaces[i]
  }));
  // Sort by total score (with chip points if chipRate is set)
  ranked.sort((a, b) => {
    const aTotal = chipRate > 0 ? a.total + a.chip * chipRate : a.total;
    const bTotal = chipRate > 0 ? b.total + b.chip * chipRate : b.total;
    return bTotal - aTotal;
  });

  // Summary cards
  const summaryCards = document.getElementById('summary-cards');
  summaryCards.innerHTML = '';
  summaryCards.className = 'summary-cards' + (count === 3 ? ' three-players' : '');

  const rankLabels = count === 3 ? ['1st', '2nd', '3rd'] : ['1st', '2nd', '3rd', '4th'];
  const lastLabel = count === 3 ? 'ラス' : 'ラス';

  ranked.forEach((p, rank) => {
    const card = document.createElement('div');
    card.className = 'summary-card';
    const totalWithChip = chipRate > 0 ? Math.round((p.total + p.chip * chipRate) * 10) / 10 : p.total;
    const scoreClass = totalWithChip >= 0 ? 'positive' : 'negative';
    const sign = totalWithChip >= 0 ? '+' : '';
    let chipHtml = '';
    if (hasChips) {
      const chipSign = p.chip >= 0 ? '+' : '';
      chipHtml = `<div class="chip-info">${chipSign}${p.chip}枚${chipRate > 0 ? ` (${chipSign}${p.chip * chipRate}pt)` : ''}</div>`;
    }
    card.innerHTML = `
      <div class="rank">${rankLabels[rank]}</div>
      <div class="player-name">${p.name}</div>
      <div class="score ${scoreClass}">${sign}${chipRate > 0 ? totalWithChip : p.total}</div>
      ${chipHtml}
      <div class="win-rate">トップ${p.first} / ${lastLabel}${p.last}</div>
    `;
    summaryCards.appendChild(card);
  });

  // History table
  const header = document.getElementById('history-header');
  header.innerHTML = `<tr><th>#</th>${state.players.map(n => `<th>${n}</th>`).join('')}<th></th></tr>`;

  const body = document.getElementById('history-body');
  body.innerHTML = '';

  state.games.forEach((game, gi) => {
    const tr = document.createElement('tr');
    let cells = `<td>${gi + 1}</td>`;
    game.finalScores.forEach((score, pi) => {
      const cls = score >= 0 ? 'positive' : 'negative';
      const sign = score >= 0 ? '+' : '';
      const rankBadge = game.rankings[pi] === 1 ? ' ①' : '';
      const chipDisplay = (game.chips && game.chips[pi] !== 0) ? `<br><small class="chip-badge">${game.chips[pi] > 0 ? '+' : ''}${game.chips[pi]}枚</small>` : '';
      cells += `<td class="${cls}">${sign}${score}${rankBadge}${chipDisplay}</td>`;
    });
    cells += `<td><button class="btn-delete-game" data-game="${gi}" title="削除">×</button></td>`;
    tr.innerHTML = cells;
    body.appendChild(tr);
  });

  // Total row
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  let totalCells = '<td>計</td>';
  totals.forEach((t, i) => {
    const finalTotal = chipRate > 0 ? Math.round((t + chipTotals[i] * chipRate) * 10) / 10 : t;
    const cls = finalTotal >= 0 ? 'positive' : 'negative';
    const sign = finalTotal >= 0 ? '+' : '';
    const chipDisplay = hasChips ? `<br><small class="chip-badge">${chipTotals[i] >= 0 ? '+' : ''}${chipTotals[i]}枚</small>` : '';
    totalCells += `<td class="${cls}">${sign}${finalTotal}${chipDisplay}</td>`;
  });
  totalCells += '<td></td>';
  totalRow.innerHTML = totalCells;
  body.appendChild(totalRow);
}

// ===== Reset =====
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('全データをリセットしますか？この操作は元に戻せません。')) {
    state = { playerCount: 4, players: [], games: [], uma: '10-30', oka: '25000-30000', chipRate: 0 };
    saveState();
    location.reload();
  }
});

// ===== Points Table =====
const POINTS_CHILD = {
  20: { 2: [1300, '400/700'], 3: [2600, '700/1300'], 4: [5200, '1300/2600'] },
  25: { 2: [1600, '-'], 3: [3200, '800/1600'], 4: [6400, '1600/3200'] },
  30: { 1: [1000, '300/500'], 2: [2000, '500/1000'], 3: [3900, '1000/2000'], 4: [7700, '2000/3900'] },
  40: { 1: [1300, '400/700'], 2: [2600, '700/1300'], 3: [5200, '1300/2600'], 4: ['満貫', '満貫'] },
  50: { 1: [1600, '400/800'], 2: [3200, '800/1600'], 3: [6400, '1600/3200'], 4: ['満貫', '満貫'] },
  60: { 1: [2000, '500/1000'], 2: [3900, '1000/2000'], 3: [7700, '2000/3900'], 4: ['満貫', '満貫'] },
  70: { 1: [2300, '600/1200'], 2: [4500, '1200/2300'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  80: { 1: [2600, '700/1300'], 2: [5200, '1300/2600'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  90: { 1: [2900, '800/1500'], 2: [5800, '1500/2900'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  100: { 1: [3200, '800/1600'], 2: [6400, '1600/3200'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  110: { 1: [3600, '900/1800'], 2: [7100, '1800/3600'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] }
};

const POINTS_PARENT = {
  20: { 2: [2000, '700ALL'], 3: [3900, '1300ALL'], 4: [7700, '2600ALL'] },
  25: { 2: [2400, '-'], 3: [4800, '1600ALL'], 4: [9600, '3200ALL'] },
  30: { 1: [1500, '500ALL'], 2: [2900, '1000ALL'], 3: [5800, '2000ALL'], 4: [11600, '3900ALL'] },
  40: { 1: [2000, '700ALL'], 2: [3900, '1300ALL'], 3: [7700, '2600ALL'], 4: ['満貫', '満貫'] },
  50: { 1: [2400, '800ALL'], 2: [4800, '1600ALL'], 3: [9600, '3200ALL'], 4: ['満貫', '満貫'] },
  60: { 1: [2900, '1000ALL'], 2: [5800, '2000ALL'], 3: [11600, '3900ALL'], 4: ['満貫', '満貫'] },
  70: { 1: [3400, '1200ALL'], 2: [6800, '2300ALL'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  80: { 1: [3900, '1300ALL'], 2: [7700, '2600ALL'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  90: { 1: [4400, '1500ALL'], 2: [8700, '2900ALL'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  100: { 1: [4800, '1600ALL'], 2: [9600, '3200ALL'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] },
  110: { 1: [5300, '1800ALL'], 2: [10600, '3600ALL'], 3: ['満貫', '満貫'], 4: ['満貫', '満貫'] }
};

let currentDealer = 'child';

function renderPointsTable() {
  const data = currentDealer === 'child' ? POINTS_CHILD : POINTS_PARENT;
  const body = document.getElementById('points-body');
  body.innerHTML = '';

  const fuList = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  fuList.forEach(fu => {
    const row = data[fu];
    if (!row) return;
    const tr = document.createElement('tr');
    let cells = `<td>${fu}符</td>`;
    for (let han = 1; han <= 4; han++) {
      if (row[han]) {
        const [ron, tsumo] = row[han];
        cells += `<td>${ron}<br><small style="color:#757575">${tsumo}</small></td>`;
      } else {
        cells += '<td>-</td>';
      }
    }
    tr.innerHTML = cells;
    body.appendChild(tr);
  });

  const manganTable = document.getElementById('mangan-table');
  const isParent = currentDealer === 'parent';
  manganTable.innerHTML = `
    <div class="mangan-item"><span class="label">満貫 (5翻)</span><span class="values">${isParent ? 'ロン12000 / ツモ4000ALL' : 'ロン8000 / ツモ2000/4000'}</span></div>
    <div class="mangan-item"><span class="label">跳満 (6-7翻)</span><span class="values">${isParent ? 'ロン18000 / ツモ6000ALL' : 'ロン12000 / ツモ3000/6000'}</span></div>
    <div class="mangan-item"><span class="label">倍満 (8-10翻)</span><span class="values">${isParent ? 'ロン24000 / ツモ8000ALL' : 'ロン16000 / ツモ4000/8000'}</span></div>
    <div class="mangan-item"><span class="label">三倍満 (11-12翻)</span><span class="values">${isParent ? 'ロン36000 / ツモ12000ALL' : 'ロン24000 / ツモ6000/12000'}</span></div>
    <div class="mangan-item"><span class="label">役満</span><span class="values">${isParent ? 'ロン48000 / ツモ16000ALL' : 'ロン32000 / ツモ8000/16000'}</span></div>
  `;
}

document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDealer = btn.dataset.dealer;
    renderPointsTable();
  });
});

// ===== Fu Calculator =====
document.getElementById('btn-calc-fu').addEventListener('click', () => {
  const isTsumo = document.getElementById('fu-tsumo').checked;
  const isMenzen = document.getElementById('fu-menzen').checked;
  const jantouFu = parseInt(document.getElementById('fu-jantou').value, 10);
  const machiFu = parseInt(document.getElementById('fu-machi').value, 10);

  if (isTsumo && isMenzen) {
    document.getElementById('fu-result').textContent = 'ツモとメンゼンロンは同時に選べません';
    return;
  }

  let totalFu = 20;
  if (isTsumo) totalFu += 2;
  if (isMenzen) totalFu += 10;
  totalFu += jantouFu;
  totalFu += machiFu;

  document.querySelectorAll('.fu-mentsu-type').forEach(sel => {
    totalFu += parseInt(sel.value, 10);
  });

  let roundedFu = Math.ceil(totalFu / 10) * 10;

  const resultEl = document.getElementById('fu-result');

  if (totalFu === 22 && isTsumo) {
    resultEl.textContent = `合計: ${totalFu}符 → 20符（ピンフツモ）`;
  } else if (roundedFu < 30) {
    resultEl.textContent = `合計: ${totalFu}符 → 30符（最低30符）`;
  } else {
    resultEl.textContent = `合計: ${totalFu}符 → ${roundedFu}符（切り上げ）`;
  }
});

// ===== Delete Game (Event Delegation) =====
document.getElementById('history-body').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete-game');
  if (!btn) return;
  const idx = parseInt(btn.dataset.game, 10);
  if (idx >= 0 && idx < state.games.length && confirm(`第${idx + 1}局を削除しますか？`)) {
    state.games.splice(idx, 1);
    saveState();
    renderScoreboard();
    if (document.getElementById('game-number')) {
      document.getElementById('game-number').textContent = `(第${state.games.length + 1}局)`;
    }
  }
});

// ===== Chip Rate Change =====
document.getElementById('chip-rate-select').addEventListener('change', updateChipSectionVisibility);

// ===== Init =====
renderScoreboard();
renderPointsTable();
