const defaultPolicy = `allow FROM cart TO payment
allow FROM cart TO inventory
allow FROM web TO cart
allow FROM web TO api
limit FROM web TO api 2/s
deny FROM * TO admin`;

const services = ['web', 'cart', 'payment', 'inventory', 'api', 'admin'];
let rules = [];
const rateWindows = new Map();
const traffic = [];

const policyEl = document.getElementById('policy');
const trafficEl = document.getElementById('traffic');
const matrixEl = document.getElementById('matrix');
const statusEl = document.getElementById('parseStatus');
policyEl.value = defaultPolicy;

function parsePolicy(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const parsed = [];
  for (const line of lines) {
    const m = line.match(/^(allow|deny|limit)\s+FROM\s+(\S+)\s+TO\s+(\S+)(?:\s+(\d+)\/s)?$/i);
    if (!m) throw new Error('Bad rule: ' + line);
    parsed.push({ action: m[1].toLowerCase(), from: m[2], to: m[3], limit: m[4] ? parseInt(m[4]) : null });
  }
  return parsed;
}

function matches(rule, from, to) {
  return (rule.from === '*' || rule.from === from) && (rule.to === '*' || rule.to === to);
}

function evaluate(from, to) {
  for (const r of rules) {
    if (matches(r, from, to)) {
      if (r.action === 'limit') {
        const key = `${r.from}->${r.to}`;
        const now = Date.now();
        const w = rateWindows.get(key) || [];
        const recent = w.filter(t => now - t < 1000);
        if (recent.length >= r.limit) return { decision: 'limit', rule: r };
        recent.push(now);
        rateWindows.set(key, recent);
        continue;
      }
      return { decision: r.action, rule: r };
    }
  }
  return { decision: 'deny', rule: null };
}

function renderTraffic() {
  trafficEl.innerHTML = '';
  traffic.slice(-40).reverse().forEach(e => {
    const div = document.createElement('div');
    div.className = 'req ' + e.decision;
    div.innerHTML = `<span>${e.from} → ${e.to}</span><span class="tag">${e.decision.toUpperCase()}</span>`;
    trafficEl.appendChild(div);
  });
}

function renderMatrix() {
  matrixEl.innerHTML = '';
  const cols = services.length + 1;
  matrixEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const header = document.createElement('div');
  header.className = 'mrow';
  header.style.display = 'contents';
  const corner = document.createElement('div');
  corner.className = 'mcell header';
  corner.textContent = 'FROM↓ TO→';
  matrixEl.appendChild(corner);
  services.forEach(s => {
    const c = document.createElement('div');
    c.className = 'mcell header';
    c.textContent = s;
    matrixEl.appendChild(c);
  });
  services.forEach(from => {
    const label = document.createElement('div');
    label.className = 'mcell header';
    label.textContent = from;
    matrixEl.appendChild(label);
    services.forEach(to => {
      const c = document.createElement('div');
      if (from === to) {
        c.className = 'mcell';
        c.textContent = '—';
      } else {
        const dec = previewEvaluate(from, to);
        c.className = 'mcell ' + dec;
        c.textContent = dec === 'allow' ? '✓' : dec === 'deny' ? '✕' : '~';
      }
      matrixEl.appendChild(c);
    });
  });
}

function previewEvaluate(from, to) {
  for (const r of rules) if (matches(r, from, to)) return r.action;
  return 'deny';
}

function applyPolicy() {
  try {
    rules = parsePolicy(policyEl.value);
    statusEl.textContent = `✓ ${rules.length} rules loaded`;
    statusEl.className = 'ok';
    renderMatrix();
  } catch (e) {
    statusEl.textContent = e.message;
    statusEl.className = 'err';
  }
}

function tick() {
  const from = services[Math.floor(Math.random() * services.length)];
  let to = services[Math.floor(Math.random() * services.length)];
  while (to === from) to = services[Math.floor(Math.random() * services.length)];
  const res = evaluate(from, to);
  traffic.push({ from, to, decision: res.decision });
  if (traffic.length > 200) traffic.shift();
  renderTraffic();
}

document.getElementById('apply').onclick = applyPolicy;
applyPolicy();
setInterval(tick, 500);