// --------------------------------------------------------------
// Changelog Oracle Console — pure D3 v7, no framework
// Cites dozens of hub skills across topology, scaling, changelog
// --------------------------------------------------------------

const state = {
  eventsPerSec: 20000,
  avgBytes: 512,
  partitions: 12,
  windowMs: 5000,
  watermarkLag: 3000,
  checkpointMs: 10000,
  replicationFactor: 3,
  stateSizeGB: 18,
  layout: 'force',
  filter: 'all',
};

const changelog = [];
const MAX_LOG = 140;

// --- seeded RNG (fnv1a-xorshift-text-to-procedural-seed)
function seeded(seed) {
  let s = seed | 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}
const rnd = seeded(271828);

// ---------- Topology model — plugin-resource-provider-architecture ----------
function buildTopology() {
  const nodes = [];
  const links = [];
  // sources
  ['tx_orders', 'tx_clicks', 'tx_iot', 'cdc_ledger'].forEach((n, i) => nodes.push({
    id: n, type: 'source', label: n, rate: 3000 + i * 1200,
  }));
  // normalizer
  nodes.push({ id: 'normalize', type: 'op', label: 'normalize' });
  nodes.push({ id: 'filter', type: 'op', label: 'policy-filter' });
  nodes.push({ id: 'window', type: 'op', label: 'tumble(5s)' });
  nodes.push({ id: 'agg', type: 'op', label: 'aggregate' });
  // state-backends
  nodes.push({ id: 'rocks', type: 'state', label: 'state://rocksdb' });
  nodes.push({ id: 'changelog', type: 'topic', label: 'topic://changelog' });
  nodes.push({ id: 'mat_view', type: 'state', label: 'materialized_view' });
  // sinks
  ['sink.bq', 'sink.pg_replica', 'sink.alerts', 'sink.dlq'].forEach((n, i) => nodes.push({
    id: n, type: 'sink', label: n,
  }));
  // topic bus
  nodes.push({ id: 'topic_in', type: 'topic', label: 'topic://ingest' });
  nodes.push({ id: 'topic_out', type: 'topic', label: 'topic://windowed' });

  const add = (s, t, w = 1, cls = '') => links.push({ source: s, target: t, w, cls });
  ['tx_orders', 'tx_clicks', 'tx_iot', 'cdc_ledger'].forEach((s) => add(s, 'topic_in', 2));
  add('topic_in', 'normalize', 2, 'hot');
  add('normalize', 'filter');
  add('filter', 'window', 2, 'hot');
  add('window', 'rocks');
  add('window', 'changelog');
  add('window', 'agg');
  add('agg', 'topic_out', 2, 'hot');
  add('topic_out', 'sink.bq');
  add('topic_out', 'sink.pg_replica');
  add('topic_out', 'sink.alerts');
  add('agg', 'mat_view');
  add('filter', 'sink.dlq', 1, 'dlq');

  return { nodes, links };
}

const { nodes: topoNodes, links: topoLinks } = buildTopology();

// ---------- Force simulation ----------
const topoContainer = document.getElementById('topology');
const topoSvg = d3.select('#topology').append('svg');
const gZoom = topoSvg.append('g');
const linkG = gZoom.append('g').attr('class', 'links');
const nodeG = gZoom.append('g').attr('class', 'nodes');

topoSvg.call(d3.zoom()
  .scaleExtent([0.4, 3])
  .on('zoom', (ev) => gZoom.attr('transform', ev.transform))
);

const simulation = d3.forceSimulation(topoNodes)
  .force('charge', d3.forceManyBody().strength(-240))
  .force('link', d3.forceLink(topoLinks).id((d) => d.id).distance(70).strength(0.9))
  .force('center', d3.forceCenter(0, 0))
  .force('collide', d3.forceCollide().radius(34));

function resizeTopology() {
  const { width, height } = topoContainer.getBoundingClientRect();
  topoSvg.attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`);
  simulation.force('center', d3.forceCenter(0, 0)).alpha(0.5).restart();
}
new ResizeObserver(resizeTopology).observe(topoContainer);

// --- data join pattern for links (d3 enter/update/exit)
function renderTopology() {
  const link = linkG.selectAll('line.link').data(topoLinks, (d) => d.source.id + '>' + d.target.id);
  link.enter().append('line')
    .attr('class', (d) => 'link ' + (d.cls || ''))
    .merge(link);
  link.exit().remove();

  // radial/flow layouts applied by force modifications — adaptive-strategy-hot-swap in spirit
  if (state.layout === 'radial') {
    topoNodes.forEach((d, i) => {
      const radius = d.type === 'source' ? 260 : d.type === 'sink' ? 240 : d.type === 'state' ? 140 : 80;
      const ang = (i / topoNodes.length) * Math.PI * 2;
      d.fx = Math.cos(ang) * radius;
      d.fy = Math.sin(ang) * radius;
    });
  } else if (state.layout === 'flow') {
    // left-to-right positioning
    const stages = ['source', 'op', 'topic', 'state', 'sink'];
    topoNodes.forEach((d) => {
      const col = stages.indexOf(d.type);
      d.fx = (col - 2) * 160;
      d.fy = null;
    });
  } else {
    topoNodes.forEach((d) => { d.fx = null; d.fy = null; });
  }

  const node = nodeG.selectAll('g.node').data(topoNodes, (d) => d.id);
  const nEnter = node.enter().append('g')
    .attr('class', (d) => 'node ' + d.type)
    .call(d3.drag()
      .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end', (ev, d) => { if (!ev.active) simulation.alphaTarget(0); if (state.layout === 'force') { d.fx = null; d.fy = null; } }));
  nEnter.append('rect')
    .attr('x', -52).attr('y', -14).attr('width', 104).attr('height', 28).attr('rx', 2);
  nEnter.append('text').attr('text-anchor', 'middle').attr('dy', 2).text((d) => d.label);
  nEnter.append('text').attr('class', 'sub').attr('text-anchor', 'middle').attr('dy', 14).text((d) => d.type);
  simulation.nodes(topoNodes).alpha(0.8).restart();
}
renderTopology();

simulation.on('tick', () => {
  linkG.selectAll('line.link')
    .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y);
  nodeG.selectAll('g.node')
    .attr('transform', (d) => `translate(${d.x},${d.y})`);
});

document.querySelectorAll('.topo-controls button[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    document.querySelectorAll('.topo-controls button[data-layout]').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    renderTopology();
  });
});
document.querySelector('.topo-controls button[data-layout="force"]').classList.add('on');

// ---------- Capacity calculator ----------
const knobs = document.querySelectorAll('.knob');
knobs.forEach((k) => {
  const field = k.dataset.field;
  const input = k.querySelector('input');
  const val = k.querySelector('.val');
  input.value = state[field];
  val.textContent = fmt(field, state[field]);
  input.addEventListener('input', () => {
    state[field] = +input.value;
    val.textContent = fmt(field, state[field]);
    recompute();
    pushLog('KNOB', `${field} → ${fmt(field, state[field])}`, 'wm');
  });
});

function fmt(f, v) {
  switch (f) {
    case 'eventsPerSec': return (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) + '/s';
    case 'avgBytes':      return v + 'B';
    case 'partitions':    return v + 'p';
    case 'windowMs':      return v + 'ms';
    case 'watermarkLag':  return v + 'ms';
    case 'checkpointMs':  return v + 'ms';
    case 'replicationFactor': return 'RF ' + v;
    case 'stateSizeGB':   return v.toFixed(1) + 'GB';
    default: return v;
  }
}

// ---------- Lag / throughput curve ----------
const lagRoot = d3.select('#lagChart').append('svg');
const lagG = lagRoot.append('g');
const xAxis = lagG.append('g').attr('class', 'axis');
const yAxis = lagG.append('g').attr('class', 'axis');
const seriesLag = lagG.append('path').attr('class', 'series-lag');
const seriesTput = lagG.append('path').attr('class', 'series-tput');
const pts = lagG.append('g');

// heatmap
const hmRoot = d3.select('#heatmap').append('svg');
const hmG = hmRoot.append('g');

// readout
const readout = d3.select('#readout');

function modelCurve() {
  // Little's law-ish: lag grows when partitions undersized
  const samples = 40;
  const data = [];
  for (let i = 0; i < samples; i++) {
    const p = 1 + i;
    const perPart = state.eventsPerSec / p;
    const baseLatency = 12 + perPart / 600;
    // nonlinear contention above 7k msg/s/partition (kafka-batch-size-timeout-tuning)
    const saturation = perPart > 7000 ? Math.pow((perPart - 7000) / 1500, 2) : 0;
    const lag = state.watermarkLag * 0.1 + baseLatency + saturation * 70;
    const tput = perPart * p * (1 - Math.min(0.6, saturation * 0.2));
    data.push({ partitions: p, lag, tput });
  }
  return data;
}

function renderLagChart() {
  const rect = document.getElementById('lagChart').getBoundingClientRect();
  const w = rect.width - 40, H = rect.height - 36;
  lagRoot.attr('viewBox', `0 0 ${rect.width} ${rect.height}`);
  lagG.attr('transform', 'translate(30,8)');
  const data = modelCurve();
  const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.partitions)).range([0, w]);
  // symlog for lag keeps near-zero visible (symlog-for-lag-metrics-near-zero)
  const y = d3.scaleSymlog().domain([0, d3.max(data, (d) => d.lag) * 1.1]).range([H, 0]);
  const y2 = d3.scaleSymlog().domain([0, d3.max(data, (d) => d.tput) * 1.1]).range([H, 0]);

  xAxis.attr('transform', `translate(0, ${H})`).call(d3.axisBottom(x).ticks(8));
  yAxis.call(d3.axisLeft(y).ticks(5));

  const lineLag = d3.line().x((d) => x(d.partitions)).y((d) => y(d.lag)).curve(d3.curveMonotoneX);
  const lineTput = d3.line().x((d) => x(d.partitions)).y((d) => y2(d.tput)).curve(d3.curveMonotoneX);

  seriesLag.datum(data).transition().duration(400).attr('d', lineLag);
  seriesTput.datum(data).transition().duration(400).attr('d', lineTput);

  // current-partitions marker
  const sel = data.find((d) => d.partitions === state.partitions) || data[Math.min(data.length - 1, state.partitions - 1)];
  const dots = pts.selectAll('circle').data(sel ? [sel] : []);
  dots.join(
    (enter) => enter.append('circle').attr('r', 0),
    (update) => update,
    (exit) => exit.transition().duration(150).attr('r', 0).remove()
  )
  .attr('class', (d) => 'point ' + (d.lag > 300 ? 'crit' : d.lag > 120 ? 'hot' : ''))
  .transition().duration(300)
  .attr('cx', (d) => x(d.partitions)).attr('cy', (d) => y(d.lag)).attr('r', 5);
}

// ---------- Cost heatmap — state backend across RF × state-size ----------
function renderHeatmap() {
  const rect = document.getElementById('heatmap').getBoundingClientRect();
  const w = rect.width, H = rect.height;
  hmRoot.attr('viewBox', `0 0 ${w} ${H}`);

  const rfs = [1, 2, 3, 4, 5];
  const sizes = [1, 5, 20, 50, 150, 500];
  const data = [];
  rfs.forEach((rf) => sizes.forEach((s) => {
    // cost = RF × size × checkpoint rate × bytes
    const ckRate = 60000 / state.checkpointMs;
    const cost = rf * s * ckRate * (state.avgBytes / 256);
    data.push({ rf, size: s, cost });
  }));
  const cw = (w - 40) / sizes.length;
  const ch = (H - 20) / rfs.length;
  const x = d3.scaleBand().domain(sizes.map(String)).range([34, w]).padding(0.08);
  const y = d3.scaleBand().domain(rfs.map(String)).range([0, H - 20]).padding(0.08);
  const color = d3.scaleSequential()
    .domain([0, d3.max(data, (d) => d.cost)])
    .interpolator(d3.interpolateRgb('#081108', '#8cff8c'));

  const cells = hmG.selectAll('rect.heat-cell').data(data, (d) => d.rf + ':' + d.size);
  cells.join(
    (enter) => enter.append('rect').attr('class', 'heat-cell').attr('opacity', 0),
    (update) => update,
    (exit) => exit.remove()
  )
  .transition().duration(350)
  .attr('x', (d) => x(String(d.size)))
  .attr('y', (d) => y(String(d.rf)))
  .attr('width', x.bandwidth())
  .attr('height', y.bandwidth())
  .attr('fill', (d) => color(d.cost))
  .attr('opacity', 1);

  // axis labels
  hmG.selectAll('text.yl').data(rfs).join('text')
    .attr('class', 'yl axis').attr('x', 4)
    .attr('y', (d) => y(String(d)) + y.bandwidth() / 2 + 3)
    .attr('fill', '#5fa55f').attr('font-size', 9).text((d) => 'RF ' + d);
  hmG.selectAll('text.xl').data(sizes).join('text')
    .attr('class', 'xl axis')
    .attr('x', (d) => x(String(d)) + x.bandwidth() / 2)
    .attr('y', H - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', '#5fa55f').attr('font-size', 9).text((d) => d + 'G');
}

// ---------- Readout ----------
function renderReadout() {
  const cksPerSec = 1000 / state.checkpointMs;
  const perPartition = state.eventsPerSec / state.partitions;
  const windowSlots = Math.ceil(60000 / state.windowMs);
  const netMbps = (state.eventsPerSec * state.avgBytes * 8) / 1_000_000;
  const replicatedMbps = netMbps * state.replicationFactor;
  const changelogMbps = (perPartition * state.avgBytes * state.replicationFactor * 0.4) / 125_000;
  const lagBudget = state.watermarkLag / state.windowMs;
  const pressure = perPartition > 7000 ? 'CRITICAL' : perPartition > 4000 ? 'HOT' : 'OK';

  const rows = [
    { lbl: 'PER-PARTITION RATE', val: perPartition.toFixed(0) + ' /s', pct: Math.min(100, perPartition / 8000 * 100), cls: perPartition > 7000 ? 'crit' : perPartition > 4000 ? 'warn' : '' },
    { lbl: 'WINDOW SLOTS / MIN', val: windowSlots.toFixed(0), pct: Math.min(100, windowSlots * 2) },
    { lbl: 'INGRESS THROUGHPUT', val: netMbps.toFixed(2) + ' Mb/s', pct: Math.min(100, netMbps / 50) },
    { lbl: 'REPLICATED NET', val: replicatedMbps.toFixed(2) + ' Mb/s', pct: Math.min(100, replicatedMbps / 100), cls: replicatedMbps > 80 ? 'warn' : '' },
    { lbl: 'CHANGELOG TOPIC', val: changelogMbps.toFixed(2) + ' Mb/s', pct: Math.min(100, changelogMbps * 5) },
    { lbl: 'CHECKPOINTS / SEC', val: cksPerSec.toFixed(2), pct: Math.min(100, cksPerSec * 30) },
    { lbl: 'WATERMARK LAG BUDGET', val: (lagBudget * 100).toFixed(0) + '%', pct: Math.min(100, lagBudget * 100), cls: lagBudget > 1 ? 'crit' : lagBudget > 0.5 ? 'warn' : '' },
    { lbl: 'STATE-BACKEND SIZE', val: (state.stateSizeGB * state.replicationFactor).toFixed(1) + 'GB', pct: Math.min(100, state.stateSizeGB * state.replicationFactor / 5) },
    { lbl: 'PRESSURE', val: pressure, pct: pressure === 'CRITICAL' ? 100 : pressure === 'HOT' ? 65 : 30, cls: pressure === 'CRITICAL' ? 'crit' : pressure === 'HOT' ? 'warn' : '' },
  ];

  const sel = readout.selectAll('.rd-row').data(rows, (d) => d.lbl);
  const enter = sel.enter().append('div').attr('class', 'rd-row');
  enter.append('div').attr('class', 'lbl');
  enter.append('div').attr('class', 'bar').append('span');
  enter.append('div').attr('class', 'v');

  const merged = enter.merge(sel);
  merged.select('.lbl').text((d) => d.lbl);
  merged.select('.v').text((d) => d.val);
  merged.select('.bar').attr('class', (d) => 'bar ' + (d.cls || ''));
  merged.select('.bar span').transition().duration(280).style('width', (d) => d.pct + '%');

  sel.exit().remove();

  // status bar
  document.getElementById('status').innerHTML = [
    `<span>EVT/s <b>${state.eventsPerSec.toLocaleString()}</b></span>`,
    `<span>PART <b>${state.partitions}</b></span>`,
    `<span>WIN <b>${state.windowMs}ms</b></span>`,
    `<span>WM <b>${state.watermarkLag}ms</b></span>`,
    `<span>CKPT <b>${state.checkpointMs}ms</b></span>`,
    `<span>RF <b>${state.replicationFactor}</b></span>`,
    `<span>STATE <b>${state.stateSizeGB.toFixed(1)}GB</b></span>`,
    `<span>MODE <b>${state.layout.toUpperCase()}</b></span>`,
  ].join('');
}

// ---------- Changelog tape ----------
const logEl = document.getElementById('log');
function pushLog(kind, msg, cls) {
  changelog.push({ t: Date.now(), kind, msg, cls: cls || kind.toLowerCase() });
  if (changelog.length > MAX_LOG) changelog.shift();
  renderLog();
}
function renderLog() {
  const filter = state.filter;
  const rows = changelog.filter((r) => filter === 'all' || r.cls === filter);
  const sel = d3.select('#log').selectAll('.log-entry')
    .data(rows.slice().reverse(), (d) => d.t + ':' + d.msg);
  const enter = sel.enter().append('div').attr('class', (d) => 'log-entry ' + d.cls);
  enter.append('span').attr('class', 'ts').text((d) => new Date(d.t).toISOString().slice(14, 19));
  enter.append('span').attr('class', 'kind').text((d) => d.kind);
  enter.append('span').attr('class', 'msg').text((d) => d.msg);
  enter.style('opacity', 0).transition().duration(220).style('opacity', 1);
  sel.exit().transition().duration(180).style('opacity', 0).remove();
}
document.querySelectorAll('.log-filter button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.log-filter button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    state.filter = b.dataset.filter;
    renderLog();
  });
});

// ---------- Simulated stream events (cdc-visualization-pattern / outbox-pattern-visualization-pattern) ----------
setInterval(() => {
  const r = rnd();
  if (r < 0.12) {
    const pid = Math.floor(rnd() * state.partitions);
    pushLog('BARRIER', `barrier aligned on P${pid} @wm=${state.watermarkLag}ms`, 'bar');
  } else if (r < 0.22) {
    const id = Math.floor(rnd() * 10000);
    pushLog('CKPT', `checkpoint C${id} committed to rocksdb (rf=${state.replicationFactor})`, 'ckpt');
  } else if (r < 0.35) {
    pushLog('WM', `watermark advanced by ${Math.floor(rnd() * 200)}ms on topic://ingest`, 'wm');
  } else if (r < 0.43) {
    const pid = Math.floor(rnd() * state.partitions);
    pushLog('DLQ', `poison record quarantined on P${pid} → sink.dlq`, 'dlq');
  } else if (r < 0.55) {
    pushLog('COMMIT', `changelog offset advanced (+${Math.floor(rnd() * 900)})`, 'all');
  } else if (r < 0.7) {
    pushLog('REBAL', `consumer group rebalanced → ${state.partitions} partitions`, 'wm');
  } else if (r < 0.82) {
    const op = ['filter', 'agg', 'window'][Math.floor(rnd() * 3)];
    pushLog('STATE', `op=${op} state-backend flushed ${(rnd() * state.stateSizeGB).toFixed(2)}GB`, 'ckpt');
  }
}, 700);

// ---------- Clock ----------
setInterval(() => {
  const d = new Date();
  document.getElementById('clock').textContent =
    d.toISOString().slice(0, 10) + 'T' + d.toISOString().slice(11, 19) + 'Z';
}, 1000);

// ---------- Recompute wiring ----------
function recompute() {
  renderLagChart();
  renderHeatmap();
  renderReadout();
}

// Initial paint, then redraw on resize
recompute();
new ResizeObserver(() => recompute()).observe(document.getElementById('lagChart'));
new ResizeObserver(() => recompute()).observe(document.getElementById('heatmap'));

// Seed the tape with a boot banner
pushLog('BOOT', 'oracle changelog console online — stream-processor stack loaded', 'wm');
pushLog('WM', 'initial watermark established @t0', 'wm');
pushLog('CKPT', 'baseline checkpoint C0 emitted', 'ckpt');

// Keyboard: f=force r=radial w=flow
window.addEventListener('keydown', (e) => {
  if (e.key === 'f') document.querySelector('.topo-controls button[data-layout="force"]').click();
  if (e.key === 'r') document.querySelector('.topo-controls button[data-layout="radial"]').click();
  if (e.key === 'w') document.querySelector('.topo-controls button[data-layout="flow"]').click();
  if (e.key === 'Escape') {
    topoNodes.forEach((d) => { d.fx = null; d.fy = null; });
    simulation.alpha(0.7).restart();
  }
});