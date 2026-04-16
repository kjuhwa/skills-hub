// ─── APM Suite — Trace Waterfall + Metrics Dashboard + Service Topology ───
// Zero-dependency, self-contained simulation
// Skills used: transaction-trace-pack-serialization-with-step-hierarchy,
//   baseline-historical-comparison-threshold, frozen-detection-consecutive-count,
//   measurement-grouping-combiner, eclipse-rcp-rich-client-for-apm-ui,
//   plugin-resource-provider-architecture, realtime-vs-polling-fallback

(() => {
'use strict';

// ╔══════════════════════════════════════════════════════════════╗
// ║  SHARED                                                      ║
// ╚══════════════════════════════════════════════════════════════╝

const SERVICES = [
  { id: 'api-gateway',   name: 'API Gateway',   color: '#6ee7b7' },
  { id: 'auth-svc',      name: 'Auth Service',  color: '#818cf8' },
  { id: 'user-svc',      name: 'User Service',  color: '#38bdf8' },
  { id: 'order-svc',     name: 'Order Service', color: '#fbbf24' },
  { id: 'payment-svc',   name: 'Payment Svc',   color: '#f87171' },
  { id: 'inventory-svc', name: 'Inventory Svc', color: '#a78bfa' },
  { id: 'notification',  name: 'Notification',  color: '#fb923c' },
  { id: 'postgres',      name: 'PostgreSQL',    color: '#94a3b8' },
  { id: 'redis',         name: 'Redis',         color: '#f472b6' },
  { id: 'kafka',         name: 'Kafka',         color: '#34d399' },
];

const svcMap = Object.fromEntries(SERVICES.map(s => [s.id, s]));
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const pick = arr => arr[randInt(0, arr.length)];
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function formatTime(d) {
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

// Clock
const clockEl = document.getElementById('clock');
setInterval(() => { clockEl.textContent = formatTime(new Date()); }, 1000);
clockEl.textContent = formatTime(new Date());

// Tab switching
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');
tabs.forEach(t => t.addEventListener('click', () => {
  tabs.forEach(x => x.classList.remove('active'));
  views.forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('view-' + t.dataset.view).classList.add('active');
  if (t.dataset.view === 'topology') resizeTopoCanvas();
}));

// ╔══════════════════════════════════════════════════════════════╗
// ║  1. TRACE WATERFALL                                          ║
// ╚══════════════════════════════════════════════════════════════╝

const traces = [];
let selectedSpan = null;

const TRACE_TEMPLATES = [
  {
    name: 'GET /api/users/:id',
    spans: [
      { svc: 'api-gateway', op: 'HTTP GET /api/users/:id', dur: [80, 200], children: [
        { svc: 'auth-svc', op: 'JWT.verify', dur: [5, 20], children: [] },
        { svc: 'user-svc', op: 'getUser', dur: [30, 100], children: [
          { svc: 'redis', op: 'GET user:cache', dur: [1, 5], children: [] },
          { svc: 'postgres', op: 'SELECT * FROM users', dur: [10, 60], children: [] },
        ]},
      ]},
    ],
  },
  {
    name: 'POST /api/orders',
    spans: [
      { svc: 'api-gateway', op: 'HTTP POST /api/orders', dur: [200, 600], children: [
        { svc: 'auth-svc', op: 'JWT.verify', dur: [5, 20], children: [] },
        { svc: 'order-svc', op: 'createOrder', dur: [100, 350], children: [
          { svc: 'inventory-svc', op: 'reserveStock', dur: [20, 80], children: [
            { svc: 'postgres', op: 'UPDATE inventory SET ...', dur: [8, 40], children: [] },
          ]},
          { svc: 'payment-svc', op: 'chargeCard', dur: [50, 200], children: [
            { svc: 'postgres', op: 'INSERT INTO payments', dur: [5, 30], children: [] },
          ]},
          { svc: 'kafka', op: 'produce order.created', dur: [2, 10], children: [] },
        ]},
        { svc: 'notification', op: 'sendConfirmation', dur: [30, 80], children: [
          { svc: 'kafka', op: 'produce email.send', dur: [2, 8], children: [] },
        ]},
      ]},
    ],
  },
  {
    name: 'GET /api/orders (list)',
    spans: [
      { svc: 'api-gateway', op: 'HTTP GET /api/orders', dur: [100, 300], children: [
        { svc: 'auth-svc', op: 'JWT.verify', dur: [4, 15], children: [] },
        { svc: 'order-svc', op: 'listOrders', dur: [60, 200], children: [
          { svc: 'redis', op: 'GET orders:page:cache', dur: [1, 4], children: [] },
          { svc: 'postgres', op: 'SELECT * FROM orders LIMIT 20', dur: [20, 120], children: [] },
        ]},
      ]},
    ],
  },
];

function generateTrace() {
  const template = pick(TRACE_TEMPLATES);
  const traceId = uid() + uid();
  const startTs = Date.now();
  const spans = [];
  const hasError = Math.random() < 0.2;
  const errorSpanDepth = hasError ? randInt(1, 4) : -1;

  function walk(node, parentId, offset, depth) {
    const spanId = uid();
    const duration = rand(node.dur[0], node.dur[1]);
    const isError = hasError && depth === errorSpanDepth && Math.random() < 0.5;
    const span = {
      spanId,
      parentId,
      traceId,
      service: node.svc,
      operation: node.op,
      startOffset: offset,
      duration,
      depth,
      status: isError ? 'ERROR' : 'OK',
      tags: {
        'service.name': svcMap[node.svc]?.name || node.svc,
        'span.kind': depth === 0 ? 'SERVER' : (node.svc === 'kafka' ? 'PRODUCER' : node.svc === 'postgres' || node.svc === 'redis' ? 'CLIENT' : 'SERVER'),
      },
    };
    if (isError) {
      span.tags['error'] = 'true';
      span.tags['error.message'] = pick(['Connection timeout', 'NullPointerException', '503 Service Unavailable', 'Deadline exceeded', 'PERMISSION_DENIED']);
      span.tags['http.status_code'] = pick(['500', '503', '504']);
    }
    if (node.op.startsWith('HTTP')) {
      span.tags['http.method'] = node.op.split(' ')[1] || 'GET';
      span.tags['http.url'] = node.op.split(' ').slice(2).join(' ') || '/';
      span.tags['http.status_code'] = span.tags['http.status_code'] || '200';
    }
    spans.push(span);

    let childOffset = offset + rand(1, duration * 0.15);
    for (const child of node.children) {
      walk(child, spanId, childOffset, depth + 1);
      childOffset += rand(child.dur[0], child.dur[1]) + rand(1, 10);
    }
  }

  walk(template.spans[0], null, 0, 0);

  const trace = {
    traceId,
    name: template.name,
    timestamp: startTs,
    spans,
    totalDuration: spans[0].duration,
    hasError: spans.some(s => s.status === 'ERROR'),
  };
  traces.unshift(trace);
  if (traces.length > 20) traces.pop();
  return trace;
}

function renderTraceList() {
  const sel = document.getElementById('traceSelect');
  sel.innerHTML = traces.map((t, i) =>
    `<option value="${i}">${t.hasError ? '[ERR] ' : ''}${t.name} — ${t.totalDuration.toFixed(0)}ms</option>`
  ).join('');
}

function renderWaterfall(trace) {
  const container = document.getElementById('waterfallContainer');
  container.innerHTML = '';
  const summary = document.getElementById('traceSummary');
  summary.textContent = `Trace ${trace.traceId.slice(0, 8)}… · ${trace.spans.length} spans · ${trace.totalDuration.toFixed(1)}ms`;

  const totalDur = trace.totalDuration;

  trace.spans.forEach(span => {
    const row = document.createElement('div');
    row.className = 'span-row' + (span.status === 'ERROR' ? ' error' : '');
    row.dataset.spanId = span.spanId;

    const indent = span.depth * 16;
    const svc = svcMap[span.service] || { name: span.service, color: '#94a3b8' };

    row.innerHTML = `
      <div class="span-label" style="padding-left:${8 + indent}px">
        <span class="svc" style="color:${svc.color}">${svc.name}</span>
        <span class="op">${span.operation.replace(svc.name, '').trim()}</span>
      </div>
      <div class="span-timing">
        <div class="span-bar" style="
          left:${(span.startOffset / totalDur * 100).toFixed(2)}%;
          width:${Math.max(0.5, span.duration / totalDur * 100).toFixed(2)}%;
          background:${svc.color}${span.status === 'ERROR' ? '' : '99'};
        "></div>
      </div>
      <div class="span-duration">${span.duration.toFixed(1)}ms</div>
    `;

    row.addEventListener('click', () => selectSpan(span, trace));
    container.appendChild(row);
  });
}

function selectSpan(span, trace) {
  selectedSpan = span;
  document.querySelectorAll('.span-row').forEach(r =>
    r.classList.toggle('selected', r.dataset.spanId === span.spanId));

  const panel = document.getElementById('spanDetail');
  const body = document.getElementById('spanDetailBody');
  panel.classList.add('open');

  const svc = svcMap[span.service] || { name: span.service, color: '#999' };
  let html = `
    <div class="kv"><span class="k">Service</span><span class="v" style="color:${svc.color}">${svc.name}</span></div>
    <div class="kv"><span class="k">Operation</span><span class="v">${span.operation}</span></div>
    <div class="kv"><span class="k">Span ID</span><span class="v">${span.spanId}</span></div>
    <div class="kv"><span class="k">Parent</span><span class="v">${span.parentId || '(root)'}</span></div>
    <div class="kv"><span class="k">Duration</span><span class="v">${span.duration.toFixed(2)}ms</span></div>
    <div class="kv"><span class="k">Offset</span><span class="v">${span.startOffset.toFixed(2)}ms</span></div>
    <div class="kv"><span class="k">Status</span><span class="v ${span.status === 'ERROR' ? 'tag-error' : ''}">${span.status}</span></div>
  `;

  html += '<div class="section-title">Tags</div>';
  for (const [k, v] of Object.entries(span.tags)) {
    const cls = k.startsWith('error') ? 'tag-error' : '';
    html += `<div class="kv"><span class="k">${k}</span><span class="v ${cls}">${v}</span></div>`;
  }

  // Show child count
  const children = trace.spans.filter(s => s.parentId === span.spanId);
  if (children.length > 0) {
    html += '<div class="section-title">Children</div>';
    children.forEach(c => {
      const cs = svcMap[c.service] || { name: c.service, color: '#999' };
      html += `<div class="kv"><span class="k" style="color:${cs.color}">${cs.name}</span><span class="v">${c.duration.toFixed(1)}ms</span></div>`;
    });
  }

  body.innerHTML = html;
}

document.getElementById('btnNewTrace').addEventListener('click', () => {
  const trace = generateTrace();
  renderTraceList();
  renderWaterfall(trace);
});

document.getElementById('traceSelect').addEventListener('change', (e) => {
  const trace = traces[parseInt(e.target.value)];
  if (trace) renderWaterfall(trace);
});

// Generate initial traces
for (let i = 0; i < 5; i++) generateTrace();
renderTraceList();
renderWaterfall(traces[0]);


// ╔══════════════════════════════════════════════════════════════╗
// ║  2. METRICS DASHBOARD                                        ║
// ╚══════════════════════════════════════════════════════════════╝

const MAX_POINTS = 120;

const metricsState = {
  latency:    { data: [], baseline: [], threshold: 300, current: 0 },
  throughput: { data: [], baseline: [], threshold: 100, current: 0, invertAlert: true },
  error:      { data: [], baseline: [], threshold: 5, current: 0 },
  saturation: { data: [], baseline: [], threshold: 85, current: 0, frozenCount: 0, lastVal: -1 },
};

// Initialize baselines (historical "normal" pattern)
function initBaselines() {
  for (let i = 0; i < MAX_POINTS; i++) {
    metricsState.latency.baseline.push(rand(40, 80));
    metricsState.throughput.baseline.push(rand(150, 250));
    metricsState.error.baseline.push(rand(0.2, 1.5));
    metricsState.saturation.baseline.push(rand(30, 50));
  }
}
initBaselines();

// Simulated metric with occasional anomalies
let anomalyPhase = 0;
function simulateMetrics() {
  const t = Date.now() / 1000;
  anomalyPhase += 0.01;
  const anomaly = Math.sin(anomalyPhase) > 0.85;

  const lat = anomaly ? rand(200, 500) : rand(30, 100) + Math.sin(t / 10) * 20;
  const thr = anomaly ? rand(30, 60) : rand(140, 260) + Math.cos(t / 8) * 30;
  const err = anomaly ? rand(3, 12) : rand(0.1, 2) + Math.abs(Math.sin(t / 15)) * 0.5;
  const sat = anomaly ? rand(70, 95) : rand(25, 55) + Math.sin(t / 12) * 10;

  pushMetric('latency', lat);
  pushMetric('throughput', thr);
  pushMetric('error', err);
  pushMetric('saturation', sat);
}

function pushMetric(key, val) {
  const m = metricsState[key];
  m.data.push(val);
  if (m.data.length > MAX_POINTS) m.data.shift();
  m.current = val;

  // Frozen detection (saturation only) — per frozen-detection-consecutive-count skill
  if (key === 'saturation') {
    if (Math.abs(val - m.lastVal) < 0.5 && m.lastVal >= 0) {
      m.frozenCount++;
    } else {
      m.frozenCount = 0;
    }
    m.lastVal = val;
  }
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * p / 100) - 1;
  return sorted[Math.max(0, idx)];
}

function drawChart(canvasId, data, baseline, threshold, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 8, right: 8, bottom: 20, left: 45 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  if (data.length < 2) return;

  const allVals = [...data, ...baseline.slice(0, data.length), threshold];
  const minV = Math.min(...allVals) * 0.8;
  const maxV = Math.max(...allVals) * 1.15;
  const rangeV = maxV - minV || 1;

  const toX = i => pad.left + (i / (MAX_POINTS - 1)) * cw;
  const toY = v => pad.top + ch - ((v - minV) / rangeV) * ch;

  // Grid lines
  ctx.strokeStyle = '#2e334422';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = pad.top + (ch / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    const val = maxV - (i / 4) * rangeV;
    ctx.fillStyle = '#8892a8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(opts.decimals ?? 0), pad.left - 6, y + 3);
  }

  // Baseline band (if enabled)
  if (document.getElementById('toggleBaseline')?.checked && baseline.length >= data.length) {
    ctx.fillStyle = '#818cf820';
    ctx.beginPath();
    const startIdx = MAX_POINTS - data.length;
    for (let i = 0; i < data.length; i++) {
      const x = toX(startIdx + i);
      const yHi = toY(baseline[i] * 1.25);
      if (i === 0) ctx.moveTo(x, yHi); else ctx.lineTo(x, yHi);
    }
    for (let i = data.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(startIdx + i), toY(baseline[i] * 0.75));
    }
    ctx.closePath();
    ctx.fill();
  }

  // Threshold line
  if (document.getElementById('toggleAlerts')?.checked) {
    const ty = toY(threshold);
    ctx.strokeStyle = '#f8717188';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, ty); ctx.lineTo(W - pad.right, ty); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f87171';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('threshold', W - pad.right - 48, ty - 4);
  }

  // Data line
  const startIdx = MAX_POINTS - data.length;
  ctx.strokeStyle = opts.color || '#6ee7b7';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = toX(startIdx + i);
    const y = toY(data[i]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill under line
  const lastX = toX(startIdx + data.length - 1);
  ctx.lineTo(lastX, pad.top + ch);
  ctx.lineTo(toX(startIdx), pad.top + ch);
  ctx.closePath();
  ctx.fillStyle = (opts.color || '#6ee7b7') + '15';
  ctx.fill();

  // Current dot
  if (data.length > 0) {
    const cx = toX(startIdx + data.length - 1);
    const cy = toY(data[data.length - 1]);
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = opts.color || '#6ee7b7';
    ctx.fill();
  }
}

function updateMetricsUI() {
  const m = metricsState;
  const alertsOn = document.getElementById('toggleAlerts')?.checked;

  // Values
  document.getElementById('latencyValue').textContent = m.latency.current.toFixed(0);
  document.getElementById('throughputValue').textContent = m.throughput.current.toFixed(0);
  document.getElementById('errorValue').textContent = m.error.current.toFixed(2);
  document.getElementById('saturationValue').textContent = m.saturation.current.toFixed(1);

  // Percentiles
  if (m.latency.data.length > 5) {
    document.getElementById('latP50').textContent = percentile(m.latency.data, 50).toFixed(0);
    document.getElementById('latP95').textContent = percentile(m.latency.data, 95).toFixed(0);
    document.getElementById('latP99').textContent = percentile(m.latency.data, 99).toFixed(0);
  }

  // Alerts — baseline-historical-comparison-threshold pattern
  function checkAlert(key, elId, cardIdx) {
    const badge = document.getElementById(elId);
    const card = document.querySelectorAll('.metric-card')[cardIdx];
    const breached = m[key].invertAlert ? m[key].current < m[key].threshold : m[key].current > m[key].threshold;
    if (alertsOn && breached) {
      badge.classList.remove('hidden');
      card.classList.add('alert-active');
    } else {
      badge.classList.add('hidden');
      card.classList.remove('alert-active');
    }
  }
  checkAlert('latency', 'latencyAlert', 0);
  checkAlert('throughput', 'throughputAlert', 1);
  checkAlert('error', 'errorAlert', 2);

  // Frozen detection — frozen-detection-consecutive-count pattern
  const frozenBadge = document.getElementById('frozenBadge');
  if (m.saturation.frozenCount >= 5) {
    frozenBadge.classList.remove('hidden');
  } else {
    frozenBadge.classList.add('hidden');
  }

  // Charts
  drawChart('chartLatency', m.latency.data, m.latency.baseline, m.latency.threshold, { color: '#6ee7b7' });
  drawChart('chartThroughput', m.throughput.data, m.throughput.baseline, m.throughput.threshold, { color: '#818cf8' });
  drawChart('chartError', m.error.data, m.error.baseline, m.error.threshold, { color: '#f87171', decimals: 2 });
  drawChart('chartSaturation', m.saturation.data, m.saturation.baseline, m.saturation.threshold, { color: '#38bdf8', decimals: 1 });
}

// Start metrics simulation
setInterval(() => {
  simulateMetrics();
  updateMetricsUI();
}, 1000);

// Populate service filter
const sf = document.getElementById('serviceFilter');
SERVICES.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.name;
  sf.appendChild(opt);
});


// ╔══════════════════════════════════════════════════════════════╗
// ║  3. SERVICE TOPOLOGY MAP                                     ║
// ╚══════════════════════════════════════════════════════════════╝

const EDGES = [
  { from: 'api-gateway', to: 'auth-svc',      latency: [2, 15] },
  { from: 'api-gateway', to: 'user-svc',      latency: [5, 25] },
  { from: 'api-gateway', to: 'order-svc',     latency: [8, 40] },
  { from: 'user-svc',    to: 'redis',         latency: [1, 3] },
  { from: 'user-svc',    to: 'postgres',      latency: [5, 30] },
  { from: 'order-svc',   to: 'inventory-svc', latency: [10, 50] },
  { from: 'order-svc',   to: 'payment-svc',   latency: [20, 80] },
  { from: 'order-svc',   to: 'kafka',         latency: [1, 5] },
  { from: 'inventory-svc', to: 'postgres',    latency: [5, 25] },
  { from: 'payment-svc', to: 'postgres',      latency: [5, 20] },
  { from: 'notification', to: 'kafka',        latency: [1, 4] },
  { from: 'api-gateway', to: 'notification',  latency: [3, 15] },
];

const NODE_POSITIONS = {
  'api-gateway':   { x: 0.15, y: 0.5 },
  'auth-svc':      { x: 0.32, y: 0.15 },
  'user-svc':      { x: 0.38, y: 0.42 },
  'order-svc':     { x: 0.38, y: 0.7 },
  'payment-svc':   { x: 0.58, y: 0.82 },
  'inventory-svc': { x: 0.58, y: 0.58 },
  'notification':  { x: 0.32, y: 0.9 },
  'postgres':      { x: 0.78, y: 0.5 },
  'redis':         { x: 0.58, y: 0.22 },
  'kafka':         { x: 0.78, y: 0.82 },
};

// Node states (simulated)
const nodeStates = {};
SERVICES.forEach(s => {
  nodeStates[s.id] = {
    health: 'healthy', // healthy | degraded | unhealthy
    rps: rand(50, 300),
    latency: rand(5, 80),
    errorRate: rand(0, 2),
    cpu: rand(10, 60),
    mem: rand(30, 70),
  };
});

// Traffic particles
const particles = [];

function spawnParticle(edge) {
  particles.push({
    edge,
    progress: 0,
    speed: rand(0.005, 0.015),
    isError: Math.random() < 0.08,
  });
}

// Canvas setup
const topoCanvas = document.getElementById('topoCanvas');
const topoCtx = topoCanvas.getContext('2d');
let draggingNode = null;
let hoveredNode = null;

function resizeTopoCanvas() {
  const rect = topoCanvas.parentElement.getBoundingClientRect();
  topoCanvas.width = rect.width;
  topoCanvas.height = rect.height - 44;
}
resizeTopoCanvas();
window.addEventListener('resize', resizeTopoCanvas);

function getNodePos(id) {
  const p = NODE_POSITIONS[id];
  return { x: p.x * topoCanvas.width, y: p.y * topoCanvas.height };
}

function drawTopology() {
  const ctx = topoCtx;
  const W = topoCanvas.width;
  const H = topoCanvas.height;
  ctx.clearRect(0, 0, W, H);

  const showTraffic = document.getElementById('toggleTraffic')?.checked;
  const showErrors = document.getElementById('toggleErrors')?.checked;

  // Draw edges
  EDGES.forEach(edge => {
    const from = getNodePos(edge.from);
    const to = getNodePos(edge.to);

    ctx.strokeStyle = '#2e334466';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Latency label at midpoint
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const lat = rand(edge.latency[0], edge.latency[1]);
    ctx.fillStyle = '#8892a866';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${lat.toFixed(0)}ms`, mx, my - 5);
  });

  // Draw particles
  if (showTraffic) {
    particles.forEach(p => {
      const from = getNodePos(p.edge.from);
      const to = getNodePos(p.edge.to);
      const x = from.x + (to.x - from.x) * p.progress;
      const y = from.y + (to.y - from.y) * p.progress;

      ctx.beginPath();
      ctx.arc(x, y, p.isError && showErrors ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.isError && showErrors ? '#f87171' : '#6ee7b788';
      ctx.fill();
    });
  }

  // Draw nodes
  SERVICES.forEach(svc => {
    const pos = getNodePos(svc.id);
    const state = nodeStates[svc.id];
    const isHovered = hoveredNode === svc.id;
    const radius = isHovered ? 28 : 24;

    // Glow for unhealthy
    if (state.health === 'unhealthy') {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f8717130';
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#232733' : '#1a1d27';
    ctx.strokeStyle = state.health === 'unhealthy' ? '#f87171' :
                      state.health === 'degraded' ? '#fbbf24' : svc.color;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.fill();
    ctx.stroke();

    // Health dot
    const dotColor = state.health === 'unhealthy' ? '#f87171' :
                     state.health === 'degraded' ? '#fbbf24' : '#6ee7b7';
    ctx.beginPath();
    ctx.arc(pos.x + radius - 4, pos.y - radius + 4, 5, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();

    // Icon letter
    ctx.fillStyle = svc.color;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(svc.name[0], pos.x, pos.y);

    // Label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(svc.name, pos.x, pos.y + radius + 6);
  });
}

// Update simulation
function updateTopology() {
  // Simulate health changes
  SERVICES.forEach(svc => {
    const state = nodeStates[svc.id];
    const r = Math.random();
    if (r < 0.01) state.health = 'unhealthy';
    else if (r < 0.04) state.health = 'degraded';
    else if (r < 0.15) state.health = 'healthy';

    state.rps = clamp(state.rps + rand(-10, 10), 10, 500);
    state.latency = clamp(state.latency + rand(-5, 5), 1, 200);
    state.errorRate = clamp(state.errorRate + rand(-0.3, 0.3), 0, 15);
    state.cpu = clamp(state.cpu + rand(-3, 3), 5, 98);
    state.mem = clamp(state.mem + rand(-2, 2), 10, 95);
  });

  // Spawn particles
  if (document.getElementById('toggleTraffic')?.checked) {
    EDGES.forEach(edge => {
      if (Math.random() < 0.15) spawnParticle(edge);
    });
  }

  // Move particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].progress += particles[i].speed;
    if (particles[i].progress >= 1) particles.splice(i, 1);
  }
}

// Topo mouse interaction
topoCanvas.addEventListener('mousemove', (e) => {
  const rect = topoCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  hoveredNode = null;
  for (const svc of SERVICES) {
    const pos = getNodePos(svc.id);
    const dx = mx - pos.x;
    const dy = my - pos.y;
    if (dx * dx + dy * dy < 28 * 28) {
      hoveredNode = svc.id;
      topoCanvas.style.cursor = 'pointer';
      break;
    }
  }
  if (!hoveredNode) topoCanvas.style.cursor = 'grab';

  if (draggingNode) {
    NODE_POSITIONS[draggingNode].x = mx / topoCanvas.width;
    NODE_POSITIONS[draggingNode].y = my / topoCanvas.height;
  }
});

topoCanvas.addEventListener('mousedown', () => {
  if (hoveredNode) draggingNode = hoveredNode;
});

topoCanvas.addEventListener('mouseup', () => {
  if (draggingNode && !hoveredNode) draggingNode = null;
  if (draggingNode) {
    showNodeDetail(draggingNode);
    draggingNode = null;
  }
});

topoCanvas.addEventListener('click', () => {
  if (hoveredNode) showNodeDetail(hoveredNode);
});

function showNodeDetail(id) {
  const svc = svcMap[id];
  const state = nodeStates[id];
  const panel = document.getElementById('topoDetail');
  const title = document.getElementById('topoDetailTitle');
  const body = document.getElementById('topoDetailBody');

  panel.classList.add('open');
  title.textContent = svc.name;
  title.style.color = svc.color;

  const healthColor = state.health === 'unhealthy' ? '#f87171' :
                      state.health === 'degraded' ? '#fbbf24' : '#6ee7b7';

  const inEdges = EDGES.filter(e => e.to === id);
  const outEdges = EDGES.filter(e => e.from === id);

  let html = `
    <div class="kv"><span class="k">Health</span><span class="v" style="color:${healthColor}">${state.health.toUpperCase()}</span></div>
    <div class="kv"><span class="k">Requests/sec</span><span class="v">${state.rps.toFixed(0)}</span></div>
    <div class="kv"><span class="k">Avg Latency</span><span class="v">${state.latency.toFixed(1)}ms</span></div>
    <div class="kv"><span class="k">Error Rate</span><span class="v">${state.errorRate.toFixed(2)}%</span></div>
    <div class="kv"><span class="k">CPU</span><span class="v">${state.cpu.toFixed(1)}%</span></div>
    <div class="kv"><span class="k">Memory</span><span class="v">${state.mem.toFixed(1)}%</span></div>
  `;

  if (inEdges.length) {
    html += '<div class="section-title">Inbound From</div>';
    inEdges.forEach(e => {
      const s = svcMap[e.from];
      html += `<div class="kv"><span class="k" style="color:${s.color}">${s.name}</span><span class="v">${rand(e.latency[0], e.latency[1]).toFixed(0)}ms</span></div>`;
    });
  }
  if (outEdges.length) {
    html += '<div class="section-title">Outbound To</div>';
    outEdges.forEach(e => {
      const s = svcMap[e.to];
      html += `<div class="kv"><span class="k" style="color:${s.color}">${s.name}</span><span class="v">${rand(e.latency[0], e.latency[1]).toFixed(0)}ms</span></div>`;
    });
  }

  body.innerHTML = html;
}

document.getElementById('btnResetLayout').addEventListener('click', () => {
  const defaults = {
    'api-gateway':   { x: 0.15, y: 0.5 },
    'auth-svc':      { x: 0.32, y: 0.15 },
    'user-svc':      { x: 0.38, y: 0.42 },
    'order-svc':     { x: 0.38, y: 0.7 },
    'payment-svc':   { x: 0.58, y: 0.82 },
    'inventory-svc': { x: 0.58, y: 0.58 },
    'notification':  { x: 0.32, y: 0.9 },
    'postgres':      { x: 0.78, y: 0.5 },
    'redis':         { x: 0.58, y: 0.22 },
    'kafka':         { x: 0.78, y: 0.82 },
  };
  Object.assign(NODE_POSITIONS, defaults);
});

// Close detail panels on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.span-detail-panel') && !e.target.closest('.span-row') && !e.target.closest('.topo-detail-panel') && !e.target.closest('#topoCanvas')) {
    document.getElementById('spanDetail').classList.remove('open');
    document.getElementById('topoDetail').classList.remove('open');
  }
});

// Main animation loop for topology
function topoLoop() {
  updateTopology();
  drawTopology();
  requestAnimationFrame(topoLoop);
}
topoLoop();

})();
