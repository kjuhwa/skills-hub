const svg = document.getElementById('pool');
const log = document.getElementById('log');
const CONNS = 12, COLS = 4;
const conns = [];

function addLog(msg) {
  const d = document.createElement('div');
  d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.prepend(d);
  if (log.children.length > 30) log.lastChild.remove();
}

for (let i = 0; i < CONNS; i++) {
  const col = i % COLS, row = Math.floor(i / COLS);
  const cx = 90 + col * 140, cy = 70 + row * 110, r = 42;
  const state = i < 3 ? 'active' : 'idle';
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
  circle.setAttribute('fill', state === 'active' ? '#6ee7b7' : '#334155');
  const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  txt.setAttribute('x', cx); txt.setAttribute('y', cy + 4); txt.setAttribute('text-anchor', 'middle');
  txt.textContent = `C${i + 1}`;
  g.appendChild(circle); g.appendChild(txt); svg.appendChild(g);
  const conn = { id: i + 1, state, circle, txt, timer: null };
  conns.push(conn);
  g.addEventListener('click', () => toggle(conn));
}

function toggle(c) {
  if (c.state === 'idle') {
    c.state = 'active'; c.circle.setAttribute('fill', '#6ee7b7');
    c.txt.setAttribute('fill', '#0f1117');
    addLog(`Connection C${c.id} acquired`);
    c.timer = setTimeout(() => { release(c); }, 2000 + Math.random() * 3000);
  } else { release(c); }
}

function release(c) {
  clearTimeout(c.timer);
  c.state = 'idle'; c.circle.setAttribute('fill', '#334155');
  c.txt.setAttribute('fill', '#e2e8f0');
  addLog(`Connection C${c.id} released`);
}

// simulate background activity
setInterval(() => {
  const idle = conns.filter(c => c.state === 'idle');
  if (idle.length && Math.random() > 0.5) toggle(idle[Math.floor(Math.random() * idle.length)]);
}, 1500);
addLog('Pool initialized with 12 connections');