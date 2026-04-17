const v = document.getElementById('view'), vx = v.getContext('2d');
const dpr = Math.max(1, devicePixelRatio||1);
function res(){ v.width=v.clientWidth*dpr; v.height=v.clientHeight*dpr; } res(); addEventListener('resize', res);

let seed = 'tide';
function rnd(s){ let h=2166136261>>>0; for(const c of s){h^=c.charCodeAt(0); h=Math.imul(h,16777619)>>>0;} return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%100000)/100000; }; }
let R = rnd(seed);

// reducer-safe state
const init = ()=> JSON.parse(JSON.stringify({
  o2: 100, oil: 80, charts: 0, depth: 120, pity: 0, failStreak: 0,
  currents: Array.from({length:4},(_,i)=>({id:i,strength:R(),dir:R()<.5?-1:1})),
  songPhase: 0, log: [], finished:false
}));
let S = init();

const $ = id => document.getElementById(id);
const actions = { drift:drift, ride:ride, chart:chart, refuel:refuel };

document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>step(b.dataset.act));
addEventListener('keydown', e=>{ const m={'1':'drift','2':'ride','3':'chart','4':'refuel'}[e.key]; if(m) step(m); });

function log(msg,cls=''){ S.log.unshift({msg,cls}); if(S.log.length>40) S.log.pop(); render(); }

// pure step: (state,action)->{state,events}
function step(act){
  if(S.finished) return;
  const before = JSON.parse(JSON.stringify(S));
  const ev = actions[act](S);
  S.o2 = Math.max(0, S.o2 - 2);
  S.oil = Math.max(0, S.oil - 1);
  if(S.oil <= 0){ S.failStreak++; log('lantern sputters — dark run','bad'); }
  // layered-risk-gates: circuit-breaker after 3 flounders
  if(S.failStreak >= 3){ finish('kraken stirs — retreat forced'); return; }
  if(S.o2 <= 0){ finish('oxygen spent — surfaced sleeping'); return; }
  if(S.charts >= 6){ finish('atlas complete — cartographers jubilant'); return; }
  ev.forEach(e=>log(e.msg, e.cls));
  render(); pulse();
}

function drift(s){
  const cur = s.currents[Math.floor(R()*s.currents.length)];
  const flow = cur.strength * cur.dir;
  s.depth = Math.max(40, Math.min(900, s.depth + Math.round(flow*40)));
  s.songPhase += .3;
  return [{msg:`drift · current ${flow.toFixed(2)} → depth ${s.depth}m`, cls: flow>0?'':'warm'}];
}

function ride(s){
  // phase-window-timing-grade-with-pity
  const target = Math.PI; // golden window center
  const delta = Math.abs(((s.songPhase%6.28) - target));
  const window = 0.6 + Math.min(0.8, s.pity*0.15); // pity expands window
  if(delta < window){
    s.pity = 0; s.failStreak = 0;
    const rare = R() < 0.1 + s.pity*0.05;
    s.charts += rare ? 2 : 1;
    return [{msg: rare? 'perfect ride — rare temple logged' : 'rode whale-song crest +1 chart', cls:'good'}];
  } else {
    s.pity++; s.failStreak++;
    return [{msg:`missed the crest (Δ ${delta.toFixed(2)})`, cls:'bad'}];
  }
}

function chart(s){
  // gacha soft-pity: chance rises with pity
  const roll = R();
  const chance = .35 + s.pity*0.08;
  if(roll < chance){
    s.charts++; s.pity = Math.max(0, s.pity-1); s.failStreak = 0;
    return [{msg:`charted a glyph (roll ${roll.toFixed(2)} < ${chance.toFixed(2)})`, cls:'good'}];
  }
  s.pity++; s.failStreak++;
  return [{msg:`fog too thick (roll ${roll.toFixed(2)} ≥ ${chance.toFixed(2)}) · pity ${s.pity}`, cls:'warm'}];
}

function refuel(s){
  s.oil = Math.min(100, s.oil + 22);
  s.failStreak = 0;
  return [{msg:'lantern rekindled', cls:'warm'}];
}

function finish(msg){
  S.finished = true;
  log(msg, 'good');
  render();
}

// pulse feedback
const pulseEl = document.getElementById('pulse');
function pulse(){ pulseEl.classList.remove('active'); void pulseEl.offsetWidth; pulseEl.classList.add('active'); }

// render
function render(){
  $('gO2').style.width = S.o2+'%';
  $('gOil').style.width = S.oil+'%';
  $('gMap').style.width = (S.charts/6*100)+'%';
  $('sDepth').textContent = S.depth+' m';
  $('sCurrent').textContent = S.currents[0].strength.toFixed(2);
  $('sSong').textContent = ((S.songPhase%6.28)/6.28).toFixed(2);
  $('sPity').textContent = S.pity;
  document.querySelectorAll('.actions button').forEach(b=> b.disabled = S.finished);
  const l = $('log'); l.innerHTML = S.log.map(e=>`<div class="e ${e.cls}">${e.msg}</div>`).join('');
  draw();
}

// incommensurate-sine lantern flicker + parallax kelp
let t=0;
function draw(){
  const W=v.width,H=v.height;
  const g = vx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0a0f1a'); g.addColorStop(1,'#04070e');
  vx.fillStyle=g; vx.fillRect(0,0,W,H);

  // kelp bands (parallax 3 layers)
  for(let k=0;k<3;k++){
    const op = 0.15 + k*0.12;
    vx.fillStyle = `rgba(30,70,50,${op})`;
    vx.beginPath(); vx.moveTo(0,H);
    for(let x=0;x<=W;x+=14){
      const y = H - (60 + k*80) - Math.sin(t*.4 + x*.008 + k)*12 - Math.sin(t*.17+x*.02+k*1.3)*6;
      vx.lineTo(x,y);
    }
    vx.lineTo(W,H); vx.closePath(); vx.fill();
  }
  // whale song pulse position
  const cx = W/2, cy = H*.45;
  for(let i=0;i<3;i++){
    const r = (i+1)*80 + (t*60)%240;
    vx.strokeStyle = `rgba(110,231,183,${(.4-i*.12)*(1-((t*60)%240)/240)})`;
    vx.lineWidth = 2;
    vx.beginPath(); vx.arc(cx,cy,r,0,7); vx.stroke();
  }
  // submersible
  const flick = (Math.sin(t*2.3)+Math.sin(t*3.7))*.2+.8;
  vx.fillStyle = '#243045';
  vx.beginPath(); vx.ellipse(cx,cy,34,18,0,0,7); vx.fill();
  vx.fillStyle = `rgba(255,214,165,${flick})`;
  vx.beginPath(); vx.arc(cx+24,cy,4,0,7); vx.fill();
  vx.strokeStyle=`rgba(255,214,165,${flick*.4})`; vx.lineWidth=1;
  vx.beginPath(); vx.moveTo(cx+24,cy); vx.lineTo(W,cy+20); vx.lineTo(W,cy-20); vx.closePath(); vx.stroke();
  t += .05;
  requestAnimationFrame(draw);
}
render();