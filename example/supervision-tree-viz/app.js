const canvas = document.getElementById('tree');
const ctx = canvas.getContext('2d');
const events = document.getElementById('events');

function resize() { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
window.addEventListener('resize', resize); resize();

let nextId = 0;
const makeActor = (name, isSup = false) => ({ id: ++nextId, name, isSup, children: [], state: 'alive', restarts: 0, crashFlash: 0 });

const root = makeActor('RootSup', true);
const workerSup = makeActor('WorkerSup', true);
const dbSup = makeActor('DbSup', true);
root.children.push(workerSup, dbSup);
workerSup.children.push(makeActor('Worker-1'), makeActor('Worker-2'), makeActor('Worker-3'));
dbSup.children.push(makeActor('Reader'), makeActor('Writer'), makeActor('Cache'));

const hits = [];

function layout(node, x, y, spreadX) {
  node._x = x; node._y = y;
  if (!node.children.length) return;
  const step = spreadX / Math.max(node.children.length, 1);
  node.children.forEach((c, i) => {
    const cx = x - spreadX / 2 + step * i + step / 2;
    layout(c, cx, y + 110, spreadX / node.children.length * 1.1);
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  layout(root, canvas.width / 2, 60, canvas.width * 0.85);
  drawEdges(root);
  drawNode(root);
}

function drawEdges(node) {
  node.children.forEach(c => {
    ctx.strokeStyle = '#2d3142';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(node._x, node._y + 22);
    ctx.lineTo(c._x, c._y - 22);
    ctx.stroke();
    drawEdges(c);
  });
}

function drawNode(node) {
  const color = node.state === 'crashed' ? '#ef4444' : node.isSup ? '#6ee7b7' : '#fbbf24';
  ctx.fillStyle = node.crashFlash > 0 ? '#ef4444' : '#1a1d27';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 + node.crashFlash;
  if (node.crashFlash > 0) node.crashFlash -= 0.1;
  ctx.beginPath();
  if (node.isSup) ctx.rect(node._x - 40, node._y - 20, 80, 40);
  else ctx.arc(node._x, node._y, 22, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(node.name, node._x, node._y + 3);
  if (node.restarts) { ctx.fillStyle = '#6ee7b7'; ctx.fillText(`↻${node.restarts}`, node._x, node._y + 38); }
  hits.push({ node, x: node._x, y: node._y, r: node.isSup ? 42 : 22 });
  node.children.forEach(drawNode);
}

function logEv(text, cls) {
  const div = document.createElement('div');
  div.className = 'event ' + cls;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  events.prepend(div);
  while (events.children.length > 20) events.removeChild(events.lastChild);
}

function crashActor(node, parent) {
  if (node.isSup || node.state === 'crashed') return;
  node.state = 'crashed'; node.crashFlash = 1;
  logEv(`CRASH: ${node.name}`, 'crash');
  const strat = document.querySelector('input[name=strat]:checked').value;
  setTimeout(() => applyStrategy(parent, node, strat), 600);
}

function applyStrategy(parent, crashed, strat) {
  if (strat === 'one-for-one') restart(crashed);
  else if (strat === 'one-for-all') parent.children.forEach(restart);
  else if (strat === 'rest-for-one') {
    const idx = parent.children.indexOf(crashed);
    parent.children.slice(idx).forEach(restart);
  }
}

function restart(node) {
  node.state = 'alive'; node.restarts++;
  logEv(`RESTART: ${node.name}`, 'restart');
}

function findParent(node, target) {
  for (const c of node.children) {
    if (c === target) return node;
    const p = findParent(c, target);
    if (p) return p;
  }
  return null;
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  for (const h of hits) {
    if (Math.hypot(h.x - mx, h.y - my) < h.r) {
      crashActor(h.node, findParent(root, h.node));
      break;
    }
  }
});

setInterval(() => { hits.length = 0; draw(); }, 50);
logEv('System booted with 2 supervisors and 6 workers', 'spawn');