const svg=document.getElementById('yard'),tip=document.getElementById('tooltip');
const topics=['order.created','payment.charge','email.dispatch','inventory.sync','analytics.push','user.onboard'];
const errors=['TimeoutException','DeserializationError','RetryLimitExceeded','CircuitBreakerOpen','AuthExpired','PayloadTooLarge'];
const epitaphs=['Gone too soon','Should have been retried','Lost in the void','Never acknowledged','Payload of gold, schema of sand','Timed out, checked out'];
const rnd=a=>a[Math.floor(Math.random()*a.length)];

const graves=[];
const cols=6,rows=3;
for(let r=0;r<rows;r++){
  for(let c=0;c<cols;c++){
    const bx=60+c*120+Math.random()*30-15;
    const by=100+r*130+Math.random()*20-10;
    graves.push({x:bx,y:by,topic:rnd(topics),error:rnd(errors),epitaph:rnd(epitaphs),
      retries:Math.floor(Math.random()*5)+1,
      ts:new Date(Date.now()-Math.floor(Math.random()*864e5*7)).toISOString().slice(0,16).replace('T',' ')});
  }
}

// ground line
const ground=document.createElementNS('http://www.w3.org/2000/svg','rect');
Object.entries({x:0,y:380,width:800,height:120,fill:'#161b22',rx:4}).forEach(([k,v])=>ground.setAttribute(k,v));
svg.appendChild(ground);

// moon
const moon=document.createElementNS('http://www.w3.org/2000/svg','circle');
Object.entries({cx:680,cy:60,r:30,fill:'#1a1d27',stroke:'#30363d','stroke-width':2}).forEach(([k,v])=>moon.setAttribute(k,v));
svg.appendChild(moon);

graves.forEach((g,i)=>{
  const group=document.createElementNS('http://www.w3.org/2000/svg','g');
  group.style.cursor='pointer';

  // tombstone body
  const stone=document.createElementNS('http://www.w3.org/2000/svg','path');
  const sx=g.x,sy=g.y,w=70,h=90;
  stone.setAttribute('d',`M${sx} ${sy+h} L${sx} ${sy+20} Q${sx} ${sy} ${sx+w/2} ${sy} Q${sx+w} ${sy} ${sx+w} ${sy+20} L${sx+w} ${sy+h} Z`);
  stone.setAttribute('fill','#1a1d27');stone.setAttribute('stroke','#30363d');stone.setAttribute('stroke-width','1.5');
  group.appendChild(stone);

  // RIP text
  const rip=document.createElementNS('http://www.w3.org/2000/svg','text');
  rip.setAttribute('x',sx+w/2);rip.setAttribute('y',sy+35);rip.setAttribute('text-anchor','middle');
  rip.setAttribute('fill','#6ee7b7');rip.setAttribute('font-size','13');rip.setAttribute('font-weight','bold');
  rip.textContent='R.I.P.';group.appendChild(rip);

  // cross
  const cross=document.createElementNS('http://www.w3.org/2000/svg','text');
  cross.setAttribute('x',sx+w/2);cross.setAttribute('y',sy+58);cross.setAttribute('text-anchor','middle');
  cross.setAttribute('fill','#30363d');cross.setAttribute('font-size','22');
  cross.textContent='†';group.appendChild(cross);

  // id
  const idText=document.createElementNS('http://www.w3.org/2000/svg','text');
  idText.setAttribute('x',sx+w/2);idText.setAttribute('y',sy+78);idText.setAttribute('text-anchor','middle');
  idText.setAttribute('fill','#8b949e');idText.setAttribute('font-size','8');
  idText.textContent='msg-'+Math.random().toString(36).slice(2,8);group.appendChild(idText);

  group.addEventListener('mouseenter',e=>{
    stone.setAttribute('fill','#6ee7b715');stone.setAttribute('stroke','#6ee7b7');
    tip.innerHTML=`<div class="topic">${g.topic}</div><div class="err">${g.error}</div><div>"${g.epitaph}"</div><div>Retries: ${g.retries}</div><div class="ts">${g.ts}</div>`;
    tip.style.display='block';
  });
  group.addEventListener('mousemove',e=>{tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px'});
  group.addEventListener('mouseleave',()=>{stone.setAttribute('fill','#1a1d27');stone.setAttribute('stroke','#30363d');tip.style.display='none'});

  svg.appendChild(group);
});

// stars
for(let i=0;i<40;i++){
  const s=document.createElementNS('http://www.w3.org/2000/svg','circle');
  s.setAttribute('cx',Math.random()*800);s.setAttribute('cy',Math.random()*370);
  s.setAttribute('r',Math.random()*1.5+.3);s.setAttribute('fill','#8b949e');
  s.setAttribute('opacity',Math.random()*.6+.2);
  svg.insertBefore(s,svg.firstChild);
}