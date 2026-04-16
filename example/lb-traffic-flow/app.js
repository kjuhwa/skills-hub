const canvas=document.getElementById("canvas"),ctx=canvas.getContext("2d");
let W,H;function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight}
resize();addEventListener("resize",resize);

const servers=[
  {name:"srv-1",x:0,y:0,conns:0,health:1,color:"#6ee7b7"},
  {name:"srv-2",x:0,y:0,conns:0,health:1,color:"#67e8f9"},
  {name:"srv-3",x:0,y:0,conns:0,health:1,color:"#a78bfa"},
  {name:"srv-4",x:0,y:0,conns:0,health:1,color:"#fbbf24"}
];
const particles=[];let rrIndex=0,totalReqs=0;

function layoutServers(){
  const cx=W*0.72,startY=H*0.22,gap=(H*0.56)/(servers.length-1);
  servers.forEach((s,i)=>{s.x=cx;s.y=startY+i*gap});
}

function getTarget(algo){
  if(algo==="round-robin"){const t=servers[rrIndex%servers.length];rrIndex++;return t}
  if(algo==="least-conn"){return servers.reduce((a,b)=>a.conns<=b.conns?a:b)}
  return servers[Math.floor(Math.random()*servers.length)];
}

function spawnParticle(){
  const algo=document.getElementById("algo").value;
  const target=getTarget(algo);
  const lbX=W*0.38,lbY=H*0.5;
  target.conns++;totalReqs++;
  particles.push({x:W*0.08,y:H*0.5,phase:0,lbX,lbY,tx:target.x,ty:target.y,srv:target,t:0,alive:true});
}

document.getElementById("addReq").onclick=spawnParticle;
document.getElementById("burst").onclick=()=>{for(let i=0;i<10;i++)setTimeout(spawnParticle,i*60)};

setInterval(spawnParticle,900);

function draw(){
  ctx.fillStyle="#0f1117";ctx.fillRect(0,0,W,H);
  layoutServers();
  const lbX=W*0.38,lbY=H*0.5;

  // draw connection lines
  ctx.strokeStyle="#1a1d27";ctx.lineWidth=1;
  servers.forEach(s=>{ctx.beginPath();ctx.moveTo(lbX,lbY);ctx.lineTo(s.x,s.y);ctx.stroke()});

  // draw LB node
  ctx.beginPath();ctx.arc(lbX,lbY,28,0,Math.PI*2);ctx.fillStyle="#1a1d27";ctx.fill();
  ctx.strokeStyle="#6ee7b7";ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle="#6ee7b7";ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText("LB",lbX,lbY);

  // draw client
  ctx.fillStyle="#6ee7b7";ctx.font="12px system-ui";ctx.fillText("Clients",W*0.08,H*0.5-20);
  ctx.beginPath();ctx.arc(W*0.08,H*0.5,14,0,Math.PI*2);ctx.fillStyle="#2a2d37";ctx.fill();
  ctx.strokeStyle="#6ee7b7";ctx.lineWidth=1.5;ctx.stroke();

  // draw servers
  servers.forEach(s=>{
    ctx.beginPath();ctx.roundRect(s.x-36,s.y-22,72,44,8);ctx.fillStyle="#1a1d27";ctx.fill();
    ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=s.color;ctx.font="bold 11px system-ui";ctx.textAlign="center";
    ctx.fillText(s.name,s.x,s.y-4);
    ctx.fillStyle="#9ca3af";ctx.font="10px system-ui";
    ctx.fillText(s.conns+" conns",s.x,s.y+10);
  });

  // draw & update particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.t+=0.025;
    if(p.t<=0.5){const r=p.t/0.5;p.x=p.x+(p.lbX-W*0.08)*0.05;p.y=p.y+(p.lbY-H*0.5)*0.05;
      p.x=W*0.08+(p.lbX-W*0.08)*r;p.y=H*0.5+(p.lbY-H*0.5)*r;
    }else{const r=(p.t-0.5)/0.5;p.x=p.lbX+(p.tx-p.lbX)*r;p.y=p.lbY+(p.ty-p.lbY)*r}
    ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=p.srv.color;ctx.globalAlpha=0.9;ctx.fill();ctx.globalAlpha=1;
    if(p.t>=1){p.srv.conns=Math.max(0,p.srv.conns-1);particles.splice(i,1)}
  }

  // stats
  ctx.fillStyle="#9ca3af";ctx.font="11px system-ui";ctx.textAlign="left";
  ctx.fillText("Total requests: "+totalReqs,20,H-20);
  requestAnimationFrame(draw);
}
draw();