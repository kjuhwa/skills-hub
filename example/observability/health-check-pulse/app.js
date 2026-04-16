const services = [
  { name: 'API Gateway', status: 'up', latency: 12 },
  { name: 'Auth Service', status: 'up', latency: 45 },
  { name: 'Database', status: 'degraded', latency: 230 },
  { name: 'Cache Layer', status: 'up', latency: 3 },
  { name: 'Queue Worker', status: 'down', latency: 0 },
  { name: 'CDN', status: 'up', latency: 8 },
  { name: 'Search Index', status: 'up', latency: 67 },
  { name: 'Notification', status: 'degraded', latency: 410 }
];
const history = {};
services.forEach(s => { history[s.name] = Array.from({ length: 60 }, () => Math.random() * 80 + (s.status === 'up' ? 10 : 150)); });
let selected = services[0].name;

function renderCards() {
  const grid = document.getElementById('services');
  grid.innerHTML = services.map(s => `
    <div class="card ${s.name === selected ? 'selected' : ''}" onclick="select('${s.name}')">
      <span class="dot ${s.status}"></span><span class="name">${s.name}</span>
      <div class="latency">${s.status === 'down' ? 'Unreachable' : s.latency + 'ms'}</div>
    </div>`).join('');
}

function select(name) { selected = name; renderCards(); drawTimeline(); }

function drawTimeline() {
  const c = document.getElementById('timeline'), ctx = c.getContext('2d');
  c.width = c.clientWidth; c.height = 200;
  ctx.clearRect(0, 0, c.width, c.height);
  const data = history[selected], step = c.width / (data.length - 1);
  ctx.beginPath(); ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 2;
  data.forEach((v, i) => { const y = c.height - (v / 500) * c.height; i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * step, y); });
  ctx.stroke();
  ctx.lineTo((data.length - 1) * step, c.height); ctx.lineTo(0, c.height); ctx.closePath();
  ctx.fillStyle = 'rgba(110,231,183,0.07)'; ctx.fill();
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px system-ui';
  ctx.fillText(selected + ' — latency (ms) last 60s', 12, 18);
}

setInterval(() => {
  services.forEach(s => {
    if (s.status !== 'down') s.latency = Math.max(1, s.latency + Math.round((Math.random() - 0.5) * 20));
    history[s.name].push(s.status === 'down' ? 500 : s.latency); history[s.name].shift();
  });
  renderCards(); drawTimeline();
}, 1000);
renderCards(); drawTimeline();