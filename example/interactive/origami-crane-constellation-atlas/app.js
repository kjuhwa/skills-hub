// Origami Crane Constellation Atlas — seeded procedural scene
// Skills embedded: canvas-svg-dual-layer-hit-dispatch, incommensurate-sine-organic-flicker,
// consistent-hashing-visualization-pattern, lantern-visualization-pattern, event-returning-pure-reducer.

const canvas=document.getElementById('sky');
const ctx=canvas.getContext('2d');
const svg=document.getElementById('overlay');
const tooltip=document.getElementById('tooltip');
const inspector=document.getElementById('inspector');
const districtsEl=document.getElementById('districts');

// fnv1a + xorshift seeded PRNG (fnv1a-xorshift-text-to-procedural-seed)
function seedFrom(str){let h=2166136261>>>0;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function mkRng(s){let x=s||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%1e9)/1e9}}

const THEME="whispering origami cranes unfold forgotten constellations above a drifting tea garden where paper lanterns hum";
let rng=mkRng(seedFrom(THEME));

const districts=[
  {name:"Lotus Pond",kind:"materialized-view"},
  {name:"Bamboo Drift",kind:"read-replica"},
  {name:"Ember Court",kind:"circuit-breaker"},
  {name:"Moth Ladder",kind:"saga-pattern"},
  {name:"Whisper Gate",kind:"pub-sub"},
  {name:"Salt Mirror",kind:"cdc"},
  {name:"Silk Ledger",kind:"event-sourcing"},
  {name:"Paper Moon",kind:"consistent-hashing"},
  {name:"Tea Weir",kind:"rate-limiter"}
];

// procedural corpus pool — plausible skill fragments mapped to the theme
const cranes=[];
const lanterns=[];
const stars=[];
let W=0,H=0,paused=false;

const SKILLS=[
  ["lantern-visualization-pattern","Glow halos, ember particles"],
  ["incommensurate-sine-organic-flicker","Non-looping flicker via 3 sines"],
  ["canvas-svg-dual-layer-hit-dispatch","Canvas scene + svg hit layer"],
  ["consistent-hashing-data-simulation","9 crane-districts on a ring"],
  ["materialized-view-data-simulation","Precomputed tea-garden views"],
  ["circuit-breaker-visualization-pattern","Ember gate OPEN/HALF/CLOSED"],
  ["saga-pattern-data-simulation","Moth-ladder compensation chain"],
  ["cdc-visualization-pattern","Salt-mirror change flow"],
  ["event-sourcing-visualization-pattern","Silk-ledger append log"],
  ["rate-limiter-visualization-pattern","Tea-weir token bucket"],
  ["pub-sub-visualization-pattern","Whisper-gate fan-out"],
  ["distributed-tracing-visualization-pattern","Crane-trail waterfall"],
  ["raft-consensus-data-simulation","Paper-moon elects a lead crane"],
  ["bloom-filter-data-simulation","Folded-paper membership test"],
  ["schema-registry-visualization-pattern","Origami fold version graph"],
  ["service-mesh-visualization-pattern","Crane-lantern sidecar pair"],
  ["sidecar-proxy-data-simulation","Lantern as sidecar of crane"],
  ["load-balancer-visualization-pattern","Wind distributes cranes"],
  ["time-series-db-visualization-pattern","Lantern hum timeseries"],
  ["log-aggregation-data-simulation","Ember sparks as log lines"],
  ["health-check-visualization-pattern","Lantern wick flutter = unhealthy"],
  ["oauth-visualization-pattern","Crane carries a scoped scroll"],
  ["idempotency-visualization-pattern","Duplicate cranes deduped"],
  ["retry-strategy-data-simulation","Crane loops back on failure"],
  ["backpressure-visualization-pattern","Pond overflows the weir"],
  ["dead-letter-queue-visualization-pattern","Lost cranes in the willow"],
  ["strangler-fig-visualization-pattern","New lanterns replace old"],
  ["outbox-pattern-visualization-pattern","Tea-ceremony outbox"],
  ["bulkhead-visualization-pattern","Garden partitioned by hedge"],
  ["feature-flags-data-simulation","Flag toggles lantern color"],
  ["command-query-visualization-pattern","Write-cranes vs read-cranes"],
  ["crdt-visualization-pattern","Two gardens reconcile folds"],
  ["blue-green-deploy-visualization-pattern","Green lantern-row cut-over"],
  ["canary-release-data-simulation","One crane dyed saffron"],
  ["api-gateway-pattern-visualization-pattern","Gatehouse at pond entrance"],
  ["graphql-data-simulation","Nested fold queries"],
  ["websocket-visualization-pattern","Paper-string duplex hum"],
  ["chaos-engineering-data-simulation","Random wind gust events"],
  ["actor-model-visualization-pattern","Each crane is an actor"],
  ["hexagonal-architecture-visualization-pattern","Tea-garden hex ports"]
];
const KNOW=[
  ["canvas-event-coord-devicepixel-rescale","Pointer coords must be rescaled"],
  ["json-clone-reducer-state-constraint","Cloned state drops Date/Map"],
  ["crypto-randomuuid-requires-secure-context","Use fallback id on http"],
  ["dashboard-decoration-vs-evidence","Flicker must prove state"],
  ["arbitrary-display-caps-hide-signal","Never slice(0,N) silently"],
  ["single-keyword-formulaic-llm-output","Evocative phrase > single word"],
  ["time-unit-consistency-us-ns-ms","Pick one time unit"],
  ["mongo-timeseries-view-pushdown-broken-8_2_3","Pushdown regression"],
  ["kafka-sticky-partitioner-key-null","Null key pins partition"],
  ["jackson-version-pinning-2.17.1","Pin Jackson"],
  ["drawer-over-modal","Drawer beats modal here"],
  ["less-antd-theme-only","Theme via Less variables"],
];

function spawn(){
  cranes.length=0;lanterns.length=0;stars.length=0;
  for(let i=0;i<120;i++){
    stars.push({x:rng()*W,y:rng()*H*0.75,r:rng()*1.1+.2,tw:rng()*6.28});
  }
  for(let i=0;i<14;i++){
    const d=districts[i%districts.length];
    const skill=SKILLS[Math.floor(rng()*SKILLS.length)];
    const kind=rng()<.5?'skill':'knowledge';
    const item=kind==='skill'?skill:KNOW[Math.floor(rng()*KNOW.length)];
    cranes.push({
      id:'c'+i,x:rng()*W,y:rng()*H*0.7+20,
      vx:(rng()*.6+.1)*(rng()<.5?-1:1),vy:(rng()-.5)*.15,
      hue:rng()*30-15,size:rng()*8+8,
      phase:[rng()*6.28,rng()*6.28,rng()*6.28],
      freq:[0.017,0.023*1.37,0.011*2.11],
      district:d,item:{name:item[0],why:item[1],kind},
    });
  }
  for(let i=0;i<9;i++){
    lanterns.push({
      id:'l'+i,x:80+(W-160)*i/8,y:H-70-Math.sin(i)*18,
      phase:[rng()*6.28,rng()*6.28,rng()*6.28],
      freq:[0.031,0.013*1.71,0.019*2.39],
      district:districts[i],
      item:{name:KNOW[i%KNOW.length][0],why:KNOW[i%KNOW.length][1],kind:'knowledge'}
    });
  }
  renderDistricts();
  renderOverlay();
}
function renderDistricts(){
  districtsEl.innerHTML=districts.map((d,i)=>`
    <div class="district" data-i="${i}">
      <b>${d.name}</b><span>${d.kind}</span>
    </div>`).join('');
  districtsEl.querySelectorAll('.district').forEach(el=>{
    el.addEventListener('click',()=>{
      document.querySelectorAll('.district').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      const i=+el.dataset.i;
      const picks=cranes.filter(c=>c.district===districts[i]);
      inspector.innerHTML=`<h2>${districts[i].name} · ${districts[i].kind}</h2>`+
        picks.map(c=>scroll(c.item)).join('');
    });
  });
}
function scroll(item){
  return `<div class="scroll"><span class="name">${item.name}</span>
    <span class="kind">${item.kind}</span>
    <p>${item.why}</p>
    <div class="tags"><span class="tag">hub</span><span class="tag">${item.kind}</span></div></div>`;
}
function renderOverlay(){
  // svg hit layer — crane triangles & lantern circles routed to pointer
  svg.innerHTML='';
  cranes.forEach(c=>{
    const el=document.createElementNS('http://www.w3.org/2000/svg','path');
    const s=c.size;
    el.setAttribute('d',`M${c.x} ${c.y} l${s} ${-s/2} l${-s/2} ${s/3} z`);
    el.setAttribute('class','hit');
    el.setAttribute('fill','transparent');
    el.setAttribute('data-id',c.id);
    svg.appendChild(el);
  });
  lanterns.forEach(l=>{
    const el=document.createElementNS('http://www.w3.org/2000/svg','circle');
    el.setAttribute('cx',l.x);el.setAttribute('cy',l.y);el.setAttribute('r',14);
    el.setAttribute('class','hit');el.setAttribute('fill','transparent');
    el.setAttribute('data-id',l.id);svg.appendChild(el);
  });
  svg.addEventListener('pointermove',onHover);
  svg.addEventListener('pointerleave',()=>tooltip.hidden=true);
  svg.addEventListener('click',onClick);
}
function lookup(id){return cranes.find(c=>c.id===id)||lanterns.find(l=>l.id===id)}
function onHover(e){
  const t=e.target;if(t.tagName==='svg'){tooltip.hidden=true;return}
  const id=t.getAttribute('data-id');if(!id)return;
  const it=lookup(id);if(!it)return;
  tooltip.textContent=`${it.district.name} · ${it.item.name}`;
  tooltip.style.left=(e.clientX-svg.getBoundingClientRect().left+12)+'px';
  tooltip.style.top=(e.clientY-svg.getBoundingClientRect().top+12)+'px';
  tooltip.hidden=false;
}
function onClick(e){
  const id=e.target.getAttribute&&e.target.getAttribute('data-id');if(!id)return;
  const it=lookup(id);if(!it)return;
  inspector.innerHTML=`<h2>${it.district.name}</h2>`+scroll(it.item);
}
function fit(){
  const rect=canvas.getBoundingClientRect();
  const dpr=window.devicePixelRatio||1;
  canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  W=rect.width;H=rect.height;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
}
function flicker(f,p,t){return 0.6+0.2*Math.sin(t*f[0]+p[0])+0.12*Math.sin(t*f[1]+p[1])+0.08*Math.sin(t*f[2]+p[2])}
let t=0;
function draw(){
  if(!paused){t+=1}
  ctx.clearRect(0,0,W,H);
  // tea-garden horizon
  const grd=ctx.createLinearGradient(0,H-160,0,H);
  grd.addColorStop(0,'#121a28');grd.addColorStop(1,'#0a0d15');
  ctx.fillStyle=grd;ctx.fillRect(0,H-160,W,160);
  // stars
  stars.forEach(s=>{
    const a=0.4+0.3*Math.sin(t*0.03+s.tw);
    ctx.globalAlpha=a;ctx.fillStyle='#f4f0e6';
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill();
  });
  ctx.globalAlpha=1;
  // constellations — consistent-hash ring
  ctx.strokeStyle='#2a3142';ctx.lineWidth=.6;
  for(let i=0;i<cranes.length;i++){
    const a=cranes[i],b=cranes[(i+3)%cranes.length];
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  // cranes
  cranes.forEach(c=>{
    if(!paused){c.x+=c.vx;c.y+=c.vy+Math.sin(t*0.01+c.phase[0])*.1;
      if(c.x<-30)c.x=W+30;if(c.x>W+30)c.x=-30}
    const a=flicker(c.freq,c.phase,t);
    ctx.globalAlpha=.7+.3*a;
    ctx.fillStyle=`hsl(${200+c.hue} 60% ${70+a*10}%)`;
    ctx.beginPath();
    ctx.moveTo(c.x,c.y);
    ctx.lineTo(c.x+c.size,c.y-c.size/2);
    ctx.lineTo(c.x+c.size/2,c.y+c.size/3);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(c.x,c.y);
    ctx.lineTo(c.x-c.size,c.y-c.size/2);
    ctx.lineTo(c.x-c.size/2,c.y+c.size/3);
    ctx.closePath();ctx.fill();
  });
  // lanterns with halo (lantern-visualization-pattern)
  lanterns.forEach(l=>{
    const a=flicker(l.freq,l.phase,t);
    const r=26+a*10;
    const g=ctx.createRadialGradient(l.x,l.y,2,l.x,l.y,r);
    g.addColorStop(0,'rgba(245,158,91,0.9)');
    g.addColorStop(1,'rgba(245,158,91,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(l.x,l.y,r,0,6.28);ctx.fill();
    ctx.fillStyle='#f59e5b';ctx.beginPath();ctx.arc(l.x,l.y,6,0,6.28);ctx.fill();
  });
  ctx.globalAlpha=1;
  requestAnimationFrame(draw);
}
window.addEventListener('resize',()=>{fit();spawn()});
window.addEventListener('keydown',e=>{
  if(e.key===' '){paused=!paused}
  if(e.key==='r'){rng=mkRng(Math.floor(Math.random()*1e9));spawn()}
});
fit();spawn();draw();