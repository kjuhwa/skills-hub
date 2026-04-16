const products = ['Widget', 'Gizmo', 'Sprocket', 'Gadget', 'Thingamajig'];
const customers = ['Ada', 'Linus', 'Grace', 'Alan', 'Margaret', 'Dennis'];
const log = [];

function genEvents() {
  let orderId = 0;
  const active = new Map();
  for (let t = 0; t < 60; t++) {
    const r = Math.random();
    if (r < 0.5 || active.size === 0) {
      const id = ++orderId;
      active.set(id, { product: products[Math.floor(Math.random() * products.length)], qty: 1 });
      log.push({ type: 'OrderPlaced', id, customer: customers[Math.floor(Math.random() * customers.length)], product: active.get(id).product });
    } else if (r < 0.75) {
      const ids = [...active.keys()];
      const id = ids[Math.floor(Math.random() * ids.length)];
      const add = Math.floor(Math.random() * 3) + 1;
      active.get(id).qty += add;
      log.push({ type: 'ItemAdded', id, qty: add });
    } else {
      const ids = [...active.keys()];
      const id = ids[Math.floor(Math.random() * ids.length)];
      const total = active.get(id).qty * 25;
      log.push({ type: 'OrderPaid', id, total });
      active.delete(id);
    }
  }
}
genEvents();

const logEl = document.getElementById('log');
log.forEach(e => {
  const li = document.createElement('li');
  const detail = Object.entries(e).filter(([k]) => k !== 'type').map(([k, v]) => `${k}=${v}`).join(' ');
  li.textContent = `${e.type} ${detail}`;
  logEl.appendChild(li);
});

const scrubber = document.getElementById('scrubber');
scrubber.max = log.length;

function project(upTo) {
  const state = { orders: 0, revenue: 0, paid: 0, byProduct: {} };
  for (let i = 0; i < upTo; i++) {
    const e = log[i];
    if (e.type === 'OrderPlaced') {
      state.orders++;
      state.byProduct[e.product] = (state.byProduct[e.product] || 0) + 1;
    } else if (e.type === 'OrderPaid') {
      state.revenue += e.total;
      state.paid++;
    }
  }
  return state;
}

function render(cursor) {
  const state = project(cursor);
  document.getElementById('cursor-label').textContent = `t = ${cursor}`;
  document.getElementById('s-orders').textContent = state.orders;
  document.getElementById('s-rev').textContent = '$' + state.revenue;
  document.getElementById('s-avg').textContent = '$' + (state.paid ? Math.round(state.revenue / state.paid) : 0);

  [...logEl.children].forEach((li, i) => {
    li.classList.toggle('active', i < cursor);
    li.classList.toggle('cursor', i === cursor - 1);
  });
  if (cursor > 0) logEl.children[cursor - 1].scrollIntoView({ block: 'nearest' });

  const svg = document.getElementById('chart');
  svg.innerHTML = '';
  const entries = Object.entries(state.byProduct);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  const bw = 400 / Math.max(entries.length, 1);
  entries.forEach(([p, v], i) => {
    const h = (v / max) * 180;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', i * bw + 10); rect.setAttribute('y', 210 - h);
    rect.setAttribute('width', bw - 20); rect.setAttribute('height', h);
    rect.setAttribute('fill', '#6ee7b7');
    svg.appendChild(rect);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', i * bw + bw / 2); t.setAttribute('y', 230);
    t.setAttribute('fill', '#9ca3af'); t.setAttribute('font-size', '10');
    t.setAttribute('text-anchor', 'middle'); t.textContent = p;
    svg.appendChild(t);
    const vt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    vt.setAttribute('x', i * bw + bw / 2); vt.setAttribute('y', 205 - h);
    vt.setAttribute('fill', '#6ee7b7'); vt.setAttribute('font-size', '11');
    vt.setAttribute('text-anchor', 'middle'); vt.textContent = v;
    svg.appendChild(vt);
  });
}

scrubber.addEventListener('input', () => render(+scrubber.value));
document.getElementById('reset').onclick = () => { scrubber.value = 0; render(0); };
let playing = null;
document.getElementById('play').onclick = () => {
  if (playing) { clearInterval(playing); playing = null; return; }
  playing = setInterval(() => {
    if (+scrubber.value >= log.length) { clearInterval(playing); playing = null; return; }
    scrubber.value = +scrubber.value + 1;
    render(+scrubber.value);
  }, 150);
};
render(0);