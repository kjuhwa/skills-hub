const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const types = ['image', 'video', 'doc', 'archive', 'data'];
const colors = { image: '#6ee7b7', video: '#f97316', doc: '#60a5fa', archive: '#a78bfa', data: '#fb7185' };
let objects = [];

function randSize() { return Math.random() * 800 + 50; }
function mockName(type) {
  const names = { image: 'photo', video: 'clip', doc: 'report', archive: 'backup', data: 'dataset' };
  return `${names[type]}-${(Math.random()*1e4|0)}.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : type === 'doc' ? 'pdf' : type === 'archive' ? 'tar.gz' : 'csv'}`;
}

function addObject() {
  const type = types[Math.random() * types.length | 0];
  objects.push({ key: mockName(type), size: randSize(), type, x: 0, y: 0, r: 0, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5 });
  layout();
}

function clearBucket() { objects = []; }

function layout() {
  const total = objects.reduce((s, o) => s + o.size, 0);
  objects.forEach(o => {
    o.r = Math.max(12, Math.sqrt(o.size / total) * 120);
    if (!o.x) { o.x = Math.random() * 700 + 100; o.y = Math.random() * 350 + 75; }
  });
}

for (let i = 0; i < 18; i++) addObject();

let hovered = null;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy;
  hovered = null;
  for (const o of objects) {
    if (Math.hypot(mx - o.x, my - o.y) < o.r) { hovered = o; break; }
  }
  canvas.style.cursor = hovered ? 'pointer' : 'default';
});

function tick() {
  ctx.clearRect(0, 0, 900, 500);
  for (let i = 0; i < objects.length; i++) {
    const a = objects[i];
    a.x += a.vx; a.y += a.vy;
    if (a.x < a.r || a.x > 900 - a.r) a.vx *= -1;
    if (a.y < a.r || a.y > 500 - a.r) a.vy *= -1;
    for (let j = i + 1; j < objects.length; j++) {
      const b = objects[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), min = a.r + b.r;
      if (dist < min && dist > 0) {
        const nx = dx / dist, ny = dy / dist, push = (min - dist) * .3;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      }
    }
  }
  objects.forEach(o => {
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = (o === hovered ? colors[o.type] + 'cc' : colors[o.type] + '44');
    ctx.fill(); ctx.strokeStyle = colors[o.type]; ctx.lineWidth = o === hovered ? 2.5 : 1; ctx.stroke();
    if (o.r > 18) {
      ctx.fillStyle = '#c9d1d9'; ctx.font = `${Math.min(11, o.r * .35)}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(o.key.length > 14 ? o.key.slice(0, 12) + '..' : o.key, o.x, o.y + 3);
    }
  });
  if (hovered) {
    ctx.fillStyle = '#1a1d27ee'; ctx.fillRect(10, 460, 300, 32); ctx.fillStyle = '#6ee7b7';
    ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${hovered.key}  |  ${(hovered.size / 1024).toFixed(1)} KB  |  ${hovered.type}`, 18, 481);
  }
  const total = objects.reduce((s, o) => s + o.size, 0);
  document.getElementById('stats').textContent = `${objects.length} objects  ·  ${(total / 1024).toFixed(1)} KB total`;
  requestAnimationFrame(tick);
}
tick();