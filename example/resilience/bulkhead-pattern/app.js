const services=[
  {name:'Payment Service',max:8,active:0,rejected:0,total:0,color:'#6ee7b7'},
  {name:'Inventory Service',max:6,active:0,rejected:0,total:0,color:'#60a5fa'},
  {name:'Notification Service',max:5,active:0,rejected:0,total:0,color:'#c084fc'}
];
const poolsEl=document.getElementById('pools'),logEl=document.getElementById('log');
function render(){poolsEl.innerHTML='';services.forEach(s=>{const pct=Math.round(s.active/s.max*100);
const deg=pct>85;const d=document.createElement('div');d.className='pool'+(deg?' degraded':'');
d.innerHTML=`<h2 style="color:${s.color}">${s.name}</h2>
<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${deg?'#ff6b6b':s.color}"></div></div>
<div class="slots">${Array.from({length:s.max},(_,i)=>`<div class="slot ${i<s.active?'active':''}"></div>`).join('')}</div>
<div class="stats">${s.active}/${s.max} threads · ${s.rejected} rejected · ${s.total} total</div>`;
poolsEl.appendChild(d)})}
function log(msg){const l=document.createElement('div');l.textContent=new Date().toLocaleTimeString()+' '+msg;logEl.prepend(l);if(logEl.children.length>40)logEl.lastChild.remove()}
function tick(){services.forEach(s=>{if(Math.random()<.4){if(s.active<s.max){s.active++;s.total++;log(`[${s.name}] request accepted (${s.active}/${s.max})`)}
else{s.rejected++;s.total++;log(`[${s.name}] REJECTED — bulkhead full`)}}
if(Math.random()<.35&&s.active>0){s.active--;log(`[${s.name}] request completed`)}});render()}
render();setInterval(tick,700);