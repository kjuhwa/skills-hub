const actors = [
  { id: 'A', name: 'Greeter', x: 140, y: 120, mailbox: [], handler: (m) => `Hi ${m.payload}!` },
  { id: 'B', name: 'Counter', x: 400, y: 80, mailbox: [], state: 0, handler: function(m) { this.state++; return `count=${this.state}`; } },
  { id: 'C', name: 'Echo', x: 650, y: 180, mailbox: [], handler: (m) => m.payload },
  { id: 'D', name: 'Logger', x: 260, y: 340, mailbox: [], handler: (m) => `logged: ${m.payload}` },
  { id: 'E', name: 'Router', x: 540, y: 380, mailbox: [], handler: (m) => `routed -> ${m.payload}` },
];

let selected = null, paused = false;
const stage = document.getElementById('stage');
const panelTitle = document.getElementById('panel-title');
const mailboxEl = document.getElementById('mailbox');
const targetSel = document.getElementById('target');
const logEl = document.getElementById('log');

function render() {
  stage.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'wire');
  svg.style.width = '100%'; svg.style.height = '100%';
  stage.appendChild(svg);
  actors.forEach(a => {
    const el = document.createElement('div');
    el.className = 'actor' + (selected === a.id ? ' selected' : '') + (a.mailbox.length > 2 ? ' busy' : '');
    el.style.left = a.x + 'px'; el.style.top = a.y + 'px';
    el.innerHTML = `<div><strong>${a.id}</strong><br><small>${a.name}</small></div>` +
      (a.mailbox.length ? `<span class="badge">${a.mailbox.length}</span>` : '');
    el.onclick = () => { selected = a.id; updatePanel(); render(); };
    stage.appendChild(el);
  });
}

function updatePanel() {
  const a = actors.find(x => x.id === selected);
  if (!a) return;
  panelTitle.textContent = `Actor ${a.id}: ${a.name}`;
  mailboxEl.innerHTML = a.mailbox.length
    ? a.mailbox.map(m => `<div class="msg">→ ${m.from}: ${m.payload}</div>`).join('')
    : '<em style="color:#6b7280">Empty mailbox</em>';
  targetSel.innerHTML = actors.map(x => `<option value="${x.id}">${x.id} - ${x.name}</option>`).join('');
}

function send(from, to, payload) {
  const actor = actors.find(a => a.id === to);
  if (!actor) return;
  actor.mailbox.push({ from, payload, ts: Date.now() });
  log(`${from} → ${to}: ${payload}`);
}

function log(msg) {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(line);
  while (logEl.children.length > 30) logEl.removeChild(logEl.lastChild);
}

function tick() {
  if (paused) return;
  actors.forEach(a => {
    if (a.mailbox.length) {
      const m = a.mailbox.shift();
      const result = a.handler.call(a, m);
      log(`${a.id} processed: ${result}`);
    }
  });
  if (Math.random() < 0.4) {
    const from = actors[Math.floor(Math.random() * actors.length)];
    const to = actors[Math.floor(Math.random() * actors.length)];
    send(from.id, to.id, ['ping', 'hello', 'world', 'sync', 'tick'][Math.floor(Math.random() * 5)]);
  }
  if (selected) updatePanel();
  render();
}

document.getElementById('send').onclick = () => {
  if (!selected) { log('Select an actor first'); return; }
  send(selected, targetSel.value, document.getElementById('payload').value);
  render();
};
document.getElementById('toggle').onclick = (e) => { paused = !paused; e.target.textContent = paused ? 'Resume System' : 'Pause System'; };

selected = 'A';
updatePanel();
render();
setInterval(tick, 900);