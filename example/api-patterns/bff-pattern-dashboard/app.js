const bffs = {
  mobile: { data: [], color: '#f472b6', baseLatency: 45, rps: 1200 },
  web: { data: [], color: '#60a5fa', baseLatency: 30, rps: 3400 },
  tv: { data: [], color: '#fbbf24', baseLatency: 60, rps: 400 },
};
let totalData = [];

function rand(base, spread) { return base + (Math.random() - 0.5) * spread; }

function drawChart(canvasId, data, color, maxVal) {
  const c = document.getElementById(canvasId);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  if (data.length < 2) return;
  const step = c.width / (data.length - 1);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  data.forEach((v, i) => {
    const x = i * step;
    const y = c.height - (v / maxVal) * (c.height - 10) - 5;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineTo((data.length - 1) * step, c.height);
  ctx.lineTo(0, c.height);
  ctx.closePath();
  ctx.fillStyle = color + '18';
  ctx.fill();
}

function updateStats(name, bff) {
  const el = document.getElementById('stats-' + name);
  const lat = bff.data[bff.data.length - 1] || 0;
  const avg = bff.data.length ? (bff.data.reduce((a, b) => a + b, 0) / bff.data.length).toFixed(1) : 0;
  el.innerHTML = `Latency: <span>${lat.toFixed(0)}ms</span> | Avg: <span>${avg}ms</span> | RPS: <span>${Math.round(rand(bff.rps, 200))}</span>`;
}

function tick() {
  let total = 0;
  for (const [name, bff] of Object.entries(bffs)) {
    const v = rand(bff.baseLatency, 30);
    bff.data.push(v);
    if (bff.data.length > 50) bff.data.shift();
    drawChart('chart-' + name, bff.data, bff.color, 120);
    updateStats(name, bff);
    total += v;
  }
  totalData.push(total / 3);
  if (totalData.length > 50) totalData.shift();
  drawChart('chart-total', totalData, '#6ee7b7', 120);
}

setInterval(tick, 800);
for (let i = 0; i < 30; i++) tick();