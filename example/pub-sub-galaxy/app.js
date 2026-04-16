const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

const topics = [
  { name: 'orders', x: canvas.width * 0.25, y: canvas.height * 0.35, r: 18, color: '#6ee7b7', subs: [] },
  { name: 'payments', x: canvas.width * 0.55, y: canvas.height * 0.25, r: 16, color: '#7dd3fc', subs: [] },
  { name: 'alerts', x: canvas.width * 0.75, y: canvas.height * 0.55, r: 20, color: '#fbbf24', subs: [] },
  { name: 'logs', x: canvas.width * 0.4, y: canvas.height * 0.65, r: 14, color: '#f87171', subs: [] }
];

const names = ['AuthSvc','BillingSvc','EmailSvc','DashSvc','AnalyticsSvc','CacheSvc','AuditSvc','NotifySvc'];
let particles = [];

topics.forEach(t => {
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i;
    const dist = 60 + Math.random() * 40;
    t.subs.push({ name: names[(Math.random() * names.length) | 0], angle, dist, speed: 0.003 + Math.random() * 0.004 });
  }
});

function publish(topic) {
  topic.subs.forEach(s => {
    const sx = topic.x + Math.cos(s.angle) * s.dist;
    const sy = topic.y + Math.sin(s.angle) * s.dist;
    particles.push({ x: topic.x, y: topic.y, tx: sx, ty: sy, t: 0, color: topic.color });
  });
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  topics.forEach(tp => { if (Math.hypot(mx - tp.x, my - tp.y) < tp.r + 10) publish(tp); });
});

setInterval(() => publish(topics[(Math.random() * topics.length) | 0]), 2200);

function draw() {
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  topics.forEach(tp => {
    tp.subs.forEach(s => {
      s.angle += s.speed;
      const sx = tp.x + Math.cos(s.angle) * s.dist;
      const sy = tp.y + Math.sin(s.angle) * s.dist;
      ctx.strokeStyle = '#1a1d27';
      ctx.beginPath(); ctx.arc(tp.x, tp.y, s.dist, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#c9d1d9';
      ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = '9px sans-serif';
      ctx.fillText(s.name, sx + 8, sy + 3);
    });
    ctx.shadowColor = tp.color; ctx.shadowBlur = 20;
    ctx.fillStyle = tp.color;
    ctx.beginPath(); ctx.arc(tp.x, tp.y, tp.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f1117'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(tp.name, tp.x, tp.y + 3); ctx.textAlign = 'start';
  });
  particles.forEach(p => {
    p.t += 0.04;
    p.x += (p.tx - p.x) * 0.06;
    p.y += (p.ty - p.y) * 0.06;
    ctx.globalAlpha = 1 - p.t;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
  particles = particles.filter(p => p.t < 1);
  requestAnimationFrame(draw);
}
draw();