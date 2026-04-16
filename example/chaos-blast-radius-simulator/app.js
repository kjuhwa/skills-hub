const svg = document.getElementById('canvas');
const logList = document.getElementById('logList');
const severityEl = document.getElementById('severity');
const severityVal = document.getElementById('severityVal');

const services = [
  { id: 'gateway', label: 'API Gateway', x: 100, y: 280 },
  { id: 'auth', label: 'Auth', x: 260, y: 140 },
  { id: 'orders', label: 'Orders', x: 260, y: 280 },
  { id: 'inventory', label: 'Inventory', x: 260, y: 420 },
  { id: 'payments', label: 'Payments', x: 460, y: 200 },
  { id: 'shipping', label: 'Shipping', x: 460, y: 360 },
  { id: 'db', label: 'Primary DB', x: 680, y: 200 },
  { id: 'cache', label: 'Redis', x: 680, y: 360 },
  { id: 'queue', label: 'Kafka', x: 820, y: 280 }
];
const edges = [
  ['gateway','auth'],['gateway','orders'],['gateway','inventory'],
  ['orders','payments'],['orders','shipping'],['inventory','cache'],
  ['payments','db'],['shipping','queue'],['db','queue'],['cache','db']
];

function render() {
  svg.innerHTML = '';
  edges.forEach(([a,b]) => {
    const s = services.find(x=>x.id===a), t = services.find(x=>x.id===b);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',s.x); line.setAttribute('y1',s.y);
    line.setAttribute('x2',t.x); line.setAttribute('y2',t.y);
    line.setAttribute('class','edge');
    line.dataset.key = `${a}-${b}`;
    svg.appendChild(line);
  });
  services.forEach(s => {
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','node');
    g.setAttribute('transform',`translate(${s.x},${s.y})`);
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('r',28); c.setAttribute('fill','#6ee7b7');
    c.dataset.id = s.id;
    c.addEventListener('click', () => injectFault(s.id));
    const t = document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('text-anchor','middle'); t.setAttribute('dy',42);
    t.textContent = s.label;
    g.appendChild(c); g.appendChild(t);
    svg.appendChild(g);
  });
}

function log(msg, cls='') {
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  if (cls) li.className = cls;
  logList.prepend(li);
}

function injectFault(id) {
  const sev = +severityEl.value;
  log(`Chaos injected at ${id} (severity ${sev})`, 'fail');
  const circle = svg.querySelector(`circle[data-id="${id}"]`);
  circle.setAttribute('fill','#f87171');
  cascade([id], sev, new Set([id]), 0);
}

function cascade(frontier, sev, seen, depth) {
  if (depth > 4 || frontier.length === 0) return;
  const next = [];
  frontier.forEach(node => {
    edges.forEach(([a,b]) => {
      const other = a===node ? b : b===node ? a : null;
      if (!other || seen.has(other)) return;
      const chance = Math.min(0.9, sev/10 - depth*0.12);
      if (Math.random() < chance) {
        seen.add(other); next.push(other);
        setTimeout(() => {
          const edge = svg.querySelector(`line[data-key="${a}-${b}"]`);
          if (edge) edge.classList.add('active');
          const c = svg.querySelector(`circle[data-id="${other}"]`);
          if (c) c.setAttribute('fill', sev>7 ? '#f87171' : '#fbbf24');
          log(`→ ${other} degraded via ${node}`, sev>7?'fail':'warn');
        }, depth*500 + 200);
      }
    });
  });
  setTimeout(() => cascade(next, sev-1, seen, depth+1), 500);
}

document.getElementById('reset').onclick = () => { logList.innerHTML=''; render(); };
document.getElementById('randomize').onclick = () => {
  const ids = services.map(s=>s.id);
  injectFault(ids[Math.floor(Math.random()*ids.length)]);
};
severityEl.oninput = () => severityVal.textContent = severityEl.value;
render();
log('Topology loaded. Ready for chaos.');