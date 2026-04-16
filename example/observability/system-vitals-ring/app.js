const metrics = [
  { name: 'CPU', value: 45, max: 100, unit: '%' },
  { name: 'Memory', value: 62, max: 100, unit: '%' },
  { name: 'Disk', value: 71, max: 100, unit: '%' },
  { name: 'Network', value: 24, max: 100, unit: 'Mbps' }
];
const logEl = document.getElementById('log');
const ringsEl = document.getElementById('rings');

function svgRing(pct) {
  const r = 42, c = 2 * Math.PI * r, dash = c * pct / 100;
  const color = pct > 85 ? '#f87171' : pct > 60 ? '#fbbf24' : '#6ee7b7';
  return `<svg width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="#22262e" stroke-width="8"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8"
      stroke-dasharray="${dash} ${c}" stroke-linecap="round" transform="rotate(-90 50 50)"/>
    <text x="50" y="55" text-anchor="middle" fill="${color}" font-size="18" font-weight="700">${pct}</text>
  </svg>`;
}

function render() {
  ringsEl.innerHTML = metrics.map(m =>
    `<div class="ring-card">${svgRing(Math.round(m.value))}<div class="val">${Math.round(m.value)}${m.unit}</div><div class="label">${m.name}</div></div>`
  ).join('');
}

function addLog(msg, cls) {
  const d = document.createElement('div');
  d.className = cls;
  d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(d);
  if (logEl.children.length > 40) logEl.lastChild.remove();
}

function tick() {
  metrics.forEach(m => {
    m.value = Math.min(m.max, Math.max(5, m.value + (Math.random() - .47) * 8));
    if (m.value > 85) addLog(`${m.name} high: ${Math.round(m.value)}${m.unit}`, 'warn');
  });
  addLog('Health check passed', 'ok');
  render();
}

render();
setInterval(tick, 1500);