const reasons=['Connection refused','Deserialization error','TTL expired','Invalid routing key','Consumer rejected','Poison pill'];
const topics=['order.created','payment.processed','user.signup','inventory.updated','email.send'];
let items=[],nextId=1;

function genItem(){
  return{id:nextId++,topic:topics[Math.random()*topics.length|0],reason:reasons[Math.random()*reasons.length|0],
    attempts:1+(Math.random()*4|0),ts:new Date(Date.now()-Math.random()*36e5).toLocaleTimeString(),state:'dlq'};
}
for(let i=0;i<8;i++)items.push(genItem());

function render(){
  ['dlq','ret','res'].forEach(prefix=>{
    const key=prefix==='ret'?'retrying':prefix==='res'?'resolved':'dlq';
    const list=document.getElementById(prefix+'-list');
    const filtered=items.filter(i=>i.state===key);
    document.getElementById(prefix+'-count').textContent=filtered.length;
    list.innerHTML=filtered.map(i=>`<div class="card ${i.state==='retrying'?'retrying':i.state==='resolved'?'success':''}">
      <div class="id">MSG-${String(i.id).padStart(4,'0')}</div>
      <div>Topic: ${i.topic}</div>
      <div class="reason">${i.reason}</div>
      <div class="meta">Attempts: ${i.attempts} · ${i.ts}</div>
      <div class="actions">
        ${i.state==='dlq'?`<button onclick="retry(${i.id})">↻ Retry</button><button class="purge" onclick="purge(${i.id})">✕ Purge</button>`:''}
      </div></div>`).join('');
  });
}

window.retry=function(id){
  const it=items.find(i=>i.id===id);if(!it)return;
  it.state='retrying';it.attempts++;render();
  setTimeout(()=>{it.state=Math.random()<.6?'resolved':'dlq';render();},1500+Math.random()*2000);
};
window.purge=function(id){items=items.filter(i=>i.id!==id);render();};

setInterval(()=>{if(items.filter(i=>i.state==='dlq').length<12){items.push(genItem());render();}},3000);
render();