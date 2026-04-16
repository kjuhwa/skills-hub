const cv=document.getElementById('c'),ctx=cv.getContext('2d');
cv.width=700;cv.height=300;
const N=80,nodes=[];
let pressure=0.3,releaseRate=0.01;
for(let i=0;i<N;i++)nodes.push({p:0.3,v:0,y:150});
document.getElementById('burst').onclick=()=>{
  for(let i=0;i<8;i++)nodes[i].p+=0.7;pressure=1;
};
document.getElementById('release').onclick=()=>{
  for(let i=N-8;i<N;i++)nodes[i].p=Math.max(0,nodes[i].p-0.5);
};
function step(){
  // wave propagation
  for(let i=1;i<N-1;i++){
    const force=(nodes[i-1].p-nodes[i].p)*0.15+(nodes[i+1].p-nodes[i].p)*0.15;
    nodes[i].v+=force;nodes[i].v*=0.96;
  }
  nodes.forEach(n=>{n.p+=n.v;n.p=Math.max(0,Math.min(1.5,n.p));n.p-=releaseRate*0.3;if(n.p<0)n.p=0;});
  // natural inflow
  nodes[0].p+=0.008;
  pressure=nodes.reduce((s,n)=>s+n.p,0)/N;
}
function draw(){
  ctx.clearRect(0,0,700,300);
  const w=700/N;
  // pressure gradient fill
  nodes.forEach((n,i)=>{
    const h=n.p*180;
    const r=Math.min(255,n.p*200),g=Math.max(0,180-n.p*120),b=180;
    ctx.fillStyle=`rgb(${r|0},${g|0},${b})`;
    ctx.fillRect(i*w,300-h,w+1,h);
    // wave line
    nodes[i].y=300-h;
  });
  // wave outline
  ctx.beginPath();ctx.moveTo(0,nodes[0].y);
  for(let i=1;i<N;i++){
    const xc=(i-0.5)*w,yc=(nodes[i-1].y+nodes[i].y)/2;
    ctx.quadraticCurveTo((i-1)*w,nodes[i-1].y,xc,yc);
  }
  ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;ctx.stroke();
  // pressure label
  ctx.fillStyle='#6ee7b7';ctx.font='bold 13px system-ui';
  ctx.fillText(`System Pressure: ${(pressure*100).toFixed(0)}%`,10,25);
  const status=pressure>0.6?'⚠ HIGH':'✓ Normal';
  ctx.fillStyle=pressure>0.6?'#f87171':'#6ee7b7';
  ctx.fillText(status,10,45);
  // node markers
  for(let i=0;i<N;i+=4){
    ctx.beginPath();ctx.arc(i*w+w/2,nodes[i].y,3,0,Math.PI*2);
    ctx.fillStyle=nodes[i].p>0.6?'#f87171':'#6ee7b7';ctx.fill();
  }
}
function loop(){step();draw();requestAnimationFrame(loop);}
loop();