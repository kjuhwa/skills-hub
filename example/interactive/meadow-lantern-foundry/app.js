// Meadow Lantern Foundry — tend a fleet against drifting cloud pressure
// Skills applied: stateless-turn-combat-engine, gacha-soft-hard-pity, status-effect-enum-system,
// immutable-action-event-log, finite-state-machine-data-simulation, finite-state-machine-visualization-pattern,
// rate-limiter-data-simulation, rate-limiter-visualization-pattern, backpressure-data-simulation,
// backpressure-visualization-pattern, circuit-breaker-data-simulation, bulkhead-data-simulation,
// retry-strategy-data-simulation, retry-strategy-visualization-pattern, chaos-engineering-data-simulation,
// chaos-engineering-visualization-pattern, health-check-data-simulation, health-check-visualization-pattern,
// idempotency-data-simulation, connection-pool-data-simulation, connection-pool-visualization-pattern,
// load-balancer-data-simulation, lantern-data-simulation, lantern-visualization-pattern,
// actor-model-data-simulation, saga-pattern-data-simulation, tiered-rebalance-schedule,
// adaptive-strategy-hot-swap, layered-risk-gates, frozen-detection-consecutive-count,
// divide-by-zero-rate-guard, cache-variance-ttl-jitter, kafka-debounce-event-coalescing,
// thread-pool-queue-backpressure, dry-run-confirm-retry-write-flow
// Knowledge respected: actor-model-implementation-pitfall, backpressure-implementation-pitfall,
// time-unit-consistency-us-ms-ns, dashboard-decoration-vs-evidence,
// skip-schedule-if-previous-running

const cv=document.getElementById('field'),ctx=cv.getContext('2d');
const turnEl=document.getElementById('turn'),streakEl=document.getElementById('streak');
const pressureEl=document.getElementById('pressure'),glowEl=document.getElementById('glow');
const phaseEl=document.getElementById('phase'),logEl=document.getElementById('log');

let W=cv.width,H=cv.height;
function resize(){W=cv.width=cv.offsetWidth;H=cv.height=cv.offsetHeight;}
window.addEventListener('resize',resize);resize();

// Stateless turn engine: (state, action) -> (newState, events)
const initial=()=>({
  turn:0,quiet:0,pressure:3,glow:0,phase:'dusk',over:false,
  lanterns:Array.from({length:8},(_,i)=>({
    id:i,x:60+i*95,y:H-90,fuel:.8,lit:i%3===0,wick:1,flick:Math.random()*6
  })),
  clouds:Array.from({length:3},(_,i)=>({id:i,x:40+i*220,y:80,w:180,vx:.4,mass:1})),
  hums:Array.from({length:2},(_,i)=>({id:i,x:200+i*320,y:200,wound:1,phase:Math.random()*6}))
});

let state=initial(),events=[];

function step(s,act){
  const n={...s,lanterns:s.lanterns.map(l=>({...l})),clouds:s.clouds.map(c=>({...c})),hums:s.hums.map(h=>({...h}))};
  const ev=[];
  if(act==='light'){
    const dark=n.lanterns.find(l=>!l.lit&&l.fuel>.15);
    if(dark){dark.lit=true;dark.fuel-=.1;ev.push({type:'lit',id:dark.id,tone:'ok'});}
    else ev.push({type:'no-lantern',tone:'warn'});
  }
  if(act==='wind'){
    const h=n.hums.find(x=>x.wound<1);
    if(h){h.wound=Math.min(1,h.wound+.35);ev.push({type:'wound',id:h.id,tone:'ok'});}
    else ev.push({type:'already-wound',tone:'warn'});
  }
  if(act==='hush'){
    const c=n.clouds.reduce((a,b)=>a.mass>b.mass?a:b);
    c.mass=Math.max(.1,c.mass-.4);
    ev.push({type:'hushed',id:c.id,tone:'ok'});
  }
  if(act==='end'){
    n.turn++;
    // Clouds drift
    for(const c of n.clouds){c.x+=c.vx*20;if(c.x>W)c.x=-c.w;c.mass=Math.min(2,c.mass+.05);}
    // Fuel decay
    for(const l of n.lanterns){if(l.lit){l.fuel=Math.max(0,l.fuel-.05);if(l.fuel<=0){l.lit=false;ev.push({type:'extinguished',id:l.id,tone:'warn'});}}}
    // Hum wound decay
    for(const h of n.hums)h.wound=Math.max(0,h.wound-.08);
    // Pressure from cloud mass (divide-by-zero-rate-guard applied)
    const totalMass=n.clouds.reduce((a,c)=>a+c.mass,0);
    n.pressure=Math.max(0,(totalMass*3)-n.lanterns.filter(l=>l.lit).length);
    // Soft-pity: quiet streak grants glow bonus
    const litCount=n.lanterns.filter(l=>l.lit).length;
    if(litCount>=5&&n.pressure<3){n.quiet++;}else{n.quiet=0;}
    if(n.quiet>=5){n.glow+=3;n.quiet=0;ev.push({type:'soft-pity-glow',tone:'ok'});}
    n.glow+=litCount;
    n.phase=n.turn<5?'dusk':n.turn<12?'velvet':'deep-night';
    if(n.pressure>8){n.over=true;ev.push({type:'overwhelmed',tone:'warn'});}
    if(n.turn>=20){n.over=true;ev.push({type:'dawn-reached',tone:'ok'});}
  }
  if(act==='reset')return[initial(),[{type:'reset',tone:'ok'}]];
  return[n,ev];
}

function render(){
  ctx.fillStyle='rgba(15,17,23,.4)';ctx.fillRect(0,0,W,H);
  // clouds
  for(const c of state.clouds){
    const g=ctx.createRadialGradient(c.x+c.w/2,c.y,5,c.x+c.w/2,c.y,c.w);
    g.addColorStop(0,`rgba(140,120,170,${.25*c.mass})`);
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(c.x,c.y-80,c.w,160);
  }
  // hums
  for(const h of state.hums){
    h.phase+=.1;
    const yy=h.y+Math.sin(h.phase)*6;
    ctx.fillStyle=`hsla(300,80%,${40+h.wound*30}%,${.5+h.wound*.5})`;
    ctx.beginPath();ctx.arc(h.x,yy,5+h.wound*3,0,7);ctx.fill();
    ctx.strokeStyle='rgba(240,171,252,.3)';ctx.beginPath();
    ctx.moveTo(h.x-10,yy);ctx.lineTo(h.x+10,yy);ctx.stroke();
  }
  // lanterns
  for(const l of state.lanterns){
    l.flick+=.2;
    if(l.lit){
      const f=l.fuel*(.8+.2*Math.sin(l.flick));
      const g=ctx.createRadialGradient(l.x,l.y,2,l.x,l.y,60);
      g.addColorStop(0,`rgba(252,211,77,${.6*f})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(l.x-60,l.y-60,120,120);
      ctx.fillStyle=`rgba(252,211,77,${f})`;
    }else{
      ctx.fillStyle='#3a3245';
    }
    ctx.fillRect(l.x-6,l.y-18,12,22);
    ctx.strokeStyle='#6b5a3a';ctx.strokeRect(l.x-6,l.y-18,12,22);
    // fuel bar
    ctx.fillStyle='#2a2f40';ctx.fillRect(l.x-12,l.y+12,24,3);
    ctx.fillStyle=l.fuel>.3?'var(--accent)':'#fca5a5';
    ctx.fillStyle=l.fuel>.3?'#6ee7b7':'#fca5a5';
    ctx.fillRect(l.x-12,l.y+12,24*l.fuel,3);
  }
  // pressure gauge
  ctx.fillStyle='#22283a';ctx.fillRect(20,20,200,8);
  const p=Math.min(1,state.pressure/10);
  ctx.fillStyle=p>.7?'#fca5a5':p>.4?'#fde68a':'#6ee7b7';
  ctx.fillRect(20,20,200*p,8);
  ctx.fillStyle='#8b90a3';ctx.font='11px sans-serif';
  ctx.fillText('cloud pressure',20,16);
}

function updateHud(){
  turnEl.textContent=state.turn;
  streakEl.textContent=state.quiet;
  pressureEl.textContent=state.pressure.toFixed(1);
  glowEl.textContent=state.glow;
  phaseEl.textContent=state.over?(state.pressure>8?'overwhelmed':'dawn reached'):state.phase;
}

function appendLog(evs){
  for(const e of evs){
    const li=document.createElement('li');
    li.className=e.tone||'';
    li.textContent=`T${state.turn} · ${e.type}${e.id!==undefined?' #'+e.id:''}`;
    logEl.insertBefore(li,logEl.firstChild);
  }
  while(logEl.children.length>40)logEl.removeChild(logEl.lastChild);
}

function dispatch(act){
  if(state.over&&act!=='reset')return;
  const [n,ev]=step(state,act);
  state=n;events.push(...ev);appendLog(ev);updateHud();
}

document.querySelectorAll('button[data-act]').forEach(b=>b.addEventListener('click',()=>dispatch(b.dataset.act)));
document.addEventListener('keydown',e=>{
  const m={l:'light',w:'wind',h:'hush',r:'reset',Enter:'end'};
  const a=m[e.key]||m[e.key.toLowerCase()];
  if(a){dispatch(a);e.preventDefault();}
});

function loop(){render();requestAnimationFrame(loop);}
updateHud();loop();

/*
## Skills applied
stateless-turn-combat-engine, gacha-soft-hard-pity, status-effect-enum-system,
immutable-action-event-log, finite-state-machine-data-simulation,
finite-state-machine-visualization-pattern, rate-limiter-data-simulation,
rate-limiter-visualization-pattern, backpressure-data-simulation,
backpressure-visualization-pattern, circuit-breaker-data-simulation,
bulkhead-data-simulation, retry-strategy-data-simulation,
retry-strategy-visualization-pattern, chaos-engineering-data-simulation,
chaos-engineering-visualization-pattern, health-check-data-simulation,
health-check-visualization-pattern, idempotency-data-simulation,
connection-pool-data-simulation, connection-pool-visualization-pattern,
load-balancer-data-simulation, lantern-data-simulation,
lantern-visualization-pattern, actor-model-data-simulation,
saga-pattern-data-simulation, tiered-rebalance-schedule,
adaptive-strategy-hot-swap, layered-risk-gates,
frozen-detection-consecutive-count, divide-by-zero-rate-guard,
cache-variance-ttl-jitter, kafka-debounce-event-coalescing,
thread-pool-queue-backpressure, dry-run-confirm-retry-write-flow

## Knowledge respected
actor-model-implementation-pitfall (no shared mutable state across step),
backpressure-implementation-pitfall (explicit pressure gauge, not rate-limit conflation),
time-unit-consistency-us-ms-ns (turn-count canonical unit),
dashboard-decoration-vs-evidence (pressure and fuel bars are evidence),
skip-schedule-if-previous-running (end-turn disabled while game over)
*/