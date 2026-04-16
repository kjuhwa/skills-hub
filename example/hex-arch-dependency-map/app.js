const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const detail = document.getElementById('detail');
const W = 800, H = 560, CX = W / 2, CY = H / 2;

const nodes = [
  { id: 'OrderEntity', layer: 0, angle: -0.3, label: 'Order Entity' },
  { id: 'UserEntity', layer: 0, angle: 0.5, label: 'User Entity' },
  { id: 'CreateOrderPort', layer: 1, angle: -1.2, label: 'CreateOrder Port' },
  { id: 'GetUserPort', layer: 1, angle: -0.1, label: 'GetUser Port' },
  { id: 'SaveOrderPort', layer: 1, angle: 1.0, label: 'SaveOrder Port' },
  { id: 'NotifyPort', layer: 1, angle: 2.2, label: 'Notify Port' },
  { id: 'RestCtrl', layer: 2, angle: -1.5, label: 'REST Controller' },
  { id: 'GraphQL', layer: 2, angle: -0.6, label: 'GraphQL Adapter' },
  { id: 'PgRepo', layer: 2, angle: 0.4, label: 'Postgres Repo' },
  { id: 'RedisCache', layer: 2, angle: 1.3, label: 'Redis Cache' },
  { id: 'EmailSvc', layer: 2, angle: 2.4, label: 'Email Service' },
  { id: 'KafkaPub', layer: 2, angle: 3.2, label: 'Kafka Publisher' }
];

const edges = [
  ['RestCtrl', 'CreateOrderPort'], ['GraphQL', 'GetUserPort'],
  ['CreateOrderPort', 'OrderEntity'], ['GetUserPort', 'UserEntity'],
  ['OrderEntity', 'SaveOrderPort'], ['SaveOrderPort', 'PgRepo'],
  ['OrderEntity', 'NotifyPort'], ['NotifyPort', 'EmailSvc'],
  ['NotifyPort', 'KafkaPub'], ['PgRepo', 'RedisCache']
];

const radii = [70, 150, 240];
const colors = ['#6ee7b7', '#3b82f6', '#f97316'];
let hovered = null;

function pos(n) {
  const r = radii[n.layer];
  return { x: CX + r * Math.cos(n.angle), y: CY + r * Math.sin(n.angle) };
}

function hexPath(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * Math.PI / 3;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

function drawArrow(x1, y1, x2, y2, color, width) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const ax = x2 - ux * 14, ay = y2 - uy * 14;
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(ax - uy * 5, ay + ux * 5);
  ctx.lineTo(ax + uy * 5, ay - ux * 5);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  radii.slice().reverse().forEach((r, ri) => {
    const i = 2 - ri;
    hexPath(CX, CY, r); ctx.strokeStyle = colors[i] + '55'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = colors[i] + '08'; ctx.fill();
  });
  const hovEdges = hovered ? edges.filter(e => e[0] === hovered.id || e[1] === hovered.id) : [];
  edges.forEach(([fromId, toId]) => {
    const from = nodes.find(n => n.id === fromId), to = nodes.find(n => n.id === toId);
    const p1 = pos(from), p2 = pos(to);
    const lit = hovEdges.some(e => e[0] === fromId && e[1] === toId);
    drawArrow(p1.x, p1.y, p2.x, p2.y, lit ? '#6ee7b7' : '#333', lit ? 2.5 : 1);
  });
  nodes.forEach(n => {
    const p = pos(n), isHov = hovered && hovered.id === n.id;
    ctx.beginPath(); ctx.arc(p.x, p.y, isHov ? 20 : 14, 0, Math.PI * 2);
    ctx.fillStyle = isHov ? colors[n.layer] : colors[n.layer] + '44'; ctx.fill();
    ctx.strokeStyle = colors[n.layer]; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = isHov ? '#0f1117' : colors[n.layer];
    ctx.font = `${isHov ? 'bold ' : ''}9px Segoe UI`;
    ctx.textAlign = 'center'; ctx.fillText(n.label, p.x, p.y + 3);
  });
  requestAnimationFrame(draw);
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  hovered = null;
  for (const n of nodes) {
    const p = pos(n);
    if (Math.hypot(mx - p.x, my - p.y) < 20) { hovered = n; break; }
  }
  if (hovered) {
    const deps = edges.filter(e => e[0] === hovered.id).map(e => e[1]);
    const depBy = edges.filter(e => e[1] === hovered.id).map(e => e[0]);
    const layer = ['Domain Core', 'Port', 'Adapter'][hovered.layer];
    detail.innerHTML = `<strong style="color:${colors[hovered.layer]}">${hovered.label}</strong> (${layer}) — depends on: ${deps.join(', ') || 'none'} | depended by: ${depBy.join(', ') || 'none'}`;
  } else {
    detail.textContent = 'Hover a node for details';
  }
});
draw();