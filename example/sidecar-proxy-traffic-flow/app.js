const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
let W,H,proxied=0,blocked=0;const particles=[];
function resize(){W=canvas.width=Math.min(window.innerWidth-40,900);H=canvas.height=Math.min(window.innerHeight-120,500)}
resize();window.addEventListener('resize',resize);
const zones={client:{x:60,y:()=>H/2,label:'Client'},sidecar:{x:()=>W/2,y:()=>H/2,label:'Sidecar Proxy'},service:{x:()=>W-60,y:()=>H/2,label:'Service'}};
function addParticle(isBlocked){
  particles.push({x:zones.client.x,y:zones.client.y()+Math.random()*60-30,phase:0,
    blocked:isBlocked||Math.random()<.15,t:0,speed:1.5+Math.random()});
}
document.getElementById('btnAdd').onclick=()=>addParticle();
document.getElementById('btnFlood').onclick=()=>{for(let i=0;i<10;i++)setTimeout(()=>addParticle(),i*80)};
for(let i=0;i<5;i++)setTimeout(()=>addParticle(),i*300);
function drawNode(x,y,label,color){
  ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fillStyle=color+'33';ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=color;ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+36);
}
function update(){
  ctx.clearRect(0,0,W,H);
  const sx=zones.sidecar.x(),sy=zones.sidecar.y(),ex=zones.service.x(),ey=zones.service.y();
  ctx.setLineDash([4,4]);ctx.strokeStyle='#333';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(zones.client.x,zones.client.y());ctx.lineTo(sx,sy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);
  drawNode(zones.client.x,zones.client.y(),'Client','#8b949e');
  drawNode(sx,sy,'Sidecar Proxy','#6ee7b7');
  drawNode(ex,ey,'Service','#58a6ff');
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.t+=p.speed;
    if(p.phase===0){p.x=zones.client.x+(sx-zones.client.x)*(p.t/100);p.y=zones.client.y()+(sy-zones.client.y())*(p.t/100);
      if(p.t>=100){p.phase=1;p.t=0;if(p.blocked){p.phase=2;blocked++;document.getElementById('stats').textContent=`Proxied: ${proxied} | Blocked: ${blocked}`}}
    }else if(p.phase===1){p.x=sx+(ex-sx)*(p.t/100);p.y=sy+(ey-sy)*(p.t/100);
      if(p.t>=100){proxied++;document.getElementById('stats').textContent=`Proxied: ${proxied} | Blocked: ${blocked}`;particles.splice(i,1);continue}
    }else{p.t+=1;if(p.t>60){particles.splice(i,1);continue}}
    ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);
    ctx.fillStyle=p.phase===2?'#f85149':p.blocked?'#f0883e':'#6ee7b7';
    ctx.globalAlpha=p.phase===2?Math.max(0,1-p.t/60):1;ctx.fill();ctx.globalAlpha=1;
  }
  requestAnimationFrame(update);
}
update();