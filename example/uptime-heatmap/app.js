const svcNames = ['API Gateway', 'Auth Service', 'Payments', 'Notifications', 'Search Index', 'Scheduler'];
const days = 30;
const data = svcNames.map(name => ({
  name,
  cells: Array.from({ length: days }, () => {
    const r = Math.random();
    return r < .06 ? 'down' : r < .15 ? 'degraded' : 'ok';
  })
}));

const heatmap = document.getElementById('heatmap');
const tip = document.getElementById('tooltip');

function dateLabel(daysAgo) {
  const d = new Date(); d.setDate(d.getDate() - (days - 1 - daysAgo));
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

data.forEach(svc => {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = `<div class="label">${svc.name}</div>`;
  svc.cells.forEach((status, i) => {
    const c = document.createElement('div');
    c.className = `cell ${status}`;
    c.addEventListener('mouseenter', e => {
      tip.style.display = 'block';
      tip.style.left = e.clientX + 12 + 'px';
      tip.style.top = e.clientY - 30 + 'px';
      const uptime = status === 'ok' ? '100%' : status === 'degraded' ? '97.3%' : '84.1%';
      tip.textContent = `${svc.name} · ${dateLabel(i)} · ${status.toUpperCase()} · ${uptime} uptime`;
    });
    c.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    row.appendChild(c);
  });
  heatmap.appendChild(row);
});