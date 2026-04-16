const canvas = document.getElementById('pipeCanvas');
const ctx = canvas.getContext('2d');
const log = document.getElementById('log');
const stats = document.getElementById('stats');

function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

const stages = [
  { name: 'Source', color: '#6ee7b7' },
  { name: 'Parse', color: '#60a5fa' },
  { name: 'Transform', color: '#fbbf24' },
  { name: 'Enrich', color: '#a78bfa' },
  { name: 'Sink', color: '#f87171' }
];

let packets = [];
let paused = false;
let rate = 800;
let failureRate = 0.02;
let totalEvents = 0;
let recentCount = 0;

function stageX(i) {
  return 80 + i * ((canvas.width - 160) / (stages.length - 1));
}

function addPacket() {
  packets.push({
    id: ++totalEvents,
    x: stageX(0),
    stage: 0,
    y: canvas.height / 2 + (Math.random() - 0.5) * 60,
    progress: 0,
    failed: false,
    value: Math.random().toFixed(3)
  });
  recentCount++;
}

function addLog(msg, type = '') {
  const div = document.createElement('div');
  div.className = `log-entry ${type}`;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.insertBefore(div, log.firstChild);
  if (log.children.length > 50) log.removeChild(log.lastChild);
}

function update(dt) {
  if (paused) return;
  for (let p of packets) {
    if (p.failed) continue;
    p.progress += dt * 0.0008;
    if (p.progress >= 1 && p.stage < stages.length - 1) {
      p.stage++;
      p.progress = 0;
      p.x = stageX(p.stage);
      if (Math.random() < failureRate) {
        p.failed = true;
        addLog(`Event #${p.id} failed at ${stages[p.stage].name}`, 'error');
      }
    } else if (p.stage < stages.length - 1) {
      p.x = stageX(p.stage) + (stageX(p.stage + 1) - stageX(p.stage)) * p.progress;
    } else if (p.progress >= 1) {
      addLog(`Event #${p.id} processed (val=${p.value})`, 'success');
      p._done = true;
    }
  }
  packets = packets.filter(p => !p._done && !p.failed);
}

function draw() {
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cy = canvas.height / 2;
  for (let i = 0; i < stages.length - 1; i++) {
    ctx.strokeStyle = '#2a2e3a';
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(stageX(i), cy);
    ctx.lineTo(stageX(i + 1), cy);
    ctx.stroke();
  }

  for (let i = 0; i < stages.length; i++) {
    ctx.fillStyle = '#0f1117';
    ctx.strokeStyle = stages[i].color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(stageX(i), cy, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = stages[i].color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(stages[i].name, stageX(i), cy + 55);
  }

  for (let p of packets) {
    ctx.fillStyle = stages[p.stage].color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => {
  if (!paused) addPacket();
}, 1000 / (rate / 60));

let spawnTimer = setInterval(() => { if (!paused) addPacket(); }, 600);
setInterval(() => {
  stats.textContent = `Events: ${totalEvents} | Rate: ${recentCount}/s`;
  recentCount = 0;
}, 1000);

document.getElementById('toggleBtn').onclick = (e) => {
  paused = !paused;
  e.target.textContent = paused ? 'Resume' : 'Pause';
  addLog(paused ? 'Pipeline paused' : 'Pipeline resumed');
};
document.getElementById('boostBtn').onclick = () => {
  clearInterval(spawnTimer);
  spawnTimer = setInterval(() => { if (!paused) addPacket(); }, 150);
  addLog('Throughput boosted 4x', 'success');
};
document.getElementById('failBtn').onclick = () => {
  failureRate = Math.min(0.5, failureRate + 0.08);
  addLog(`Failure rate raised to ${(failureRate * 100).toFixed(0)}%`, 'error');
};

addLog('Pipeline initialized', 'success');