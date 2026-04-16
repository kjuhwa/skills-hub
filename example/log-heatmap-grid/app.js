const services = ['api-gateway', 'auth-service', 'user-service', 'payment', 'notifications', 'scheduler', 'analytics'];
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0') + ':00');
const data = services.map(s => hours.map(() => Math.random() < 0.1 ? 60 + Math.random() * 140 | 0 : Math.random() * 50 | 0));

const cellW = 34, cellH = 28, padL = 110, padT = 30;
const svg = document.getElementById('heatmap');
const tip = document.getElementById('tooltip');
const detail = document.getElementById('detail');
svg.setAttribute('viewBox', `0 0 ${padL + hours.length * cellW + 10} ${padT + services.length * cellH + 10}`);

function color(v) {
  if (v > 80) return '#dc2626';
  if (v > 30) return '#d97706';
  return '#064e3b';
}

hours.forEach((h, i) => {
  if (i % 3 === 0) {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', padL + i * cellW + cellW / 2); t.setAttribute('y', 18);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#8b949e'); t.setAttribute('font-size', '9');
    t.textContent = h; svg.appendChild(t);
  }
});

services.forEach((s, ri) => {
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', padL - 6); t.setAttribute('y', padT + ri * cellH + cellH / 2 + 4);
  t.setAttribute('text-anchor', 'end'); t.setAttribute('fill', '#c9d1d9'); t.setAttribute('font-size', '11');
  t.textContent = s; svg.appendChild(t);

  hours.forEach((h, ci) => {
    const v = data[ri][ci];
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    r.setAttribute('x', padL + ci * cellW + 1); r.setAttribute('y', padT + ri * cellH + 1);
    r.setAttribute('width', cellW - 2); r.setAttribute('height', cellH - 2);
    r.setAttribute('rx', 3); r.setAttribute('fill', color(v)); r.style.cursor = 'pointer';
    r.addEventListener('mouseenter', e => {
      tip.style.display = 'block'; tip.style.left = e.clientX + 12 + 'px'; tip.style.top = e.clientY - 10 + 'px';
      tip.textContent = `${s} @ ${h} — ${v} errors`;
    });
    r.addEventListener('mouseleave', () => tip.style.display = 'none');
    r.addEventListener('click', () => {
      const samples = ['TimeoutError: upstream 5000ms', 'NullPointerException in handler', '503 Service Unavailable', 'ECONNREFUSED 10.0.3.12:5432'];
      detail.innerHTML = `<b>${s}</b> at <b>${h}</b>: ${v} errors aggregated<br><br>` +
        Array.from({ length: Math.min(v, 4) }, () => '• ' + samples[Math.random() * samples.length | 0]).join('<br>');
    });
    svg.appendChild(r);
  });
});

detail.innerHTML = 'Click any cell to see aggregated error details.';