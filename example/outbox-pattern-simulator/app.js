const svcs=[{name:'Orders',event:'order.created'},{name:'Payments',event:'payment.completed'},{name:'Users',event:'user.signed_up'},{name:'Shipping',event:'shipment.dispatched'},{name:'Inventory',event:'stock.updated'}];
const svcEl=document.getElementById('services');
const svg=document.getElementById('svg');
const outboxEl=document.getElementById('outbox');
const topicsEl=document.getElementById('topics');
let outbox=[],topics=[],animId=0;
const boxes=[{x:60,y:100,w:120,h:50,label:'Service',fill:'#58a6ff'},{x:240,y:100,w:120,h:50,label:'DB Write',fill:'#f0ad4e'},{x:420,y:100,w:120,h:50,label:'Outbox Relay',fill:'#da70d6'},{x:620,y:100,w:120,h:50,label:'Message Broker',fill:'#6ee7b7'}];
function drawBase(){
  let s='';
  boxes.forEach((b,i)=>{
    s+=`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="8" fill="${b.fill}11" stroke="${b.fill}" stroke-width="1.5"/>`;
    s+=`<text x="${b.x+b.w/2}" y="${b.y+b.h/2+5}" text-anchor="middle" fill="${b.fill}" font-size="12" font-family="system-ui">${b.label}</text>`;
    if(i<boxes.length-1){const nx=boxes[i+1];s+=`<line x1="${b.x+b.w}" y1="${b.y+b.h/2}" x2="${nx.x}" y2="${nx.y+nx.h/2}" stroke="#6ee7b722" stroke-width="1.5" stroke-dasharray="5,4"/>`}
  });
  svg.innerHTML=s;
}
drawBase();
svcs.forEach(s=>{const d=document.createElement('div');d.className='svc';d.textContent=s.name;d.onclick=()=>emit(s);svcEl.appendChild(d)});
function uid(){return Math.random().toString(36).slice(2,7)}
function emit(svc){
  const id=uid();
  const row={id,event:svc.event,status:'PENDING',ts:new Date().toLocaleTimeString()};
  outbox.unshift(row);
  animateDot(0,1,'#f0ad4e');
  setTimeout(()=>{
    animateDot(1,2,'#da70d6');
    setTimeout(()=>{
      if(Math.random()<.1){row.status='FAILED'}
      else{row.status='SENT';topics.unshift({topic:svc.event,id,ts:row.ts});animateDot(2,3,'#6ee7b7')}
      renderTables();
    },700);
  },700);
  renderTables();
}
function animateDot(fi,ti){
  const f=boxes[fi],t=boxes[ti];
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('r','5');c.setAttribute('fill',t.fill);
  const a=document.createElementNS('http://www.w3.org/2000/svg','animateMotion');
  a.setAttribute('dur','0.6s');a.setAttribute('fill','freeze');
  a.setAttribute('path',`M${f.x+f.w},${f.y+f.h/2} L${t.x},${t.y+t.h/2}`);
  c.appendChild(a);svg.appendChild(c);
  setTimeout(()=>c.remove(),700);
}
function renderTables(){
  outboxEl.innerHTML=outbox.slice(0,15).map(r=>`<div class="entry"><span>${r.id}</span><span>${r.event}</span><span class="${r.status==='PENDING'?'p':r.status==='SENT'?'s':'f'}">${r.status}</span></div>`).join('');
  topicsEl.innerHTML=topics.slice(0,15).map(r=>`<div class="entry"><span>${r.topic}</span><span>${r.id}</span><span class="s">${r.ts}</span></div>`).join('');
}
// seed initial data
svcs.slice(0,3).forEach((s,i)=>setTimeout(()=>emit(s),i*400));