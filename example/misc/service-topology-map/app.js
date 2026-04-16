const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
let W, H;
function resize() { W=canvas.width=innerWidth; H=canvas.height=innerHeight; }
resize(); addEventListener('resize', resize);

const nodes = [
  {id:'gateway',x:0,y:0,r:22,color:'#6ee7b7',rps:1200},
  {id:'auth',x:0,y:0,r:16,color:'#f472b6',rps:800},
  {id:'users',x:0,y:0,r:18,color:'#60a5fa',rps:600},
  {id:'orders',x:0,y:0,r:20,color:'#fbbf24',rps:950},
  {id:'payments',x:0,y:0,r:17,color:'#a78bfa',rps:400},
  {id:'inventory',x:0,y:0,r:15,color:'#fb923c',rps:300},
  {id:'notify',x:0,y:0,r:13,color:'#34d399',rps:200},
  {id:'cache',x:0,y:0,r:14,color:'#f87171',rps:2000},
];
const edges = [
  [0,1],[0,2],[0,3],[1,7],[2,7],[3,4],[3,5],[3,6],[4,7],[5,7]
];

const cx=()=>W/2, cy=()=>H/2;
nodes.forEach((n,i)=>{ const a=i/nodes.length*Math.PI*2-Math.PI/2; n.x=cx()+Math.cos(a)*180; n.y=cy()+Math.sin(a)*180; });
nodes[0].x=cx(); nodes[0].y=cy();

const particles = [];
function spawnParticle(ei) {
  const e=edges[ei]; const a=nodes[e[0]], b=nodes[e[1]];
  particles.push({x:a.x,y:a.y,tx:b.x,ty:b.y,t:0,speed:.01+Math.random()*.02,color:a.color});
}

function sendRequest() {
  [0,1,2].forEach(i=>setTimeout(()=>spawnParticle(i),i*120));
  setTimeout(()=>{[3,4].forEach(i=>spawnParticle(edges.length>i?i:0));},300);
  setTimeout(()=>{[5,6,7,8,9].forEach(i=>{ if(i<edges.length) spawnParticle(i); });},500);
}

let hovered = null;
canvas.addEventListener('mousemove', e=>{
  hovered=null;
  nodes.forEach(n=>{
    if(Math.hypot(e.clientX-n.x,e.clientY-n.y)<n.r+4) hovered=n;
  });
  if(hovered) info.innerHTML=`<strong style="color:${hovered.color}">${hovered.id}</strong><br>${hovered.rps} req/s`;
  else info.textContent='Hover a node';
});

document.getElementById('btnPulse').addEventListener('click', sendRequest);
setInterval(sendRequest, 3000);

function draw() {
  ctx.clearRect(0,0,W,H);
  edges.forEach(([a,b])=>{
    ctx.beginPath(); ctx.moveTo(nodes[a].x,nodes[a].y); ctx.lineTo(nodes[b].x,nodes[b].y);
    ctx.strokeStyle='#2a2d37'; ctx.lineWidth=1; ctx.stroke();
  });
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.t+=p.speed;
    if(p.t>=1){particles.splice(i,1);continue;}
    p.x=p.x+(p.tx-p.x)*p.speed*3; p.y=p.y+(p.ty-p.y)*p.speed*3;
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2);
    ctx.fillStyle=p.color; ctx.globalAlpha=1-p.t; ctx.fill(); ctx.globalAlpha=1;
  }
  nodes.forEach(n=>{
    ctx.beginPath(); ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
    ctx.fillStyle=n===hovered?'#2a2d37':'#1a1d27'; ctx.fill();
    ctx.strokeStyle=n.color; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle=n.color; ctx.font='10px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(n.id,n.x,n.y);
  });
  requestAnimationFrame(draw);
}
draw();