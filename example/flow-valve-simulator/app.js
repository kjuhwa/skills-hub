const c=document.getElementById('pipe'),ctx=c.getContext('2d');
const inflowEl=document.getElementById('inflow'),valveEl=document.getElementById('valve');
const inflowVal=document.getElementById('inflowVal'),valveVal=document.getElementById('valveVal');
const pressureEl=document.getElementById('pressure'),outflowEl=document.getElementById('outflow');
const bufferEl=document.getElementById('buffer'),statusEl=document.getElementById('status'),statusGauge=document.getElementById('statusGauge');

let W=c.width,H=c.height,pressure=0,buffer=0,particles=[];
function resize(){const r=c.getBoundingClientRect();c.width=r.width*devicePixelRatio;c.height=280*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);W=r.width;H=280}
resize();window.addEventListener('resize',()=>{ctx.setTransform(1,0,0,1,0,0);resize()});

inflowEl.oninput=()=>inflowVal.textContent=inflowEl.value;
valveEl.oninput=()=>valveVal.textContent=valveEl.value;

function spawn(rate){for(let i=0;i<rate/20;i++)if(Math.random()<rate/100)particles.push({x:20,y:H/2+(Math.random()-.5)*60,v:1.5+Math.random()})}

function tick(){
  const inflow=+inflowEl.value,valve=+valveEl.value;
  const capacity=valve*1.2;
  const diff=inflow-capacity;
  buffer=Math.max(0,Math.min(100,buffer+diff*0.05));
  pressure=Math.max(0,Math.min(200,buffer*1.8+(diff>0?diff*0.3:0)));
  const outflow=Math.min(inflow,capacity)*(1-buffer/400);

  spawn(inflow);
  const valveX=W-160,valveGap=valve/100*70;
  particles=particles.filter(p=>{
    if(p.x<valveX)p.x+=p.v*(1-buffer/200);
    else if(Math.abs(p.y-H/2)<valveGap/2)p.x+=p.v*valve/100*2;
    else{p.y+=(p.y<H/2?-.5:.5);if(p.x<valveX-5)p.x+=.2}
    return p.x<W+10
  });

  draw(valve,valveGap);

  pressureEl.textContent=pressure.toFixed(0);
  outflowEl.textContent=outflow.toFixed(0);
  bufferEl.textContent=buffer.toFixed(0);
  statusGauge.className='gauge';
  if(buffer>70){statusEl.textContent='BURST';statusGauge.classList.add('danger')}
  else if(buffer>40){statusEl.textContent='BACKPRESSURE';statusGauge.classList.add('warn')}
  else statusEl.textContent='OK';

  requestAnimationFrame(tick)
}

function draw(valve,gap){
  ctx.fillStyle='#0f1117';ctx.fillRect(0,0,W,H);
  const pipeTop=H/2-50,pipeBot=H/2+50;
  const hue=120-buffer*1.2;
  ctx.fillStyle=`hsla(${hue},70%,40%,0.25)`;
  ctx.fillRect(20,pipeTop,W-40,100);
  ctx.strokeStyle='#252836';ctx.lineWidth=3;
  ctx.strokeRect(20,pipeTop,W-40,100);

  particles.forEach(p=>{ctx.fillStyle='#6ee7b7';ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fill()});

  const vx=W-160;
  ctx.fillStyle='#1a1d27';
  ctx.fillRect(vx-4,pipeTop,8,50-gap/2);
  ctx.fillRect(vx-4,H/2+gap/2,8,50-gap/2);
  ctx.fillStyle='#6ee7b7';
  ctx.fillRect(vx-4,pipeTop,8,3);ctx.fillRect(vx-4,pipeBot-3,8,3);

  if(buffer>30){
    ctx.fillStyle=`rgba(239,68,68,${buffer/150})`;
    ctx.beginPath();ctx.arc(100,H/2,30+buffer/3,0,Math.PI*2);ctx.fill()
  }
}
tick();