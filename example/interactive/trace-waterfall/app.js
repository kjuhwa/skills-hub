const services = ['api-gateway','auth-svc','user-svc','order-svc','payment-svc','inventory-svc','notify-svc','cache-layer'];
const colors = ['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb923c','#34d399','#f87171'];

function rid() { return Math.random().toString(36).slice(2, 10); }

function generateTrace() {
  const totalMs = 200 + Math.random() * 800;
  const spans = [];
  const depth = 4 + Math.floor(Math.random() * 5);
  let t = 0;
  for (let i = 0; i < depth; i++) {
    const svc = services[i % services.length];
    const start = i === 0 ? 0 : spans[Math.floor(Math.random() * i)].start + Math.random() * 30;
    const dur = 10 + Math.random() * (totalMs / depth);
    spans.push({ id: rid(), service: svc, start, dur, color: colors[i % colors.length] });
  }
  render(spans, totalMs, rid());
}

function render(spans, totalMs, traceId) {
  document.getElementById('traceId').textContent = 'trace: ' + traceId;
  const container = document.getElementById('waterfall');
  container.innerHTML = '';
  const maxEnd = Math.max(...spans.map(s => s.start + s.dur));
  spans.sort((a, b) => a.start - b.start);
  spans.forEach(s => {
    const row = document.createElement('div');
    row.className = 'span-row';
    const label = document.createElement('div');
    label.className = 'span-label';
    label.textContent = s.service;
    const track = document.createElement('div');
    track.className = 'span-track';
    const bar = document.createElement('div');
    bar.className = 'span-bar';
    bar.style.left = (s.start / maxEnd * 100) + '%';
    bar.style.width = (s.dur / maxEnd * 100) + '%';
    bar.style.background = s.color;
    const dur = document.createElement('span');
    dur.className = 'dur';
    dur.textContent = Math.round(s.dur) + 'ms';
    bar.appendChild(dur);
    track.appendChild(bar);
    row.appendChild(label);
    row.appendChild(track);
    container.appendChild(row);
  });
}

generateTrace();