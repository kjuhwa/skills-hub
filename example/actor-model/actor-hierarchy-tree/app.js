const svg = document.getElementById('tree');
const events = document.getElementById('events');
const ns = 'http://www.w3.org/2000/svg';
const nodes = [
  { id: 0, name: '/root', parent: -1, x: 380, y: 40 },
  { id: 1, name: '/user', parent: 0, x: 200, y: 120 },
  { id: 2, name: '/system', parent: 0, x: 560, y: 120 },
  { id: 3, name: 'workerA', parent: 1, x: 100, y: 220 },
  { id: 4, name: 'workerB', parent: 1, x: 200, y: 220 },
  { id: 5, name: 'workerC', parent: 1, x: 300, y: 220 },
  { id: 6, name: 'logger', parent: 2, x: 480, y: 220 },
  { id: 7, name: 'scheduler', parent: 2, x: 640, y: 220 },
  { id: 8, name: 'taskA', parent: 3, x: 60, y: 320 },
  { id: 9, name: 'taskB', parent: 3, x: 140, y: 320 },
  { id: 10, name: 'taskC', parent: 5, x: 260, y: 320 },
  { id: 11, name: 'taskD', parent: 5, x: 340, y: 320 },
];

const state = nodes.map(() => 'alive');

function logEvent(txt) { const d = document.createElement('div'); d.textContent = `[${new Date().toLocaleTimeString()}] ${txt}`; events.prepend(d); }

function color(i) { return state[i] === 'alive' ? '#6ee7b7' : state[i] === 'crashed' ? '#ef4444' : '#f59e0b'; }

function render() {
  svg.innerHTML = '';
  nodes.forEach(n => {
    if (n.parent >= 0) { const p = nodes[n.parent]; const l = document.createElementNS(ns, 'line'); l.setAttribute('x1', p.x); l.setAttribute('y1', p.y); l.setAttribute('x2', n.x); l.setAttribute('y2', n.y); svg.appendChild(l); }
  });
  nodes.forEach((n, i) => {
    const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 18);
    c.setAttribute('fill', color(i)); c.setAttribute('opacity', state[i] === 'alive' ? '1' : '0.5');
    c.onclick = () => crash(i); svg.appendChild(c);
    const t = document.createElementNS(ns, 'text'); t.setAttribute('x', n.x); t.setAttribute('y', n.y + 34); t.textContent = n.name; svg.appendChild(t);
  });
}

function children(id) { return nodes.filter(n => n.parent === id).map(n => n.id); }

function crash(id) {
  if (state[id] !== 'alive') return;
  state[id] = 'crashed'; logEvent(`💥 ${nodes[id].name} crashed!`);
  children(id).forEach(c => { state[c] = 'crashed'; logEvent(`  ↳ ${nodes[c].name} stopped (child)`); });
  render();
  const parent = nodes[id].parent;
  if (parent >= 0) {
    setTimeout(() => {
      logEvent(`🔧 ${nodes[parent].name} restarting children...`);
      state[id] = 'restarting'; children(id).forEach(c => state[c] = 'restarting'); render();
      setTimeout(() => {
        state[id] = 'alive'; children(id).forEach(c => state[c] = 'alive');
        logEvent(`✅ ${nodes[id].name} + children restarted`); render();
      }, 800);
    }, 1000);
  }
}

render();
logEvent('System initialized — click any actor to simulate a crash');