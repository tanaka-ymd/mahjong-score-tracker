// ===== State =====
let state = loadState();
const RATE_KEY = 'mahjong-tracker-rate';

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
    if (tab.dataset.tab === 'stats') renderStats();
    if (tab.dataset.tab === 'scoreboard') renderScoreGraph();
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
  renderSettlement();
  renderStats();
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
  renderSettlement();
  renderStats();

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

// ===== Player Colors for Graph =====
const PLAYER_COLORS = ['#1a7a3a', '#1565C0', '#e65100', '#7B1FA2'];

// ===== Session Helpers =====
function getSessionKey(timestamp) {
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function groupGamesBySessions(games) {
  const sessions = [];
  const map = {};
  games.forEach((game, idx) => {
    const key = getSessionKey(game.timestamp);
    if (!map[key]) {
      map[key] = { date: key, games: [], indices: [] };
      sessions.push(map[key]);
    }
    map[key].games.push(game);
    map[key].indices.push(idx);
  });
  return sessions;
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
  const lastLabel = 'ラス';

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

  // Score Graph
  renderScoreGraph();

  // History table with sessions
  const header = document.getElementById('history-header');
  header.innerHTML = `<tr><th>#</th>${state.players.map(n => `<th>${n}</th>`).join('')}<th></th></tr>`;

  const body = document.getElementById('history-body');
  body.innerHTML = '';

  const sessions = groupGamesBySessions(state.games);

  if (sessions.length > 1) {
    // Multi-session: show session headers with collapsible groups
    sessions.forEach((session, si) => {
      const isLatest = si === sessions.length - 1;
      // Session header row
      const headerTr = document.createElement('tr');
      headerTr.className = 'session-header-row';
      headerTr.innerHTML = `<td colspan="${count + 2}">
        <div class="session-header" data-session="${si}">
          <span class="session-title">${session.date} (${session.games.length}局)</span>
          <span class="session-toggle ${isLatest ? '' : 'collapsed'}">▼</span>
        </div>
      </td>`;
      body.appendChild(headerTr);

      // Game rows for this session
      const groupId = `session-group-${si}`;
      session.games.forEach((game, gi) => {
        const globalIdx = session.indices[gi];
        const tr = document.createElement('tr');
        tr.className = `session-game-row ${groupId}`;
        if (!isLatest) tr.style.display = 'none';
        let cells = `<td>${globalIdx + 1}</td>`;
        game.finalScores.forEach((score, pi) => {
          const cls = score >= 0 ? 'positive' : 'negative';
          const sign = score >= 0 ? '+' : '';
          const rankBadge = game.rankings[pi] === 1 ? ' ①' : '';
          const chipDisplay = (game.chips && game.chips[pi] !== 0) ? `<br><small class="chip-badge">${game.chips[pi] > 0 ? '+' : ''}${game.chips[pi]}枚</small>` : '';
          cells += `<td class="${cls}">${sign}${score}${rankBadge}${chipDisplay}</td>`;
        });
        cells += `<td><button class="btn-delete-game" data-game="${globalIdx}" title="削除">×</button></td>`;
        tr.innerHTML = cells;
        body.appendChild(tr);
      });

      // Session subtotal row
      const subTotals = new Array(count).fill(0);
      const subChips = new Array(count).fill(0);
      session.games.forEach(game => {
        game.finalScores.forEach((s, i) => subTotals[i] += s);
        if (game.chips) game.chips.forEach((c, i) => subChips[i] += c);
      });
      const subTr = document.createElement('tr');
      subTr.className = `session-subtotal-row ${groupId}`;
      if (!isLatest) subTr.style.display = 'none';
      let subCells = '<td>小計</td>';
      subTotals.forEach((t, i) => {
        const rounded = Math.round(t * 10) / 10;
        const finalSub = chipRate > 0 ? Math.round((rounded + subChips[i] * chipRate) * 10) / 10 : rounded;
        const cls = finalSub >= 0 ? 'positive' : 'negative';
        const sign = finalSub >= 0 ? '+' : '';
        subCells += `<td class="${cls}">${sign}${finalSub}</td>`;
      });
      subCells += '<td></td>';
      subTr.innerHTML = subCells;
      body.appendChild(subTr);
    });
  } else {
    // Single session or no sessions: render flat
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
  }

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

// ===== Session toggle (Event Delegation) =====
document.getElementById('history-body').addEventListener('click', (e) => {
  const hdr = e.target.closest('.session-header');
  if (!hdr) return;
  const si = hdr.dataset.session;
  const groupClass = `session-group-${si}`;
  const toggle = hdr.querySelector('.session-toggle');
  const isCollapsed = toggle.classList.contains('collapsed');
  toggle.classList.toggle('collapsed');
  document.querySelectorAll(`.${groupClass}`).forEach(row => {
    row.style.display = isCollapsed ? '' : 'none';
  });
});

// ===== Score Graph =====
function renderScoreGraph() {
  const section = document.getElementById('score-graph-section');
  const canvas = document.getElementById('score-graph-canvas');
  const legendEl = document.getElementById('graph-legend');
  const count = state.playerCount;

  if (state.games.length < 2) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width - 16;
  const h = 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Calculate cumulative scores
  const cumScores = [];
  for (let pi = 0; pi < count; pi++) {
    const series = [0];
    let cum = 0;
    state.games.forEach(game => {
      cum += game.finalScores[pi];
      series.push(Math.round(cum * 10) / 10);
    });
    cumScores.push(series);
  }

  const numPoints = state.games.length + 1;
  const allValues = cumScores.flat();
  let minVal = Math.min(...allValues);
  let maxVal = Math.max(...allValues);
  if (minVal === maxVal) { minVal -= 10; maxVal += 10; }
  const padding = { top: 20, right: 16, bottom: 30, left: 45 };
  const graphW = w - padding.left - padding.right;
  const graphH = h - padding.top - padding.bottom;

  const xStep = graphW / (numPoints - 1);

  function toX(i) { return padding.left + i * xStep; }
  function toY(val) { return padding.top + graphH - ((val - minVal) / (maxVal - minVal)) * graphH; }

  // Grid lines and Y-axis labels
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#757575';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  const yTicks = 5;
  for (let i = 0; i <= yTicks; i++) {
    const val = minVal + (maxVal - minVal) * i / yTicks;
    const y = toY(val);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    ctx.fillText(Math.round(val * 10) / 10, padding.left - 4, y + 3);
  }

  // Zero line
  if (minVal < 0 && maxVal > 0) {
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, toY(0));
    ctx.lineTo(w - padding.right, toY(0));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // X-axis labels
  ctx.fillStyle = '#757575';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < numPoints; i++) {
    const label = i === 0 ? '開始' : `${i}`;
    // Only show some labels if too many
    if (numPoints <= 12 || i === 0 || i === numPoints - 1 || i % Math.ceil(numPoints / 10) === 0) {
      ctx.fillText(label, toX(i), h - padding.bottom + 16);
    }
  }

  // Draw lines
  const pointPositions = [];
  for (let pi = 0; pi < count; pi++) {
    ctx.strokeStyle = PLAYER_COLORS[pi] || '#333';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const pts = [];
    cumScores[pi].forEach((val, i) => {
      const x = toX(i);
      const y = toY(val);
      pts.push({ x, y, val, gameIdx: i });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    pointPositions.push(pts);

    // Draw dots
    pts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = PLAYER_COLORS[pi] || '#333';
      ctx.fill();
    });
  }

  // Store for tooltip interaction
  canvas._graphData = { pointPositions, cumScores, count, w, h, dpr };

  // Legend
  legendEl.innerHTML = '';
  state.players.forEach((name, i) => {
    const item = document.createElement('span');
    item.className = 'graph-legend-item';
    item.innerHTML = `<span class="graph-legend-color" style="background:${PLAYER_COLORS[i]}"></span>${name}`;
    legendEl.appendChild(item);
  });
}

// Graph tooltip interaction
(function() {
  const canvas = document.getElementById('score-graph-canvas');
  const tooltip = document.getElementById('graph-tooltip');

  function handleGraphInteraction(clientX, clientY) {
    if (!canvas._graphData) return;
    const { pointPositions, count, dpr } = canvas._graphData;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    let closest = null;
    let minDist = 30;
    for (let pi = 0; pi < count; pi++) {
      pointPositions[pi].forEach(pt => {
        const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = { pi, ...pt };
        }
      });
    }

    if (closest) {
      const label = closest.gameIdx === 0 ? '開始' : `第${closest.gameIdx}局`;
      tooltip.textContent = `${state.players[closest.pi]}: ${label} ${closest.val >= 0 ? '+' : ''}${closest.val}`;
      tooltip.style.display = 'block';
      // Position relative to card
      const cardRect = canvas.parentElement.getBoundingClientRect();
      tooltip.style.left = (closest.x + 8) + 'px';
      tooltip.style.top = (closest.y - 8) + 'px';
    } else {
      tooltip.style.display = 'none';
    }
  }

  canvas.addEventListener('mousemove', (e) => handleGraphInteraction(e.clientX, e.clientY));
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleGraphInteraction(touch.clientX, touch.clientY);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleGraphInteraction(touch.clientX, touch.clientY);
  }, { passive: false });
  canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
  canvas.addEventListener('touchend', () => { tooltip.style.display = 'none'; });
})();

// ===== Statistics Dashboard =====
function renderStats() {
  const noData = document.getElementById('stats-no-data');
  const content = document.getElementById('stats-content');
  const count = state.playerCount;

  if (state.games.length === 0 || state.players.length === 0) {
    noData.style.display = 'block';
    content.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  content.style.display = 'block';

  document.getElementById('stats-total-count').textContent = state.games.length;

  const container = document.getElementById('stats-player-cards');
  container.innerHTML = '';

  state.players.forEach((name, pi) => {
    const rankings = state.games.map(g => g.rankings[pi]);
    const scores = state.games.map(g => g.finalScores[pi]);
    const avgRank = (rankings.reduce((a, b) => a + b, 0) / rankings.length).toFixed(2);
    const winCount = rankings.filter(r => r === 1).length;
    const winRate = ((winCount / rankings.length) * 100).toFixed(1);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Consecutive wins
    let maxStreak = 0, streak = 0;
    rankings.forEach(r => {
      if (r === 1) { streak++; maxStreak = Math.max(maxStreak, streak); }
      else { streak = 0; }
    });

    const card = document.createElement('div');
    card.className = 'stats-player-card';
    card.innerHTML = `
      <div class="stats-player-name" style="color:${PLAYER_COLORS[pi]}">${name}</div>
      <div class="stats-grid">
        <div class="stats-item">
          <span class="stats-label">平均順位</span>
          <span class="stats-value">${avgRank}位</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">勝率(1位率)</span>
          <span class="stats-value">${winRate}%</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">最大連勝</span>
          <span class="stats-value">${maxStreak}連勝</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">平均スコア</span>
          <span class="stats-value ${parseFloat(avgScore) >= 0 ? 'positive' : 'negative'}">${parseFloat(avgScore) >= 0 ? '+' : ''}${avgScore}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">最高スコア</span>
          <span class="stats-value ${maxScore >= 0 ? 'positive' : 'negative'}">${maxScore >= 0 ? '+' : ''}${maxScore}</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">最低スコア</span>
          <span class="stats-value ${minScore >= 0 ? 'positive' : 'negative'}">${minScore >= 0 ? '+' : ''}${minScore}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ===== Settlement (精算) =====
function renderSettlement() {
  const section = document.getElementById('settlement-section');
  const body = document.getElementById('settlement-body');
  const rateSelect = document.getElementById('rate-select');
  const rate = parseInt(rateSelect.value, 10);
  const count = state.playerCount;

  if (state.games.length === 0 || state.players.length === 0 || rate === 0) {
    section.style.display = state.games.length > 0 ? 'block' : 'none';
    body.innerHTML = rate === 0 ? '<p class="settlement-none">レートを選択してください</p>' : '';
    return;
  }

  section.style.display = 'block';

  const totals = new Array(count).fill(0);
  const chipTotals = new Array(count).fill(0);
  state.games.forEach(game => {
    game.finalScores.forEach((s, i) => { totals[i] += s; });
    if (game.chips) game.chips.forEach((c, i) => { chipTotals[i] += c; });
  });

  const chipRate = state.chipRate || 0;
  const results = state.players.map((name, i) => {
    const scorePoints = Math.round(totals[i] * rate * 10) / 10;
    const chipPoints = chipRate > 0 ? chipTotals[i] * chipRate : 0;
    const total = Math.round((scorePoints + chipPoints) * 10) / 10;
    return { name, scorePoints, chipPoints, total };
  });

  results.sort((a, b) => b.total - a.total);

  let html = '<div class="settlement-list">';
  results.forEach(r => {
    const cls = r.total >= 0 ? 'positive' : 'negative';
    const sign = r.total >= 0 ? '+' : '';
    html += `<div class="settlement-row">
      <span class="settlement-name">${r.name}</span>
      <span class="settlement-points ${cls}">${sign}${r.total}pt</span>
    </div>`;
  });
  html += '</div>';
  body.innerHTML = html;
}

// Restore saved rate
(function initRate() {
  const saved = localStorage.getItem(RATE_KEY);
  if (saved) {
    const sel = document.getElementById('rate-select');
    if (sel) sel.value = saved;
  }
})();

document.getElementById('rate-select').addEventListener('change', function() {
  localStorage.setItem(RATE_KEY, this.value);
  renderSettlement();
});

// ===== Reset =====
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm('全データをリセットしますか？この操作は元に戻せません。')) {
    state = { playerCount: 4, players: [], games: [], uma: '10-30', oka: '25000-30000', chipRate: 0 };
    saveState();
    location.reload();
  }
});

// ===== Data Management (Export / Import / Reset) =====
document.getElementById('btn-export').addEventListener('click', () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `mahjong_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!confirm('現在のデータを上書きします。よろしいですか？')) {
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.players || !Array.isArray(imported.games)) {
        alert('無効なデータ形式です');
        return;
      }
      // Merge with defaults
      const defaults = { playerCount: 4, players: [], games: [], uma: '10-30', oka: '25000-30000', chipRate: 0 };
      state = { ...defaults, ...imported };
      if (!state.playerCount && state.players.length > 0) {
        state.playerCount = state.players.length;
      }
      saveState();
      location.reload();
    } catch (err) {
      alert('ファイルの読み込みに失敗しました: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btn-data-reset').addEventListener('click', () => {
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
    renderSettlement();
    renderStats();
    if (document.getElementById('game-number')) {
      document.getElementById('game-number').textContent = `(第${state.games.length + 1}局)`;
    }
  }
});

// ===== Chip Rate Change =====
document.getElementById('chip-rate-select').addEventListener('change', updateChipSectionVisibility);

// ===== Init =====
renderScoreboard();
renderSettlement();
renderPointsTable();
renderStats();
