const canvas=document.getElementById('timeline'),ctx=canvas.getContext('2d'),journal=document.getElementById('journal');
const entries=[];const MAX=60;
const colors={command:'#f97583',query:'#79c0ff',event:'#6ee7b7'};
const cmdNames=['CreateUser','UpdateCart','DeleteComment','PlaceOrder','ChangeEmail'];
const qryNames=['GetProfile','ListOrders','SearchItems','FetchMetrics','CountUsers'];
const evtNames=['UserCreated','CartUpdated','CommentDeleted','OrderPlaced','EmailChanged'];

function ts(){return new Date().toLocaleTimeString()}

function add(type,name){
  const e={type,name,time:ts(),tick:Date.now()};
  entries.push(e);if(entries.length>MAX)entries.shift();
  const d=document.createElement('div');d.className='entry t-'+type.slice(0,3).toLowerCase();
  d.innerHTML=`<span class="dot"></span><span class="ts">${e.time}</span><span>${type.toUpperCase().slice(0,3)} ${name}</span>`;
  journal.prepend(d);
  if(journal.children.length>40)journal.removeChild(journal.lastChild);
  updateStats();drawTimeline();
}

function updateStats(){
  const c=entries.filter(e=>e.type==='command').length;
  const q=entries.filter(e=>e.type==='query').length;
  const v=entries.filter(e=>e.type==='event').length;
  document.getElementById('sCmd').textContent=c;
  document.getElementById('sQry').textContent=q;
  document.getElementById('sEvt').textContent=v;
}

function drawTimeline(){
  ctx.clearRect(0,0,700,140);
  if(!entries.length)return;
  const now=Date.now(),window=30000;
  const yMap={command:30,query:70,event:110};
  ['command','query','event'].forEach(t=>{ctx.fillStyle=colors[t]+'44';ctx.fillRect(0,yMap[t]-8,700,16);ctx.fillStyle='#484f58';ctx.font='10px monospace';ctx.fillText(t.toUpperCase(),6,yMap[t]+4);});
  entries.forEach(e=>{
    const age=(now-e.tick)/window;if(age>1)return;
    const x=700-(age*700);
    ctx.beginPath();ctx.arc(x,yMap[e.type],4,0,Math.PI*2);ctx.fillStyle=colors[e.type];ctx.fill();
  });
}

function tick(){
  const r=Math.random();
  if(r<0.4){const n=cmdNames[Math.random()*cmdNames.length|0];add('command',n);setTimeout(()=>add('event',n.replace(/^[A-Z][a-z]+/,'')+'d'),300+Math.random()*500);}
  else{add('query',qryNames[Math.random()*qryNames.length|0]);}
}

setInterval(tick,1200);
setInterval(drawTimeline,200);
tick();tick();tick();