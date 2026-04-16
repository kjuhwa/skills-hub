const ids = ['serialize', 'out', 'net', 'in', 'handler', 'retry'];
const labels = {
  serialize: 'App serialize',
  out: 'Sidecar out',
  net: 'Network RTT',
  in: 'Sidecar in',
  handler: 'Remote handler',
  retry: 'Retries',
};
const colors = {
  serialize: '#6ee7b7',
  out: '#4dd0e1',
  net: '#fbbf24',
  in: '#4dd0e1',
  handler: '#6ee7b7',
  retry: '#ff6b6b',
};

const sliders = {};
ids.forEach(id => {
  sliders[id] = document.getElementById(id);
  sliders[id].oninput = render;
  document.getElementById('v' + cap(id)).textContent = sliders[id].value;
});

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function values() {
  const v = {};
  ids.forEach(id => v[id] = parseInt(sliders[id].value));
  return v;
}

function render() {
  const v = values();
  ids.forEach(id => {
    document.getElementById('v' + cap(id)).textContent = v[id];
  });

  const oneWay = [
    { id: 'serialize', label: 'App serialize', ms: v.serialize },
    { id: 'out', label: 'Sidecar out', ms: v.out },
    { id: 'net', label: 'Net →', ms: v.net / 2 },
    { id: 'in', label: 'Sidecar in', ms: v.in },
    { id: 'handler', label: 'Handler', ms: v.handler },
    { id: 'in', label: 'Sidecar out (resp)', ms: v.in },
    { id: 'net', label: 'Net ←', ms: v.net / 2 },
    { id: 'out', label: 'Sidecar in (resp)', ms: v.out },
  ];

  const retryCost = v.retry * (v.net + v.handler + v.in + v.out);
  const total = oneWay.reduce((s, x) => s + x.ms, 0) + retryCost;
  const overhead = v.out + v.in + v.out + v.in;
  const overheadPct = total > 0 ? (overhead / total * 100) : 0;

  document.getElementById('total').textContent = total.toFixed(1);
  document.getElementById('overhead').textContent = overhead;
  document.getElementById('pct').textContent = overheadPct.toFixed(1);

  drawWaterfall(oneWay, retryCost, total);
  drawBars(v, total);
}

function drawWaterfall(segments, retryCost, total) {
  const svg = document.getElementById('chart');
  svg.innerHTML = '';
  const W = 600, H = 300;
  const barH = 22;
  const padX = 140;
  const scale = total > 0 ? (W - padX - 20) / total : 0;
  let x = padX;

  segments.forEach((seg, i) => {
    const y = 20 + i * (barH + 6);
    const w = seg.ms * scale;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', Math.max(1, w));
    rect.setAttribute('height', barH);
    rect.setAttribute('fill', colors[seg.id]);
    rect.setAttribute('rx', 2);
    svg.appendChild(rect);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 10);
    label.setAttribute('y', y + barH / 2 + 4);
    label.setAttribute('fill', '#e5e7eb');
    label.setAttribute('font-family', 'monospace');
    label.setAttribute('font-size', '11');
    label.textContent = seg.label;
    svg.appendChild(label);

    const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    val.setAttribute('x', x + w + 4);
    val.setAttribute('y', y + barH / 2 + 4);
    val.setAttribute('fill', '#6b7280');
    val.setAttribute('font-size', '10');
    val.setAttribute('font-family', 'monospace');
    val.textContent = seg.ms.toFixed(1) + 'ms';
    svg.appendChild(val);

    x += w;
  });

  if (retryCost > 0) {
    const y = 20 + segments.length * (barH + 6);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', padX);
    rect.setAttribute('y', y);
    rect.setAttribute('width', retryCost * scale);
    rect.setAttribute('height', barH);
    rect.setAttribute('fill', colors.retry);
    rect.setAttribute('opacity', 0.7);
    rect.setAttribute('rx', 2);
    svg.appendChild(rect);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', 10);
    label.setAttribute('y', y + barH / 2 + 4);
    label.setAttribute('fill', '#ff6b6b');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'monospace');
    label.textContent = 'Retry overhead';
    svg.appendChild(label);
  }
}

function drawBars(v, total) {
  const container = document.getElementById('bars');
  container.innerHTML = '';
  const entries = [
    ['App serialize', v.serialize],
    ['Sidecar out (×2)', v.out * 2],
    ['Network RTT', v.net],
    ['Sidecar in (×2)', v.in * 2],
    ['Remote handler', v.handler],
    ['Retry cost', v.retry * (v.net + v.handler + v.in + v.out)],
  ];
  const max = Math.max(...entries.map(e => e[1]), 1);
  entries.forEach(([name, ms]) => {
    const row = document.createElement('div');
    row.className = 'bar';
    row.innerHTML = `<span>${name}</span><div class="fill" style="width:${ms/max*100}%"></div><span class="val">${ms.toFixed(1)}ms</span>`;
    container.appendChild(row);
  });
}

render();