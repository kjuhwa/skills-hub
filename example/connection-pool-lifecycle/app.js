const MAX_POOL = 10;
let nextId = 1, conns = [];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls; if (text) e.textContent = text;
  return e;
}

function render() {
  ['idle', 'active', 'closing'].forEach(s => {
    const lane = document.getElementById('lane-' + s);
    lane.querySelectorAll('.conn').forEach(c => c.remove());
    conns.filter(c => c.state === s).forEach(c => {
      const div = el('div', 'conn ' + s);
      const id = el('span', 'id', `#${c.id}`);
      const age = el('span', 'age', `${((Date.now() - c.born) / 1000).toFixed(0)}s`);
      div.appendChild(id); div.appendChild(age); lane.appendChild(div);
    });
  });
  document.getElementById('info').textContent = `Pool: ${conns.filter(c=>c.state!=='closing').length} / ${MAX_POOL}`;
}

function spawnConn() {
  if (conns.filter(c => c.state !== 'closing').length >= MAX_POOL) return;
  conns.push({ id: nextId++, state: 'idle', born: Date.now() });
  render();
}

function sendQuery() {
  const idle = conns.find(c => c.state === 'idle');
  if (!idle) { spawnConn(); setTimeout(sendQuery, 100); return; }
  idle.state = 'active'; render();
  setTimeout(() => {
    idle.state = 'idle'; render();
    if (Math.random() < 0.2) closeConn(idle);
  }, 1000 + Math.random() * 2000);
}

function closeConn(c) {
  c.state = 'closing'; render();
  setTimeout(() => { conns = conns.filter(x => x !== c); render(); }, 1200);
}

// seed pool
for (let i = 0; i < 5; i++) spawnConn();
// background queries
setInterval(() => { if (Math.random() > 0.4) sendQuery(); }, 2000);
setInterval(render, 500);