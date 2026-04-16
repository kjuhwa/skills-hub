const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statsEl = document.getElementById('stats');
const tables = ['users','orders','products','payments','sessions','logs'];
const ops = ['INSERT','UPDATE','DELETE'];
const colors = { INSERT:'#6ee7b7', UPDATE:'#60a5fa', DELETE:'#f87171' };
let particles = [], counts = { INSERT:0, UPDATE:0, DELETE:0 }, total = 0;

function resize() { canvas.width = innerWidth; canvas.height = innerHeight - 49; }
resize(); addEventListener('resize', resize);

function spawn() {
  const op = ops[Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2];
  const table = tables[Math.floor(Math.random() * tables.length)];
  particles.push({ x: Math.random() * canvas.width, y: -10, vy: 1 + Math.random() * 2, r: 3 + Math.random() * 4, op, table, alpha: 1, age: 0 });
  counts[op]++; total++;
}

function draw() {
  ctx.fillStyle = 'rgba(15,17,23,0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy; p.age++;
    p.x += Math.sin(p.age * 0.02) * 0.5;
    if (p.y > canvas.height * 0.7) p.alpha -= 0.015;
    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.alpha;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = colors[p.op]; ctx.fill();
    if (p.alpha > 0.8) { ctx.font = '10px monospace'; ctx.fillStyle = '#e2e8f0'; ctx.fillText(p.table, p.x + p.r + 4, p.y + 3); }
  }
  ctx.globalAlpha = 1;
  statsEl.innerHTML = `Total: <span>${total}</span> | INS: <span>${counts.INSERT}</span> | UPD: <span>${counts.UPDATE}</span> | DEL: <span>${counts.DELETE}</span>`;
  if (Math.random() < 0.3) spawn();
  requestAnimationFrame(draw);
}
for (let i = 0; i < 40; i++) spawn();
draw();