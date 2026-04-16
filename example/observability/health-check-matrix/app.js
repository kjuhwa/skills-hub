const services = ['API Gateway', 'Auth', 'Database', 'Cache', 'Queue', 'Search', 'Mail', 'CDN', 'Billing', 'Analytics'];
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const data = {};
services.forEach(s => {
  data[s] = hours.map(() => { const r = Math.random(); return r < 0.75 ? 1 : r < 0.92 ? 0.5 : 0; });
});

const matrix = document.getElementById('matrix');
const tooltip = document.getElementById('tooltip');
const colors = { 1: '#6ee7b7', 0.5: '#fbbf24', 0: '#f87171' };

const header = document.createElement('div'); header.className = 'row';
const spacer = document.createElement('div'); spacer.className = 'row-label'; header.appendChild(spacer);
hours.forEach((h, i) => {
  if (i % 4 === 0) { const lbl = document.createElement('div'); lbl.style.cssText = `width:${18*4+3*3}px;font-size:.65rem;color:#64748b;`; lbl.textContent = h; header.appendChild(lbl); }
});
matrix.appendChild(header);

services.forEach(s => {
  const row = document.createElement('div'); row.className = 'row';
  const label = document.createElement('div'); label.className = 'row-label'; label.textContent = s; row.appendChild(label);
  data[s].forEach((v, i) => {
    const cell = document.createElement('div'); cell.className = 'cell';
    cell.style.background = colors[v]; cell.style.opacity = v === 1 ? '0.8' : '1';
    cell.addEventListener('mouseenter', e => {
      const st = v === 1 ? 'Healthy' : v === 0.5 ? 'Degraded' : 'Down';
      tooltip.innerHTML = `<b>${s}</b><br>${hours[i]}<br>Status: <span style="color:${colors[v]}">${st}</span>`;
      tooltip.style.display = 'block';
    });
    cell.addEventListener('mousemove', e => { tooltip.style.left = e.clientX + 14 + 'px'; tooltip.style.top = e.clientY + 14 + 'px'; });
    cell.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
    row.appendChild(cell);
  });
  matrix.appendChild(row);
});

setInterval(() => {
  services.forEach(s => {
    data[s].shift(); const r = Math.random(); data[s].push(r < 0.75 ? 1 : r < 0.92 ? 0.5 : 0);
  });
  const rows = matrix.querySelectorAll('.row');
  services.forEach((s, si) => {
    const cells = rows[si + 1].querySelectorAll('.cell');
    data[s].forEach((v, i) => { cells[i].style.background = colors[v]; cells[i].style.opacity = v === 1 ? '0.8' : '1'; });
  });
}, 3000);