const machines = {
  traffic: {
    states: ['green','yellow','red','walk'],
    initial: 'green',
    transitions: {timer:{'green':'yellow','yellow':'red','red':'walk','walk':'green'},emergency:{'green':'red','yellow':'red','walk':'red','red':'red'}},
    events: ['timer','emergency']
  },
  door: {
    states: ['locked','unlocked','open','alarmed'],
    initial: 'locked',
    transitions: {unlock:{'locked':'unlocked'},lock:{'unlocked':'locked','open':'locked'},push:{'unlocked':'open'},timeout:{'open':'alarmed','alarmed':'locked'},reset:{'alarmed':'locked'}},
    events: ['unlock','lock','push','timeout','reset']
  },
  vending: {
    states: ['idle','coin_inserted','dispensing','error'],
    initial: 'idle',
    transitions: {insert_coin:{'idle':'coin_inserted'},select:{'coin_inserted':'dispensing'},dispense:{'dispensing':'idle'},jam:{'dispensing':'error'},fix:{'error':'idle'}},
    events: ['insert_coin','select','dispense','jam','fix']
  }
};
let current, machine, ctx;
const canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');
const logEl = document.getElementById('log');
const eventsEl = document.getElementById('events');

function load(name) {
  machine = machines[name]; current = machine.initial;
  eventsEl.innerHTML = '';
  machine.events.forEach(e => {
    const b = document.createElement('button'); b.textContent = e;
    b.onclick = () => fire(e); eventsEl.appendChild(b);
  });
  logEl.innerHTML = ''; addLog('Machine loaded', current); draw();
}

function fire(event) {
  const t = machine.transitions[event];
  if (t && t[current]) { const prev = current; current = t[current]; addLog(`${event}: ${prev}`, current); }
  else { addLog(`${event}: invalid from ${current}`, current); }
  draw();
}

function addLog(msg, state) {
  const d = document.createElement('div'); d.className = 'log-entry';
  d.innerHTML = `${msg} → <span>${state}</span>`; logEl.prepend(d);
}

function draw() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const n = machine.states.length, cx = W / 2, cy = H / 2, r = 130;
  const positions = machine.states.map((_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  // draw transitions as arrows
  Object.entries(machine.transitions).forEach(([ev, map]) => {
    Object.entries(map).forEach(([from, to]) => {
      const fi = machine.states.indexOf(from), ti = machine.states.indexOf(to);
      if (fi === ti) return;
      const [x1,y1] = positions[fi], [x2,y2] = positions[ti];
      const dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
      const ux=dx/len, uy=dy/len;
      ctx.beginPath(); ctx.moveTo(x1+ux*32, y1+uy*32); ctx.lineTo(x2-ux*32, y2-uy*32);
      ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 1.5; ctx.stroke();
      const ax=x2-ux*38, ay=y2-uy*38;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax-ux*8+uy*5, ay-uy*8-ux*5);
      ctx.lineTo(ax-ux*8-uy*5, ay-uy*8+ux*5); ctx.closePath(); ctx.fillStyle='#2d333b'; ctx.fill();
    });
  });
  // draw states
  machine.states.forEach((s, i) => {
    const [x, y] = positions[i]; const active = s === current;
    ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#6ee7b733' : '#1a1d27';
    ctx.strokeStyle = active ? '#6ee7b7' : '#2d333b'; ctx.lineWidth = active ? 3 : 1.5;
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = active ? '#6ee7b7' : '#c9d1d9'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  });
}

document.getElementById('machine-select').onchange = e => load(e.target.value);
load('traffic');