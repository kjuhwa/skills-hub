const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const cx = 250, cy = 250;

const layers = [
  { r: 70, color: '#fbbf24', label: 'Domain Model', desc: 'Pure business logic, entities and value objects. No dependencies on outer layers.',
    items: ['Entity: Order', 'Entity: Customer', 'Value: Money', 'Value: Address', 'Domain Event: OrderPlaced'] },
  { r: 130, color: '#6ee7b7', label: 'Application Services', desc: 'Use cases and port interfaces. Orchestrates domain objects.',
    items: ['Port: OrderRepository', 'Port: PaymentGateway', 'UseCase: PlaceOrder', 'UseCase: CancelOrder', 'Port: NotificationSender'] },
  { r: 190, color: '#60a5fa', label: 'Adapters', desc: 'Implementations of ports. Connects domain to infrastructure.',
    items: ['Adapter: PostgresOrderRepo', 'Adapter: StripePayment', 'Adapter: REST Controller', 'Adapter: gRPC Controller', 'Adapter: EmailNotifier'] },
  { r: 240, color: '#a78bfa', label: 'Infrastructure', desc: 'Frameworks, drivers, and external systems.',
    items: ['PostgreSQL', 'Redis Cache', 'RabbitMQ', 'Express/Spring', 'Docker Config'] },
];

let hovered = -1;

function hexPath(r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i - Math.PI / 6;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, 500, 500);
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i];
    hexPath(l.r);
    ctx.fillStyle = i === hovered ? l.color + '33' : l.color + '15';
    ctx.fill();
    ctx.strokeStyle = i === hovered ? l.color : l.color + '88';
    ctx.lineWidth = i === hovered ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = i === hovered ? '#fff' : '#8b949e';
    ctx.font = i === hovered ? 'bold 13px Segoe UI' : '12px Segoe UI';
    ctx.textAlign = 'center';
    const ty = i === 0 ? cy : cy - (l.r + layers[i - 1].r) / 2;
    ctx.fillText(l.label, cx, ty + 4);
  }
}

function distToCenter(mx, my) { return Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2); }

function hexRadius(mx, my) {
  const dx = mx - cx, dy = my - cy;
  const angle = Math.atan2(dy, dx) + Math.PI / 6;
  const sector = Math.cos(Math.PI / 6) / Math.cos((angle % (Math.PI / 3)) - Math.PI / 6);
  return Math.sqrt(dx * dx + dy * dy) / sector;
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (500 / rect.width);
  const my = (e.clientY - rect.top) * (500 / rect.height);
  const hr = hexRadius(mx, my);
  let found = -1;
  for (let i = 0; i < layers.length; i++) { if (hr <= layers[i].r) { found = i; break; } }
  if (found !== hovered) {
    hovered = found;
    draw();
    const title = document.getElementById('d-title');
    const desc = document.getElementById('d-desc');
    const items = document.getElementById('d-items');
    if (found >= 0) {
      title.textContent = layers[found].label;
      desc.textContent = layers[found].desc;
      items.innerHTML = layers[found].items.map(i => `<li>${i}</li>`).join('');
    } else {
      title.textContent = 'Hover a layer';
      desc.textContent = 'Move your mouse over the hexagonal rings.';
      items.innerHTML = '';
    }
  }
});

draw();