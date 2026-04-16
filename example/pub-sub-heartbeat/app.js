const channels = [
  { name: 'user.signup', subs: 4, rate: 0, peak: 0, msgs: 0 },
  { name: 'order.created', subs: 7, rate: 0, peak: 0, msgs: 0 },
  { name: 'payment.processed', subs: 3, rate: 0, peak: 0, msgs: 0 },
  { name: 'inventory.low', subs: 2, rate: 0, peak: 0, msgs: 0 },
  { name: 'notification.send', subs: 5, rate: 0, peak: 0, msgs: 0 },
  { name: 'audit.log', subs: 6, rate: 0, peak: 0, msgs: 0 }
];
const grid = document.getElementById('grid');
const log = document.getElementById('log');

function render() {
  grid.innerHTML = '';
  channels.forEach(ch => {
    const pct = ch.peak > 0 ? Math.min((ch.rate / ch.peak) * 100, 100) : 0;
    const active = ch.rate > 0 ? 'active' : '';
    grid.innerHTML += `<div class="card ${active}"><h3>${ch.name}</h3><div class="rate">${ch.rate}<span style="font-size:0.7rem;color:#555"> msg/s</span></div><div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div><div class="meta">${ch.subs} subscribers · ${ch.msgs} total · peak ${ch.peak}/s</div></div>`;
  });
}

function addLog(ch, msg) {
  const t = new Date().toLocaleTimeString();
  const d = document.createElement('div');
  d.innerHTML = `<span class="ts">${t}</span> <span class="tp">${ch.name}</span> → <span class="sub">${msg}</span>`;
  log.prepend(d);
  if (log.children.length > 50) log.lastChild.remove();
}

function simulate() {
  channels.forEach(ch => {
    const r = Math.random() < 0.6 ? Math.floor(Math.random() * 20) : 0;
    ch.rate = r;
    ch.msgs += r;
    if (r > ch.peak) ch.peak = r;
    if (r > 0) addLog(ch, `${r} msgs delivered to ${ch.subs} subs`);
  });
  render();
}

render();
setInterval(simulate, 1000);