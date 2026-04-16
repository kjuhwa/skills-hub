const mvs = [
  { name: 'mv_daily_sales', cols: ['date', 'amount', 'product_id'], tables: ['orders', 'products'], agg: 'SUM(amount)', groupBy: 'date' },
  { name: 'mv_product_stats', cols: ['product_id', 'total_qty', 'avg_price'], tables: ['orders', 'products'], agg: 'AVG(price)', groupBy: 'product_id' },
  { name: 'mv_user_orders', cols: ['user_id', 'order_count', 'total_spent'], tables: ['orders', 'users'], agg: 'COUNT(*)', groupBy: 'user_id' },
];

function analyze(sql) {
  const lower = sql.toLowerCase();
  const tables = ['orders', 'products', 'users'].filter(t => lower.includes(t));
  const hasAgg = /sum|avg|count|min|max/i.test(lower);
  const groupMatch = lower.match(/group\s+by\s+(\w+)/);
  const groupCol = groupMatch ? groupMatch[1] : null;

  const scored = mvs.map(mv => {
    let score = 0; const reasons = [];
    const tblOverlap = mv.tables.filter(t => tables.includes(t)).length;
    if (tblOverlap === tables.length && tblOverlap === mv.tables.length) { score += 50; reasons.push('exact table match'); }
    else if (tblOverlap > 0) { score += 20; reasons.push('partial table match'); }
    if (hasAgg && lower.includes(mv.agg.split('(')[0].toLowerCase())) { score += 30; reasons.push('aggregate match'); }
    if (groupCol && mv.groupBy === groupCol) { score += 20; reasons.push('GROUP BY match'); }
    return { ...mv, score, reasons };
  }).sort((a, b) => b.score - a.score);

  return { tables, hasAgg, groupCol, candidates: scored };
}

function renderResult(r) {
  const res = document.getElementById('result');
  let html = `<p><b>Detected tables:</b> ${r.tables.join(', ')}</p>`;
  html += `<p><b>Aggregation:</b> ${r.hasAgg ? 'Yes' : 'No'} · <b>Group by:</b> ${r.groupCol || 'none'}</p><hr style="border-color:#2d333b;margin:8px 0">`;
  r.candidates.forEach(c => {
    const cls = c.score >= 80 ? 'hit' : c.score >= 40 ? 'partial' : 'miss';
    const lbl = c.score >= 80 ? 'REWRITE ✓' : c.score >= 40 ? 'PARTIAL' : 'NO MATCH';
    html += `<p><span class="tag ${cls}">${lbl}</span> <b>${c.name}</b> — score ${c.score}%<br><small>${c.reasons.join(', ')}</small></p>`;
  });
  res.innerHTML = html;
}

function renderPlan(r) {
  const svg = document.getElementById('plan');
  const best = r.candidates[0];
  const useMV = best.score >= 40;
  const nodes = useMV
    ? [{ l: 'Query', x: 80 }, { l: 'Rewrite', x: 250 }, { l: best.name, x: 450 }, { l: 'Result', x: 650 }]
    : [{ l: 'Query', x: 80 }, { l: 'Seq Scan', x: 250 }, { l: r.tables.join(' ⨝ '), x: 450 }, { l: 'Result', x: 650 }];

  let s = '';
  nodes.forEach((n, i) => {
    if (i < nodes.length - 1) {
      s += `<line x1="${n.x + 40}" y1="130" x2="${nodes[i + 1].x - 40}" y2="130" stroke="#2d333b" stroke-width="2" marker-end="url(#arr)"/>`;
    }
    const col = (useMV && i === 2) ? '#6ee7b7' : '#8b949e';
    s += `<rect x="${n.x - 45}" y="105" width="90" height="50" rx="8" fill="#0f1117" stroke="${col}" stroke-width="2"/>`;
    s += `<text x="${n.x}" y="135" text-anchor="middle" fill="${col}" font-size="11" font-family="Segoe UI">${n.l}</text>`;
  });
  const costLabel = useMV ? `Cost: ~${best.score}x faster via ${best.name}` : 'Cost: full table scan (no MV match)';
  s += `<text x="380" y="200" text-anchor="middle" fill="#8b949e" font-size="12">${costLabel}</text>`;
  s += `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#2d333b"/></marker></defs>`;
  svg.innerHTML = s;
}

document.getElementById('analyze').onclick = () => {
  const r = analyze(document.getElementById('sql').value);
  renderResult(r); renderPlan(r);
};

document.getElementById('analyze').click();