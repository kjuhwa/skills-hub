const REGIONS = ['us-east', 'us-west', 'eu-central', 'ap-south'];
let instanceCounter = 1;
const instances = [];
const logs = [];

function makeInstance() {
  return {
    id: `i-${(instanceCounter++).toString(16).padStart(4, '0')}`,
    region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    status: 'healthy',
    consecutiveFails: 0,
    cpu: 20 + Math.random() * 30,
    rps: 50 + Math.random() * 100,
    latencyHistory: Array(20).fill(0).map(() => 30 + Math.random() * 40),
    failChance: Math.random() < 0.15 ? 0.4 : 0.05,
  };
}

for (let i = 0; i < 8; i++) instances.push(makeInstance());

function log(msg, level = 'ok') {
  const t = new Date().toLocaleTimeString();
  logs.unshift({ t, msg, level });
  if (logs.length > 40) logs.pop();
}

log('Load balancer pool initialized', 'ok');

function probe(inst) {
  const fail = Math.random() < inst.failChance;
  const latency = fail ? 800 + Math.random() * 400 : 25 + Math.random() * 60 + inst.cpu * 0.4;
  inst.latencyHistory.push(latency);
  if (inst.latencyHistory.length > 20) inst.latencyHistory.shift();
  inst.cpu += (Math.random() - 0.5) * 10;
  inst.cpu = Math.max(5, Math.min(98, inst.cpu));
  inst.rps += (Math.random() - 0.5) * 20;
  inst.rps = Math.max(0, inst.rps);

  if (fail) {
    inst.consecutiveFails++;
    if (inst.consecutiveFails >= 3 && inst.status !== 'down') {
      inst.status = 'down';
      log(`${inst.id} (${inst.region}) evicted from pool`, 'err');
    } else if (inst.consecutiveFails >= 1 && inst.status === 'healthy') {
      inst.status = 'degraded';
      log(`${inst.id} marked degraded — ${Math.round(latency)}ms`, 'warn');
    }
  } else {
    if (inst.status === 'down') {
      log(`${inst.id} restored to pool`, 'ok');
    } else if (inst.status === 'degraded') {
      log(`${inst.id} recovered`, 'ok');
    }
    inst.consecutiveFails = 0;
    inst.status = 'healthy';
  }
}

function spark(inst) {
  const hist = inst.latencyHistory;
  const max = Math.max(...hist, 100);
  const w = 200, h = 30, step = w / (hist.length - 1);
  const pts = hist.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  const color = inst.status === 'down' ? '#ef4444' : inst.status === 'degraded' ? '#fbbf24' : '#6ee7b7';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline fill="none" stroke="${color}" stroke-width="1.5" points="${pts}"/>
  </svg>`;
}

function render() {
  const grid = document.getElementById('grid');
  grid.innerHTML = instances.map(inst => {
    const avg = inst.latencyHistory.reduce((a, b) => a + b, 0) / inst.latencyHistory.length;
    return `
      <div class="instance ${inst.status}">
        <div class="head">
          <span class="id">${inst.id}</span>
          <span class="badge">${inst.status}</span>
        </div>
        <div class="metrics">
          region: <span>${inst.region}</span><br>
          cpu: <span>${inst.cpu.toFixed(0)}%</span> · rps: <span>${inst.rps.toFixed(0)}</span><br>
          latency: <span>${avg.toFixed(0)}ms</span>
        </div>
        ${spark(inst)}
      </div>`;
  }).join('');

  const counts = { healthy: 0, degraded: 0, down: 0 };
  instances.forEach(i => counts[i.status]++);
  document.getElementById('poolHealthy').textContent = counts.healthy;
  document.getElementById('poolDegraded').textContent = counts.degraded;
  document.getElementById('poolDown').textContent = counts.down;

  document.getElementById('log').innerHTML = logs.map(l =>
    `<div class="entry"><span class="time">${l.t}</span><span class="${l.level}">${l.msg}</span></div>`
  ).join('');
}

setInterval(() => {
  instances.forEach(probe);
  render();
}, 1500);

setInterval(() => {
  if (instances.length < 12 && Math.random() < 0.3) {
    const n = makeInstance();
    instances.push(n);
    log(`${n.id} provisioned in ${n.region}`, 'ok');
  } else if (instances.length > 4 && Math.random() < 0.15) {
    const idx = Math.floor(Math.random() * instances.length);
    const removed = instances.splice(idx, 1)[0];
    log(`${removed.id} decommissioned`, 'warn');
  }
}, 8000);

render();