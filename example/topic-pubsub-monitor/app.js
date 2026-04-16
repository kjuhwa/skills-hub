const topics = {
  'orders.created': { subs: 4, events: [], history: [] },
  'orders.shipped': { subs: 2, events: [], history: [] },
  'auth.login': { subs: 6, events: [], history: [] },
  'metrics.cpu': { subs: 1, events: [], history: [] },
  'errors.api': { subs: 3, events: [], history: [] }
};
const samplePayloads = {
  'orders.created': () => `{ orderId: ${rid()}, total: $${(Math.random()*200).toFixed(2)} }`,
  'orders.shipped': () => `{ orderId: ${rid()}, carrier: "FedEx" }`,
  'auth.login': () => `{ userId: ${rid()}, ip: "10.0.${ri(0,255)}.${ri(0,255)}" }`,
  'metrics.cpu': () => `{ host: "node-${ri(1,12)}", cpu: ${ri(20,95)}% }`,
  'errors.api': () => `{ code: 5${ri(0,9)}${ri(0,9)}, route: "/api/v1/${pick(['users','orders','auth'])}" }`
};
let current = 'orders.created';

function rid() { return Math.floor(Math.random() * 99999); }
function ri(a, b) { return Math.floor(Math.random() * (b-a+1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function publish(name) {
  const t = topics[name];
  if (!t) return;
  const evt = {
    time: new Date().toLocaleTimeString(),
    payload: (samplePayloads[name] || (() => '{}'))(),
    ts: Date.now()
  };
  t.events.unshift(evt);
  if (t.events.length > 80) t.events.pop();
  if (name === current) renderFeed();
  renderTopics();
}

function renderTopics() {
  const list = document.getElementById('topicList');
  list.innerHTML = '';
  Object.entries(topics).forEach(([name, t]) => {
    const div = document.createElement('div');
    div.className = 'topic' + (name === current ? ' active' : '');
    div.innerHTML = `<span>${name}</span><span class="badge">${t.events.length}</span>`;
    div.onclick = () => { current = name; renderAll(); };
    list.appendChild(div);
  });
}

function renderFeed() {
  const t = topics[current];
  if (!t) return;
  document.getElementById('currentTopic').textContent = current;
  document.getElementById('subCount').textContent = t.subs;
  document.getElementById('totalCount').textContent = t.events.length;
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  t.events.slice(0, 30).forEach(e => {
    const d = document.createElement('div');
    d.className = 'event';
    d.innerHTML = `<time>${e.time}</time><span class="payload">${escapeHtml(e.payload)}</span>`;
    feed.appendChild(d);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function renderChart() {
  const t = topics[current]; if (!t) return;
  const svg = document.getElementById('chart');
  const points = t.history.slice(-30);
  const max = Math.max(1, ...points);
  const w = 600, h = 200, pad = 20;
  const sw = (w - pad*2) / Math.max(1, points.length - 1);
  let path = '';
  points.forEach((v, i) => {
    const x = pad + i * sw;
    const y = h - pad - (v / max) * (h - pad*2);
    path += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
  });
  let bars = '';
  points.forEach((v, i) => {
    const x = pad + i * sw - 2;
    const bh = (v / max) * (h - pad*2);
    bars += `<rect x="${x}" y="${h-pad-bh}" width="4" height="${bh}" fill="#6ee7b7" opacity="0.3"/>`;
  });
  svg.innerHTML = `
    <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#262a36"/>
    ${bars}
    <path d="${path}" stroke="#6ee7b7" stroke-width="2" fill="none"/>
    <text x="${pad}" y="14" fill="#7a8198" font-size="10">events / tick (max ${max})</text>
  `;
  const rate = t.history.slice(-5).reduce((a,b) => a+b, 0);
  document.getElementById('rate').textContent = rate + '/s';
}

function renderAll() { renderTopics(); renderFeed(); renderChart(); }

document.getElementById('publishRandom').onclick = () => {
  const names = Object.keys(topics);
  publish(names[Math.floor(Math.random() * names.length)]);
};
document.getElementById('addTopic').onclick = () => {
  const v = document.getElementById('newTopic').value.trim();
  if (v && !topics[v]) {
    topics[v] = { subs: ri(1,5), events: [], history: [] };
    document.getElementById('newTopic').value = '';
    current = v; renderAll();
  }
};

// auto traffic
setInterval(() => {
  Object.keys(topics).forEach(n => {
    if (Math.random() < 0.5) publish(n);
  });
}, 1200);

// per-second history sampling
setInterval(() => {
  Object.entries(topics).forEach(([n, t]) => {
    const last = t._lastCount || 0;
    const delta = t.events.length - last;
    t.history.push(Math.max(0, delta));
    if (t.history.length > 60) t.history.shift();
    t._lastCount = t.events.length;
  });
  renderChart();
}, 1000);

renderAll();