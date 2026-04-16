const states={IDLE:{x:100,y:200},LOADING:{x:350,y:80},SUCCESS:{x:600,y:140},ERROR:{x:600,y:300},RETRY:{x:350,y:320}};
const transitions=[
  {from:'IDLE',to:'LOADING',event:'FETCH'},
  {from:'LOADING',to:'SUCCESS',event:'RESOLVE'},
  {from:'LOADING',to:'ERROR',event:'REJECT'},
  {from:'ERROR',to:'RETRY',event:'RETRY'},
  {from:'RETRY',to:'LOADING',event:'FETCH'},
  {from:'SUCCESS',to:'IDLE',event:'RESET'},
];
let current='IDLE';
const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const logEl=document.getElementById('log');
function getEventsFrom(s){return transitions.filter(t=>t.from===s)}
function renderButtons(){
  const el=document.getElementById('events');el.innerHTML='';
  const avail=getEventsFrom(current);
  transitions.forEach(t=>{
    const b=document.createElement('button');b.textContent=t.event;
    b.disabled=!avail.find(a=>a.event===t.event);
    b.onclick=()=>fire(t.event);el.appendChild(b);
  });
}
function fire(ev){
  const t=transitions.find(tr=>tr.from===current&&tr.event===ev);
  if(!t)return;
  const prev=current;current=t.to;
  document.getElementById('current').textContent=current;
  const d=document.createElement('div');d.textContent=`${prev} —${ev}→ ${current}`;
  logEl.prepend(d);
  renderButtons();draw();
}
function arrow(x1,y1,x2,y2,label,active){
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
  const ux=dx/len,uy=dy/len;
  const sx=x1+ux*30,sy=y1+uy*30,ex=x2-ux*30,ey=y2-uy*30;
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);
  ctx.strokeStyle=active?'#6ee7b7':'#ffffff22';ctx.lineWidth=active?2.5:1.2;ctx.stroke();
  const a=Math.atan2(ey-sy,ex-sx);
  ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-10*Math.cos(a-.4),ey-10*Math.sin(a-.4));
  ctx.lineTo(ex-10*Math.cos(a+.4),ey-10*Math.sin(a+.4));ctx.closePath();
  ctx.fillStyle=active?'#6ee7b7':'#ffffff22';ctx.fill();
  ctx.fillStyle=active?'#6ee7b7':'#ffffff55';ctx.font='11px sans-serif';
  ctx.fillText(label,(sx+ex)/2+uy*12,(sy+ey)/2-ux*12);
}
function draw(){
  ctx.clearRect(0,0,700,400);
  transitions.forEach(t=>{
    const a=states[t.from],b=states[t.to];
    arrow(a.x,a.y,b.x,b.y,t.event,t.from===current);
  });
  Object.entries(states).forEach(([name,{x,y}])=>{
    const active=name===current;
    ctx.beginPath();ctx.arc(x,y,28,0,Math.PI*2);
    ctx.fillStyle=active?'#6ee7b733':'#1a1d27';ctx.fill();
    ctx.strokeStyle=active?'#6ee7b7':'#ffffff33';ctx.lineWidth=active?2.5:1;ctx.stroke();
    ctx.fillStyle=active?'#6ee7b7':'#c9d1d9';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(name,x,y);
  });
}
renderButtons();draw();