const services = [
  {id:'svc-auth',fail:0,state:'closed',threshold:5,cooldown:0},
  {id:'svc-payment',fail:0,state:'closed',threshold:4,cooldown:0},
  {id:'svc-inventory',fail:0,state:'closed',threshold:5,cooldown:0},
  {id:'svc-shipping',fail:0,state:'closed',threshold:3,cooldown:0},
  {id:'svc-email',fail:0,state:'closed',threshold:4,cooldown:0},
  {id:'svc-search',fail:0,state:'closed',threshold:5,cooldown:0}
];
const log=document.getElementById('log');
function addLog(msg){const d=document.createElement('div');d.textContent=`[${new Date().toLocaleTimeString()}] ${msg}`;log.prepend(d);if(log.children.length>60)log.lastChild.remove()}
function drawRing(canvas,ratio,color){const ctx=canvas.getContext('2d'),cx=60,cy=60,r=50;ctx.clearRect(0,0,120,120);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#2a2d37';ctx.lineWidth=8;ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();ctx.fillStyle=color;ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(Math.round(ratio*100)+'%',cx,cy)}
function tick(){services.forEach(s=>{const el=document.getElementById(s.id),stateEl=el.querySelector('.state'),canvas=el.querySelector('canvas');
if(s.state==='open'){s.cooldown--;if(s.cooldown<=0){s.state='half';addLog(`${s.id} → HALF-OPEN (probing)`)}
}else{const fails=Math.random()<(s.state==='half'?0.4:0.15);if(fails){s.fail=Math.min(s.fail+1,s.threshold);if(s.fail>=s.threshold&&s.state!=='open'){s.state='open';s.cooldown=8+Math.floor(Math.random()*5);addLog(`⚠ ${s.id} → OPEN (${s.threshold} failures)`)}}else{if(s.state==='half'){s.state='closed';s.fail=0;addLog(`✓ ${s.id} → CLOSED (recovered)`)}else{s.fail=Math.max(0,s.fail-1)}}}
const ratio=s.fail/s.threshold,color=s.state==='open'?'#f87171':s.state==='half'?'#fbbf24':'#6ee7b7';
drawRing(canvas,ratio,color);el.className='card '+s.state;stateEl.textContent=s.state.toUpperCase();stateEl.className='state s-'+s.state})}
setInterval(tick,800);tick();