const canvas=document.getElementById('mesh'),ctx=canvas.getContext('2d');
let W,H;function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight}
window.addEventListener('resize',resize);resize();
const services=[
  {id:'gateway',name:'api-gateway',x:.5,y:.1,status:'healthy'},
  {id:'auth',name:'auth-svc',x:.2,y:.3,status:'healthy'},
  {id:'user',name:'user-svc',x:.5,y:.35,status:'healthy'},
  {id:'order',name:'order-svc',x:.8,y:.3,status:'healthy'},
  {id:'payment',name:'payment-svc',x:.3,y:.65,status:'healthy'},
  {id:'inventory',name:'inventory-svc',x:.6,y:.65,status:'healthy'},
  {id:'notify',name:'notify-svc',x:.85,y:.7,status:'healthy'},
  {id:'db',name:'postgres',x:.5,y:.9,status:'healthy'}
];
const edges=[['gateway','auth'],['gateway','user'],['gateway','order'],['auth','db'],['user','db'],['order','payment'],['order','inventory'],['payment','db'],['inventory','db'],['order','notify']];
const packets=[];let paused=false,chaos=false;
let stats={rps:0,p99:0,err:0,circuits:0};
function nodeAt(id){const s=services.find(x=>x.id===id);return{x:s.x*W,y:s.y*H,s}}
function spawn(){if(paused)return;const e=edges[Math.floor(Math.random()*edges.length)];const from=services.find(s=>s.id===e[0]),to=services.find(s=>s.id===e[1]);if(from.status==='failed'||to.status==='failed')return;const err=chaos?Math.random()<.3:Math.random()<.03;packets.push({from:e[0],to:e[1],t:0,speed:.008+Math.random()*.01,err})}
function draw(){ctx.fillStyle='#0f1117';ctx.fillRect(0,0,W,H);
  edges.forEach(([a,b])=>{const A=nodeAt(a),B=nodeAt(b);ctx.strokeStyle='#2a2f3e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke()});
  for(let i=packets.length-1;i>=0;i--){const p=packets[i];p.t+=p.speed;const A=nodeAt(p.from),B=nodeAt(p.to);const x=A.x+(B.x-A.x)*p.t,y=A.y+(B.y-A.y)*p.t;ctx.fillStyle=p.err?'#ef4444':'#6ee7b7';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=8;ctx.shadowColor=p.err?'#ef4444':'#6ee7b7';ctx.fill();ctx.shadowBlur=0;if(p.t>=1)packets.splice(i,1)}
  services.forEach(s=>{const x=s.x*W,y=s.y*H;const col=s.status==='failed'?'#ef4444':s.status==='degraded'?'#fbbf24':'#6ee7b7';ctx.fillStyle='#1a1d27';ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=col;ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(s.name,x,y+38)});
  requestAnimationFrame(draw)}
setInterval(spawn,80);
setInterval(()=>{const recent=packets.length;stats.rps=Math.floor(recent*12+Math.random()*50);stats.p99=Math.floor(20+Math.random()*80+(chaos?150:0));stats.err=chaos?(15+Math.random()*15).toFixed(1):(Math.random()*3).toFixed(1);stats.circuits=services.filter(s=>s.status!=='healthy').length;document.getElementById('rps').textContent=stats.rps;document.getElementById('p99').textContent=stats.p99+'ms';document.getElementById('err').textContent=stats.err+'%';document.getElementById('circuits').textContent=stats.circuits;const ul=document.getElementById('services');ul.innerHTML=services.map(s=>`<li class="${s.status}">${s.name}<span>${s.status}</span></li>`).join('')},500);
document.getElementById('pause').onclick=e=>{paused=!paused;e.target.textContent=paused?'Resume':'Pause'};
document.getElementById('chaos').onclick=()=>{chaos=!chaos;if(chaos){services[2].status='degraded';services[4].status='failed'}else services.forEach(s=>s.status='healthy')};
document.getElementById('reset').onclick=()=>{packets.length=0;chaos=false;services.forEach(s=>s.status='healthy')};
draw();