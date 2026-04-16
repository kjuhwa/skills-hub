const svg=document.getElementById('viz'),stats=document.getElementById('stats');
let state='closed',failures=0,successes=0,rejected=0,timer=0,cooldownMax=6,thresholdMax=5,particles=[];
const thresholdIn=document.getElementById('threshold'),cooldownIn=document.getElementById('cooldown');
thresholdIn.oninput=()=>{thresholdMax=+thresholdIn.value;document.getElementById('thresholdVal').textContent=thresholdMax};
cooldownIn.oninput=()=>{cooldownMax=+cooldownIn.value;document.getElementById('cooldownVal').textContent=cooldownMax};
document.getElementById('btnReq').onclick=()=>sendReq(false);
document.getElementById('btnFail').onclick=()=>sendReq(true);
document.getElementById('btnReset').onclick=()=>{state='closed';failures=0;successes=0;rejected=0;timer=0;render()};
function sendReq(fail){
  if(state==='open'){rejected++;particles.push({x:300,y:80,vx:(Math.random()-.5)*3,vy:-2,life:30,color:'#f87171'});render();return}
  if(fail){failures++;if(failures>=thresholdMax){state='open';timer=cooldownMax;startTimer()}particles.push({x:440,y:130,vx:2,vy:(Math.random()-.5)*2,life:30,color:'#f87171'})}
  else{successes++;if(state==='half'){state='closed';failures=0}particles.push({x:440,y:130,vx:2,vy:(Math.random()-.5)*2,life:30,color:'#6ee7b7'})}
  render()}
function startTimer(){const iv=setInterval(()=>{timer--;if(timer<=0){clearInterval(iv);state='half';failures=Math.max(0,failures-1);render()}render()},1000)}
function render(){
  const sc=state==='closed'?'#6ee7b7':state==='open'?'#f87171':'#fbbf24';
  const bars=Array.from({length:thresholdMax},(_,i)=>`<rect x="${180+i*18}" y="170" width="14" height="40" rx="3" fill="${i<failures?'#f87171':'#2a2d37'}"/>`).join('');
  svg.innerHTML=`
    <circle cx="100" cy="130" r="40" fill="none" stroke="#2a2d37" stroke-width="4"/>
    <text x="100" y="85" text-anchor="middle" fill="#8b949e" font-size="11">CLIENT</text>
    <circle cx="300" cy="130" r="44" fill="none" stroke="${sc}" stroke-width="5"/>
    <text x="300" y="125" text-anchor="middle" fill="${sc}" font-size="13" font-weight="bold">${state.toUpperCase()}</text>
    <text x="300" y="143" text-anchor="middle" fill="#8b949e" font-size="10">${state==='open'?'retry in '+timer+'s':'fail '+failures+'/'+thresholdMax}</text>
    <circle cx="500" cy="130" r="40" fill="none" stroke="#2a2d37" stroke-width="4"/>
    <text x="500" y="85" text-anchor="middle" fill="#8b949e" font-size="11">SERVICE</text>
    <line x1="144" y1="130" x2="252" y2="130" stroke="${sc}" stroke-width="2" stroke-dasharray="${state==='open'?'6,4':'none'}"/>
    <line x1="348" y1="130" x2="456" y2="130" stroke="#2a2d37" stroke-width="2"/>
    ${bars}
    <text x="180" y="228" fill="#8b949e" font-size="10">failure gauge</text>
    ${particles.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="${Math.max(1,p.life/8)}" fill="${p.color}" opacity="${p.life/30}"/>`).join('')}`;
  stats.textContent=`✓ ${successes} success | ✗ ${failures} failures | ⊘ ${rejected} rejected`;
}
setInterval(()=>{particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;return p.life>0});if(particles.length)render()},50);
render();