const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
const info = document.getElementById('info');
let W, H; function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; } resize(); onresize = resize;

const nodes = [
  { label: 'Core API', health: 98, angle: 0, r: 130, color: '#6ee7b7' },
  { label: 'Postgres', health: 87, angle: 0.8, r: 130, color: '#6ee7b7' },
  { label: 'Redis', health: 100, angle: 1.6, r: 130, color: '#6ee7b7' },
  { label: 'Worker', health: 42, angle: 2.4, r: 130, color: '#fbbf24' },
  { label: 'Scheduler', health: 0, angle: 3.2, r: 130, color: '#f87171' },
  { label: 'S3 Store', health: 95, angle: 4.0, r: 130, color: '#6ee7b7' },
  { label: 'Mailer', health: 73, angle: 4.8, r: 130, color: '#fbbf24' },
  { label: 'Logger', health: 99, angle: 5.6, r: 130, color: '#6ee7b7' },
];
const outer = [
  { label: 'EU Region', health: 91, angle: 0.4, r: 230, color: '#6ee7b7' },
  { label: 'US Region', health: 85, angle: 1.8, r: 230, color: '#6ee7b7' },
  { label: 'APAC Region', health: 60, angle: 3.4, r: 230, color: '#fbbf24' },
  { label: 'Failover', health: 100, angle: 5.0, r: 230, color: '#6ee7b7' },
];
const all = [...nodes, ...outer];
let hovered = null, mouse = { x: 0, y: 0 };

canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

function getPos(n, t) {
  const cx = W / 2, cy = H / 2;
  return { x: cx + Math.cos(n.angle + t) * n.r, y: cy + Math.sin(n.angle + t) * n.r };
}

function draw(t) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  [130, 230].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = '#1a1d27'; ctx.lineWidth = 1; ctx.stroke(); });
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fillStyle = '#6ee7b7'; ctx.fill();
  ctx.fillStyle = '#0f1117'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('HQ', cx, cy + 4);
  hovered = null;
  all.forEach(n => {
    const speed = n.r === 130 ? 0.0003 : 0.00015;
    const p = getPos(n, t * speed);
    const sz = 10 + (n.health / 100) * 10;
    const dist = Math.hypot(mouse.x - p.x, mouse.y - p.y);
    if (dist < sz + 6) hovered = n;
    ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
    ctx.fillStyle = n === hovered ? '#fff' : n.color; ctx.globalAlpha = n.health === 0 ? 0.3 : 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#0f1117'; ctx.font = '9px system-ui'; ctx.textAlign = 'center'; ctx.fillText(n.label.slice(0, 5), p.x, p.y + 3);
  });
  info.innerHTML = hovered ? `<b style="color:${hovered.color}">${hovered.label}</b><br>Health: ${hovered.health}%<br>Ring: ${hovered.r === 130 ? 'Core' : 'Edge'}` : 'Hover a node';
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);