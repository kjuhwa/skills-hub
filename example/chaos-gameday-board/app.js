const experiments = [
  { name: 'Kill payment-svc pod', target: 'payment-svc', status: 'running', start: -180 },
  { name: 'Network latency 500ms', target: 'api-gateway', status: 'passed', start: -600 },
  { name: 'CPU stress 90%', target: 'order-processor', status: 'failed', start: -420 },
  { name: 'DNS failure injection', target: 'auth-service', status: 'running', start: -60 },
  { name: 'Disk fill 95%', target: 'log-aggregator', status: 'passed', start: -900 },
];

const timelineEvents = [];
function genTimeline() {
  const actions = ['Experiment started', 'Alert fired', 'Auto-scaled', 'Circuit breaker opened', 'Rollback triggered', 'Recovery confirmed'];
  experiments.forEach(e => {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      timelineEvents.push({ time: e.start + i * 45, text: `[${e.target}] ${actions[Math.floor(Math.random() * actions.length)]}` });
    }
  });
  timelineEvents.sort((a, b) => a.time - b.time);
}
genTimeline();

function renderExperiments() {
  const el = document.getElementById('experiments');
  el.innerHTML = '<h2>Active Experiments</h2>' + experiments.map(e =>
    `<div class="exp-row"><span>${e.name}</span><span class="badge ${e.status}">${e.status}</span></div>`
  ).join('');
}

function renderTimeline() {
  const el = document.getElementById('timeline');
  el.innerHTML = '<h2>Event Timeline</h2>' + timelineEvents.slice(-8).map(t =>
    `<div class="tl-entry">${fmtSec(t.time)} — ${t.text}</div>`
  ).join('');
}

function fmtSec(s) { const a = Math.abs(s), m = Math.floor(a / 60); return `T-${m}m${a % 60}s`; }

function renderMetrics() {
  const el = document.getElementById('metrics');
  el.innerHTML = '<h2>Error Rate (last 15 min)</h2><svg id="chart"></svg>';
  const svg = document.getElementById('chart');
  const pts = Array.from({ length: 30 }, (_, i) => ({ x: i, y: Math.random() * 40 + (i > 18 ? 35 : 5) }));
  const w = svg.clientWidth || 800, h = 120, mx = 30, my = 10;
  const sx = (w - mx * 2) / 29, sy = (h - my * 2) / 80;
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${mx + p.x * sx},${h - my - p.y * sy}`).join(' ');
  svg.innerHTML = `<line x1="${mx}" y1="${h - my}" x2="${w - mx}" y2="${h - my}" stroke="#2d333b"/>
    <path d="${path}" fill="none" stroke="#6ee7b7" stroke-width="2"/>
    <line x1="${mx + 18 * sx}" y1="${my}" x2="${mx + 18 * sx}" y2="${h - my}" stroke="#f87171" stroke-dasharray="4"/>
    <text x="${mx + 18 * sx + 4}" y="${my + 12}" fill="#f87171" font-size="10">failure injected</text>`;
}

function updateClock() { document.getElementById('clock').textContent = new Date().toLocaleTimeString(); }

function tick() {
  experiments.forEach(e => { if (e.status === 'running' && Math.random() < 0.05) e.status = Math.random() < 0.5 ? 'passed' : 'failed'; });
  renderExperiments(); renderTimeline(); renderMetrics(); updateClock();
}
tick(); setInterval(tick, 3000);