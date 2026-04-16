const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const servers = [
  { id: 'A', x: 720, y: 80, weight: 5, conn: 0, total: 0, capacity: 12 },
  { id: 'B', x: 720, y: 170, weight: 3, conn: 0, total: 0, capacity: 10 },
  { id: 'C', x: 720, y: 260, weight: 4, conn: 0, total: 0, capacity: 11 },
  { id: 'D', x: 720, y: 350, weight: 2, conn: 0, total: 0, capacity: 8 },
];

const lb = { x: 200, y: 210 };
let strategy = 'round-robin', rrIdx = 0, running = true, rate = 8;
let requests = [];
let lastSpawn = 0;

function pickServer() {
  if (strategy === 'round-robin') {
    const s = servers[rrIdx % servers.length]; rrIdx++; return s;
  }
  if (strategy === 'least-conn') {
    return servers.reduce((a, b) => a.conn <= b.conn ? a : b);
  }
  if (strategy === 'weighted') {
    const total = servers.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const s of servers) { if ((r -= s.weight) <= 0) return s; }
    return servers[0];
  }
  return servers[Math.floor(Math.random() * servers.length)];
}

function spawnRequest() {
  const s = pickServer();
  s.conn++;
  requests.push({
    x: 20, y: lb.y + (Math.random() - 0.5) * 30,
    target: s, phase: 'to-lb', t: 0,
    duration: 1500 + Math.random() * 2500
  });
}

function tick(now) {
  if (!running) { requestAnimationFrame(tick); return; }
  if (now - lastSpawn > 1000 / rate) { spawnRequest(); lastSpawn = now; }

  ctx.fillStyle = '#1a1d27'; ctx.fillRect(0, 0, W, H);

  // LB node
  ctx.fillStyle = '#6ee7b7';
  ctx.beginPath(); ctx.arc(lb.x, lb.y, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f1117';
  ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('LB', lb.x, lb.y);

  // Servers
  servers.forEach(s => {
    const load = Math.min(s.conn / s.capacity, 1);
    ctx.strokeStyle = '#2a2f3d'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lb.x + 32, lb.y); ctx.lineTo(s.x - 28, s.y); ctx.stroke();
    ctx.fillStyle = `hsl(${140 - load * 140}, 60%, 55%)`;
    ctx.fillRect(s.x - 28, s.y - 22, 56, 44);
    ctx.fillStyle = '#0f1117';
    ctx.fillText(s.id, s.x, s.y - 6);
    ctx.font = '10px sans-serif';
    ctx.fillText(`${s.conn}/${s.capacity}`, s.x, s.y + 10);
    ctx.font = 'bold 14px sans-serif';
  });

  // Requests
  requests = requests.filter(r => {
    r.t += 16;
    if (r.phase === 'to-lb') {
      r.x += 4;
      if (r.x >= lb.x) { r.phase = 'to-server'; r.startX = lb.x; r.startY = lb.y; }
    } else if (r.phase === 'to-server') {
      const p = Math.min((r.x - lb.x) / (r.target.x - lb.x), 1);
      r.x = lb.x + (r.target.x - lb.x) * (p + 0.04);
      r.y = lb.y + (r.target.y - lb.y) * Math.min(p + 0.04, 1);
      if (p >= 1) { r.phase = 'processing'; r.t = 0; }
    } else {
      if (r.t >= r.duration) {
        r.target.conn--; r.target.total++; return false;
      }
    }
    if (r.phase !== 'processing') {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(r.x, r.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    return true;
  });

  updateStats();
  requestAnimationFrame(tick);
}

function updateStats() {
  const html = servers.map(s => `
    <div class="stat-card">
      <div class="name">Server ${s.id}</div>
      <div class="val">${s.total}</div>
      <div class="sub">active: ${s.conn} · w:${s.weight}</div>
    </div>
  `).join('');
  document.getElementById('stats').innerHTML = html;
}

document.querySelectorAll('.strategy-picker button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.strategy-picker button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    strategy = b.dataset.strategy;
  };
});
document.getElementById('rate').oninput = e => {
  rate = +e.target.value;
  document.getElementById('rateLabel').textContent = rate;
};
document.getElementById('toggle').onclick = e => {
  running = !running;
  e.target.textContent = running ? 'Pause' : 'Resume';
};

requestAnimationFrame(tick);