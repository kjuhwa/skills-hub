const stage=document.getElementById('canary');
const particles=document.getElementById('gasParticles');
let health=100,latency=0.2,errors=0,cpu=0.3,users=0,deployTime=Date.now();
let state='healthy',faultActive=false;
const versions=['v2.4.1','v2.5.0-beta','v2.5.1','v3.0.0-rc1'];let vIdx=0;

function drawCanary(){
  const tilt=state==='sick'?20:state==='dead'?90:0;
  const flap=Math.sin(Date.now()/200)*8;
  const color=state==='dead'?'#555':state==='sick'?'#fbbf24':'#6ee7b7';
  const y=state==='dead'?300:200+Math.sin(Date.now()/500)*8;
  stage.innerHTML=`
    <g transform="translate(400 ${y}) rotate(${tilt})">
      <ellipse cx="0" cy="0" rx="40" ry="28" fill="${color}"/>
      <ellipse cx="-${flap}" cy="-4" rx="20" ry="14" fill="${color}" opacity="0.9" transform="rotate(-20)"/>
      <ellipse cx="${flap}" cy="-4" rx="20" ry="14" fill="${color}" opacity="0.9" transform="rotate(20)"/>
      <circle cx="25" cy="-8" r="14" fill="${color}"/>
      <circle cx="30" cy="-10" r="3" fill="#0f1117"/>
      <polygon points="38,-8 48,-6 38,-3" fill="#fbbf24"/>
      <line x1="-10" y1="25" x2="-12" y2="35" stroke="#fbbf24" stroke-width="2"/>
      <line x1="10" y1="25" x2="12" y2="35" stroke="#fbbf24" stroke-width="2"/>
    </g>`;
}

function spawnGas(){
  if(!faultActive)return;
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx',100+Math.random()*600);
  c.setAttribute('cy',380);
  c.setAttribute('r',3+Math.random()*8);
  c.setAttribute('fill','#f87171');
  c.setAttribute('opacity','0.6');
  particles.appendChild(c);
  let t=0;
  const i=setInterval(()=>{
    t++;
    c.setAttribute('cy',380-t*4);
    c.setAttribute('opacity',0.6-t*0.02);
    if(t>30){clearInterval(i);c.remove();}
  },60);
}

function setBar(id,val,thresholds){
  const el=document.getElementById(id);
  el.style.width=Math.min(100,val*100)+'%';
  el.className='';
  if(val>thresholds[1])el.className='bad';
  else if(val>thresholds[0])el.className='warn';
}

function alert(msg,cls=''){
  const a=document.getElementById('alert');
  a.textContent=msg;a.className='alert '+cls;
}

function tick(){
  if(faultActive){
    latency=Math.min(1,latency+0.02);
    errors=Math.min(1,errors+0.015);
    cpu=Math.min(1,cpu+0.01);
    health=Math.max(0,health-1);
  }else{
    latency=Math.max(0.15,latency-0.01);
    errors=Math.max(0,errors-0.015);
    cpu=Math.max(0.25,cpu-0.008);
    health=Math.min(100,health+0.5);
  }
  users+=Math.floor(1+Math.random()*3);
  if(health>70){state='healthy';}
  else if(health>20){state='sick';alert('⚠️ Canary is wobbly - error rate climbing','warn');}
  else if(health>0){state='sick';alert('🚨 Canary failing - consider rollback','danger');}
  else{state='dead';alert('☠️ CANARY DEAD - auto-rollback triggered','danger');
    if(faultActive){faultActive=false;setTimeout(()=>{health=40;alert('🔧 Rolled back to previous version','warn');},1500);}
  }
  document.getElementById('health').textContent=Math.floor(health);
  document.getElementById('users').textContent=users.toLocaleString();
  document.getElementById('age').textContent=Math.floor((Date.now()-deployTime)/1000)+'s';
  setBar('latBar',latency,[0.5,0.8]);
  setBar('errBar',errors,[0.3,0.6]);
  setBar('cpuBar',cpu,[0.6,0.85]);
  drawCanary();spawnGas();
}

document.getElementById('deploy').onclick=()=>{
  vIdx=(vIdx+1)%versions.length;
  document.getElementById('release').textContent=versions[vIdx];
  deployTime=Date.now();health=100;faultActive=false;errors=0;latency=0.2;
  alert('🚀 Deployed '+versions[vIdx]+' to canary fleet','');
};
document.getElementById('inject').onclick=()=>{faultActive=true;alert('☠️ Fault injected into canary','danger');};
document.getElementById('resolve').onclick=()=>{faultActive=false;health=Math.max(health,60);alert('🔧 Hotfix applied','');};

alert('Canary alive and singing 🎶');
setInterval(tick,400);
drawCanary();