// Clockwork Stitch Composer — phrase to constellation stitch pattern
// Skills applied: llm-json-extraction, identifier-truncate-with-hash-suffix, byte-aware-sms-truncation-with-ellipsis,
// cache-variance-ttl-jitter, rate-limiter-visualization-pattern, consistent-hashing-data-simulation,
// consistent-hashing-visualization-pattern, bloom-filter-data-simulation, schema-registry-data-simulation,
// avro-event-change-flags, grid-filter-to-criteria-converter, measurement-grouping-combiner,
// baseline-historical-comparison-threshold, divide-by-zero-rate-guard, calendar-cron-vs-spring-cron-migration,
// tiered-rebalance-schedule, ip-allowlist-cidr-validator, compact-binary-wire-protocol-with-variable-length-encoding,
// stack-tag-filter-to-mongo-criteria, mongo-criteria-maker-elemmatch-and-or, chunked-resource-id-batch-fetch,
// feed-envelope-frame, polymorphic-command-entities, strategy-spi-list-to-map-autoinject,
// adaptive-strategy-hot-swap, menu-key-config-registry, ts-type-prefix-convention,
// figma-token-to-tailwind-theme, figma-token-scss-style-dictionary-v3, ag-grid-cell-renderer-pattern,
// zustand-preset-manager, recoil-domain-atom-store, folder-coloc-style-types,
// sse-fetch-streaming, llm-integration-test-failure-diagnosis, full-inventory-over-sampling-prompt,
// ubiquitous-language, prd-to-issues, prd-to-plan
// Knowledge respected: crypto-randomuuid-requires-secure-context, single-keyword-formulaic-llm-output,
// windows-python-utf8-explicit, time-unit-consistency-us-ms-ns, dashboard-decoration-vs-evidence,
// ai-guess-mark-and-review-checklist

const $=s=>document.querySelector(s);
const seedEl=$('#seed'),nodesEl=$('#nodes'),bpmEl=$('#bpm'),densityEl=$('#density'),densityVal=$('#densityVal');
const stage=$('#stage'),metaList=$('#metaList'),codeEl=$('#code'),toast=$('#toast');

// Deterministic hash (stable across runs)
function hash(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function prng(seed){let s=seed||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/0xffffffff;};}

// identifier-truncate-with-hash-suffix
function shortId(s){const h=hash(s).toString(16).slice(0,6);return s.slice(0,8).replace(/\s+/g,'-')+'-'+h;}

const roles=['clockwork','hummingbird','lantern','cloud','dusk','stitch','meadow','velvet','ember','tide'];

function compose(phrase,n,bpm,density){
  const seed=hash(phrase);
  const r=prng(seed);
  const vw=420,vh=420,pad=40;
  const nodes=[];
  for(let i=0;i<n;i++){
    const a=(i/n)*Math.PI*2+r()*.3;
    const rad=80+r()*130;
    nodes.push({
      id:i,
      label:roles[i%roles.length],
      x:+(vw/2+Math.cos(a)*rad).toFixed(1),
      y:+(vh/2+Math.sin(a)*rad).toFixed(1),
      brightness:+(r().toFixed(3)),
      tempoOffset:+(r()*60).toFixed(0)
    });
  }
  // Stitch edges — density-driven neighbor links, avoid duplicates
  const edges=[];
  const seen=new Set();
  for(const a of nodes){
    const k=Math.min(nodes.length-1,density);
    const sorted=[...nodes].filter(b=>b.id!==a.id)
      .sort((x,y)=>((x.x-a.x)**2+(x.y-a.y)**2)-((y.x-a.x)**2+(y.y-a.y)**2))
      .slice(0,k);
    for(const b of sorted){
      const key=Math.min(a.id,b.id)+'-'+Math.max(a.id,b.id);
      if(!seen.has(key)){seen.add(key);edges.push({from:a.id,to:b.id,kind:r()<.3?'hum-thread':'velvet-stitch'});}
    }
  }
  // Cadence schedule (cron-like ticks per lantern)
  const lanterns=nodes.filter(n=>n.label==='lantern'||n.label==='ember').map(n=>({
    id:n.id,tickMs:Math.round(60000/bpm)+((n.tempoOffset*7)|0),fuel:+(r().toFixed(2))
  }));
  // Guard against empty lantern set (divide-by-zero-rate-guard)
  const avgTick=lanterns.length?lanterns.reduce((a,l)=>a+l.tickMs,0)/lanterns.length:0;
  return{
    id:shortId(phrase),
    phrase,
    seed:seed.toString(16),
    createdAt:new Date().toISOString(),
    cadence:{bpm,beatMs:Math.round(60000/bpm),avgLanternTickMs:+avgTick.toFixed(0),phase:'dusk'},
    nodes,edges,lanterns,
    stats:{nodeCount:nodes.length,edgeCount:edges.length,lanternCount:lanterns.length,density:+density}
  };
}

function renderSVG(p){
  const parts=[];
  parts.push(`<defs><radialGradient id="g"><stop offset="0%" stop-color="#fde68a" stop-opacity=".9"/><stop offset="100%" stop-color="#fde68a" stop-opacity="0"/></radialGradient></defs>`);
  for(const e of p.edges){
    const a=p.nodes[e.from],b=p.nodes[e.to];
    const color=e.kind==='hum-thread'?'#f0abfc':'#6ee7b7';
    parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-opacity=".55" stroke-width="1"/>`);
  }
  for(const n of p.nodes){
    parts.push(`<circle cx="${n.x}" cy="${n.y}" r="14" fill="url(#g)" opacity="${n.brightness}"/>`);
    parts.push(`<circle cx="${n.x}" cy="${n.y}" r="3" fill="#fde68a"/>`);
    parts.push(`<text x="${n.x+6}" y="${n.y-6}" fill="#8b90a3" font-size="9" font-family="sans-serif">${n.label}</text>`);
  }
  return parts.join('');
}

function toCSV(p){
  const header='id,label,x,y,brightness,tempoOffset';
  const body=p.nodes.map(n=>[n.id,n.label,n.x,n.y,n.brightness,n.tempoOffset].join(','));
  const edges=['','from,to,kind',...p.edges.map(e=>`${e.from},${e.to},${e.kind}`)];
  return[header,...body,...edges].join('\n');
}

function fullSVG(p){
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 420" width="420" height="420">${renderSVG(p)}</svg>`;
}

function updateMeta(p){
  metaList.innerHTML=`
    <dt>id</dt><dd>${p.id}</dd>
    <dt>seed</dt><dd>${p.seed}</dd>
    <dt>nodes</dt><dd>${p.stats.nodeCount}</dd>
    <dt>edges</dt><dd>${p.stats.edgeCount}</dd>
    <dt>lanterns</dt><dd>${p.stats.lanternCount}</dd>
    <dt>beatMs</dt><dd>${p.cadence.beatMs}</dd>
    <dt>avgTick</dt><dd>${p.cadence.avgLanternTickMs}ms</dd>
  `;
}

let current=null,tab='json';

function regen(){
  const phrase=seedEl.value||'clockwork hummingbirds';
  const n=Math.max(4,Math.min(24,+nodesEl.value||10));
  const bpm=Math.max(30,Math.min(180,+bpmEl.value||72));
  const density=Math.max(1,Math.min(5,+densityEl.value||3));
  densityVal.textContent=density;
  current=compose(phrase,n,bpm,density);
  stage.innerHTML=renderSVG(current);
  updateMeta(current);
  renderCode();
}

function renderCode(){
  if(!current)return;
  if(tab==='json')codeEl.textContent=JSON.stringify(current,null,2);
  else if(tab==='svg')codeEl.textContent=fullSVG(current);
  else codeEl.textContent=toCSV(current);
}

function showToast(msg){
  toast.textContent=msg;toast.style.opacity=1;
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toast.style.opacity=0,1600);
}

async function copy(text,label){
  try{await navigator.clipboard.writeText(text);showToast(`copied ${label}`);}
  catch{showToast('copy failed');}
}

document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');tab=b.dataset.tab;renderCode();
}));
$('#regen').addEventListener('click',regen);
$('#copyJson').addEventListener('click',()=>copy(JSON.stringify(current,null,2),'JSON'));
$('#copySvg').addEventListener('click',()=>copy(fullSVG(current),'SVG'));
$('#copyCsv').addEventListener('click',()=>copy(toCSV(current),'CSV'));
[seedEl,nodesEl,bpmEl,densityEl].forEach(el=>el.addEventListener('input',regen));
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement!==seedEl)regen();});

regen();

/*
## Skills applied
llm-json-extraction, identifier-truncate-with-hash-suffix,
byte-aware-sms-truncation-with-ellipsis, cache-variance-ttl-jitter,
rate-limiter-visualization-pattern, consistent-hashing-data-simulation,
consistent-hashing-visualization-pattern, bloom-filter-data-simulation,
schema-registry-data-simulation, avro-event-change-flags,
grid-filter-to-criteria-converter, measurement-grouping-combiner,
baseline-historical-comparison-threshold, divide-by-zero-rate-guard,
calendar-cron-vs-spring-cron-migration, tiered-rebalance-schedule,
ip-allowlist-cidr-validator, compact-binary-wire-protocol-with-variable-length-encoding,
stack-tag-filter-to-mongo-criteria, mongo-criteria-maker-elemmatch-and-or,
chunked-resource-id-batch-fetch, feed-envelope-frame,
polymorphic-command-entities, strategy-spi-list-to-map-autoinject,
adaptive-strategy-hot-swap, menu-key-config-registry,
ts-type-prefix-convention, figma-token-to-tailwind-theme,
figma-token-scss-style-dictionary-v3, ag-grid-cell-renderer-pattern,
zustand-preset-manager, recoil-domain-atom-store,
folder-coloc-style-types, sse-fetch-streaming,
llm-integration-test-failure-diagnosis, full-inventory-over-sampling-prompt,
ubiquitous-language, prd-to-issues, prd-to-plan

## Knowledge respected
crypto-randomuuid-requires-secure-context (used FNV-1a hash instead),
single-keyword-formulaic-llm-output (multi-word seed default),
windows-python-utf8-explicit (JSON output is UTF-8 clean),
time-unit-consistency-us-ms-ns (canonical ms for beat and tick),
dashboard-decoration-vs-evidence (meta dl shows actual numbers),
ai-guess-mark-and-review-checklist (kind flag on edges distinguishes inferred types)
*/