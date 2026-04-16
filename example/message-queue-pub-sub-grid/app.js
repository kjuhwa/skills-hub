const PUBS = [
  { name: 'OrderService', topics: ['order.created', 'order.paid'] },
  { name: 'UserService', topics: ['user.signup', 'user.login'] },
  { name: 'Inventory', topics: ['stock.low', 'stock.update'] },
  { name: 'Auth', topics: ['user.login', 'security.alert'] }
];
const SUBS = [
  { name: 'EmailWorker', filters: ['user.signup', 'order.paid'], count: 0 },
  { name: 'Analytics', filters: ['order.created', 'user.login', 'stock.update'], count: 0 },
  { name: 'AlertBot', filters: ['stock.low', 'security.alert'], count: 0 },
  { name: 'AuditLog', filters: ['order.created', 'order.paid', 'user.signup', 'user.login', 'stock.low', 'stock.update', 'security.alert'], count: 0 }
];

const canvas = document.getElementById('bus');
const ctx = canvas.getContext('2d');
const messages = [];
let total = 0;
let auto = false;

function renderLists() {
  const pubEl = document.getElementById('publishers');
  pubEl.innerHTML = '';
  PUBS.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'node';
    d.dataset.idx = i;
    d.innerHTML = `<div class="name">${p.name}</div><div class="topics">${p.topics.join(', ')}</div>`;
    d.onclick = () => publish(i);
    pubEl.appendChild(d);
  });
  const subEl = document.getElementById('subscribers');
  subEl.innerHTML = '';
  SUBS.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'node sub';
    d.dataset.idx = i;
    d.innerHTML = `<div class="name">${s.name}<span class="count">${s.count}</span></div><div class="topics">${s.filters.slice(0, 2).join(', ')}${s.filters.length > 2 ? '...' : ''}</div>`;
    subEl.appendChild(d);
  });
}

function publish(pubIdx) {
  const pub = PUBS[pubIdx];
  const topic = pub.topics[Math.floor(Math.random() * pub.topics.length)];
  flash(`#publishers .node[data-idx="${pubIdx}"]`);
  SUBS.forEach((sub, sIdx) => {
    if (sub.filters.includes(topic)) {
      messages.push({
        topic,
        fromY: 60 + pubIdx * 80,
        toY: 60 + sIdx * 80,
        x: 0,
        progress: 0,
        subIdx: sIdx
      });
    }
  });
  total++;
  document.getElementById('total').textContent = total;
}

function flash(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 250);
}

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#252836';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 60 + i * 80);
    ctx.lineTo(W, 60 + i * 80);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(W / 2 - 30, 0, 60, H);
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 11px sans-serif';
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('TOPIC BUS', 0, 4);
  ctx.restore();

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    m.progress += 0.018;
    const t = m.progress;
    const x = t * W;
    const y = m.fromY + (m.toY - m.fromY) * t;
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    if (t < 0.5) ctx.fillText(m.topic, x + 8, y + 3);
    if (t >= 1) {
      SUBS[m.subIdx].count++;
      flash(`#subscribers .node[data-idx="${m.subIdx}"]`);
      renderLists();
      messages.splice(i, 1);
    }
  }
  requestAnimationFrame(draw);
}

document.getElementById('auto').onclick = () => {
  auto = !auto;
};

setInterval(() => {
  if (auto) publish(Math.floor(Math.random() * PUBS.length));
}, 800);

renderLists();
draw();
publish(0);
setTimeout(() => publish(2), 300);