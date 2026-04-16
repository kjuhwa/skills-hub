const c=document.getElementById('c'),ctx=c.getContext('2d');
c.width=Math.min(900,innerWidth-40);c.height=Math.min(500,innerHeight-120);
const W=c.width,H=c.height,stages=[
  {label:'SOURCE',x:W*.1,color:'#3b82f6'},
  {label:'EXTRACT',x:W*.3,color:'#8b5cf6'},
  {label:'TRANSFORM',x:W*.55,color:'#f59e0b'},
  {label:'LOAD',x:W*.8,color:'#6ee7b7'}
];
let particles=[],counts={E:0,T:0,L:0,Err:0};

function spawn(){
  particles.push({x:stages[0].x,y:H/2+(Math.random()-.5)*120,stage:0,speed:1+Math.random()*1.5,size:3+Math.random()*3,err:Math.random()<.08,alpha:1});
}

function update(){
  particles.forEach(p=>{
    if(p.err&&p.stage===2){p.y+=p.speed;p.alpha-=.015;return}
    const target=stages[Math.min(p.stage+1,3)];
    p.x+=(target.x-p.x)*.02*p.speed;
    if(Math.abs(p.x-target.x)<8&&p.stage<3){
      p.stage++;
      if(p.stage===1)counts.E++;if(p.stage===2)counts.T++;
      if(p.stage===3)counts.L++;if(p.err&&p.stage===2)counts.Err++;
    }
    if(p.stage===3)p.alpha-=.01;
  });
  particles=particles.filter(p=>p.alpha>0);
}

function draw(){
  ctx.clearRect(0,0,W,H);
  stages.forEach(s=>{
    ctx.fillStyle=s.color+'22';ctx.fillRect(s.x-25,40,50,H-80);
    ctx.fillStyle=s.color;ctx.font='bold 11px system-ui';ctx.textAlign='center';
    ctx.fillText(s.label,s.x,30);
  });
  particles.forEach(p=>{
    ctx.globalAlpha=p.alpha;
    ctx.fillStyle=p.err&&p.stage>=2?'#f87171':stages[Math.min(p.stage,3)].color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
  });
  ctx.globalAlpha=1;
  document.getElementById('sE').textContent=counts.E;
  document.getElementById('sT').textContent=counts.T;
  document.getElementById('sL').textContent=counts.L;
  document.getElementById('sErr').textContent=counts.Err;
}

function loop(){if(Math.random()<.3)spawn();update();draw();requestAnimationFrame(loop)}
loop();