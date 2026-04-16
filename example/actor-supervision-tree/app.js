const svg = document.getElementById('tree');
const events = document.getElementById('events');
const W = 900, H = 460;
svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

const tree = {
  id: 'root', label: 'Supervisor', strategy: 'one-for-one', alive: true, restarts: 0,
  children: [
    { id: 'w1', label: 'DB-Pool', alive: true, restarts: 0, children: [
      { id: 'w1a', label: 'Conn-1', alive: true, restarts: 0, children: [] },
      { id: 'w1b', label: 'Conn-2', alive: true, restarts: 0, children: [] }
    ]},
    { id: 'w2', label: 'HTTP-Handler', alive: true, restarts: 0, children: [
      { id: 'w2a', label: 'Router', alive: true, restarts: 0, children: [] },
      { id: 'w2b', label: 'Auth', alive: true, restarts: 0, children: [] },
      { id: 'w2c', label: 'Logger', alive: true, restarts: 0, children: [] }
    ]},
    { id: 'w3', label: 'Cache', alive: true, restarts: 0, children: [] }
  ]
};

function logEvent(msg) { const d = document.createElement('div'); d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`; events.prepend(d); if (events.children.length > 25) events.lastChild.remove(); }

function layout(node, x, y, w, depth) {
  node.x = x; node.y = y; node.depth = depth;
  const n = node.children.length;
  if (n === 0) return;
  const cw = w / n;
  node.children.forEach((c, i) => layout(c, x - w / 2 + cw * i + cw / 2, y + 80, cw, depth + 1));
}
layout(tree, W / 2, 50, W * 0.8, 0);

function flatNodes(n, arr = []) { arr.push(n); n.children.forEach(c => flatNodes(c, arr)); return arr; }

function crashNode(node) {
  if (!node.alive || node.id === 'root') return;
  node.alive = false;
  logEvent(`💥 ${node.label} crashed!`);
  node.children.forEach(c => { c.alive = false; });
  setTimeout(() => {
    node.alive = true; node.restarts++;
    node.children.forEach(c => { c.alive = true; c.restarts++; });
    logEvent(`🔄 Supervisor restarted ${node.label} (${node.restarts} restarts)`);
    render();
  }, 1200);
  render();
}

function render() {
  svg.innerHTML = '';
  const all = flatNodes(tree);
  // edges
  all.forEach(n => {
    n.children.forEach(c => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      Object.entries({ x1: n.x, y1: n.y + 18, x2: c.x, y2: c.y - 18, stroke: c.alive ? '#6ee7b744' : '#f8717144', 'stroke-width': 1.5 }).forEach(([k, v]) => line.setAttribute(k, v));
      svg.appendChild(line);
    });
  });
  // nodes
  all.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = 'pointer';
    g.onclick = () => crashNode(n);
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const rw = 80, rh = 34;
    Object.entries({ x: n.x - rw / 2, y: n.y - rh / 2, width: rw, height: rh, rx: 6, fill: n.alive ? '#1a1d27' : '#f8717133', stroke: n.alive ? '#6ee7b7' : '#f87171', 'stroke-width': n.id === 'root' ? 2 : 1 }).forEach(([k, v]) => r.setAttribute(k, v));
    g.appendChild(r);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    Object.entries({ x: n.x, y: n.y + 1, fill: n.alive ? '#c9d1d9' : '#f87171', 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'monospace', 'dominant-baseline': 'middle' }).forEach(([k, v]) => t.setAttribute(k, v));
    t.textContent = n.label;
    g.appendChild(t);
    if (n.restarts > 0) {
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      Object.entries({ x: n.x + 38, y: n.y - 14, fill: '#6ee7b7', 'font-size': '8', 'font-family': 'monospace', 'text-anchor': 'middle' }).forEach(([k, v]) => badge.setAttribute(k, v));
      badge.textContent = `×${n.restarts}`;
      g.appendChild(badge);
    }
    svg.appendChild(g);
  });
}
render();
// auto-crash random workers
setInterval(() => { const leaves = flatNodes(tree).filter(n => n.children.length === 0 && n.alive); if (leaves.length && Math.random() > 0.5) crashNode(leaves[Math.random() * leaves.length | 0]); }, 3000);