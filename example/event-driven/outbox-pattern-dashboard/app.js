const statCfg=[{id:'total',lbl:'Total Events'},{id:'pending',lbl:'Pending'},{id:'sent',lbl:'Sent'},{id:'failed',lbl:'Failed'},{id:'rate',lbl:'Events/sec'}];
const statsEl=document.getElementById('stats');
statCfg.forEach(s=>{const d=document.createElement('div');d.className='stat';d.innerHTML=`<div class="val" id="s-${s.id}">0</div><div class="lbl">${s.lbl}</div>`;statsEl.appendChild(d)});
let total=0,pending=0,sent=0,failed=0,history=new Array(60).fill(0),perSec=0;
const canvas=document.getElementById('chart'),ctx=canvas.getContext('2d');
const queue=document.getElementById('queue');
let events=[];
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function uid(){return Math.random().toString(36).slice(2,8)}
const types=['OrderCreated','PaymentProcessed','UserRegistered','ItemShipped','InvoiceGenerated'];
function tick(){
  const n=rnd(0,3);
  for(let i=0;i<n;i++){total++;pending++;const e={id:uid(),type:types[rnd(0,4)],status:'pending',ts:Date.now()};events.unshift(e)}
  const relay=Math.min(pending,rnd(0,4));
  for(let i=0;i<relay;i++){
    const e=events.find(x=>x.status==='pending');
    if(e){if(Math.random()<.07){e.status='failed';failed++;} else{e.status='sent';sent++;}pending--;}
  }
  perSec=n;history.push(n);history.shift();
  events=events.slice(0,50);
  render();
}
function render(){
  document.getElementById('s-total').textContent=total;
  document.getElementById('s-pending').textContent=pending;
  document.getElementById('s-sent').textContent=sent;
  document.getElementById('s-failed').textContent=failed;
  document.getElementById('s-rate').textContent=perSec;
  canvas.width=canvas.clientWidth;canvas.height=180;
  const w=canvas.width,h=canvas.height,max=Math.max(...history,1),bw=w/history.length;
  ctx.clearRect(0,0,w,h);
  history.forEach((v,i)=>{const bh=(v/max)*(h-20);ctx.fillStyle='#6ee7b7'+(v?'66':'22');ctx.fillRect(i*bw+1,h-bh,bw-2,bh)});
  ctx.strokeStyle='#6ee7b744';ctx.beginPath();ctx.moveTo(0,h-((2/max)*(h-20)));ctx.lineTo(w,h-((2/max)*(h-20)));ctx.stroke();
  queue.innerHTML=events.slice(0,20).map(e=>`<div class="row"><span>${e.id}</span><span>${e.type}</span><span class="${e.status}">${e.status.toUpperCase()}</span></div>`).join('');
}
setInterval(tick,1000);tick();