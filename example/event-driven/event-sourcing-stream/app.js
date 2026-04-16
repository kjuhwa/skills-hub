```js
const types=['OrderPlaced','PaymentReceived','ItemShipped','OrderCancelled','RefundIssued'];
const colors=['#6ee7b7','#38bdf8','#f472b6','#fb923c','#a78bfa'];
const counts={};types.forEach(t=>counts[t]=0);
const rateBuf=new Array(30).fill(0);
let total=0,running=true,secCount=0;

function emit(){
  const t=types[Math.random()*5|0];
  counts[t]++;total++;secCount++;
  const el=document.getElementById('feed');
  const d=document.createElement('div');
  d.innerHTML=`<span style="color:${colors[types.indexOf(t)]}">${t}</span> id-${(Math.random()*9999|0).toString(16)} ${new Date().toLocaleTimeString()}`;
  el.prepend(d);
  if(el.children.length>80)el.removeChild(el.lastChild);
  document.getElementById('counter').textContent=total+' events';
  drawPie();
}
function drawPie(){
  const svg=document.getElementById('pie');
  const vals=types.map(t=>counts[t]);
  const sum=vals.reduce((a,b)=>a+b,0)||1;
  let cum=0;let paths='';
  vals.forEach((v,i)=>{
    const a1=cum/sum*Math.PI*2-Math.PI/2;
    cum+=v;const a2=cum/sum*Math.PI*2-Math.PI/2;
    const lg=v/sum>.5?1:0;
    const x1=60+50*Math.cos(a1),y1=60+50*Math.sin(a1);
    const x2=60+50*Math.cos(a2),y2=60+50*Math.sin(a2);
    if(v>0)paths+=`<path d="M60,60 L${x1},${y1} A50,50 0 ${lg},1 ${x2},${y2} Z" fill="${colors[i]}"/>`;
  });
  svg.innerHTML=paths;
  document.getElementById('legend').innerHTML=types.map((t,i)=>
    `<span class="leg"><span class="dot" style="background:${colors[i]}"></span>${t}: ${counts[t]}</span>`
  ).join('');
}
function drawRate(){
  const c=document.getElementById('rateChart'),ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  const max=Math.max(1,...rateBuf);
  ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;ctx.beginPath();
  rateBuf.forEach((v,i)=>{
    const x=i/(rateBuf.length-1)*c.width;
    const y=c.height-v/max*(c.height-10)-5;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.fillStyle='#6ee7b744';ctx.lineTo(c.width,c.height);ctx.lineTo(0,c.height);ctx.fill();
}
setInterval(()=>{
  if(!running)return;
  const n=1+Math.random()*4|0;
  for(let i=0;i<n;i++)emit();
},400);
setInterval(()=>{rateBuf.shift();rateBuf.push(secCount);secCount=0;drawRate();},1000);
document.getElementById('toggle').onclick=function(){
  running=!running;this.textContent=running?'⏸ Pause':'▶ Resume';
};
drawPie();drawRate();
```