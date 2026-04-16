const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const psiEl = document.getElementById('psi');
const resetBtn = document.getElementById('reset');

let pipes, packets, score, level, spawnTimer, gameOver, rafId;

function init() {
  pipes = [
    { x: 120, y: 120, pressure: 0, max: 100, valveOpen: false, label: 'API' },
    { x: 360, y: 120, pressure: 0, max: 100, valveOpen: false, label: 'QUEUE' },
    { x: 600, y: 120, pressure: 0, max: 100, valveOpen: false, label: 'DB' },
    { x: 240, y: 300, pressure: 0, max: 100, valveOpen: false, label: 'CACHE' },
    { x: 480, y: 300, pressure: 0, max: 100, valveOpen: false, label: 'WORKER' },
  ];
  packets = [];
  score = 0;
  level = 1;
  spawnTimer = 0;
  gameOver = false;
}
init();

canvas.addEventListener('click', e => {
  if (gameOver) { init(); animate(); return; }
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top) * (H / rect.height);
  for (const p of pipes) {
    const dx = mx - p.x, dy = my - (p.y + 70);
    if (dx * dx + dy * dy < 300) {
      p.valveOpen = true;
      setTimeout(() => p.valveOpen = false, 600);
    }
  }
});
resetBtn.onclick = () => { init(); cancelAnimationFrame(rafId); animate(); };

function spawn() {
  const target = pipes[Math.floor(Math.random() * pipes.length)];
  packets.push({
    x: Math.random() * W,
    y: -10,
    target,
    speed: 2 + level * 0.3,
  });
}

function update(dt) {
  spawnTimer += dt;
  const spawnGap = Math.max(0.15, 0.9 - level * 0.08);
  while (spawnTimer > spawnGap) {
    spawnTimer -= spawnGap;
    spawn();
  }

  for (let i = packets.length - 1; i >= 0; i--) {
    const p = packets[i];
    const dx = p.target.x - p.x;
    const dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    p.x += (dx / d) * p.speed;
    p.y += (dy / d) * p.speed;
    if (d < 10) {
      p.target.pressure += 6;
      packets.splice(i, 1);
      score++;
    }
  }

  let totalPressure = 0;
  for (const pipe of pipes) {
    if (pipe.valveOpen) pipe.pressure -= 45 * dt;
    pipe.pressure -= 3 * dt;
    pipe.pressure = Math.max(0, pipe.pressure);
    totalPressure += pipe.pressure;
    if (pipe.pressure >= pipe.max) {
      gameOver = true;
    }
  }

  if (score > level * 30) level++;
  psiEl.textContent = Math.round(totalPressure / pipes.length) + ' psi';
  scoreEl.textContent = score;
  levelEl.textContent = level;
}

function drawPipe(p) {
  const ratio = p.pressure / p.max;
  const color = ratio > 0.85 ? '#ef4444'
              : ratio > 0.6 ? '#f59e0b'
              : '#6ee7b7';

  ctx.strokeStyle = '#252a38';
  ctx.lineWidth = 4;
  ctx.strokeRect(p.x - 50, p.y - 40, 100, 80);

  ctx.fillStyle = color;
  const fillH = 76 * ratio;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(p.x - 48, p.y + 38 - fillH, 96, fillH);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.label, p.x, p.y + 4);
  ctx.fillStyle = color;
  ctx.font = '10px sans-serif';
  ctx.fillText(Math.round(p.pressure) + '%', p.x, p.y + 22);

  ctx.beginPath();
  ctx.arc(p.x, p.y + 70, 16, 0, Math.PI * 2);
  ctx.fillStyle = p.valveOpen ? '#6ee7b7' : '#2a3242';
  ctx.fill();
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(p.valveOpen ? '○' : '×', p.x, p.y + 75);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (const p of pipes) drawPipe(p);
  for (const pk of packets) {
    ctx.fillStyle = '#a78bfa';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (gameOver) {
    ctx.fillStyle = 'rgba(15,17,23,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PIPE BURST', W / 2, H / 2 - 10);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click to restart — score: ' + score, W / 2, H / 2 + 20);
  }
}

let last = performance.now();
function animate(t = performance.now()) {
  const dt = Math.min(0.1, (t - last) / 1000);
  last = t;
  if (!gameOver) update(dt);
  draw();
  rafId = requestAnimationFrame(animate);
}
animate();