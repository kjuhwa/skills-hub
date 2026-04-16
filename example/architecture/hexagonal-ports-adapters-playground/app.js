const svg = document.getElementById('hex');
const logList = document.getElementById('logList');

const nodes = {
  core: { x: 300, y: 260, r: 80, label: 'Domain Core', color: '#6ee7b7' },
  primaryPort: { x: 150, y: 260, r: 30, label: 'Primary Port', color: '#8b93a7' },
  secondaryPortA: { x: 420, y: 160, r: 30, label: 'Repo Port', color: '#8b93a7' },
  secondaryPortB: { x: 420, y: 360, r: 30, label: 'Notify Port', color: '#8b93a7' },
  primary: { x: 60, y: 260, r: 40, label: 'Primary', color: '#4a9eff' },
  persistence: { x: 520, y: 160, r: 40, label: 'Persistence', color: '#ff9e4a' },
  notify: { x: 520, y: 360, r: 40, label: 'Notify', color: '#e44aff' }
};

const labels = {
  primary: { rest: 'REST', cli: 'CLI', grpc: 'gRPC' },
  persistence: { postgres: 'PostgreSQL', memory: 'In-Memory', mongo: 'MongoDB' },
  notify: { email: 'Email', sms: 'SMS', webhook: 'Webhook' }
};

function drawHex() {
  svg.innerHTML = '';
  const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = 300 + 160 * Math.cos(angle);
    const y = 260 + 160 * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  hex.setAttribute('points', points.join(' '));
  hex.setAttribute('fill', 'none');
  hex.setAttribute('stroke', '#6ee7b7');
  hex.setAttribute('stroke-width', '2');
  hex.setAttribute('stroke-dasharray', '6 4');
  svg.appendChild(hex);

  const connections = [
    ['primary', 'primaryPort'], ['primaryPort', 'core'],
    ['core', 'secondaryPortA'], ['secondaryPortA', 'persistence'],
    ['core', 'secondaryPortB'], ['secondaryPortB', 'notify']
  ];
  connections.forEach(([a, b]) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', nodes[a].x);
    line.setAttribute('y1', nodes[a].y);
    line.setAttribute('x2', nodes[b].x);
    line.setAttribute('y2', nodes[b].y);
    line.setAttribute('stroke', '#2a2e3a');
    line.setAttribute('stroke-width', '2');
    line.id = `line-${a}-${b}`;
    svg.appendChild(line);
  });

  Object.entries(nodes).forEach(([key, n]) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('node');
    g.id = `node-${key}`;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', n.r);
    c.setAttribute('fill', n.color); c.setAttribute('opacity', '0.85');
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', n.x); t.setAttribute('y', n.y + 4);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#0f1117');
    t.setAttribute('font-size', '11'); t.setAttribute('font-weight', 'bold');
    t.textContent = n.label;
    g.appendChild(c); g.appendChild(t);
    svg.appendChild(g);
  });
}

function log(msg, kind = 'info') {
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  if (kind === 'domain') li.style.borderLeftColor = '#ff9e4a';
  logList.prepend(li);
}

async function pulse(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  await new Promise(r => setTimeout(r, 450));
  el.classList.remove('active');
}

document.getElementById('send').onclick = async () => {
  const p = document.getElementById('primary').value;
  const db = document.getElementById('persistence').value;
  const n = document.getElementById('notify').value;
  log(`→ Incoming via ${labels.primary[p]}`);
  await pulse('node-primary');
  await pulse('node-primaryPort');
  log('Port translates to domain command', 'domain');
  await pulse('node-core');
  log('Domain logic executes (pure)', 'domain');
  await pulse('node-secondaryPortA');
  log(`Persisted via ${labels.persistence[db]}`);
  await pulse('node-persistence');
  await pulse('node-secondaryPortB');
  log(`Notified via ${labels.notify[n]}`);
  await pulse('node-notify');
  log('✓ Request cycle complete');
};

drawHex();
log('System initialized. Select adapters and send a request.');