const metrics = [
  { lbl: 'Throughput', val: 0, unit: ' evt/s' },
  { lbl: 'Avg Latency', val: 0, unit: ' ms' },
  { lbl: 'Error Rate', val: 0, unit: '%' },
  { lbl: 'Backpressure', val: 0, unit: '%' }
];

const cardsEl = document.getElementById('cards');
metrics.forEach((m, i) => {
  const d = document.createElement('div'); d.className = 'card';
  d.innerHTML = `<div class="val" id="v${i}">0</div><div class="lbl">${m.lbl}</div>`;
  cardsEl.appendChild(d);
});

const history = Array.from({ length: 60 }, () => 200 + Math.random() * 100);
const stageNames = ['Ingest', 'Parse', 'Validate', 'Transform', 'Load'];
const stageLat = stageNames.map(() => 20 + Math.random() * 80);

const tCtx = document.getElementById('throughput').getContext('2d');
const lCtx = document.getElementById('latency').getContext('2d');

function drawLine(ctx, w, h, data, max) {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#2a2d37'; ctx.lineWidth = 0.5;
  for (let y = 0; y < 4; y++) { const py = h * y / 4; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke(); }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(110,231,183,0.25)'); grad.addColorStop(1, 'rgba(110,231,183,0)');
  ctx.beginPath();
  data.forEach((v, i) => { const x = (i / (data.length - 1)) * w, y = h - (v / max) * h * 0.85; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 2; ctx.stroke();
  const last = data.length - 1;
  ctx.lineTo((last / (data.length - 1)) * w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}

function drawBars(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const bw = 40, gap = (w - bw * stageNames.length) / (stageNames.length + 1);
  stageLat.forEach((v, i) => {
    const x = gap + i * (bw + gap), bh = (v / 120) * h * 0.8;
    ctx.fillStyle = '#6ee7b7'; ctx.globalAlpha = 0.15;
    ctx.fillRect(x, 0, bw, h);
    ctx.globalAlpha = 1; ctx.fillStyle = '#6ee7b7';
    ctx.fillRect(x, h - bh, bw, bh);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(stageNames[i], x + bw / 2, h - 2);
    ctx.fillStyle = '#e2e8f0'; ctx.fillText(Math.round(v) + 'ms', x + bw / 2, h - bh - 6);
  });
}

function tick() {
  const tp = 200 + Math.random() * 180;
  history.push(tp); history.shift();
  stageLat.forEach((_, i) => { stageLat[i] += (Math.random() - 0.5) * 8; stageLat[i] = Math.max(5, Math.min(110, stageLat[i])); });
  document.getElementById('v0').textContent = Math.round(tp);
  document.getElementById('v1').textContent = Math.round(stageLat.reduce((a, b) => a + b) / stageLat.length);
  document.getElementById('v2').textContent = (Math.random() * 2.5).toFixed(1);
  document.getElementById('v3').textContent = Math.round(Math.random() * 40);
  drawLine(tCtx, 560, 200, history, 450);
  drawBars(lCtx, 340, 200);
}

setInterval(tick, 800); tick();