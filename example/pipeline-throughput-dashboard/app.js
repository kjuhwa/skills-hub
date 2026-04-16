const stageNames = ['Ingest', 'Transform', 'Validate', 'Load'];
const throughputData = Array(60).fill(0), latencyData = Array(60).fill(0);
let totalMsg = 0, totalErr = 0, logs = [];

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function drawChart(id, data, color, max) {
  const c = document.getElementById(id), ctx = c.getContext('2d');
  c.width = c.clientWidth * devicePixelRatio; c.height = c.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = c.clientWidth, h = c.clientHeight;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  const step = w / (data.length - 1);
  data.forEach((v, i) => {
    const x = i * step, y = h - (v / max) * (h - 10);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineTo((data.length - 1) * step, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = color + '18'; ctx.fill();
}

function tick() {
  const tp = rand(80, 200), lat = rand(5, 120);
  throughputData.push(tp); throughputData.shift();
  latencyData.push(lat); latencyData.shift();
  const isErr = Math.random() < 0.07;
  totalMsg++; if (isErr) totalErr++;
  const stage = stageNames[rand(0, 3)];
  const now = new Date().toLocaleTimeString();
  logs.unshift({ time: now, stage, ok: !isErr, lat });
  if (logs.length > 50) logs.pop();

  document.getElementById('metrics').innerHTML = [
    { l: 'Total Messages', v: totalMsg }, { l: 'Errors', v: totalErr },
    { l: 'Throughput', v: tp + '/s' }, { l: 'Avg Latency', v: (latencyData.reduce((a, b) => a + b) / 60).toFixed(0) + 'ms' }
  ].map(m => `<div class="m"><div class="v">${m.v}</div><div class="l">${m.l}</div></div>`).join('');

  drawChart('c1', throughputData, '#6ee7b7', 250);
  drawChart('c2', latencyData, '#facc15', 150);

  document.querySelector('#log tbody').innerHTML = logs.slice(0, 20).map(r =>
    `<tr><td>${r.time}</td><td>${r.stage}</td><td class="${r.ok ? 'ok' : 'err'}">${r.ok ? '✓ OK' : '✗ Fail'}</td><td>${r.lat}ms</td></tr>`
  ).join('');
}

setInterval(tick, 800); tick();