const canvas = document.getElementById('heatCanvas');
const ctx = canvas.getContext('2d');
const cols = 13, rows = 6, pad = 6, cellW = 54, cellH = 54;
const methods = ['GET','PUT','DELETE','POST','PATCH'];
const paths = ['/users','/orders','/pay','/items','/auth','/config','/notify','/cart','/ship','/refund','/search','/upload','/webhook'];
const grid = [];

function initGrid() {
  grid.length = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const method = methods[r % methods.length];
    const idempotent = ['GET','PUT','DELETE'].includes(method);
    grid.push({ r, c, method, path: paths[c], idempotent, calls: 0, effects: 0 });
  }
}

function cellColor(cell) {
  if (cell.calls === 0) return '#1e2130';
  if (cell.idempotent) return cell.calls > 1 ? '#6ee7b7' : '#3b8268';
  const ratio = Math.min(cell.effects / 5, 1);
  const r_ = Math.round(110 + 145 * ratio), g_ = Math.round(231 - 180 * ratio), b_ = Math.round(183 - 115 * ratio);
  return `rgb(${r_},${g_},${b_})`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  grid.forEach(cell => {
    const x = pad + cell.c * (cellW + pad), y = pad + cell.r * (cellH + pad);
    ctx.fillStyle = cellColor(cell);
    ctx.beginPath(); ctx.roundRect(x, y, cellW, cellH, 6); ctx.fill();
    ctx.fillStyle = '#0f1117'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(cell.method, x + cellW / 2, y + 22);
    ctx.font = '9px monospace';
    ctx.fillText(cell.calls + 'x', x + cellW / 2, y + 38);
  });
}

function simulate() {
  let step = 0;
  const iv = setInterval(() => {
    if (step++ > 60) return clearInterval(iv);
    const cell = grid[Math.floor(Math.random() * grid.length)];
    cell.calls++;
    cell.effects = cell.idempotent ? 1 : cell.effects + 1;
    draw();
  }, 60);
}

function resetGrid() { initGrid(); draw(); }

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const c = Math.floor(mx / (cellW + pad)), r = Math.floor(my / (cellH + pad));
  const cell = grid.find(g => g.r === r && g.c === c);
  const tip = document.getElementById('tooltip');
  if (cell) {
    tip.style.display = 'block'; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY + 12 + 'px';
    tip.innerHTML = `<b>${cell.method} ${cell.path}</b><br>Calls: ${cell.calls} | Effects: ${cell.effects}<br>${cell.idempotent ? '✓ Idempotent' : '✗ Non-idempotent'}`;
  } else tip.style.display = 'none';
});
canvas.addEventListener('mouseleave', () => document.getElementById('tooltip').style.display = 'none');

initGrid(); draw();