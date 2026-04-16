const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
let W,H;function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=Math.min(420,window.innerHeight-160);} resize();window.onresize=resize;
const queue=[],particles=[],consumed=[];
const COLORS=['#6ee7b7','#38bdf8','#f472b6','#facc15','#a78bfa'];
let msgId=0;
function addMsg(){
  const m={id:++msgId,color:COLORS[msgId%COLORS.length],x:60,y:H/2,targetX:0,phase:'enter',alpha:1,t:0};
  queue.push(m);updateCount();
}
function consumeMsg(){
  if(!queue.length)return;
  const m=queue.shift();m.phase='exit';m.targetX=W-60;consumed.push(m);updateCount();
  for(let i=0;i<8;i++)particles.push({x:m.x,y:m.y,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:1,color:m.color});
}
function updateCount(){document.getElementById('queueCount').textContent='Queue: '+queue.length;}
document.getElementById('btnProduce').onclick=addMsg;
document.getElementById('btnConsume').onclick=consumeMsg;
function draw(){
  ctx.clearRect(0,0,W,H);
  const qx=W/2,qw=220,qh=60;
  ctx.strokeStyle='#6ee7b733';ctx.lineWidth=2;ctx.setLineDash([6,4]);
  ctx.strokeRect(qx-qw/2,H/2-qh/2,qw,qh);ctx.setLineDash([]);
  ctx.fillStyle='#6ee7b722';ctx.fillRect(qx-qw/2,H/2-qh/2,qw,qh);
  ctx.fillStyle='#6ee7b7';ctx.font='12px system-ui';ctx.textAlign='center';
  ctx.fillText('QUEUE',qx,H/2-qh/2-8);
  ctx.fillStyle='#334155';ctx.font='11px system-ui';
  ctx.textAlign='left';ctx.fillText('Producer',20,H/2-40);
  ctx.textAlign='right';ctx.fillText('Consumer',W-20,H/2-40);
  queue.forEach((m,i)=>{
    const slotX=qx-qw/2+20+i*(24)%(qw-40);
    m.targetX=slotX;m.x+=(m.targetX-m.x)*.08;
    ctx.beginPath();ctx.arc(m.x,H/2,8,0,Math.PI*2);ctx.fillStyle=m.color;ctx.fill();
    ctx.fillStyle='#0f1117';ctx.font='bold 9px system-ui';ctx.textAlign='center';
    ctx.fillText(m.id,m.x,H/2+3);
  });
  consumed.forEach((m,i)=>{
    m.x+=(m.targetX-m.x)*.06;m.alpha*=.995;
    if(m.alpha<.01){consumed.splice(i,1);return;}
    ctx.globalAlpha=m.alpha;ctx.beginPath();ctx.arc(m.x,H/2,8,0,Math.PI*2);ctx.fillStyle=m.color;ctx.fill();ctx.globalAlpha=1;
  });
  particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.life-=.025;
    if(p.life<=0){particles.splice(i,1);return;}
    ctx.globalAlpha=p.life;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.globalAlpha=1;
  });
  requestAnimationFrame(draw);
}
draw();
for(let i=0;i<5;i++)setTimeout(addMsg,i*300);
setInterval(()=>{if(Math.random()>.5)addMsg();},1800);
setInterval(()=>{if(queue.length&&Math.random()>.3)consumeMsg();},2200);