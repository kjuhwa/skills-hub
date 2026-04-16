const causes=[['TimeoutException',38,'#f59e0b'],['NullPointerException',22,'#ef4444'],['SchemaViolation',18,'#8b5cf6'],['AuthFailure',12,'#3b82f6'],['RateLimitExceeded',10,'#6ee7b7']];
const services=['order-svc','payment-svc','notification-svc','inventory-svc','user-svc','analytics-svc'];
const lastWords=['Connection refused after 30s','Cannot read property id of undefined','Expected string but got null','Token expired 14 seconds ago','429 Too Many Requests','Schema field amount missing','Upstream returned 503','Circuit breaker OPEN','Deserialization failed at line 42','TTL exceeded in stage 3'];

const total=causes.reduce((s,c)=>s+c[1],0);
document.getElementById('count').textContent=total*3;

function drawDonut(){
  const svg=document.getElementById('donut');
  const cx=100,cy=100,r=70,ir=45;
  let a0=-Math.PI/2;
  causes.forEach(([lbl,val,col])=>{
    const a1=a0+(val/total)*Math.PI*2;
    const x0=cx+Math.cos(a0)*r,y0=cy+Math.sin(a0)*r;
    const x1=cx+Math.cos(a1)*r,y1=cy+Math.sin(a1)*r;
    const xi0=cx+Math.cos(a0)*ir,yi0=cy+Math.sin(a0)*ir;
    const xi1=cx+Math.cos(a1)*ir,yi1=cy+Math.sin(a1)*ir;
    const large=a1-a0>Math.PI?1:0;
    const path=`M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi0},${yi0} Z`;
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',path);p.setAttribute('fill',col);p.setAttribute('stroke','#1a1d27');p.setAttribute('stroke-width','2');
    svg.appendChild(p);
    a0=a1;
  });
  document.getElementById('donut-legend').innerHTML=causes.map(([l,v,c])=>`<li><i style="background:${c}"></i>${l} <b>${v}</b></li>`).join('');
}

function drawTimeline(){
  const svg=document.getElementById('timeline');
  const pts=Array.from({length:24},(_,i)=>Math.floor(Math.random()*40)+5);
  const max=Math.max(...pts);
  const w=400,h=120;
  const path=pts.map((v,i)=>`${i===0?'M':'L'}${(i/23)*w},${h-(v/max)*(h-10)-5}`).join(' ');
  const area=path+` L${w},${h} L0,${h} Z`;
  svg.innerHTML=`<path d="${area}" fill="#6ee7b7" opacity=".15"/>
    <path d="${path}" stroke="#6ee7b7" stroke-width="2" fill="none"/>
    ${pts.map((v,i)=>`<circle cx="${(i/23)*w}" cy="${h-(v/max)*(h-10)-5}" r="2.5" fill="#6ee7b7"/>`).join('')}`;
}

function drawOffenders(){
  const data=services.map(s=>({svc:s,deaths:Math.floor(Math.random()*80)+10})).sort((a,b)=>b.deaths-a.deaths);
  const max=data[0].deaths;
  document.getElementById('offenders').innerHTML=data.map(d=>
    `<div class="offender"><span>${d.svc}</span><div class="bar"><div style="width:${(d.deaths/max)*100}%"></div></div><span>${d.deaths}</span></div>`
  ).join('');
}

function drawQuotes(){
  const picked=[...lastWords].sort(()=>Math.random()-.5).slice(0,6);
  document.getElementById('quotes').innerHTML=picked.map(q=>
    `<blockquote>"${q}"<cite>— msg_${Math.random().toString(36).slice(2,8)}</cite></blockquote>`
  ).join('');
}

drawDonut();drawTimeline();drawOffenders();drawQuotes();
setInterval(()=>{document.getElementById('timeline').innerHTML='';drawTimeline()},5000);
setInterval(drawQuotes,7000);