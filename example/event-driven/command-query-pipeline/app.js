const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d'),logEl=document.getElementById('log');
const nodes=[{x:80,y:200,label:'Client',r:30},{x:280,y:100,label:'Command\nBus',r:34},{x:280,y:300,label:'Query\nBus',r:34},{x:500,y:100,label:'Write\nModel',r:34},{x:500,y:300,label:'Read\nModel',r:34},{x:720,y:200,label:'Event\nStore',r:34}];
const edges=[[0,1],[0,2],[1,3],[2,4],[3,5],[5,4]];
let particles=[];
const commands=['CreateUser','UpdateOrder','DeleteItem','ProcessPayment','ShipOrder'];
const queries=['GetUser','ListOrders','FetchItem','OrderStatus','Inventory'];

function drawNode(n){ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fillStyle='#1a1d27';ctx.fill();ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#c9d1d9';ctx.font='11px monospace';ctx.textAlign='center';const lines=n.label.split('\n');lines.forEach((l,i)=>ctx.fillText(l,n.x,n.y-4+(i*14)));}

function drawEdge(a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#2d333b';ctx.lineWidth=1;ctx.stroke();}

function draw(){ctx.clearRect(0,0,900,400);edges.forEach(([i,j])=>drawEdge(nodes[i],nodes[j]));nodes.forEach(drawNode);
particles=particles.filter(p=>{p.t+=0.018;if(p.t>1)return false;const a=nodes[p.from],b=nodes[p.to];const x=a.x+(b.x-a.x)*p.t,y=a.y+(b.y-a.y)*p.t;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();return true;});
requestAnimationFrame(draw);}

function addParticle(from,to,color,delay){setTimeout(()=>particles.push({from,to,t:0,color}),delay);}

function log(msg,cls){const d=document.createElement('div');d.className=cls;d.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;logEl.prepend(d);}

function dispatch(type){
  if(type==='command'){const c=commands[Math.random()*commands.length|0];log(`CMD → ${c}`,'log-cmd');addParticle(0,1,'#f97583',0);addParticle(1,3,'#f97583',400);addParticle(3,5,'#6ee7b7',800);addParticle(5,4,'#6ee7b7',1200);setTimeout(()=>log(`EVT ← ${c}Completed`,'log-evt'),1400);}
  else{const q=queries[Math.random()*queries.length|0];log(`QRY → ${q}`,'log-qry');addParticle(0,2,'#79c0ff',0);addParticle(2,4,'#79c0ff',400);setTimeout(()=>log(`RES ← ${q}Result{...}`,'log-qry'),800);}
}
draw();
setInterval(()=>dispatch(Math.random()>.5?'command':'query'),2500);