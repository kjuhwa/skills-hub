const heap = [];
const svg = document.getElementById('tree');
const log = document.getElementById('log');
const TOPICS = ['email.send', 'order.create', 'log.flush', 'cache.evict', 'webhook.fire', 'image.resize'];

function swap(i, j) { [heap[i], heap[j]] = [heap[j], heap[i]]; }

function siftUp(i) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (heap[p].prio > heap[i].prio) { swap(p, i); i = p; } else break;
  }
}

function siftDown(i) {
  const n = heap.length;
  while (true) {
    const l = 2 * i + 1, r = 2 * i + 2;
    let s = i;
    if (l < n && heap[l].prio < heap[s].prio) s = l;
    if (r < n && heap[r].prio < heap[s].prio) s = r;
    if (s !== i) { swap(s, i); i = s; } else break;
  }
}

function enqueue(topic, prio) {
  heap.push({ topic, prio, id: Math.random().toString(36).slice(2, 6) });
  siftUp(heap.length - 1);
  render();
}

function dequeue() {
  if (heap.length === 0) return;
  const top = heap[0];
  const li = document.createElement('li');
  li.textContent = `P${top.prio} ${top.topic} #${top.id}`;
  log.prepend(li);
  if (log.children.length > 8) log.lastChild.remove();
  if (heap.length === 1) heap.pop();
  else { heap[0] = heap.pop(); siftDown(0); }
  render();
}

function nodePos(i, depth, totalLevels) {
  const level = Math.floor(Math.log2(i + 1));
  const idxInLevel = i - (Math.pow(2, level) - 1);
  const slots = Math.pow(2, level);
  const W = 800;
  const x = (W / (slots + 1)) * (idxInLevel + 1);
  const y = 50 + level * 90;
  return { x, y };
}

function render() {
  svg.innerHTML = '';
  if (heap.length === 0) {
    svg.innerHTML = '<text x="400" y="250" fill="#6b7280" text-anchor="middle" font-size="16">Queue empty</text>';
    return;
  }
  for (let i = 0; i < heap.length; i++) {
    const p = nodePos(i);
    if (i > 0) {
      const pp = nodePos(Math.floor((i - 1) / 2));
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'edge');
      line.setAttribute('x1', pp.x); line.setAttribute('y1', pp.y);
      line.setAttribute('x2', p.x); line.setAttribute('y2', p.y);
      svg.appendChild(line);
    }
  }
  const colors = ['#f87171', '#fbbf24', '#6ee7b7', '#60a5fa', '#c084fc'];
  for (let i = 0; i < heap.length; i++) {
    const p = nodePos(i);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'node');
    g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
    g.innerHTML = `
      <circle r="28" fill="${colors[heap[i].prio - 1]}22" stroke="${colors[heap[i].prio - 1]}"/>
      <text y="-2" font-weight="bold">P${heap[i].prio}</text>
      <text y="12" font-size="9" fill="#9ca3af">${heap[i].topic.slice(0, 10)}</text>
    `;
    svg.appendChild(g);
  }
}

document.getElementById('enqueue').onclick = () => {
  enqueue(document.getElementById('topic').value || 'untitled', +document.getElementById('prio').value);
};
document.getElementById('dequeue').onclick = dequeue;
document.getElementById('autogen').onclick = () => {
  for (let i = 0; i < 5; i++) enqueue(TOPICS[Math.floor(Math.random() * TOPICS.length)], 1 + Math.floor(Math.random() * 5));
};

[3, 1, 4, 2, 5, 3, 2].forEach((p, i) => enqueue(TOPICS[i % TOPICS.length], p));