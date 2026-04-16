const svg = document.getElementById('scene');
const NS = 'http://www.w3.org/2000/svg';
const SERVER = { x: 500, y: 200 };
let clients = [], tick = 0, served = 0, dropped = 0, rpsWindow = [], running = false;

function rand(a, b) { return a + Math.random() * (b - a); }

function spawnClients() {
  const n = +document.getElementById('clients').value;
  clients = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    clients.push({
      x: 100 + Math.cos(angle) * 60, y: 200 + Math.sin(angle) * 100,
      retryAt: 0, attempts: 0, state: 'idle', lastDelay: 1
    });
  }
  render();
}

function triggerOutage() {
  const jitter = +document.getElementById('jitter').value / 100;
  clients.forEach(c => {
    c.state = 'retry'; c.attempts = 0;
    const base = 60;
    c.lastDelay = base;
    c.retryAt = tick + base + (jitter ? rand(-base * jitter, base * jitter) : 0);
  });
  running = true; served = 0; dropped = 0;
}

function step() {
  if (!running) return;
  tick++;
  const cap = +document.getElementById('server').value;
  const jitter = +document.getElementById('jitter').value / 100;
  const perTick = cap / 60;
  let requests = clients.filter(c => c.state === 'retry' && c.retryAt <= tick);
  rpsWindow.push(requests.length);
  if (rpsWindow.length > 60) rpsWindow.shift();
  let capacity = perTick + (Math.random() < perTick % 1 ? 1 : 0);
  requests.forEach(c => {
    c.attempts++;
    if (capacity > 0 && c.attempts >= 1 && Math.random() > 0.2) {
      c.state = 'done'; served++; capacity--;
    } else {
      dropped++;
      const base = 60 * Math.pow(2, Math.min(c.attempts, 5));
      const j = jitter ? rand(-base * jitter, base * jitter) : 0;
      c.lastDelay = base + j; c.retryAt = tick + c.lastDelay;
    }
  });
  document.getElementById('rps').textContent = Math.round(rpsWindow.reduce((a, b) => a + b, 0));
  document.getElementById('drop').textContent = dropped;
  document.getElementById('served').textContent = served;
  render();
  if (clients.every(c => c.state === 'done')) running = false;
}

function render() {
  svg.innerHTML = '';
  const server = document.createElementNS(NS, 'rect');
  server.setAttribute('x', SERVER.x - 40); server.setAttribute('y', SERVER.y - 40);
  server.setAttribute('width', 80); server.setAttribute('height', 80);
  server.setAttribute('rx', 8); server.setAttribute('fill', '#6ee7b7'); server.setAttribute('opacity', 0.2);
  server.setAttribute('stroke', '#6ee7b7');
  svg.appendChild(server);
  const label = document.createElementNS(NS, 'text');
  label.setAttribute('x', SERVER.x); label.setAttribute('y', SERVER.y + 4);
  label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', '#6ee7b7');
  label.setAttribute('font-family', 'Consolas'); label.textContent = 'API';
  svg.appendChild(label);
  clients.forEach(c => {
    if (c.state === 'retry' && c.retryAt <= tick + 5) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', c.x); line.setAttribute('y1', c.y);
      line.setAttribute('x2', SERVER.x); line.setAttribute('y2', SERVER.y);
      line.setAttribute('stroke', '#ef4444'); line.setAttribute('opacity', 0.3);
      svg.appendChild(line);
    }
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', c.x); dot.setAttribute('cy', c.y); dot.setAttribute('r', 5);
    dot.setAttribute('fill', c.state === 'done' ? '#6ee7b7' : c.state === 'retry' ? '#f59e0b' : '#8a8f9c');
    svg.appendChild(dot);
  });
}

document.getElementById('clients').addEventListener('input', e => {
  document.getElementById('cLabel').textContent = e.target.value; spawnClients();
});
document.getElementById('jitter').addEventListener('input', e => {
  document.getElementById('jLabel').textContent = e.target.value + '%';
});
document.getElementById('server').addEventListener('input', e => {
  document.getElementById('sLabel').textContent = e.target.value;
});
document.getElementById('start').onclick = triggerOutage;
document.getElementById('reset').onclick = () => { running = false; spawnClients(); served = dropped = 0; };
spawnClients();
setInterval(step, 1000 / 30);