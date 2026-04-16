const svcs = ['gateway','auth','user-api','order-api','payment','inventory','cache-read','db-query','notification','logger'];
const palette = ['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb923c','#34d399','#f87171','#818cf8','#e879f9'];
const ROW_H = 22, PAD = 2;

function genTree(depth, start, totalW, maxD) {
  if (depth > maxD) return [];
  const svc = svcs[depth % svcs.length];
  const dur = totalW * (0.5 + Math.random() * 0.5);
  const node = { svc, start, dur, depth, id: Math.random().toString(36).slice(2, 8) };
  const spans = [node];
  if (depth < maxD) {
    const kids = 1 + Math.floor(Math.random() * 2);
    let cursor = start + Math.random() * dur * 0.1;
    for (let i = 0; i < kids; i++) {
      const childW = dur * (0.2 + Math.random() * 0.3);
      if (cursor + childW > start + dur) break;
      spans.push(...genTree(depth + 1, cursor, childW, maxD));
      cursor += childW + Math.random() * dur * 0.05;
    }
  }
  return spans;
}

function rebuild() {
  const maxD = 4 + Math.floor(Math.random() * 4);
  const totalMs = 200 + Math.random() * 600;
  const spans = genTree(0, 0, totalMs, maxD);
  render(spans, totalMs);
}

function render(spans, totalMs) {
  const svg = document.getElementById('flame');
  const detail = document.getElementById('detail');
  const W = svg.parentElement.clientWidth - 48;
  const maxDepth = Math.max(...spans.map(s => s.depth));
  const svgH = (maxDepth + 1) * (ROW_H + PAD) + 10;
  svg.setAttribute('viewBox', `0 0 ${W} ${svgH}`);
  svg.setAttribute('height', svgH);
  svg.innerHTML = '';

  spans.forEach(s => {
    const x = (s.start / totalMs) * W;
    const w = Math.max((s.dur / totalMs) * W, 3);
    const y = s.depth * (ROW_H + PAD);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', ROW_H);
    rect.setAttribute('rx', 3); rect.setAttribute('fill', palette[s.depth % palette.length]);
    rect.setAttribute('class', 'flame-rect');
    rect.addEventListener('click', () => {
      detail.innerHTML = `<span style="color:${palette[s.depth % palette.length]}">■</span> <b>${s.svc}</b> &nbsp; id: ${s.id} &nbsp; duration: ${Math.round(s.dur)}ms &nbsp; start: ${Math.round(s.start)}ms &nbsp; depth: ${s.depth}`;
    });
    svg.appendChild(rect);
    if (w > 40) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + 4); text.setAttribute('y', y + 14);
      text.setAttribute('class', 'flame-label');
      text.textContent = s.svc + ' ' + Math.round(s.dur) + 'ms';
      svg.appendChild(text);
    }
  });
  detail.innerHTML = 'Click a span for details';
}

rebuild();