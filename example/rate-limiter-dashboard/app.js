const endpoints = [
  { path: '/api/users', limit: 100, window: 60 },
  { path: '/api/search', limit: 30, window: 60 },
  { path: '/api/upload', limit: 10, window: 60 },
  { path: '/api/webhook', limit: 50, window: 60 },
];
const state = endpoints.map(e => ({ ...e, used: 0, blocked: 0 }));
const history = Array(60).fill(null).map(() => ({ ok: 0, blocked: 0 }));
const cardsEl = document.getElementById('cards');
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

function renderCards() {
  cardsEl.innerHTML = state.map(s => {
    const pct = Math.min(100, (s.used / s.limit) * 100);
    const cls = pct > 90 ? 'red' : pct > 60 ? 'yellow' : 'green';
    const color = pct > 90 ? '#f87171' : pct > 60 ? '#fbbf24' : '#6ee7b7';
    return `<div class="card"><div class="label">${s.path}</div>
      <div class="value ${cls}">${s.used}<span style="font-size:0.7rem;color:#8b949e">/${s.limit}</span></div>
      <div style="font-size:0.7rem;color:#f87171">${s.blocked} blocked</div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
  }).join('');
}

function drawChart() {
  ctx.clearRect(0, 0, 780, 200);
  const max = Math.max(10, ...history.map(h => h.ok + h.blocked));
  const w = 780 / 60;
  history.forEach((h, i) => {
    const okH = (h.ok / max) * 170;
    const blH = (h.blocked / max) * 170;
    ctx.fillStyle = '#6ee7b7'; ctx.fillRect(i * w + 1, 185 - okH - blH, w - 2, okH);
    ctx.fillStyle = '#f87171'; ctx.fillRect(i * w + 1, 185 - blH, w - 2, blH);
  });
  ctx.fillStyle = '#8b949e'; ctx.font = '10px monospace';
  ctx.fillText('now', 750, 198); ctx.fillText('60s ago', 0, 198);
}

function simulate() {
  const tick = { ok: 0, blocked: 0 };
  state.forEach(s => {
    const reqs = Math.floor(Math.random() * (s.limit * 0.06)) + 1;
    for (let i = 0; i < reqs; i++) {
      if (s.used < s.limit) { s.used++; tick.ok++; } else { s.blocked++; tick.blocked++; }
    }
  });
  history.push(tick); history.shift();
  renderCards(); drawChart();
}

setInterval(simulate, 1000);
setInterval(() => { state.forEach(s => { s.used = Math.max(0, s.used - Math.floor(s.limit * 0.3)); }); }, 3000);
renderCards(); drawChart();