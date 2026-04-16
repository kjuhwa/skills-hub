```js
const POOLS=[
  {name:'API Gateway',max:20,used:0,rejected:0,history:[]},
  {name:'DB Pool',max:15,used:0,rejected:0,history:[]},
  {name:'Cache Layer',max:25,used:0,rejected:0,history:[]},
  {name:'Worker Queue',max:12,used:0,rejected:0,history:[]}
];
const gridEl=document.getElementById('grid');
const canvas=document.getElementById('chart');
const ctx=canvas.getContext('2d');
const MAX_HIST=60;

function ringSVG(pct){
  const r=34,c=2*Math.PI*r,off=c-(pct/100)*c;
  const color=pct>85?'#f87171':pct>60?'#fbbf24':'#6ee7b7';
  return `<svg width="80" height="80"><circle cx="40" cy="40" r="${r}" fill="none" stroke="#2a2d37" stroke-width="7"/>
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="7"
    stroke-dasharray="${c}" stroke-dashoffset="${off}" stroke-linecap="round"/></svg>`;
}

function renderCards(){
  gridEl.innerHTML='';
  POOLS.forEach(p=>{
    const pct=Math.round(p.used/p.max*100);
    const d=document.createElement('div');d.className='card';
    d.innerHTML=`<h3>${p.name}</h3><div class="ring">${ringSVG(pct)}<div class="val">${pct}%</div></div>
      <div class="meta"><span>${p.used}</span>/${p.max} threads | rej: <span style="color:${p.rejected?'#f87171':'#6ee7b7'}">${p.rejected}</span></div>`;
    gridEl.appendChild(d);
  });
}

function drawChart(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#ffffff08';
  for(let y=0;y<canvas.height;y+=40){ctx.fillRect(0,y,canvas.width,1);}
  const colors=['#6ee7b7','#3b82f6','#fbbf24','#f87171'];
  POOLS.forEach((p,i)=>{
    if(p.history.length<2)return;
    ctx.beginPath();ctx.strokeStyle=colors[i];ctx.lineWidth=2;
    p.history.forEach((v,j)=>{
      const x=(j/(MAX_HIST-1))*canvas.width;
      const y=canvas.height-(v/p.max)*canvas.height;
      j===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
    ctx.fillStyle=colors[i];ctx.font='11px Segoe UI';
    ctx.fillText(p.name,8,16+i*14);
  });
}

function tick(){
  POOLS.forEach(p=>{
    const delta=Math.floor(Math.random()*5)-2;
    p.used=Math.max(0,Math.min(p.max,p.used+delta));
    if(p.used>=p.max&&Math.random()>.5)p.rejected++;
    p.history.push(p.used);
    if(p.history.length>MAX_HIST)p.history.shift();
  });
  renderCards();drawChart();
}

for(let i=0;i<MAX_HIST;i++){POOLS.forEach(p=>{p.used=Math.floor(Math.random()*p.max*.7);p.history.push(p.used);});}
setInterval(tick,800);tick();
```