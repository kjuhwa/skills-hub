const services = [
  { name: 'api-gateway', angle: 0 },
  { name: 'auth-service', angle: 45 },
  { name: 'user-db', angle: 90 },
  { name: 'cache-redis', angle: 135 },
  { name: 'payment-api', angle: 180 },
  { name: 'search-engine', angle: 225 },
  { name: 'cdn-edge', angle: 270 },
  { name: 'queue-broker', angle: 315 }
];

const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
const cx = 240, cy = 240;
let sweep = 0;
let serviceState = [];

function probe() {
  serviceState = services.map(s => {
    const latency = Math.random() * 400 + 20;
    const status = latency > 300 ? 'fail' : latency > 150 ? 'warn' : 'ok';
    const dist = 60 + Math.min(latency, 400) * 0.4;
    return { ...s, latency: Math.round(latency), status, dist };
  });
  renderList();
  updateOverall();
}

function renderList() {
  const ul = document.getElementById('services');
  ul.innerHTML = serviceState.map(s =>
    `<li class="${s.status}">${s.name}<span class="latency">${s.latency}ms</span></li>`
  ).join('');
}

function updateOverall() {
  const fails = serviceState.filter(s => s.status === 'fail').length;
  const warns = serviceState.filter(s => s.status === 'warn').length;
  const el = document.getElementById('overall');
  if (fails > 0) { el.textContent = `${fails} FAIL`; el.className = 'status fail'; }
  else if (warns > 0) { el.textContent = `${warns} WARN`; el.className = 'status warn'; }
  else { el.textContent = 'ALL OK'; el.className = 'status ok'; }
}

function draw() {
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, 480, 480);

  ctx.strokeStyle = '#2a2f3d';
  ctx.lineWidth = 1;
  for (let r = 60; r <= 220; r += 40) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let a = 0; a < 360; a += 45) {
    const rad = (a - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * 220, cy + Math.sin(rad) * 220);
    ctx.stroke();
  }

  const sweepRad = (sweep - 90) * Math.PI / 180;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
  grad.addColorStop(0, 'rgba(110,231,183,0.3)');
  grad.addColorStop(1, 'rgba(110,231,183,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 220, sweepRad - 0.5, sweepRad);
  ctx.closePath();
  ctx.fill();

  serviceState.forEach(s => {
    const rad = (s.angle - 90) * Math.PI / 180;
    const x = cx + Math.cos(rad) * s.dist;
    const y = cy + Math.sin(rad) * s.dist;
    const color = s.status === 'ok' ? '#6ee7b7' : s.status === 'warn' ? '#fbbf24' : '#f87171';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e4e7ed';
    ctx.font = '11px monospace';
    ctx.fillText(s.name, x + 10, y + 4);
  });

  sweep = (sweep + 1.5) % 360;
  requestAnimationFrame(draw);
}

document.getElementById('probe').onclick = probe;
probe();
setInterval(probe, 5000);
draw();