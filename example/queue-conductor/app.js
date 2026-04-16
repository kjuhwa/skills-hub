const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const state = {
  producers: [], consumers: [], queue: [], messages: [],
  sent: 0, delivered: 0, running: true, speed: 5,
  tputBuf: [], lastTick: performance.now()
};

const COLORS = ['#6ee7b7', '#fbbf24', '#f87171', '#60a5fa', '#c084fc'];

function makeProducer() {
  const i = state.producers.length;
  state.producers.push({ x: 80, y: 80 + i * 80, cooldown: 0, color: COLORS[i % COLORS.length] });
}
function makeConsumer() {
  const i = state.consumers.length;
  state.consumers.push({ x: W - 80, y: 80 + i * 80, busy: 0, processed: 0 });
}

[0,1].forEach(makeProducer);
[0,1].forEach(makeConsumer);

function emit(p) {
  const msg = {
    x: p.x, y: p.y, tx: 350, ty: H/2,
    color: p.color, phase: 'toQueue', id: ++state.sent
  };
  state.messages.push(msg);
}

function tick(dt) {
  if (!state.running) return;
  const sp = state.speed;
  state.producers.forEach(p => {
    p.cooldown -= dt * sp;
    if (p.cooldown <= 0) { emit(p); p.cooldown = 600 + Math.random() * 800; }
  });

  state.messages.forEach(m => {
    const dx = m.tx - m.x, dy = m.ty - m.y;
    const d = Math.hypot(dx, dy);
    const v = 2 * sp;
    if (d < v) {
      m.x = m.tx; m.y = m.ty;
      if (m.phase === 'toQueue') {
        state.queue.push(m); m.phase = 'queued';
      } else if (m.phase === 'toConsumer') {
        m.consumer.busy = 0; m.consumer.processed++;
        state.delivered++; m.phase = 'done';
      }
    } else {
      m.x += (dx/d) * v; m.y += (dy/d) * v;
    }
  });
  state.messages = state.messages.filter(m => m.phase !== 'done');

  state.consumers.forEach(c => {
    if (c.busy <= 0 && state.queue.length) {
      const m = state.queue.shift();
      m.phase = 'toConsumer'; m.tx = c.x; m.ty = c.y; m.consumer = c;
      c.busy = 30;
    } else if (c.busy > 0) c.busy -= dt * sp * 0.05;
  });

  // queue line up
  state.queue.forEach((m, i) => {
    const slot = 350 + (i % 12) * 22;
    m.tx = slot; m.ty = H/2 + Math.floor(i/12) * 22 - 22;
    if (m.phase === 'queued') { m.x += (m.tx-m.x)*0.2; m.y += (m.ty-m.y)*0.2; }
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // queue zone
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(330, 100, 240, 300);
  ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 1;
  ctx.strokeRect(330, 100, 240, 300);
  ctx.fillStyle = '#7a8198'; ctx.font = '11px sans-serif';
  ctx.fillText('QUEUE (FIFO)', 410, 90);

  state.producers.forEach(p => drawNode(p.x, p.y, p.color, 'P'));
  state.consumers.forEach(c => {
    drawNode(c.x, c.y, c.busy > 0 ? '#fbbf24' : '#6ee7b7', 'C');
    ctx.fillStyle = '#7a8198'; ctx.font = '10px sans-serif';
    ctx.fillText(c.processed, c.x - 8, c.y + 35);
  });

  state.messages.forEach(m => {
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.arc(m.x, m.y, 5, 0, Math.PI*2); ctx.fill();
  });
}

function drawNode(x, y, color, label) {
  ctx.fillStyle = '#1a1d27';
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
}

function updateStats(dt) {
  state.tputBuf.push({t: performance.now(), n: state.delivered});
  state.tputBuf = state.tputBuf.filter(e => performance.now() - e.t < 1000);
  const tput = state.tputBuf.length > 1
    ? state.tputBuf[state.tputBuf.length-1].n - state.tputBuf[0].n : 0;
  document.getElementById('qLen').textContent = state.queue.length;
  document.getElementById('sent').textContent = state.sent;
  document.getElementById('delivered').textContent = state.delivered;
  document.getElementById('tput').textContent = tput;
  document.getElementById('pCount').textContent = state.producers.length;
  document.getElementById('cCount').textContent = state.consumers.length;
}

function loop(now) {
  const dt = now - state.lastTick;
  state.lastTick = now;
  tick(dt); draw(); updateStats(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.getElementById('addProducer').onclick = makeProducer;
document.getElementById('addConsumer').onclick = makeConsumer;
document.getElementById('burst').onclick = () => {
  for (let i = 0; i < 20; i++) emit(state.producers[i % state.producers.length]);
};
document.getElementById('toggleRun').onclick = (e) => {
  state.running = !state.running;
  e.target.textContent = state.running ? 'Pause' : 'Resume';
};
document.getElementById('speed').oninput = (e) => state.speed = +e.target.value;