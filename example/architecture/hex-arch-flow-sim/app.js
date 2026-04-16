const scenarios = [
  { name: 'Create Order', driving: [
      { label: 'Adapter', name: 'REST Controller' },
      { label: 'Port', name: 'CreateOrderPort' }
    ], core: [
      { label: 'Use Case', name: 'CreateOrderUseCase' },
      { label: 'Entity', name: 'Order Aggregate' }
    ], driven: [
      { label: 'Port', name: 'OrderRepository' },
      { label: 'Adapter', name: 'PostgresAdapter' }
    ]},
  { name: 'Send Notification', driving: [
      { label: 'Adapter', name: 'Kafka Consumer' },
      { label: 'Port', name: 'NotifyPort' }
    ], core: [
      { label: 'Use Case', name: 'SendNotificationUseCase' },
      { label: 'Entity', name: 'Notification' }
    ], driven: [
      { label: 'Port', name: 'EmailSenderPort' },
      { label: 'Adapter', name: 'SMTPAdapter' }
    ]},
  { name: 'Query Report', driving: [
      { label: 'Adapter', name: 'GraphQL Resolver' },
      { label: 'Port', name: 'GetReportPort' }
    ], core: [
      { label: 'Use Case', name: 'GetReportUseCase' },
      { label: 'Entity', name: 'Report VO' }
    ], driven: [
      { label: 'Port', name: 'CachePort' },
      { label: 'Adapter', name: 'RedisAdapter' }
    ]}
];

const left = document.getElementById('left');
const center = document.getElementById('center');
const right = document.getElementById('right');
const timeline = document.getElementById('timeline');
const status = document.getElementById('status');
let running = false;

function renderScenario(s) {
  [left, center, right].forEach(c => { c.innerHTML = c.querySelector('h3')?.outerHTML || ''; });
  left.innerHTML = '<h3>Driving Side</h3>' + s.driving.map(n => `<div class="node" id="n-${n.name.replace(/\s/g,'')}"><div class="label">${n.label}</div><div class="name">${n.name}</div></div>`).join('');
  center.innerHTML = '<h3>Domain Core</h3>' + s.core.map(n => `<div class="node" id="n-${n.name.replace(/\s/g,'')}"><div class="label">${n.label}</div><div class="name">${n.name}</div></div>`).join('');
  right.innerHTML = '<h3>Driven Side</h3>' + s.driven.map(n => `<div class="node" id="n-${n.name.replace(/\s/g,'')}"><div class="label">${n.label}</div><div class="name">${n.name}</div></div>`).join('');
}

async function runFlow(s) {
  if (running) return;
  running = true;
  timeline.innerHTML = '';
  status.textContent = 'Running...';
  const all = [...s.driving, ...s.core, ...s.driven];
  let t = 0;
  for (const node of all) {
    const el = document.getElementById('n-' + node.name.replace(/\s/g, ''));
    if (el) el.classList.add('active');
    const delay = 80 + Math.random() * 200 | 0;
    t += delay;
    const step = document.createElement('div');
    step.className = 'step';
    step.innerHTML = `<span class="ms">+${t}ms</span> → ${node.label}: <strong>${node.name}</strong>`;
    timeline.appendChild(step);
    await new Promise(r => setTimeout(r, delay));
    step.classList.add('done');
  }
  status.textContent = `✓ Completed in ${t}ms`;
  setTimeout(() => { all.forEach(n => { const el = document.getElementById('n-' + n.name.replace(/\s/g, '')); if (el) el.classList.remove('active'); }); }, 1200);
  running = false;
}

document.getElementById('scenario').onchange = function() { renderScenario(scenarios[+this.value]); };
document.getElementById('btnRun').onclick = () => runFlow(scenarios[+document.getElementById('scenario').value]);

renderScenario(scenarios[0]);