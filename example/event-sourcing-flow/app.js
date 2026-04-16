const svg = document.getElementById('flowSvg');
const NS = 'http://www.w3.org/2000/svg';
let eventCount = 0, autoId = null;

const nodes = [
  { id: 'cmd', x: 60, y: 190, label: 'Command', color: '#f59e0b' },
  { id: 'agg', x: 250, y: 190, label: 'Aggregate', color: '#6ee7b7' },
  { id: 'store', x: 450, y: 190, label: 'Event Store', color: '#60a5fa' },
  { id: 'p1', x: 680, y: 70, label: 'Read Model A', color: '#c084fc' },
  { id: 'p2', x: 680, y: 190, label: 'Read Model B', color: '#c084fc' },
  { id: 'p3', x: 680, y: 310, label: 'Read Model C', color: '#c084fc' },
];
const edges = [
  ['cmd','agg'],['agg','store'],['store','p1'],['store','p2'],['store','p3']
];

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k,v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text) e.textContent = text;
  return e;
}

function getNode(id) { return nodes.find(n => n.id === id); }

edges.forEach(([a, b]) => {
  const na = getNode(a), nb = getNode(b);
  svg.appendChild(el('line', { x1: na.x+50, y1: na.y, x2: nb.x-50, y2: nb.y, stroke: '#6ee7b722', 'stroke-width': 2 }));
});

nodes.forEach(n => {
  svg.appendChild(el('rect', { x: n.x-50, y: n.y-25, width: 100, height: 50, rx: 8, fill: '#0f1117', stroke: n.color, 'stroke-width': 1.5 }));
  svg.appendChild(el('text', { x: n.x, y: n.y+5, fill: n.color, 'text-anchor': 'middle', 'font-size': '12', 'font-family': 'system-ui' }, n.label));
  const counter = el('text', { x: n.x, y: n.y+20, fill: '#c9d1d966', 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'system-ui', 'data-counter': n.id }, '0');
  svg.appendChild(counter);
});

function animateDot(from, to, color, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      const na = getNode(from), nb = getNode(to);
      const dot = el('circle', { cx: na.x+50, cy: na.y, r: 5, fill: color, opacity: 0.9 });
      svg.appendChild(dot);
      const dx = (nb.x-50) - (na.x+50), dy = nb.y - na.y;
      let t = 0;
      const anim = () => {
        t += 0.035;
        if (t >= 1) { dot.remove(); resolve(); return; }
        dot.setAttribute('cx', na.x+50 + dx*t);
        dot.setAttribute('cy', na.y + dy*t);
        dot.setAttribute('opacity', 1 - t*0.3);
        requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }, delay);
  });
}

function updateCounter(id, val) {
  const c = svg.querySelector(`[data-counter="${id}"]`);
  if (c) c.textContent = val;
}

const counts = { cmd: 0, agg: 0, store: 0, p1: 0, p2: 0, p3: 0 };

async function emitEvent() {
  eventCount++;
  document.getElementById('counter').textContent = `Events: ${eventCount} | Projections: 3`;
  counts.cmd++; updateCounter('cmd', counts.cmd);
  await animateDot('cmd', 'agg', '#f59e0b', 0);
  counts.agg++; updateCounter('agg', counts.agg);
  await animateDot('agg', 'store', '#6ee7b7', 0);
  counts.store++; updateCounter('store', counts.store);
  await Promise.all([
    animateDot('store', 'p1', '#c084fc', 0).then(() => { counts.p1++; updateCounter('p1', counts.p1); }),
    animateDot('store', 'p2', '#c084fc', 80).then(() => { counts.p2++; updateCounter('p2', counts.p2); }),
    animateDot('store', 'p3', '#c084fc', 160).then(() => { counts.p3++; updateCounter('p3', counts.p3); }),
  ]);
}

document.getElementById('btnEmit').onclick = emitEvent;
document.getElementById('btnAuto').onclick = function() {
  if (autoId) { clearInterval(autoId); autoId = null; this.classList.remove('on'); this.textContent = 'Auto ▶'; }
  else { autoId = setInterval(emitEvent, 1200); this.classList.add('on'); this.textContent = 'Auto ⏸'; }
};

for (let i = 0; i < 3; i++) setTimeout(() => emitEvent(), i * 600);