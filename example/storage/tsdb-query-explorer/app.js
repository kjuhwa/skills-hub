const metrics = ['cpu_usage', 'mem_used', 'disk_read', 'net_in', 'net_out'];
const ranges = [['5m', 300], ['15m', 900], ['1h', 3600], ['6h', 21600], ['1d', 86400]];
let activeMetric = metrics[0], activeRange = 3600;

const metricList = document.getElementById('metricList');
const rangeBar = document.getElementById('rangeBar');
const svg = document.getElementById('svg');
const table = document.getElementById('table');
const queryInput = document.getElementById('query');

function genSeries(name, sec) {
  const pts = [], now = Date.now(), step = Math.max(sec / 120, 5) * 1000;
  const base = { cpu_usage: 50, mem_used: 70, disk_read: 200, net_in: 500, net_out: 300 }[name] || 50;
  for (let t = now - sec * 1000; t <= now; t += step) {
    pts.push({ t, v: base + Math.sin(t / 30000) * base * 0.3 + (Math.random() - 0.5) * base * 0.2 });
  }
  return pts;
}

function renderMetrics() {
  metricList.innerHTML = metrics.map(m =>
    `<div class="metric-item ${m === activeMetric ? 'active' : ''}" data-m="${m}">${m}</div>`
  ).join('');
  metricList.querySelectorAll('.metric-item').forEach(el => el.onclick = () => { activeMetric = el.dataset.m; run(); });
}

function renderRanges() {
  rangeBar.innerHTML = ranges.map(([l, s]) =>
    `<button class="${s === activeRange ? 'active' : ''}" data-s="${s}">${l}</button>`
  ).join('');
  rangeBar.querySelectorAll('button').forEach(el => el.onclick = () => { activeRange = +el.dataset.s; run(); });
}

function run() {
  renderMetrics(); renderRanges();
  queryInput.value = `SELECT mean("${activeMetric}") WHERE time > now() - ${ranges.find(r => r[1] === activeRange)[0]} GROUP BY time(auto)`;
  const pts = genSeries(activeMetric, activeRange);
  drawSVG(pts);
  drawTable(pts);
}

function drawSVG(pts) {
  const rect = svg.parentElement.getBoundingClientRect();
  const W = rect.width, H = rect.height;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const vals = pts.map(p => p.v), mn = Math.min(...vals), mx = Math.max(...vals), pad = 10;
  const x = (i) => (i / (pts.length - 1)) * W;
  const y = (v) => pad + (1 - (v - mn) / (mx - mn || 1)) * (H - pad * 2);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = line + ` L${W},${H} L0,${H} Z`;
  svg.innerHTML = `
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6ee7b7" stop-opacity="0.3"/><stop offset="100%" stop-color="#6ee7b7" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#g)"/><path d="${line}" fill="none" stroke="#6ee7b7" stroke-width="2"/>`;
}

function drawTable(pts) {
  const last = pts.slice(-20).reverse();
  table.querySelector('thead tr').innerHTML = '<th>Timestamp</th><th>Value</th>';
  table.querySelector('tbody').innerHTML = last.map(p =>
    `<tr><td>${new Date(p.t).toLocaleTimeString()}</td><td>${p.v.toFixed(2)}</td></tr>`
  ).join('');
}

document.getElementById('runBtn').onclick = run;
window.addEventListener('resize', run);
run();