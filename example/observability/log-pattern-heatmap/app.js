const canvas = document.getElementById('heatmap');
const ctx = canvas.getContext('2d');
const tip = document.getElementById('tip');
const legend = document.getElementById('legend');
const patterns = ['AuthFailure', 'Timeout', 'RateLimit', 'DBSlow', 'OOMKill', 'DiskFull', 'CacheMiss', 'QueueFull', 'TLSError', 'NullRef'];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const data = patterns.map(() => hours.map(() => Math.random() < 0.1 ? 0 : Math.floor(Math.pow(Math.random(), 2) * 100)));

const stops = [[15, '#1a1d27'], [40, '#1a4a3a'], [70, '#2d8a5e'], [100, '#6ee7b7']];
function heatColor(v) {
  if (v === 0) return '#12141c';
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) return stops[i][1];
  }
  return stops[stops.length - 1][1];
}

legend.innerHTML = 'Low ' + stops.map(([, c]) => `<div class="block" style="background:${c}"></div>`).join('') + ' High';

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  draw();
}

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const left = 80, top = 24, gap = 2;
  const cw = (w - left - 10) / hours.length;
  const ch = (h - top - 10) / patterns.length;
  ctx.clearRect(0, 0, w, h);
  ctx.font = '11px system-ui';
  ctx.fillStyle = '#565f89';
  ctx.textAlign = 'right';
  patterns.forEach((p, r) => ctx.fillText(p, left - 8, top + r * ch + ch / 2 + 4));
  ctx.textAlign = 'center';
  hours.forEach((hr, c) => { if (c % 3 === 0) ctx.fillText(hr, left + c * cw + cw / 2, top - 6); });
  data.forEach((row, r) => row.forEach((v, c) => {
    ctx.fillStyle = heatColor(v);
    ctx.beginPath();
    ctx.roundRect(left + c * cw + gap / 2, top + r * ch + gap / 2, cw - gap, ch - gap, 3);
    ctx.fill();
  }));
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const left = 80, top = 24;
  const cw = (canvas.clientWidth - left - 10) / 24;
  const ch = (canvas.clientHeight - top - 10) / patterns.length;
  const col = Math.floor((x - left) / cw), row = Math.floor((y - top) / ch);
  if (row >= 0 && row < patterns.length && col >= 0 && col < 24) {
    tip.style.display = 'block';
    tip.style.left = (e.clientX - canvas.parentElement.getBoundingClientRect().left + 12) + 'px';
    tip.style.top = (e.clientY - canvas.parentElement.getBoundingClientRect().top - 30) + 'px';
    tip.innerHTML = `<b>${patterns[row]}</b> @ ${hours[col]}<br>${data[row][col]} occurrences`;
  } else tip.style.display = 'none';
});
canvas.addEventListener('mouseleave', () => tip.style.display = 'none');

resize();
window.addEventListener('resize', resize);
document.getElementById('range').addEventListener('change', () => {
  data.forEach(row => row.forEach((_, i, a) => a[i] = Math.random() < 0.1 ? 0 : Math.floor(Math.pow(Math.random(), 2) * 100)));
  draw();
});