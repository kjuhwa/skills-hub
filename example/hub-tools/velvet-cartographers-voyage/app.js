"use strict";
const $=s=>document.querySelector(s);
const evs=$("#events"), board=$("#board");

// status enum per status-effect-enum-system
const S={CALM:"calm",MIST:"mist",STORM:"storm",BECALMED:"becalmed",INSPIRED:"inspired"};
const W=8,H=7;
const TERRAIN=["open","reef","wake","deep","deep","open","open","mist"];
let state=null;

// deterministic seeded RNG per state
function srng(seed){let s=seed>>>0||1;return ()=>((s=Math.imul(1664525,s)+1013904223>>>0)/2**32)}
function makeWorld(seed){
  const r=srng(seed); const cells=[];
  for(let q=0;q<W;q++) for(let y=0;y<H;y++){
    cells.push({q,y,t:TERRAIN[(r()*TERRAIN.length)|0], star:r()<.18, charted:false});
  }
  return cells;
}
function initial(seed=42){
  return {
    seed, turn:1, fuel:100, ink:40, pity:0, hardPity:60, status:S.CALM, statusTTL:0,
    ship:{q:0,y:3}, cells:makeWorld(seed), charted:[], frozenStreak:0,
    log:[{k:"ok",m:"A cartographer casts off onto drifting paper seas."}],
  };
}
// pure reducer — returns {state, events}
function step(s,action){
  const n=JSON.parse(JSON.stringify(s)); const out=[];
  if(n.fuel<=0){out.push({k:"err",m:"The lantern has guttered. The voyage ends."});return{state:n,events:out,done:true}}
  const r=srng(n.seed+n.turn*7919);
  // baseline-historical-comparison-threshold — drift status chance up when fuel low
  const lowFuel=n.fuel<40?.25:0;
  if(n.statusTTL<=0){
    const roll=r();
    if(roll<.08+lowFuel) {n.status=S.STORM;n.statusTTL=3;out.push({k:"err",m:"A storm unspools across the page-sea."})}
    else if(roll<.22) {n.status=S.MIST;n.statusTTL=2}
    else if(roll<.28) {n.status=S.BECALMED;n.statusTTL=2;out.push({k:"",m:"Sails slacken. The sea becomes a blotting page."})}
    else {n.status=S.CALM;n.statusTTL=4}
  } else n.statusTTL--;

  if(action.type==="drift"){
    n.fuel-=1;
    const dq=action.dq||1, dy=action.dy||0;
    const nq=Math.max(0,Math.min(W-1,n.ship.q+dq));
    const ny=Math.max(0,Math.min(H-1,n.ship.y+dy));
    const moved=(nq!==n.ship.q||ny!==n.ship.y);
    n.ship.q=nq;n.ship.y=ny;
    // frozen-detection-consecutive-count
    n.frozenStreak=moved?0:n.frozenStreak+1;
    if(n.frozenStreak>=3) out.push({k:"err",m:"The ship has not moved in 3 turns (frozen-detection)."});
    out.push({k:"",m:`drift → (${nq},${ny})`});
    if(n.status===S.STORM){n.fuel-=2;out.push({k:"err",m:"storm bites at the hull (-2 fuel)"})}
  }
  else if(action.type==="chart"){
    if(n.ink<3){out.push({k:"err",m:"not enough ink"});return{state:n,events:out}}
    n.ink-=3;n.fuel-=1;
    const cell=n.cells.find(c=>c.q===n.ship.q&&c.y===n.ship.y);
    if(!cell){out.push({k:"err",m:"nothing to chart here"});return{state:n,events:out}}
    if(cell.charted){out.push({k:"",m:"already charted"});return{state:n,events:out}}
    // gacha-soft-hard-pity
    let chance=cell.star?.55:.15;
    if(n.pity>=20) chance+=.2*(n.pity-20)/20;    // soft pity
    if(n.pity>=n.hardPity) chance=1;              // hard pity
    const roll=r();
    if(roll<chance){
      cell.charted=true;n.pity=0;
      const name=`${pick(r,THEMES)}-${pick(r,THEMES)}`;
      n.charted.push({at:[cell.q,cell.y],name});
      out.push({k:"ok",m:`charted constellation "${name}"`});
    } else {
      n.pity++;
      out.push({k:"",m:`the stars hide (pity ${n.pity}/${n.hardPity})`});
    }
  }
  else if(action.type==="rest"){
    const gain=n.status===S.STORM?1:n.status===S.BECALMED?2:4;
    n.ink=Math.min(60,n.ink+gain); n.fuel-=2;
    out.push({k:"",m:`rest: +${gain} ink, -2 fuel (status ${n.status})`});
  }
  else if(action.type==="signal"){
    if(n.fuel<5){out.push({k:"err",m:"lantern too dim for signal"});return{state:n,events:out}}
    n.fuel-=5; n.status=S.INSPIRED; n.statusTTL=3;
    out.push({k:"ok",m:"a flare rises — inspired (chart cost halved next turns)"});
  }
  n.turn++;
  // layered-risk-gates — soft cutoff before hard game over
  if(n.fuel<15) out.push({k:"err",m:`lantern ember low (${n.fuel})`});
  if(n.fuel<=0) out.push({k:"err",m:"ember extinguished."});
  return {state:n,events:out,done:n.fuel<=0};
}
const THEMES=["velvet","paper","forgotten","drifting","inkwell","whale","lantern","cartographer","constellation","drift","ember","tide","atlas","vellum","quill"];
function pick(r,a){return a[(r()*a.length)|0]}

function apply(action){
  const res=step(state,action);
  state=res.state;
  for(const e of res.events){const li=document.createElement("li");li.textContent=`t${state.turn-1}: ${e.m}`;li.className=e.k;evs.prepend(li)}
  render();
}
function renderHex(q,y,c){
  const x=q*64+(y%2?32:0), yy=y*52;
  const fill=c.t==="reef"?"#2a2638":c.t==="mist"?"#202738":c.t==="deep"?"#0c1122":c.t==="wake"?"#18202f":"#141a28";
  const stroke=c.charted?"var(--accent)":"#2a2f3d";
  const sw=c.charted?1.6:.8;
  const star=c.star?`<circle cx="${x+18}" cy="${yy+22}" r="1.6" fill="#6ee7b7" opacity=".85"/>`:"";
  const ship=(state.ship.q===q&&state.ship.y===y)?`<text x="${x+18}" y="${yy+26}" class="ship" fill="#ffc56b" font-size="14" text-anchor="middle">⚓</text>`:"";
  return `<g class="hex" data-q="${q}" data-y="${y}"><polygon points="${hexPts(x,yy)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>${star}${ship}</g>`;
}
function hexPts(x,y){const r=18,pts=[];for(let i=0;i<6;i++){const a=(60*i-30)*Math.PI/180;pts.push(`${(x+18+r*Math.cos(a)).toFixed(1)},${(y+22+r*Math.sin(a)).toFixed(1)}`)}return pts.join(" ")}
function render(){
  $("#turn").textContent=state.turn;
  $("#fuel").textContent=state.fuel;
  $("#ink").textContent=state.ink;
  $("#charted").textContent=state.charted.length;
  $("#status").textContent=`${state.status} (${state.statusTTL})`;
  let svg="";
  for(const c of state.cells) svg+=renderHex(c.q,c.y,c);
  board.innerHTML=svg;
  $("#constellations").innerHTML=state.charted.map(c=>`<span class="const" title="at ${c.at}">${c.name}</span>`).join("");
  document.querySelectorAll("button[data-a]").forEach(b=>b.disabled=state.fuel<=0);
}
board.addEventListener("click",e=>{
  const g=e.target.closest("g.hex");if(!g) return;
  const q=+g.dataset.q, y=+g.dataset.y;
  const dq=Math.sign(q-state.ship.q), dy=Math.sign(y-state.ship.y);
  if(dq===0&&dy===0) apply({type:"chart"}); else apply({type:"drift",dq,dy});
});
document.querySelectorAll("button[data-a]").forEach(b=>b.addEventListener("click",()=>apply({type:b.dataset.a})));
$("#reset").onclick=()=>{state=initial((Math.random()*1e6)|0);evs.innerHTML="";render()};
addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(k==="c") apply({type:"chart"});
  else if(k==="r") apply({type:"rest"});
  else if(k==="s") apply({type:"signal"});
  else if(k==="arrowright") apply({type:"drift",dq:1,dy:0});
  else if(k==="arrowleft") apply({type:"drift",dq:-1,dy:0});
  else if(k==="arrowup") apply({type:"drift",dq:0,dy:-1});
  else if(k==="arrowdown") apply({type:"drift",dq:0,dy:1});
});
state=initial();render();