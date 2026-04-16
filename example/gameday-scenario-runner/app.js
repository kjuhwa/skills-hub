const scenarios = [
  { id: 'latency', title: 'Network Latency', desc: '+200ms injected on service calls', effect: { latency: 0.9, errors: 0.3, tps: 0.4, cpu: 0.5 } },
  { id: 'cpu', title: 'CPU Hog', desc: 'Saturate CPU on one host', effect: { latency: 0.6, errors: 0.2, tps: 0.55, cpu: 0.95 } },
  { id: 'kill', title: 'Pod Kill', desc: 'Randomly terminate a pod', effect: { latency: 0.4, errors: 0.6, tps: 0.3, cpu: 0.3 } },
  { id: 'dns', title: 'DNS Blackhole', desc: 'DNS resolver returns NXDOMAIN', effect: { latency: 0.7, errors: 0.95, tps: 0.2, cpu: 0.25 } },
  { id: 'disk', title: 'Disk Fill', desc: 'Fill disk to 99%', effect: { latency: 0.5, errors: 0.4, tps: 0.4, cpu: 0.6 } },
  { id: 'none', title: 'Steady State', desc: 'No injection — baseline', effect: { latency: 0.2, errors: 0.05, tps: 0.75, cpu: 0.4 } },
];

const steady = { latency: 0.2, errors: 0.05, tps: 0.75, cpu: 0.4 };
let target = { ...steady };
let current = { ...steady };
let active = 'none';

const container = document.getElementById('scenarios');
scenarios.forEach(s => {
  const el = document.createElement('div');
  el.className = 'card' + (s.id==='none' ? ' active':'');
  el.innerHTML = `<h3>${s.title}</h3><p>${s.desc}</p>`;
  el.onclick = () => {
    document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
    target = { ...s.effect };
    active = s.id;
  };
  container.appendChild(el);
});

const chart = document.getElementById('chart');
const cx = chart.getContext('2d');
const history = Array(120).fill(null).map(() => ({ ...steady }));

function render() {
  current.latency += (target.latency - current.latency) * 0.08;
  current.errors += (target.errors - current.errors) * 0.08;
  current.tps += (target.tps - current.tps) * 0.08;
  current.cpu += (target.cpu - current.cpu) * 0.08;

  const noisy = {
    latency: Math.min(1, current.latency + (Math.random()-0.5)*0.04),
    errors: Math.max(0, current.errors + (Math.random()-0.5)*0.03),
    tps: Math.max(0, current.tps + (Math.random()-0.5)*0.05),
    cpu: Math.min(1, current.cpu + (Math.random()-0.5)*0.04),
  };

  update('latency', noisy.latency, v => `${(v*500).toFixed(0)}ms`);
  update('errors', noisy.errors, v => `${(v*100).toFixed(1)}%`);
  update('tps', noisy.tps, v => `${(v*1200).toFixed(0)}/s`, true);
  update('cpu', noisy.cpu, v => `${(v*100).toFixed(0)}%`);

  history.push(noisy);
  history.shift();
  drawChart();

  const verdict = document.getElementById('verdict');
  if (noisy.errors > 0.5) { verdict.className = 'verdict bad'; verdict.textContent = `❌ Hypothesis broken: error rate ${(noisy.errors*100).toFixed(1)}% exceeds SLO.`; }
  else if (noisy.errors > 0.2 || noisy.latency > 0.7) { verdict.className = 'verdict warn'; verdict.textContent = `⚠ System degraded but surviving the ${active} experiment.`; }
  else { verdict.className = 'verdict'; verdict.textContent = `✓ Steady state holds under ${active === 'none' ? 'no injection' : active}.`; }

  requestAnimationFrame(render);
}

function update(id, v, fmt, good) {
  const fill = document.getElementById('m-'+id);
  fill.style.width = Math.min(100, v*100) + '%';
  fill.style.background = good
    ? (v > 0.5 ? '#6ee7b7' : v > 0.3 ? '#f59e0b' : '#ef4444')
    : (v > 0.7 ? '#ef4444' : v > 0.4 ? '#f59e0b' : '#6ee7b7');
  document.getElementById('v-'+id).textContent = fmt(v);
}

function drawChart() {
  const w = chart.width, h = chart.height;
  cx.clearRect(0,0,w,h);
  const colors = { latency: '#6ee7b7', errors: '#ef4444', cpu: '#f59e0b' };
  Object.keys(colors).forEach(k => {
    cx.strokeStyle = colors[k];
    cx.lineWidth = 1.5;
    cx.beginPath();
    history.forEach((d, i) => {
      const x = (i / history.length) * w;
      const y = h - d[k] * h;
      i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
    });
    cx.stroke();
  });
}

render();