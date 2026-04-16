const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 74;
}
resize();
window.addEventListener('resize', resize);

const services = [
  { name: 'Order', listens: ['OrderRequested'], emits: 'OrderCreated', fails: 'OrderFailed' },
  { name: 'Inventory', listens: ['OrderCreated'], emits: 'InventoryReserved', fails: 'InventoryFailed' },
  { name: 'Payment', listens: ['InventoryReserved'], emits: 'PaymentCharged', fails: 'PaymentFailed' },
  { name: 'Shipping', listens: ['PaymentCharged'], emits: 'OrderShipped', fails: 'ShippingFailed' },
  { name: 'Notify', listens: ['OrderShipped', 'PaymentFailed', 'InventoryFailed'], emits: 'UserNotified' }
];

const nodes = [];
let events = [];
let stats = { total: 0, ok: 0, rollback: 0 };
let chaos = false;

function layoutNodes() {
  nodes.length = 0;
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  services.forEach((s, i) => {
    const a = (i / services.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ ...s, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, pulse: 0 });
  });
}
layoutNodes();
window.addEventListener('resize', layoutNodes);

function emit(type, origin) {
  const target = nodes.find(n => n.listens.includes(type));
  if (!target) return;
  const from = origin || nodes[0];
  events.push({ type, fromX: from.x, fromY: from.y, toX: target.x, toY: target.y, t: 0, target });
  stats.total++;
  updateStats();
}

function updateStats() {
  statsEl.textContent = `Events: ${stats.total} | Success: ${stats.ok} | Rollback: ${stats.rollback}`;
}

function handleArrival(ev) {
  const node = ev.target;
  node.pulse = 1;
  const willFail = chaos && Math.random() < 0.3;
  setTimeout(() => {
    if (willFail && node.fails) {
      stats.rollback++;
      emit(node.fails, node);
    } else if (node.emits) {
      if (node.emits === 'UserNotified') stats.ok++;
      emit(node.emits, node);
    }
    updateStats();
  }, 300);
}

function draw() {
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  nodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 45 + n.pulse * 15, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1d27';
    ctx.fill();
    ctx.strokeStyle = n.pulse > 0 ? `rgba(110,231,183,${n.pulse})` : '#2d3344';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x, n.y + 4);
    n.pulse = Math.max(0, n.pulse - 0.02);
  });

  events = events.filter(ev => {
    ev.t += 0.02;
    if (ev.t >= 1) { handleArrival(ev); return false; }
    const x = ev.fromX + (ev.toX - ev.fromX) * ev.t;
    const y = ev.fromY + (ev.toY - ev.fromY) * ev.t;
    const fail = ev.type.includes('Failed');
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = fail ? '#f87171' : '#6ee7b7';
    ctx.fill();
    ctx.fillStyle = fail ? '#f87171' : '#6ee7b7';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(ev.type, x + 10, y - 6);
    return true;
  });

  requestAnimationFrame(draw);
}
draw();

document.getElementById('emit').onclick = () => emit('OrderRequested', nodes[0]);
document.getElementById('chaos').onclick = (e) => {
  chaos = !chaos;
  e.target.style.color = chaos ? '#f87171' : '';
  e.target.style.borderColor = chaos ? '#f87171' : '';
};
document.getElementById('clear').onclick = () => {
  events = []; stats = { total: 0, ok: 0, rollback: 0 }; updateStats();
};

for (let i = 0; i < 3; i++) setTimeout(() => emit('OrderRequested', nodes[0]), i * 800);