let shards = [
  { name:'shard-0', records:320 },
  { name:'shard-1', records:180 },
  { name:'shard-2', records:510 },
];
const logEl = document.getElementById('log');
const loadSlider = document.getElementById('load');
const loadVal = document.getElementById('loadVal');

function log(msg) {
  const d = document.createElement('div');
  d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(d);
  if (logEl.children.length > 50) logEl.lastChild.remove();
}

function distribute(total) {
  const per = Math.floor(total / shards.length);
  let rem = total - per * shards.length;
  shards.forEach((s, i) => { s.records = per + (i < rem ? 1 : 0); });
}

function render() {
  const max = Math.max(...shards.map(s => s.records), 1);
  const avg = shards.reduce((a, s) => a + s.records, 0) / shards.length;
  document.getElementById('shards').innerHTML = shards.map(s => {
    const pct = (s.records / max * 100).toFixed(0);
    const hot = s.records > avg * 1.4 ? 'hot' : '';
    return `<div class="shard ${hot}"><h3>${s.name}</h3>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="count">${s.records.toLocaleString()} records (${pct}%)</div></div>`;
  }).join('');
}

loadSlider.oninput = () => {
  const v = +loadSlider.value; loadVal.textContent = v;
  const idx = Math.floor(Math.random() * shards.length);
  const extra = v - shards.reduce((a, s) => a + s.records, 0);
  if (extra > 0) { shards[idx].records += extra; log(`+${extra} records → ${shards[idx].name} (hot-spot)`); }
  else if (extra < 0) { distribute(v); log(`Scaled down to ${v} total records`); }
  render();
};

document.getElementById('btnAdd').onclick = () => {
  shards.push({ name: `shard-${shards.length}`, records: 0 });
  log(`Added ${shards[shards.length - 1].name}`);
  render();
};

document.getElementById('btnRebalance').onclick = () => {
  const total = shards.reduce((a, s) => a + s.records, 0);
  const before = shards.map(s => s.records);
  distribute(total);
  shards.forEach((s, i) => {
    const diff = s.records - before[i];
    if (diff !== 0) log(`${s.name}: ${diff > 0 ? '+' : ''}${diff} records`);
  });
  log(`Rebalanced ${total.toLocaleString()} records across ${shards.length} shards`);
  render();
};

render(); log('Simulator ready — 3 shards initialized');