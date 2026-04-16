const connectors = [
  { name: 'users-source', type: 'Debezium', table: 'users', status: 'running', eps: 142, lag: 12 },
  { name: 'orders-source', type: 'Debezium', table: 'orders', status: 'running', eps: 310, lag: 5 },
  { name: 'payments-sink', type: 'JDBC Sink', table: 'payments', status: 'lagging', eps: 87, lag: 1450 },
  { name: 'sessions-source', type: 'Debezium', table: 'sessions', status: 'running', eps: 55, lag: 2 },
  { name: 'audit-sink', type: 'S3 Sink', table: 'audit_log', status: 'stopped', eps: 0, lag: 9800 },
];
const statusLabel = { running: 'Running', lagging: 'Lagging', stopped: 'Stopped' };
const throughputHistory = Array.from({ length: 60 }, () => 200 + Math.random() * 300);

function renderCards() {
  document.getElementById('cards').innerHTML = connectors.map(c => `
    <div class="card">
      <div class="card-name">${c.name}</div>
      <div class="card-status"><span class="dot ${c.status}"></span>${statusLabel[c.status]}</div>
      <div class="card-stats">
        <span>Type: ${c.type}</span>
        <span>Table: ${c.table}</span>
        <span>Throughput: ${c.eps} evt/s</span>
        <span>Lag: ${c.lag} ms</span>
      </div>
    </div>
  `).join('');
}

function renderChart() {
  const svg = document.getElementById('chart');
  const w = svg.clientWidth || 900, h = 180, pad = 30;
  const max = Math.max(...throughputHistory);
  const pts = throughputHistory.map((v, i) => {
    const x = pad + (i / (throughputHistory.length - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  svg.innerHTML = `
    <text x="${pad}" y="16" fill="#94a3b8" font-size="12">Aggregate Throughput (evt/s)</text>
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#2a2d37"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#2a2d37"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#6ee7b7" stroke-width="2"/>
    <polygon points="${pad},${h - pad} ${pts.join(' ')} ${w - pad},${h - pad}" fill="url(#grad)" opacity="0.3"/>
    <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="100%" stop-color="#0f1117"/></linearGradient></defs>
    <text x="${pad}" y="${h - 10}" fill="#64748b" font-size="10">60s ago</text>
    <text x="${w - pad - 20}" y="${h - 10}" fill="#64748b" font-size="10">now</text>
  `;
}

function tick() {
  connectors.forEach(c => {
    if (c.status === 'running') { c.eps += (Math.random() - 0.5) * 20 | 0; c.eps = Math.max(10, c.eps); c.lag = Math.max(0, c.lag + (Math.random() - 0.6) * 5 | 0); }
    if (c.status === 'lagging') { c.lag += Math.random() * 30 | 0; c.eps = Math.max(5, c.eps + (Math.random() - 0.5) * 10 | 0); }
  });
  throughputHistory.shift();
  throughputHistory.push(connectors.reduce((s, c) => s + c.eps, 0));
  renderCards(); renderChart();
}

renderCards(); renderChart();
setInterval(tick, 1000);
addEventListener('resize', renderChart);