const svg = document.getElementById('marble');
const logEl = document.getElementById('log');
const prod = document.getElementById('prod');
const cons = document.getElementById('cons');
const buf = document.getElementById('buf');
const pLabel = document.getElementById('pLabel');
const cLabel = document.getElementById('cLabel');
const bLabel = document.getElementById('bLabel');

let strategy = 'buffer';
document.querySelectorAll('.strategies button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.strategies button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    strategy = b.dataset.s;
    log(`strategy → ${strategy.toUpperCase()}`, 'strat');
  };
});

const ns = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(ns, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function scaffold() {
  svg.innerHTML = '';
  svg.append(
    el('line', { x1: 30, y1: 60, x2: 770, y2: 60, stroke: '#3a4155', 'stroke-width': 2 }),
    el('line', { x1: 30, y1: 200, x2: 770, y2: 200, stroke: '#3a4155', 'stroke-width': 2 }),
  );
  const txt1 = el('text', { x: 30, y: 40, fill: '#9ca3af', 'font-size': 12 });
  txt1.textContent = 'PRODUCER';
  const txt2 = el('text', { x: 30, y: 235, fill: '#9ca3af', 'font-size': 12 });
  txt2.textContent = 'CONSUMER';
  svg.append(txt1, txt2);
}
scaffold();

function log(msg, cls = '') {
  const line = document.createElement('div');
  line.className = 'line ' + cls;
  line.innerHTML = `<b>[${Date.now() % 10000}]</b>${msg}`;
  logEl.prepend(line);
  while (logEl.children.length > 50) logEl.lastChild.remove();
}

let buffer = [];
let counter = 0;
let lastSample = 0;
let lastThrottle = 0;

function emit() {
  counter++;
  const item = { id: counter, born: performance.now() };
  const maxBuf = +buf.value;

  if (strategy === 'buffer') {
    if (buffer.length >= maxBuf) {
      log(`#${item.id} overflow (buffer full)`, 'drop');
      return;
    }
    buffer.push(item);
  } else if (strategy === 'drop-newest') {
    if (buffer.length >= maxBuf) {
      log(`#${item.id} dropped (newest)`, 'drop');
      return;
    }
    buffer.push(item);
  } else if (strategy === 'drop-oldest') {
    if (buffer.length >= maxBuf) {
      const old = buffer.shift();
      log(`#${old.id} evicted (oldest)`, 'drop');
    }
    buffer.push(item);
  } else if (strategy === 'throttle') {
    const now = performance.now();
    const gap = 1000 / +cons.value;
    if (now - lastThrottle < gap) {
      log(`#${item.id} throttled`, 'drop');
      return;
    }
    lastThrottle = now;
    buffer.push(item);
  } else if (strategy === 'sample') {
    buffer = [item];
  }
  renderMarble(item, 'up');
}

function consume() {
  if (strategy === 'sample') {
    const now = performance.now();
    if (now - lastSample < 1000 / +cons.value) return;
    lastSample = now;
    if (buffer.length > 0) {
      const i = buffer.pop();
      renderMarble(i, 'down');
      buffer = [];
    }
    return;
  }
  if (buffer.length === 0) return;
  const i = buffer.shift();
  renderMarble(i, 'down');
}

function renderMarble(item, dir) {
  const x = 30 + (item.id * 37) % 720;
  const y = dir === 'up' ? 60 : 200;
  const c = el('circle', {
    cx: x, cy: y, r: 10,
    fill: dir === 'up' ? '#6ee7b7' : '#a78bfa',
    opacity: 0.95,
  });
  const t = el('text', {
    x, y: y + 4, 'text-anchor': 'middle',
    fill: '#0f1117', 'font-size': 10, 'font-weight': 700,
  });
  t.textContent = item.id % 100;
  svg.append(c, t);

  let r = 10;
  const fade = setInterval(() => {
    r -= 0.3;
    c.setAttribute('r', r);
    c.setAttribute('opacity', r / 10);
    t.setAttribute('opacity', r / 10);
    if (r <= 0) { clearInterval(fade); c.remove(); t.remove(); }
  }, 80);
}

let pAcc = 0, cAcc = 0, last = performance.now();
function loop(t) {
  const dt = (t - last) / 1000; last = t;
  pAcc += dt * +prod.value;
  cAcc += dt * +cons.value;
  while (pAcc >= 1) { pAcc--; emit(); }
  while (cAcc >= 1) { cAcc--; consume(); }

  pLabel.textContent = prod.value + '/s';
  cLabel.textContent = cons.value + '/s';
  bLabel.textContent = `${buffer.length}/${buf.value}`;

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
log('system ready', 'strat');