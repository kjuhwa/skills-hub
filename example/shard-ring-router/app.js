const canvas=document.getElementById('ring'),ctx=canvas.getContext('2d'),log=document.getElementById('log');
const W=520,C=W/2,R=200,shards=[],particles=[];
const COLORS=['#6ee7b7','#f472b6','#60a5fa','#fbbf24','#a78bfa','#fb923c'];

function hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360}

for(let i=0;i<5;i++){const a=i*72;shards.push({id:i,name:'Shard-'+String.fromCharCode(65+i),angle:a,color:COLORS[i],size:1});}

function angleTo(a){return{x:C+R*Math.cos(a*Math.PI/180),y:C+R*Math.sin(a*Math.PI/180)};}

function findShard(angle){let best=null,bestD=Infinity;
shards.forEach(s=>{let d=(s.angle-angle+360)%360;if(d<bestD){bestD=d;best=s}});return best;}

canvas.addEventListener('click',e=>{
  const rect=canvas.getBoundingClientRect(),mx=e.clientX-rect.left,my=e.clientY-rect.top;
  const angle=((Math.atan2(my-C,mx-C)*180/Math.PI)+360)%360;
  const key='key_'+Math.random().toString(36).slice(2,7);
  const shard=findShard(angle);
  particles.push({x:C,y:C,tx:0,ty:0,angle,shard,t:0,key});
  const d=document.createElement('div');
  d.innerHTML=`<span class="key">${key}</span> → hashed to ${Math.round(angle)}° → <span class="shard">${shard.name}</span>`;
  log.prepend(d);if(log.children.length>20)log.lastChild.remove();
});

function draw(){
  ctx.clearRect(0,0,W,W);
  ctx.beginPath();ctx.arc(C,C,R,0,Math.PI*2);ctx.strokeStyle='#2d333b';ctx.lineWidth=2;ctx.stroke();
  shards.forEach(s=>{
    const p=angleTo(s.angle);s.size+=(1-s.size)*0.1;
    ctx.beginPath();ctx.arc(p.x,p.y,10*s.size,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill();
    ctx.fillStyle='#0f1117';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(s.name.slice(-1),p.x,p.y);
  });
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.t+=0.04;
    const target=angleTo(p.angle+(((p.shard.angle-p.angle+360)%360)*p.t));
    p.x+=(target.x-p.x)*0.15;p.y+=(target.y-p.y)*0.15;
    ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=p.shard.color;ctx.globalAlpha=1-p.t;ctx.fill();ctx.globalAlpha=1;
    if(p.t>=1){p.shard.size=1.6;particles.splice(i,1);}
  }
  requestAnimationFrame(draw);
}
draw();
for(let i=0;i<3;i++)setTimeout(()=>canvas.dispatchEvent(new MouseEvent('click',{clientX:canvas.getBoundingClientRect().left+100+i*120,clientY:canvas.getBoundingClientRect().top+260})),500+i*400);