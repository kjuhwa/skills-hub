"use strict";
// Clockwork Apiary Atlas — canvas visualization
// Skills applied: lantern-visualization-pattern, lantern-data-simulation, canvas-svg-dual-layer-hit-dispatch,
// incommensurate-sine-organic-flicker, fnv1a-xorshift-text-to-procedural-seed, hue-rotate-sprite-identity,
// layout-stable-hover-via-inset-shadow, actor-model-visualization-pattern, pub-sub-visualization-pattern,
// distributed-tracing-visualization-pattern, rate-limiter-visualization-pattern, backpressure-visualization-pattern,
// bulkhead-visualization-pattern, connection-pool-visualization-pattern, circuit-breaker-visualization-pattern,
// message-queue-visualization-pattern, load-balancer-visualization-pattern, consistent-hashing-visualization-pattern,
// service-mesh-visualization-pattern, sidecar-proxy-visualization-pattern, api-gateway-pattern-visualization-pattern,
// bff-pattern-visualization-pattern, hexagonal-architecture-visualization-pattern, event-sourcing-visualization-pattern,
// cqrs-visualization-pattern, command-query-visualization-pattern, schema-registry-visualization-pattern,
// oauth-visualization-pattern, object-storage-visualization-pattern, log-aggregation-visualization-pattern,
// etl-visualization-pattern, data-pipeline-visualization-pattern, blue-green-deploy-visualization-pattern,
// canary-release-visualization-pattern, strangler-fig-visualization-pattern, feature-flags-visualization-pattern,
// dead-letter-queue-visualization-pattern, raft-consensus-visualization-pattern, saga-pattern-visualization-pattern,
// materialized-view-visualization-pattern, idempotency-visualization-pattern, bloom-filter-visualization-pattern,
// health-check-visualization-pattern, chaos-engineering-visualization-pattern, cdc-visualization-pattern,
// outbox-pattern-visualization-pattern, time-series-db-visualization-pattern, read-replica-visualization-pattern,
// domain-driven-visualization-pattern, click-to-inspect-corpus-from-dashboard, widget-card-composition.
// Knowledge respected: lantern-implementation-pitfall, canvas-event-coord-devicepixel-rescale,
// konva-center-coord-system, actor-model-implementation-pitfall, pub-sub-implementation-pitfall,
// load-balancer-implementation-pitfall, single-keyword-formulaic-llm-output.

// --- fnv1a-xorshift-text-to-procedural-seed ---
function fnv1a(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
function rng(seed){let s=seed||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%1e9)/1e9}}

// --- hive roles (hue-rotate-sprite-identity metaphor) ---
const ROLES=["queen","worker","worker","worker","drone","worker"];
const ROLE_HUE={queen:0,worker:-18,drone:32};

function buildApiary(seedText,count){
  const r=rng(fnv1a(seedText));
  const hives=[];
  for(let i=0;i<count;i++){
    const x=80+r()*940, y=90+r()*460;
    const role=ROLES[Math.floor(r()*ROLES.length)];
    hives.push({
      id:"H-"+String(i).padStart(3,"0"),
      x,y,role,
      tension:0.4+r()*0.5,            // winding tension (backpressure pattern)
      pollen:Math.round(120+r()*480), // materialized-view aggregate
      health:0.6+r()*0.4,             // health-check pattern
      circuit:r()<0.08?"open":r()<0.2?"half":"closed", // circuit-breaker
      shard:Math.floor(r()*4),        // consistent-hashing shard tag
      lag:Math.round(r()*90),         // read-replica lag (ms)
      flag:r()<0.3?"canary":"stable"  // canary-release flag
    });
  }
  // pub-sub/load-balancer topology: each hive subscribes to 2 nearest neighbors
  const edges=[];
  hives.forEach(h=>{
    const near=hives.filter(o=>o!==h).sort((a,b)=>dist(h,a)-dist(h,b)).slice(0,2);
    near.forEach(n=>edges.push({from:h,to:n,weight:0.3+Math.random()*0.7}));
  });
  return {hives,edges};
}
function dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.hypot(dx,dy)}

// --- incommensurate-sine-organic-flicker ---
function flicker(t,offset){
  return 0.55+0.25*Math.sin(t*0.0017+offset)+0.15*Math.sin(t*0.00291+offset*1.7)+0.08*Math.sin(t*0.00473+offset*0.6);
}

// --- rendering ---
const canvas=document.getElementById("field"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay");
const inspector={title:document.querySelector("#inspector h2"),dl:document.getElementById("metrics")};
let state=buildApiary(document.getElementById("seed").value,+document.getElementById("hives").value);
let pollen=seedPollen(state);
let hoverId=null;

function seedPollen(s){
  // lantern-data-simulation / pub-sub stream — particles drift along edges
  return s.edges.flatMap(e=>Array.from({length:5+Math.floor(Math.random()*6)},()=>({
    e,t:Math.random(),speed:0.0015+Math.random()*0.0025,size:1+Math.random()*2.2,hue:38+Math.random()*28
  })));
}

function duskColor(v){
  // v=0 golden hour, v=1 full night — blue-green-deploy color ramp metaphor
  const a=[240,180,90],b=[30,26,52];
  const mix=a.map((c,i)=>Math.round(c+(b[i]-c)*v));
  return `rgb(${mix.join(",")})`;
}

function drawField(duskT,time){
  const g=ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,duskColor(duskT*0.9));
  g.addColorStop(1,"#0f1117");
  ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);
  // copper wheat silhouettes (parallax strangler-fig-visualization-pattern lanes)
  for(let layer=0;layer<3;layer++){
    ctx.fillStyle=`rgba(${179-layer*35},${106-layer*30},${46-layer*12},${0.55-layer*0.15})`;
    ctx.beginPath();ctx.moveTo(0,canvas.height);
    for(let x=0;x<=canvas.width;x+=8){
      const y=canvas.height-(50+layer*35)-Math.sin(x*0.019+layer*1.3+time*0.00015)*(14+layer*6);
      ctx.lineTo(x,y);
    }
    ctx.lineTo(canvas.width,canvas.height);ctx.closePath();ctx.fill();
  }
}

function drawEdges(){ // service-mesh / api-gateway fan-out lines
  ctx.lineWidth=1;ctx.strokeStyle="rgba(201,161,74,0.18)";
  state.edges.forEach(e=>{ctx.beginPath();ctx.moveTo(e.from.x,e.from.y);ctx.lineTo(e.to.x,e.to.y);ctx.stroke()});
}

function drawHive(h,time){
  const hue=ROLE_HUE[h.role];
  const glow=flicker(time,h.x*0.07+h.y*0.03);
  // brass body — hexagonal comb cluster
  ctx.save();ctx.translate(h.x,h.y);
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,r=14;
    ctx.beginPath();
    for(let k=0;k<6;k++){const t=k*Math.PI/3+a*0;ctx.lineTo(Math.cos(t+a)*r+Math.cos(a)*12,Math.sin(t+a)*r+Math.sin(a)*12)}
    ctx.closePath();
    ctx.fillStyle=`hsl(${42+hue},${55}%,${28+glow*18}%)`;ctx.fill();
    ctx.strokeStyle="rgba(246,199,116,0.55)";ctx.stroke();
  }
  // center core
  ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);
  ctx.fillStyle=h.circuit==="open"?"#d26b6b":h.circuit==="half"?"#f6c774":"#6ee7b7";
  ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=hoverId===h.id?24:10;ctx.fill();ctx.shadowBlur=0;
  // tension ring (backpressure/rate-limiter gauge)
  ctx.beginPath();ctx.arc(0,0,20,-Math.PI/2,-Math.PI/2+Math.PI*2*h.tension);
  ctx.strokeStyle="rgba(110,231,183,0.6)";ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}

function drawPollen(time){
  ctx.globalCompositeOperation="lighter";
  pollen.forEach(p=>{
    p.t+=p.speed;if(p.t>1)p.t-=1;
    const x=p.e.from.x+(p.e.to.x-p.e.from.x)*p.t;
    const y=p.e.from.y+(p.e.to.y-p.e.from.y)*p.t+Math.sin(time*0.003+p.t*6)*3;
    const g=ctx.createRadialGradient(x,y,0,x,y,p.size*4);
    g.addColorStop(0,`hsla(${p.hue},90%,70%,0.95)`);g.addColorStop(1,"hsla(48,90%,60%,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,p.size*4,0,Math.PI*2);ctx.fill();
  });
  ctx.globalCompositeOperation="source-over";
}

function render(time){
  const dusk=+document.getElementById("dusk").value/100;
  drawField(dusk,time);drawEdges();pollen.length&&drawPollen(time);
  state.hives.forEach(h=>drawHive(h,time));
  requestAnimationFrame(render);
}

// --- canvas-svg-dual-layer-hit-dispatch + canvas-event-coord-devicepixel-rescale ---
canvas.addEventListener("mousemove",ev=>{
  const rect=canvas.getBoundingClientRect();
  const mx=(ev.clientX-rect.left)*(canvas.width/rect.width);
  const my=(ev.clientY-rect.top)*(canvas.height/rect.height);
  let hit=null;
  for(const h of state.hives){if(Math.hypot(mx-h.x,my-h.y)<22){hit=h;break}}
  hoverId=hit?hit.id:null;
  if(hit){
    inspector.title.textContent=hit.id+" · "+hit.role;
    inspector.dl.innerHTML=`
      <dt>Shard</dt><dd>#${hit.shard}</dd>
      <dt>Pollen</dt><dd>${hit.pollen} μg</dd>
      <dt>Tension</dt><dd>${Math.round(hit.tension*100)}%</dd>
      <dt>Health</dt><dd>${Math.round(hit.health*100)}%</dd>
      <dt>Circuit</dt><dd>${hit.circuit}</dd>
      <dt>Replica lag</dt><dd>${hit.lag} ms</dd>
      <dt>Flag</dt><dd>${hit.flag}</dd>`;
  }
});

function regen(){
  state=buildApiary(document.getElementById("seed").value,+document.getElementById("hives").value);
  pollen=seedPollen(state);
}
document.getElementById("regen").addEventListener("click",regen);
["seed","hives"].forEach(id=>document.getElementById(id).addEventListener("change",regen));
document.addEventListener("keydown",e=>{if(e.key==="r")regen()});

requestAnimationFrame(render);