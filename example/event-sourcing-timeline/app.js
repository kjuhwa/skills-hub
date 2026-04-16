const types = ['deposit', 'withdraw', 'fee', 'interest'];
const store = { events: [], state: { balance: 0 } };

function createEvent(type, amount) {
  return { id: store.events.length + 1, type, amount, ts: Date.now() + store.events.length * 100 };
}

function applyEvent(state, e) {
  const s = { ...state };
  if (e.type === 'deposit' || e.type === 'interest') s.balance += e.amount;
  else s.balance -= e.amount;
  return s;
}

function rebuild() {
  store.state = store.events.reduce((s, e) => applyEvent(s, e), { balance: 0 });
  document.getElementById('stateDisplay').textContent = `Balance: $${store.state.balance.toFixed(2)}`;
}

function renderLog() {
  const log = document.getElementById('eventLog');
  log.innerHTML = store.events.slice().reverse().map(e =>
    `<div class="log-entry"><span>#${e.id} <b>${e.type}</b> $${e.amount.toFixed(2)}</span><span class="ts">${new Date(e.ts).toLocaleTimeString()}</span></div>`
  ).join('');
}

function drawTimeline() {
  const c = document.getElementById('timeline'), ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  if (!store.events.length) return;
  ctx.strokeStyle = '#6ee7b744'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();
  const step = Math.min(80, (W - 80) / store.events.length);
  let running = 0;
  store.events.forEach((e, i) => {
    const x = 50 + i * step, cy = H / 2;
    running = (e.type === 'deposit' || e.type === 'interest') ? running + e.amount : running - e.amount;
    const barH = Math.min(80, Math.abs(running) * 0.4);
    const up = running >= 0;
    ctx.fillStyle = up ? '#6ee7b744' : '#f8717144';
    ctx.fillRect(x - 8, up ? cy - barH : cy, 16, barH);
    ctx.beginPath(); ctx.arc(x, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = e.type === 'withdraw' || e.type === 'fee' ? '#f87171' : '#6ee7b7';
    ctx.fill();
    ctx.fillStyle = '#c9d1d9'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText(e.type.slice(0, 3), x, cy + 22);
  });
}

function addRandom() {
  const t = types[Math.floor(Math.random() * types.length)];
  const amt = +(Math.random() * 200 + 5).toFixed(2);
  store.events.push(createEvent(t, amt));
  rebuild(); renderLog(); drawTimeline();
}

async function replay() {
  const saved = [...store.events];
  store.events = []; rebuild(); renderLog(); drawTimeline();
  for (const e of saved) {
    store.events.push(e); rebuild(); renderLog(); drawTimeline();
    await new Promise(r => setTimeout(r, 300));
  }
}

document.getElementById('btnAdd').onclick = addRandom;
document.getElementById('btnReplay').onclick = replay;
document.getElementById('btnReset').onclick = () => { store.events = []; rebuild(); renderLog(); drawTimeline(); };

for (let i = 0; i < 8; i++) addRandom();