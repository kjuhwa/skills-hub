const services = ['API Gateway', 'Auth', 'Orders', 'Payments', 'Inventory', 'Notifications'];
const failures = ['Pod Kill', 'CPU Stress', 'Net Latency', 'Disk Full', 'DNS Fail', 'Memory Leak'];
const scores = {};

services.forEach(s => failures.forEach(f => {
  scores[`${s}|${f}`] = { tested: Math.random() < 0.6, score: Math.random(), mttr: Math.floor(Math.random() * 300 + 10) };
}));

function color(entry) {
  if (!entry.tested) return '#2d333b';
  if (entry.score > 0.7) return '#22863a';
  if (entry.score > 0.4) return '#b08800';
  return '#b33a3a';
}

function label(entry) {
  if (!entry.tested) return 'untested';
  if (entry.score > 0.7) return 'resilient';
  if (entry.score > 0.4) return 'degraded';
  return 'vulnerable';
}

function render() {
  const cols = failures.length + 1;
  const grid = document.getElementById('matrix');
  grid.style.gridTemplateColumns = `100px repeat(${failures.length}, 1fr)`;
  grid.innerHTML = '';

  const corner = document.createElement('div');
  corner.className = 'cell corner';
  grid.appendChild(corner);

  failures.forEach(f => {
    const hdr = document.createElement('div');
    hdr.className = 'cell header';
    hdr.textContent = f;
    grid.appendChild(hdr);
  });

  services.forEach(s => {
    const row = document.createElement('div');
    row.className = 'cell header';
    row.textContent = s;
    grid.appendChild(row);
    failures.forEach(f => {
      const key = `${s}|${f}`;
      const entry = scores[key];
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.background = color(entry);
      cell.textContent = label(entry);
      cell.addEventListener('mouseenter', () => showDetail(s, f, entry));
      cell.addEventListener('click', () => {
        entry.tested = !entry.tested;
        if (entry.tested) { entry.score = Math.random(); entry.mttr = Math.floor(Math.random() * 300 + 10); }
        render();
      });
      grid.appendChild(cell);
    });
  });
}

function showDetail(svc, fail, entry) {
  const el = document.getElementById('detail');
  if (!entry.tested) {
    el.innerHTML = `<span class="label">${svc} × ${fail}</span> — Not yet tested. Click to simulate.`;
  } else {
    el.innerHTML = `<span class="label">${svc} × ${fail}</span> — Score: ${(entry.score * 100).toFixed(0)}% · MTTR: ${entry.mttr}s · Status: ${label(entry)}`;
  }
}

render();
document.getElementById('detail').innerHTML = '<span class="label">Hover</span> a cell to see details';