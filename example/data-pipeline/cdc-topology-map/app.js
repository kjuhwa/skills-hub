const svg=document.getElementById('svg'),info=document.getElementById('info');
let W,H;
function resize(){W=svg.clientWidth;H=svg.clientHeight;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);layout()}
const nodes=[
  {id:'postgres',type:'source',label:'PostgreSQL',rate:120},
  {id:'mysql',type:'source',label:'MySQL',rate:85},
  {id:'mongo',type:'source',label:'MongoDB',rate:200},
  {id:'debezium',type:'connector',label:'Debezium'},
  {id:'kafka',type:'broker',label:'Kafka'},
  {id:'elastic',type:'sink',label:'Elasticsearch',lag:12},
  {id:'redis',type:'sink',label:'Redis Cache',lag:3},
  {id:'warehouse',type:'sink',label:'Data Warehouse',lag:45},
];
const links=[
  ['postgres','debezium'],['mysql','debezium'],['mongo','debezium'],
  ['debezium','kafka'],['kafka','elastic'],['kafka','redis'],['kafka','warehouse']
];
const typeColors={source:'#6ee7b7',connector:'#f0c674',broker:'#7ec8e3',sink:'#c084fc'};
function layout(){
  const cols={source:0.12,connector:0.35,broker:0.55,sink:0.85};
  const groups={};nodes.forEach(n=>{if(!groups[n.type])groups[n.type]=[];groups[n.type].push(n)});
  Object.entries(groups).forEach(([type,arr])=>{
    const x=cols[type]*W;arr.forEach((n,i)=>{n.x=x;n.y=H*(i+1)/(arr.length+1)})});
  render();
}
function render(){
  let html='<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  links.forEach(([a,b],i)=>{
    const na=nodes.find(n=>n.id===a),nb=nodes.find(n=>n.id===b);
    const mx=(na.x+nb.x)/2,my=(na.y+nb.y)/2-30;
    html+=`<path class="link" d="M${na.x},${na.y} Q${mx},${my} ${nb.x},${nb.y}"/>`;
    html+=`<circle class="pulse" r="4" filter="url(#glow)"><animateMotion dur="${1.5+i*0.3}s" repeatCount="indefinite" path="M${na.x},${na.y} Q${mx},${my} ${nb.x},${nb.y}"/><animate attributeName="opacity" values="0;1;1;0" dur="${1.5+i*0.3}s" repeatCount="indefinite"/></circle>`;
  });
  nodes.forEach(n=>{
    const r=n.type==='broker'?28:22,c=typeColors[n.type];
    html+=`<circle cx="${n.x}" cy="${n.y}" r="${r}" fill="#1a1d27" stroke="${c}" stroke-width="2" data-id="${n.id}" style="cursor:pointer" filter="url(#glow)"/>`;
    html+=`<text class="node-label" x="${n.x}" y="${n.y+r+14}">${n.label}</text>`;
    const icon=n.type==='source'?'DB':n.type==='connector'?'⚡':n.type==='broker'?'☰':'▼';
    html+=`<text x="${n.x}" y="${n.y+4}" text-anchor="middle" fill="${c}" font-size="14">${icon}</text>`;
  });
  svg.innerHTML=html;
  svg.querySelectorAll('circle[data-id]').forEach(el=>{
    el.addEventListener('mouseenter',()=>{
      const n=nodes.find(nd=>nd.id===el.dataset.id);
      let txt=`${n.label} (${n.type})`;
      if(n.rate)txt+=` — ${n.rate} events/s`;if(n.lag!=null)txt+=` — lag: ${n.lag}ms`;
      info.textContent=txt;info.style.color=typeColors[n.type];
    });
    el.addEventListener('mouseleave',()=>{info.textContent='Hover a node for details';info.style.color='#888'});
  });
}
window.addEventListener('resize',resize);resize();