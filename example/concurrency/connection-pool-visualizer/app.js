const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

let poolSize = 10;
let avgDuration = 2000;
let slots = [];
let queue = [];
let nextId = 1;

function initSlots() {
  slots = Array.from({ length: poolSize }, (_, i) => ({ idx: i, conn: null }));
}
initSlots();

function request() {
  const id = nextId++;
  const conn = { id, start: performance.now(), duration: avgDuration * (0.5 + Math.random()) };
  const free = slots.find(s => !s.conn);
  if (free) {
    free.conn = conn;
    log(`conn#${id} acquired slot ${free.idx}`, 'ok');
  } else {
    queue.push(conn);
    log(`conn#${id} queued`, 'wait');
  }
}

function release(slot) {
  if (!slot.conn) return;
  log(`conn#${slot.conn.id} released slot ${slot.idx}`, 'ok');
  slot.conn = null;
  if (queue.length) {
    const next = queue.shift();
    next.start = performance.now();
    slot.conn = next;
    log(`conn#${next.id} dequeued → slot ${slot.idx}`, 'ok');
  }
}

function log(msg, cls) {
  const el = document.getElementById('log');
  const line = document.createElement('div');
  line.className = 'log-entry ' + cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.prepend(line);
  while (el.childNodes.length > 30) el.removeChild(el.lastChild);
}

function update() {
  const now = performance.now();
  for (const s of slots) {
    if (s.conn && now - s.conn.start > s.conn.duration) release(s);
  }
}

function drawSlot(x, y, r, slot) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = slot.conn ? '#6ee7b7' : '#2a2f3e';
  ctx.fill();
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (slot.conn) {
    const now = performance.now();
    const p = Math.min(1, (now - slot.conn.start) / slot.conn.duration);
    ctx.beginPath();
    ctx.arc(x, y, r + 6, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#0f1117';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('#' + slot.conn.id, x, y);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Pool Slots', 20, 30);
  ctx.fillText('Wait Queue', 20, 280);

  const cols = 5, r = 28;
  slots.forEach((s, i) => {
    const x = 80 + (i % cols) * 130;
    const y = 80 + Math.floor(i / cols) * 90;
    drawSlot(x, y, r, s);
  });

  queue.slice(0, 10).forEach((c, i) => {
    const x = 60 + i * 60;
    const y = 360;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.fillStyle = '#0f1117';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('#' + c.id, x, y);
  });
  if (queue.length > 10) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '13px sans-serif';
    ctx.fillText(`+${queue.length - 10} more…`, 660, 365);
  }

  const active = slots.filter(s => s.conn).length;
  document.getElementById('active').textContent = active;
  document.getElementById('idle').textContent = slots.length - active;
  document.getElementById('waiting').textContent = queue.length;
  document.getElementById('total').textContent = slots.length;
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.getElementById('request').onclick = request;
document.getElementById('burst').onclick = () => { for (let i = 0; i < 10; i++) request(); };
document.getElementById('release').onclick = () => {
  const taken = slots.filter(s => s.conn).sort((a, b) => a.conn.start - b.conn.start);
  if (taken[0]) release(taken[0]);
};
document.getElementById('pool-size').oninput = e => {
  poolSize = +e.target.value;
  const old = slots.map(s => s.conn);
  initSlots();
  old.forEach((c, i) => { if (c && i < slots.length) slots[i].conn = c; else if (c) queue.unshift(c); });
};
document.getElementById('duration').oninput = e => { avgDuration = +e.target.value; };

for (let i = 0; i < 5; i++) request();
setInterval(() => { if (Math.random() < 0.5) request(); }, 800);
loop();