const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const infoEl = document.getElementById('info');
const modeLabel = document.getElementById('mode-label');
let states = [], transitions = [], mode = 'idle', dragging = null, transFrom = null;
let simState = null, simMode = false, stateCounter = 0;

// seed data
function seed(){
  states=[{id:'S0',x:150,y:200,initial:true},{id:'S1',x:350,y:120},{id:'S2',x:550,y:200},{id:'S3',x:350,y:320}];
  stateCounter=4;
  transitions=[{from:'S0',to:'S1',label:'a'},{from:'S1',to:'S2',label:'b'},{from:'S2',to:'S3',label:'c'},{from:'S3',to:'S0',label:'d'}];
}
seed();

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  transitions.forEach(t=>{
    const f=states.find(s=>s.id===t.from), to=states.find(s=>s.id===t.to); if(!f||!to)return;
    const dx=to.x-f.x,dy=to.y-f.y,len=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/len,uy=dy/len;
    ctx.beginPath(); ctx.moveTo(f.x+ux*30,f.y+uy*30); ctx.lineTo(to.x-ux*30,to.y-uy*30);
    ctx.strokeStyle='#3d444d'; ctx.lineWidth=2; ctx.stroke();
    const ax=to.x-ux*36,ay=to.y-uy*36;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax-ux*10+uy*5,ay-uy*10-ux*5);
    ctx.lineTo(ax-ux*10-uy*5,ay-uy*10+ux*5); ctx.closePath(); ctx.fillStyle='#3d444d'; ctx.fill();
    const mx=(f.x+to.x)/2, my=(f.y+to.y)/2-12;
    ctx.fillStyle='#8b949e'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.fillText(t.label,mx,my);
  });
  states.forEach(s=>{
    const active = simMode && simState===s.id;
    ctx.beginPath(); ctx.arc(s.x,s.y,28,0,Math.PI*2);
    ctx.fillStyle=active?'#6ee7b733':'#1a1d27';
    ctx.strokeStyle=active?'#6ee7b7':s.initial?'#6ee7b799':'#2d333b';
    ctx.lineWidth=active?3:s.initial?2.5:2; ctx.fill(); ctx.stroke();
    ctx.fillStyle=active?'#6ee7b7':'#c9d1d9'; ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(s.id,s.x,s.y);
  });
  if(mode==='place-state'){modeLabel.textContent='Click to place state';}
  else if(mode==='trans-from'){modeLabel.textContent='Click source state';}
  else if(mode==='trans-to'){modeLabel.textContent='Click target state';}
  else{modeLabel.textContent=simMode?'Simulate — click state':'Design Mode';}
}

function getState(x,y){return states.find(s=>Math.hypot(s.x-x,s.y-y)<30)}
function canvasXY(e){const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*(canvas.width/r.width),(e.clientY-r.top)*(canvas.height/r.height)]}

canvas.onmousedown=e=>{
  const [x,y]=canvasXY(e);
  if(mode==='place-state'){states.push({id:'S'+stateCounter++,x,y,initial:!states.length});mode='idle';draw();return}
  if(mode==='trans-from'){const s=getState(x,y);if(s){transFrom=s.id;mode='trans-to';draw();}return}
  if(mode==='trans-to'){const s=getState(x,y);if(s){const lbl=prompt('Transition label:','x');if(lbl)transitions.push({from:transFrom,to:s.id,label:lbl});mode='idle';draw();}return}
  if(simMode){const s=getState(x,y);if(s){simState=s.id;infoEl.textContent=`Current: ${s.id}. Outgoing: ${transitions.filter(t=>t.from===s.id).map(t=>`${t.label}→${t.to}`).join(', ')||'none'}`;draw();}return}
  const s=getState(x,y);if(s)dragging=s;
};
canvas.onmousemove=e=>{if(!dragging)return;const[x,y]=canvasXY(e);dragging.x=x;dragging.y=y;draw()};
canvas.onmouseup=()=>{dragging=null};

document.getElementById('add-state').onclick=()=>{mode='place-state';simMode=false;draw()};
document.getElementById('add-trans').onclick=()=>{mode='trans-from';simMode=false;draw()};
document.getElementById('sim-btn').onclick=()=>{simMode=!simMode;mode='idle';if(simMode){const init=states.find(s=>s.initial);simState=init?init.id:states[0]?.id;infoEl.textContent='Click states to simulate. Outgoing transitions shown below.';}else{simState=null;infoEl.textContent='Design mode.';}draw()};
document.getElementById('clear-btn').onclick=()=>{states=[];transitions=[];stateCounter=0;simMode=false;simState=null;mode='idle';infoEl.textContent='Cleared.';draw()};
draw();