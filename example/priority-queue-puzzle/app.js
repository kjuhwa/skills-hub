const subjects = ['payment.failed', 'user.signup', 'log.info', 'cache.evict',
  'order.shipped', 'auth.expire', 'metric.spike', 'email.send', 'cron.daily'];
const priorities = [
  { v: 1, name: 'CRITICAL' },
  { v: 2, name: 'HIGH' },
  { v: 3, name: 'NORMAL' },
  { v: 4, name: 'LOW' }
];

let nextId = 0;
let inbox = [], queue = [], processed = [];
let score = 0, mistakes = 0;

function makeMsg() {
  const p = priorities[Math.floor(Math.random() * priorities.length)];
  return {
    id: ++nextId,
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    priority: p.v, pname: p.name
  };
}

for (let i = 0; i < 5; i++) inbox.push(makeMsg());

function render() {
  renderBin('inbox', inbox);
  renderBin('queue', queue);
  renderBin('processed', processed);
  document.querySelector('#score b:nth-of-type(1)').textContent = score;
  document.querySelector('#score b:nth-of-type(2)').textContent = mistakes;
}

function renderBin(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  list.forEach(m => {
    const div = document.createElement('div');
    div.className = 'msg p' + m.priority;
    div.draggable = id === 'inbox';
    div.dataset.id = m.id;
    div.innerHTML = `<span>${m.subject}</span><span class="prio">${m.pname}</span>`;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', m.id);
    });
    el.appendChild(div);
  });
}

function findAndRemove(list, id) {
  const idx = list.findIndex(m => m.id == id);
  return idx >= 0 ? list.splice(idx, 1)[0] : null;
}

const queueEl = document.getElementById('queue');
queueEl.addEventListener('dragover', e => { e.preventDefault(); queueEl.classList.add('drag-over'); });
queueEl.addEventListener('dragleave', () => queueEl.classList.remove('drag-over'));
queueEl.addEventListener('drop', e => {
  e.preventDefault();
  queueEl.classList.remove('drag-over');
  const id = e.dataTransfer.getData('text/plain');
  const m = findAndRemove(inbox, id);
  if (m) {
    queue.push(m);
    queue.sort((a, b) => a.priority - b.priority);
    render();
    flash(queueEl);
  }
});

document.getElementById('dequeue').onclick = () => {
  if (!queue.length) return;
  const m = queue.shift();
  processed.push(m);
  // scoring: compare to what should have been first in inbox+queue+...
  const allRemaining = [...queue, ...inbox];
  const expectedPrio = allRemaining.reduce((min, x) =>
    x.priority < min ? x.priority : min, m.priority);
  if (m.priority <= expectedPrio) score += 10;
  else mistakes++;
  render();
};

document.getElementById('clear').onclick = () => {
  inbox.push(...queue); queue = []; render();
};
document.getElementById('generate').onclick = () => {
  inbox.push(makeMsg()); render();
};

function flash(el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300); }

render();
setInterval(() => { if (inbox.length < 8) { inbox.push(makeMsg()); render(); } }, 4000);