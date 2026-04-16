const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const procEl = document.getElementById('proc');

function resize() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
window.addEventListener('resize', resize); resize();

const roles = ['Auth', 'Router', 'Worker', 'DB', 'Cache', 'Logger', 'Notifier', 'Validator'];
const actors = roles.map((name, i) => ({
  id: i, name, x: 0, y: 0, r: 28, processed: 0, load: 0, hue: (i * 47) % 360,
  pulse: 0,
}));

function layout() {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R = Math.min(canvas.width, canvas.height) * 0.35;
  actors.forEach((a, i) => {
    const t = (i / actors.length) * Math.PI * 2;
    a.x = cx + Math.cos(t) * R;
    a.y = cy + Math.sin(t) * R;
  });
}
layout();
window.addEventListener('resize', layout);

const messages = [];
let processedTotal = 0;

function send(fromId, toId, color = '#6ee7b7', size = 4) {
  const a = actors[fromId], b = actors[toId];
  if (!a || !b) return;
  a.load++;
  messages.push({ fromId, toId, t: 0, speed: 0.012 + Math.random() * 0.01, color, size });
}

function step() {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    m.t += m.speed;
    if (m.t >= 1) {
      const target = actors[m.toId];
      target.processed++; target.pulse = 1;
      processedTotal++;
      actors[m.fromId].load = Math.max(0, actors[m.fromId].load - 1);
      messages.splice(i, 1);
      if (Math.random() < 0.3) {
        const next = Math.floor(Math.random() * actors.length);
        if (next !== m.toId) send(m.toId, next, m.color, m.size);
      }
    }
  }
  countEl.textContent = messages.length;
  procEl.textContent = processedTotal;
}

function draw() {
  ctx.fillStyle = 'rgba(15,17,23,0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  actors.forEach(a => {
    actors.forEach(b => {
      if (a.id >= b.id) return;
      ctx.strokeStyle = 'rgba(45,49,66,0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
  });

  messages.forEach(m => {
    const a = actors[m.fromId], b = actors[m.toId];
    const x = a.x + (b.x - a.x) * m.t;
    const y = a.y + (b.y - a.y) * m.t;
    ctx.fillStyle = m.color;
    ctx.shadowColor = m.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(x, y, m.size, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  actors.forEach(a => {
    const radius = a.r + a.pulse * 8;
    ctx.fillStyle = `hsl(${a.hue}, 40%, 18%)`;
    ctx.strokeStyle = `hsl(${a.hue}, 70%, 65%)`;
    ctx.lineWidth = 2 + a.pulse * 2;
    ctx.beginPath(); ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    a.pulse *= 0.9;
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(a.name, a.x, a.y + 3);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '9px monospace';
    ctx.fillText(`${a.processed}`, a.x, a.y + a.r + 14);
    if (a.load > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(a.x + a.r * 0.7, a.y - a.r * 0.7, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace';
      ctx.fillText(a.load, a.x + a.r * 0.7, a.y - a.r * 0.7 + 3);
    }
  });
}

const patterns = {
  'request-reply': () => { const a = rnd(), b = rnd(a); send(a, b, '#6ee7b7'); setTimeout(() => send(b, a, '#fbbf24'), 400); },
  'broadcast': () => { const src = rnd(); actors.forEach(t => { if (t.id !== src) send(src, t.id, '#a78bfa'); }); },
  'pipeline': () => { const chain = shuffle([...actors.keys()]).slice(0, 5); for (let i = 0; i < chain.length - 1; i++) setTimeout(() => send(chain[i], chain[i + 1], '#60a5fa'), i * 200); },
  'fan-out': () => { const src = rnd(); for (let i = 0; i < 4; i++) setTimeout(() => send(src, rnd(src), '#f472b6'), i * 60); },
};
function rnd(exclude) { let i; do { i = Math.floor(Math.random() * actors.length); } while (i === exclude); return i; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }

document.querySelectorAll('[data-pattern]').forEach(b => b.onclick = () => patterns[b.dataset.pattern]());

let dragging = null;
canvas.addEventListener('mousedown', e => {
  const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  dragging = actors.find(a => Math.hypot(a.x - mx, a.y - my) < a.r);
});
canvas.addEventListener('mousemove', e => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  dragging.x = e.clientX - r.left; dragging.y = e.clientY - r.top;
});
canvas.addEventListener('mouseup', () => dragging = null);

setInterval(() => { if (Math.random() < 0.5) patterns[Object.keys(patterns)[Math.floor(Math.random() * 4)]](); }, 1800);
function loop() { step(); draw(); requestAnimationFrame(loop); } loop();