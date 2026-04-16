const states = [
  { id: 'IDLE', x: 80, y: 160 },
  { id: 'CREATED', x: 270, y: 160 },
  { id: 'PROCESSING', x: 460, y: 160 },
  { id: 'DONE', x: 650, y: 160 }
];
const transitions = { IDLE: { CREATE: 'CREATED' }, CREATED: { PROCESS: 'PROCESSING' }, PROCESSING: { COMPLETE: 'DONE' } };
let current = 'IDLE';
const processed = new Set();

function buildSvg() {
  const svg = document.getElementById('stateSvg');
  svg.innerHTML = '';
  // arrows
  for (let i = 0; i < states.length - 1; i++) {
    const a = states[i], b = states[i + 1];
    const line = el('line', { x1: a.x + 50, y1: a.y, x2: b.x - 50, y2: b.y, stroke: '#334155', 'stroke-width': 2, 'marker-end': 'url(#arrow)' });
    svg.appendChild(line);
  }
  const defs = el('defs'); 
  defs.innerHTML = '<marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#334155"/></marker>';
  svg.appendChild(defs);
  // state circles
  states.forEach(s => {
    const g = el('g');
    const circle = el('circle', { cx: s.x, cy: s.y, r: 42, fill: s.id === current ? '#6ee7b7' : '#1e2130', stroke: '#6ee7b7', 'stroke-width': 2 });
    const text = el('text', { x: s.x, y: s.y + 5, fill: s.id === current ? '#0f1117' : '#e2e8f0', 'text-anchor': 'middle', 'font-size': '11', 'font-weight': 'bold', 'font-family': 'monospace' });
    text.textContent = s.id;
    g.appendChild(circle); g.appendChild(text); svg.appendChild(g);
  });
}

function el(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

function fireEvent(evt) {
  const log = document.getElementById('eventLog');
  const eventKey = current + ':' + evt;
  if (processed.has(eventKey)) {
    log.innerHTML = `<div class="log-skip">⟳ ${evt} — already processed in ${current}, idempotent skip</div>` + log.innerHTML;
    pulse(); return;
  }
  const next = transitions[current] && transitions[current][evt];
  if (next) {
    processed.add(eventKey);
    current = next;
    log.innerHTML = `<div class="log-ok">→ ${evt} — transitioned to ${current}</div>` + log.innerHTML;
    buildSvg();
  } else {
    log.innerHTML = `<div class="log-skip">✗ ${evt} — no valid transition from ${current}</div>` + log.innerHTML;
  }
}

function pulse() {
  const svg = document.getElementById('stateSvg');
  const circles = svg.querySelectorAll('circle');
  const active = [...circles].find(c => c.getAttribute('fill') === '#6ee7b7');
  if (active) { active.setAttribute('r', '46'); setTimeout(() => active.setAttribute('r', '42'), 200); }
}

function resetMachine() {
  current = 'IDLE'; processed.clear();
  document.getElementById('eventLog').innerHTML = '';
  buildSvg();
}

buildSvg();