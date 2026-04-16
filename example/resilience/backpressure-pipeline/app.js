const cv=document.getElementById('c'),ctx=cv.getContext('2d');
cv.width=700;cv.height=260;
const Q=[],MAX=40;let dropped=0,processed=0,prodEff=0;
const prodR=document.getElementById('prodRate'),conR=document.getElementById('conRate'),bpT=document.getElementById('bpToggle'),stats=document.getElementById('stats');
function tick(){
  const pr=+prodR.value,cr=+conR.value,bp=bpT.checked;
  const effectiveRate=bp?Math.min(pr,cr+(MAX-Q.length)/4):pr;
  prodEff=effectiveRate;
  for(let i=0;i<effectiveRate&&Math.random()<.6;i++){
    if(Q.length<MAX)Q.push({x:160,age:0,hue:140+Math.random()*40});
    else dropped++;
  }
  for(let i=0;i<cr&&Q.length;i++){Q.shift();processed++;}
  Q.forEach(p=>{p.age++;p.x=160+((p.age/30)*380)});
}
function draw(){
  ctx.clearRect(0,0,700,260);
  ctx.fillStyle='#1a1d27';ctx.fillRect(0,0,700,260);
  // producer
  ctx.fillStyle='#6ee7b7';ctx.font='bold 13px system-ui';ctx.fillText('PRODUCER',30,30);
  ctx.strokeStyle='#2d333b';ctx.lineWidth=2;ctx.strokeRect(20,40,120,60);
  const pFill=prodEff/20;
  ctx.fillStyle=`rgba(110,231,183,${0.3+pFill*0.5})`;ctx.fillRect(22,42,116*pFill,56);
  // queue
  ctx.fillStyle='#6ee7b7';ctx.fillText(`QUEUE (${Q.length}/${MAX})`,300,30);
  ctx.strokeStyle=Q.length>MAX*.8?'#f87171':'#2d333b';ctx.strokeRect(160,80,380,60);
  const qFill=Q.length/MAX;
  ctx.fillStyle=qFill>.8?'rgba(248,113,113,.25)':'rgba(110,231,183,.15)';
  ctx.fillRect(162,82,376*qFill,56);
  Q.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(162+i*(376/MAX)+5,110,4,0,Math.PI*2);
    ctx.fillStyle=`hsl(${p.hue},70%,65%)`;ctx.fill();
  });
  // consumer
  ctx.fillStyle='#6ee7b7';ctx.fillText('CONSUMER',575,30);
  ctx.strokeStyle='#2d333b';ctx.strokeRect(560,40,120,60);
  const cFill=+conR.value/20;
  ctx.fillStyle=`rgba(110,231,183,${0.3+cFill*0.5})`;ctx.fillRect(562,42,116*cFill,56);
  // arrows
  ctx.strokeStyle='#6ee7b7';ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(140,70);ctx.lineTo(160,110);ctx.stroke();
  ctx.beginPath();ctx.moveTo(540,110);ctx.lineTo(560,70);ctx.stroke();
  ctx.setLineDash([]);
  // backpressure signal
  if(bpT.checked&&Q.length>MAX*.5){
    ctx.strokeStyle='#f59e0b';ctx.setLineDash([6,3]);
    ctx.beginPath();ctx.moveTo(350,80);ctx.lineTo(80,70);ctx.stroke();
    ctx.fillStyle='#f59e0b';ctx.font='11px system-ui';ctx.fillText('⬅ slow down',170,75);
    ctx.setLineDash([]);
  }
  stats.textContent=`Processed: ${processed} | Dropped: ${dropped} | Queue: ${Q.length}`;
}
setInterval(()=>{tick();draw()},120);