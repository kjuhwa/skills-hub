const svg=document.getElementById('pipeline'),log=document.getElementById('log'),statusEl=document.getElementById('status');
const stages=[{id:'extract',label:'Extract',x:60,sources:['PostgreSQL','CSV Files','REST API']},{id:'transform',label:'Transform',x:340,sources:['Clean Nulls','Map Schema','Aggregate']},{id:'load',label:'Load',x:620,sources:['Data Warehouse','Redis Cache','S3 Bucket']}];
let particles=[],animId=null,running=false;

function buildSVG(){
  svg.innerHTML='';
  stages.forEach((s,i)=>{
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.innerHTML=`<rect x="${s.x}" y="40" width="200" height="260" rx="12" fill="#1a1d27" stroke="#333" stroke-width="1.5"/>
      <text x="${s.x+100}" y="72" text-anchor="middle" fill="#6ee7b7" font-size="15" font-weight="bold">${s.label}</text>
      <line x1="${s.x+20}" y1="85" x2="${s.x+180}" y2="85" stroke="#333"/>`;
    s.sources.forEach((src,j)=>{
      const y=110+j*70;
      g.innerHTML+=`<rect x="${s.x+20}" y="${y}" width="160" height="44" rx="6" fill="#0f1117" stroke="#444" id="box-${s.id}-${j}"/>
        <text x="${s.x+100}" y="${y+27}" text-anchor="middle" fill="#c9d1d9" font-size="12">${src}</text>`;
    });
    if(i<2){
      const ax=s.x+210,bx=stages[i+1].x-10;
      g.innerHTML+=`<line x1="${ax}" y1="170" x2="${bx}" y2="170" stroke="#333" stroke-width="2" stroke-dasharray="6,4"/>
        <polygon points="${bx},164 ${bx+10},170 ${bx},176" fill="#6ee7b7" opacity="0.5"/>`;
    }
    svg.appendChild(g);
  });
}

function addLog(msg){const d=document.createElement('div');d.className='log-line';d.innerHTML=`<span>[${new Date().toLocaleTimeString()}]</span> ${msg}`;log.prepend(d)}

function animateStage(idx){
  return new Promise(r=>{
    const s=stages[idx];
    let step=0;
    const boxes=s.sources.map((_,j)=>document.getElementById(`box-${s.id}-${j}`));
    const interval=setInterval(()=>{
      if(step<3){
        boxes[step].setAttribute('stroke','#6ee7b7');
        boxes[step].setAttribute('stroke-width','2');
        addLog(`${s.label}: processing <span>${s.sources[step]}</span>`);
        step++;
      }else{clearInterval(interval);r()}
    },500);
  });
}

async function run(){
  if(running)return;running=true;statusEl.textContent='Running...';statusEl.style.color='#6ee7b7';
  buildSVG();log.innerHTML='';addLog('Pipeline started');
  for(let i=0;i<3;i++){addLog(`Stage: <span>${stages[i].label}</span>`);await animateStage(i);await new Promise(r=>setTimeout(r,300))}
  addLog('✓ Pipeline complete — 1,247 rows processed');statusEl.textContent='Complete';running=false;
}

document.getElementById('runBtn').onclick=run;
document.getElementById('resetBtn').onclick=()=>{running=false;buildSVG();log.innerHTML='';statusEl.textContent='Idle';statusEl.style.color='#888'};
buildSVG();