const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const W = 600, H = 520, cx = W / 2, cy = H / 2;

const modules = [
  { id: 'domain', label: 'Domain', ring: 0, slot: 0, color: '#fbbf24', deps: [] },
  { id: 'app-svc', label: 'App Service', ring: 1, slot: 0, color: '#6ee7b7', deps: ['domain'] },
  { id: 'ports-in', label: 'Inbound Port', ring: 1, slot: 1, color: '#6ee7b7', deps: ['domain'] },
  { id: 'ports-out', label: 'Outbound Port', ring: 1, slot: 2, color: '#6ee7b7', deps: ['domain'] },
  { id: 'rest-adapter', label: 'REST Adapter', ring: 2, slot: 0, color: '#60a5fa', deps: ['ports-in', 'app-svc'] },
  { id: 'grpc-adapter', label: 'gRPC Adapter', ring: 2, slot: 1, color: '#60a5fa', deps: ['ports-in', 'app-svc'] },
  { id: 'db-adapter', label: 'DB Adapter', ring: 2, slot: 2, color: '#60a5fa', deps: ['ports-out'] },
  { id: 'mq-adapter', label: 'MQ Adapter', ring: 2, slot: 3, color: '#60a5fa', deps: ['ports-out'] },
  { id: 'config', label: 'Config/DI', ring: 2, slot: 4, color: '#a78bfa', deps: ['app-svc', 'ports-in', 'ports-out', 'rest-adapter', 'db-adapter'] },
];

const ringRadii = [0, 110, 210];
const ringCounts = [1, 3, 5];

modules.forEach(m => {
  if (m.ring === 0) { m.x = cx; m.y = cy; }
  else {
    const count = ringCounts[m.ring];
    const a = (2 * Math.PI * m.slot) / count - Math.PI / 2;
    m.x = cx + ringRadii[m.ring] * Math.cos(a);
    m.y = cy + ringRadii[m.ring] * Math.sin(a);
  }
});

let selected = null;

function draw() {
  ctx.clearRect(0, 0, W, H);
  // Hex rings
  [80, 150, 240].forEach((r, i) => {
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const a = Math.PI / 3 * j - Math.PI / 6;
      j === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = '#2a2d37'; ctx.lineWidth = 1; ctx.stroke();
  });

  // Dependency arrows
  modules.forEach(m => {
    m.deps.forEach(dId => {
      const t = modules.find(x => x.id === dId);
      const highlight = selected && (selected.id === m.id || selected.id === t.id);
      const bad = selected && selected.ring < m.ring && selected.id === t.id && m.deps.includes(selected.id);
      ctx.beginPath();
      ctx.moveTo(m.x, m.y); ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = highlight ? (bad ? '#ef4444' : '#6ee7b7') : '#2a2d37';
      ctx.lineWidth = highlight ? 2.5 : 1;
      ctx.stroke();
      // arrowhead
      const angle = Math.atan2(t.y - m.y, t.x - m.x);
      const ax = t.x - 28 * Math.cos(angle), ay = t.y - 28 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = highlight ? '#6ee7b7' : '#2a2d37'; ctx.fill();
    });
  });

  // Nodes
  modules.forEach(m => {
    const active = !selected || selected.id === m.id || selected.deps.includes(m.id) || m.deps.includes(selected.id);
    ctx.beginPath(); ctx.arc(m.x, m.y, 26, 0, Math.PI * 2);
    ctx.fillStyle = active ? m.color + '30' : '#1a1d27';
    ctx.fill();
    ctx.strokeStyle = active ? m.color : '#2a2d37';
    ctx.lineWidth = selected && selected.id === m.id ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = active ? '#fff' : '#555';
    ctx.font = '10px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(m.label, m.x, m.y + 4);
  });
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top) * (H / rect.height);
  let found = null;
  modules.forEach(m => { if (Math.hypot(mx - m.x, my - m.y) < 28) found = m; });
  selected = found === selected ? null : found;
  draw();
  if (selected) {
    const depNames = selected.deps.map(d => modules.find(x => x.id === d).label);
    info.innerHTML = `<span>${selected.label}</span> depends on: ${depNames.length ? depNames.join(', ') : 'nothing (pure domain)'}. Ring ${selected.ring} → dependencies point inward ✓`;
  } else { info.innerHTML = 'Click any module to see its dependency flow'; }
});

draw();
info.innerHTML = 'Click any module to see its dependency flow';