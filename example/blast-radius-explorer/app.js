const services=[
  {id:'gateway',x:400,y:50,deps:['auth','router']},
  {id:'auth',x:200,y:150,deps:['users','cache']},
  {id:'router',x:600,y:150,deps:['orders','search']},
  {id:'users',x:100,y:280,deps:['db-primary']},
  {id:'cache',x:300,y:280,deps:[]},
  {id:'orders',x:500,y:280,deps:['payments','inventory']},
  {id:'search',x:700,y:280,deps:['cache']},
  {id:'payments',x:400,y:410,deps:['db-primary']},
  {id:'inventory',x:600,y:410,deps:['db-primary']},
  {id:'db-primary',x:300,y:450,deps:[]}
];
const svg=document.getElementById('graph'),panel=document.getElementById('panelTitle'),body=document.getElementById('panelBody');
const NS='http://www.w3.org/2000/svg';
function el(tag,attrs){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e}
const edgeEls=[],nodeEls={};
services.forEach(s=>{s.deps.forEach(d=>{const t=services.find(x=>x.id===d);if(!t)return;const line=el('line',{x1:s.x,y1:s.y,x2:t.x,y2:t.y,class:'edge','data-from':s.id,'data-to':d});svg.appendChild(line);edgeEls.push(line)})});
services.forEach(s=>{const g=el('g',{class:'node',transform:`translate(${s.x},${s.y})`});
  g.appendChild(el('circle',{r:22,fill:'#6ee7b7'}));
  const txt=el('text',{'text-anchor':'middle',dy:'4'});txt.textContent=s.id;g.appendChild(txt);
  const ring=el('circle',{r:22,class:'ring',stroke:'#f87171'});g.appendChild(ring);
  g.addEventListener('click',()=>simulate(s));
  svg.appendChild(g);nodeEls[s.id]={g,circle:g.querySelector('circle'),ring}});

function getAffected(src){
  const affected=new Set();
  const dependents={};
  services.forEach(s=>s.deps.forEach(d=>{if(!dependents[d])dependents[d]=[];dependents[d].push(s.id)}));
  const q=[src.id];affected.add(src.id);
  while(q.length){const cur=q.shift();(dependents[cur]||[]).forEach(dep=>{if(!affected.has(dep)){affected.add(dep);q.push(dep)}})}
  return affected;
}
function simulate(src){
  edgeEls.forEach(e=>e.classList.remove('hit'));
  Object.values(nodeEls).forEach(n=>{n.circle.setAttribute('fill','#6ee7b7');n.ring.classList.remove('active')});
  const hit=getAffected(src);
  hit.forEach(id=>{const n=nodeEls[id];n.circle.setAttribute('fill','#f87171');void n.ring.offsetWidth;n.ring.classList.add('active')});
  edgeEls.forEach(e=>{if(hit.has(e.dataset.from)&&hit.has(e.dataset.to))e.classList.add('hit')});
  panel.textContent=`💥 Failure: ${src.id}`;
  const tags=[...hit].map(id=>`<span class="tag">${id}</span>`).join('');
  const safe=services.filter(s=>!hit.has(s.id)).map(s=>`<span class="tag safe">${s.id}</span>`).join('')||'<em>none</em>';
  body.innerHTML=`<strong>Affected (${hit.size}):</strong> ${tags}<br><strong>Unaffected:</strong> ${safe}<br><strong>Blast radius:</strong> ${Math.round(hit.size/services.length*100)}% of infrastructure`;
}