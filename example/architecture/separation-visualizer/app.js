const fns = [
  { name: 'getUser(id)', src: 'function getUser(id) {\n  return users.find(u => u.id === id);\n}', mutates: 0, returns: 1 },
  { name: 'addUser(u)', src: 'function addUser(u) {\n  users.push(u);\n}', mutates: 1, returns: 0 },
  { name: 'countActive()', src: 'function countActive() {\n  return users.filter(u => u.active).length;\n}', mutates: 0, returns: 1 },
  { name: 'popUser()', src: 'function popUser() {\n  return users.pop(); // mutates AND returns\n}', mutates: 1, returns: 1 },
  { name: 'clearAll()', src: 'function clearAll() {\n  users.length = 0;\n}', mutates: 1, returns: 0 },
  { name: 'findByName(n)', src: 'function findByName(n) {\n  return users.filter(u => u.name === n);\n}', mutates: 0, returns: 1 },
  { name: 'incrementAndGet()', src: 'function incrementAndGet() {\n  counter++;\n  return counter;\n}', mutates: 1, returns: 1 },
  { name: 'log(msg)', src: 'function log(msg) {\n  console.log(msg);\n}', mutates: 1, returns: 0 },
  { name: 'hash(s)', src: 'function hash(s) {\n  return s.length * 17;\n}', mutates: 0, returns: 1 }
];

function classify(f) {
  if (f.mutates && f.returns) return 'm';
  if (f.mutates) return 'c';
  if (f.returns) return 'q';
  return 'q';
}

const verdicts = {
  q: '✓ Pure query — safe to call any number of times.',
  c: '✓ Command — mutates state but returns nothing.',
  m: '✗ Violates CQS — both mutates and returns a value.'
};

function renderList() {
  const ul = document.getElementById('funcs');
  ul.innerHTML = '';
  fns.forEach((f, i) => {
    const cls = classify(f);
    const li = document.createElement('li');
    li.className = cls;
    li.dataset.idx = i;
    li.innerHTML = `${f.name}<span class="tag">${cls === 'm' ? 'mixed' : cls === 'c' ? 'command' : 'query'}</span>`;
    li.addEventListener('click', () => select(i));
    ul.appendChild(li);
  });
}

function renderChart() {
  const svg = document.getElementById('chart');
  svg.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  svg.appendChild(axis(20, 260, 380, 260));
  svg.appendChild(axis(20, 20, 20, 260));
  svg.appendChild(label(200, 275, 'mutates →'));
  svg.appendChild(label(10, 140, 'returns →', -90, 10, 140));

  fns.forEach((f, i) => {
    const cls = classify(f);
    const color = cls === 'q' ? '#6ee7b7' : cls === 'c' ? '#f59e0b' : '#ef4444';
    const baseX = f.mutates ? 280 : 80;
    const baseY = f.returns ? 80 : 220;
    const x = baseX + (i % 3) * 20 - 20;
    const y = baseY + Math.floor(i / 3) * 18 - 18;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', x); c.setAttribute('cy', y);
    c.setAttribute('r', 8); c.setAttribute('fill', color);
    c.setAttribute('opacity', '0.85');
    c.dataset.idx = i;
    c.style.cursor = 'pointer';
    c.addEventListener('click', () => select(i));
    svg.appendChild(c);
  });

  [['pure query', 80, 220, '#6ee7b7'],
   ['command', 280, 220, '#f59e0b'],
   ['forbidden', 280, 80, '#ef4444'],
   ['nothing', 80, 80, '#8a93a6']].forEach(([t, x, y, c]) => {
    svg.appendChild(label(x, y - 20, t, 0, x, y - 20, c));
  });
}

function axis(x1, y1, x2, y2) {
  const ns = 'http://www.w3.org/2000/svg';
  const l = document.createElementNS(ns, 'line');
  l.setAttribute('x1', x1); l.setAttribute('y1', y1);
  l.setAttribute('x2', x2); l.setAttribute('y2', y2);
  l.setAttribute('stroke', '#262a36'); l.setAttribute('stroke-width', 1);
  return l;
}

function label(x, y, text, rot = 0, cx, cy, color = '#8a93a6') {
  const ns = 'http://www.w3.org/2000/svg';
  const t = document.createElementNS(ns, 'text');
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.setAttribute('fill', color); t.setAttribute('font-size', 10);
  t.setAttribute('text-anchor', 'middle');
  if (rot) t.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
  t.textContent = text;
  return t;
}

function select(i) {
  const f = fns[i];
  const cls = classify(f);
  document.getElementById('source').textContent = f.src;
  const v = document.getElementById('verdict');
  v.className = 'verdict ' + cls;
  v.textContent = verdicts[cls];
  document.querySelectorAll('#funcs li').forEach(li => {
    li.classList.toggle('active', Number(li.dataset.idx) === i);
  });
}

renderList();
renderChart();
select(3);