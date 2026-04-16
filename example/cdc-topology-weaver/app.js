const svg = document.getElementById('graph');
const SVGNS = 'http://www.w3.org/2000/svg';
const nodes = [
  { id: 'pg', type: 'src', label: 'Postgres', x: 120, y: 120, lag: '12ms', throughput: '2.3k/s' },
  { id: 'my', type: 'src', label: 'MySQL', x: 120, y: 260, lag: '8ms', throughput: '1.8k/s' },
  { id: 'mo', type: 'src', label: 'MongoDB', x: 120, y: 400, lag: '18ms', throughput: '900/s' },
  { id: 'kf', type: 'trf', label: 'Kafka', x: 380, y: 180, lag: '3ms', throughput: '5.0k/s' },
  { id: 'dz', type: 'trf', label: 'Debezium', x: 380, y: 340, lag: '5ms', throughput: '4.7k/s' },
  { id: 'sn', type: 'snk', label: 'Snowflake', x: 700, y: 120, lag: '45ms', throughput: '3.1k/s' },
  { id: 'es', type: 'snk', label: 'ElasticSearch', x: 700, y: 260, lag: '22ms', throughput: '2.4k/s' },
  { id: 'rd', type: 'snk', label: 'Redis', x: 700, y: 400, lag: '6ms', throughput: '1.2k/s' }
];
const edges = [
  ['pg', 'kf'], ['my', 'kf'], ['mo', 'dz'],
  ['kf', 'sn'], ['kf', 'es'], ['dz', 'es'], ['dz', 'rd'], ['kf', 'rd']
];
const COLOR = { src: '#6ee7b7', trf: '#fbbf24', snk: '#a5b4fc' };

function build() {
  svg.innerHTML = '';
  edges.forEach(([a, b]) => {
    const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
    const p = document.createElementNS(SVGNS, 'path');
    const mx = (na.x + nb.x) / 2;
    p.setAttribute('d', `M${na.x},${na.y} C${mx},${na.y} ${mx},${nb.y} ${nb.x},${nb.y}`);
    p.setAttribute('class', 'edge');
    p.dataset.from = a; p.dataset.to = b;
    svg.appendChild(p);
  });
  nodes.forEach(n => {
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('transform', `translate(${n.x},${n.y})`);
    g.dataset.id = n.id;
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('r', 28); c.setAttribute('fill', '#0f1117');
    c.setAttribute('stroke', COLOR[n.type]); c.setAttribute('stroke-width', 2);
    const t = document.createElementNS(SVGNS, 'text');
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', 4);
    t.textContent = n.label;
    g.appendChild(c); g.appendChild(t);
    g.onclick = () => select(n);
    svg.appendChild(g);
  });
}

function select(n) {
  document.querySelectorAll('.node').forEach(el => el.classList.remove('sel'));
  document.querySelector(`[data-id="${n.id}"]`).classList.add('sel');
  const d = document.getElementById('details');
  const ups = edges.filter(e => e[1] === n.id).map(e => e[0]).join(', ') || '—';
  const downs = edges.filter(e => e[0] === n.id).map(e => e[1]).join(', ') || '—';
  d.innerHTML = `
    <div class="row"><b>ID</b> ${n.id}</div>
    <div class="row"><b>Role</b> ${n.type}</div>
    <div class="row"><b>Lag</b> ${n.lag}</div>
    <div class="row"><b>Throughput</b> ${n.throughput}</div>
    <div class="row"><b>Upstream</b> ${ups}</div>
    <div class="row"><b>Downstream</b> ${downs}</div>`;
}

function animatePackets() {
  edges.forEach(([a, b], idx) => {
    if (Math.random() > 0.4) return;
    const na = nodes.find(n => n.id === a), nb = nodes.find(n => n.id === b);
    const pkt = document.createElementNS(SVGNS, 'circle');
    pkt.setAttribute('r', 4); pkt.setAttribute('class', 'packet');
    svg.appendChild(pkt);
    const start = performance.now();
    const dur = 1400 + Math.random() * 600;
    function step(t) {
      const p = Math.min(1, (t - start) / dur);
      const mx = (na.x + nb.x) / 2;
      const x = (1 - p) * (1 - p) * na.x + 2 * (1 - p) * p * mx + p * p * nb.x;
      const y = (1 - p) * (1 - p) * na.y + 2 * (1 - p) * p * (na.y + nb.y) / 2 + p * p * nb.y;
      pkt.setAttribute('cx', x); pkt.setAttribute('cy', y);
      if (p < 1) requestAnimationFrame(step); else pkt.remove();
    }
    requestAnimationFrame(step);
  });
}

document.getElementById('shake').onclick = () => {
  nodes.forEach(n => {
    if (n.type === 'trf') { n.y = 140 + Math.random() * 240; }
  });
  build();
};

build();
setInterval(animatePackets, 600);
select(nodes[0]);