const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tip = document.getElementById('tooltip');
canvas.width = Math.min(window.innerWidth - 40, 900);
canvas.height = Math.min(window.innerHeight - 90, 560);

const contexts = [
  { id: 'order', label: 'Order', x: 150, y: 120, r: 54, color: '#6ee7b7' },
  { id: 'inventory', label: 'Inventory', x: 400, y: 100, r: 50, color: '#7dd3fc' },
  { id: 'shipping', label: 'Shipping', x: 650, y: 150, r: 48, color: '#fca5a5' },
  { id: 'billing', label: 'Billing', x: 250, y: 340, r: 52, color: '#fcd34d' },
  { id: 'customer', label: 'Customer', x: 520, y: 360, r: 56, color: '#c4b5fd' },
  { id: 'catalog', label: 'Catalog', x: 720, y: 380, r: 44, color: '#f9a8d4' },
];

const relations = [
  { from: 'order', to: 'inventory', type: 'Partnership', desc: 'Reserve stock on order placed' },
  { from: 'order', to: 'billing', type: 'Customer-Supplier', desc: 'Order triggers invoice creation' },
  { from: 'order', to: 'shipping', type: 'Conformist', desc: 'Shipping conforms to order schema' },
  { from: 'customer', to: 'order', type: 'Shared Kernel', desc: 'Shared customer identity' },
  { from: 'customer', to: 'billing', type: 'ACL', desc: 'Anti-corruption layer for legacy billing' },
  { from: 'catalog', to: 'inventory', type: 'Open Host', desc: 'Published product API' },
];

let drag = null, offsetX, offsetY;
const byId = id => contexts.find(c => c.id === id);

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  relations.forEach(r => {
    const a = byId(r.from), b = byId(r.to);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.fillStyle = '#586069'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(r.type, mx, my - 6);
  });
  contexts.forEach(c => {
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = c.color + '18'; ctx.fill();
    ctx.strokeStyle = c.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = c.color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(c.label, c.x, c.y + 5);
  });
}

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  for (const c of contexts) { if (Math.hypot(mx - c.x, my - c.y) < c.r) { drag = c; offsetX = mx - c.x; offsetY = my - c.y; canvas.style.cursor = 'grabbing'; return; } }
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  if (drag) { drag.x = mx - offsetX; drag.y = my - offsetY; draw(); return; }
  for (const r of relations) {
    const a = byId(r.from), b = byId(r.to), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (Math.hypot(mx - mid.x, my - mid.y) < 20) { tip.style.display = 'block'; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY + 12 + 'px'; tip.textContent = `${r.type}: ${r.desc}`; return; }
  }
  tip.style.display = 'none';
});
canvas.addEventListener('mouseup', () => { drag = null; canvas.style.cursor = 'grab'; });
draw();