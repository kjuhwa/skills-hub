const svg=document.getElementById('busSvg'),log=document.getElementById('log');
let particles=[];
function drawBus(){
  svg.innerHTML='';
  const ns='http://www.w3.org/2000/svg';
  // bus lines
  [{y:80,label:'Command Bus',color:'#f87171'},{y:200,label:'Query Bus',color:'#60a5fa'}].forEach(b=>{
    const line=document.createElementNS(ns,'line');
    Object.entries({x1:10,y1:b.y,x2:210,y2:b.y,stroke:b.color,'stroke-width':3,'stroke-dasharray':'6,4',opacity:.5}).forEach(([k,v])=>line.setAttribute(k,v));
    svg.appendChild(line);
    const t=document.createElementNS(ns,'text');
    t.setAttribute('x',110);t.setAttribute('y',b.y-10);t.setAttribute('text-anchor','middle');
    t.setAttribute('fill',b.color);t.setAttribute('font-size','11');t.textContent=b.label;
    svg.appendChild(t);
  });
}
function animateParticle(type){
  const ns='http://www.w3.org/2000/svg';
  const isCmd=type==='command',y=isCmd?80:200,color=isCmd?'#f87171':'#60a5fa';
  const c=document.createElementNS(ns,'circle');
  c.setAttribute('r',6);c.setAttribute('cy',y);c.setAttribute('cx',10);c.setAttribute('fill',color);
  svg.appendChild(c);
  let x=10;const iv=setInterval(()=>{x+=6;c.setAttribute('cx',x);if(x>210){clearInterval(iv);c.remove()}},30);
}
function dispatch(type,name){
  animateParticle(type);
  const li=document.createElement('li');li.className=type==='command'?'cmd':'qry';
  const handler=type==='command'?name+'Handler':''+name+'Handler';
  const result=type==='command'?'✓ state mutated':'⟵ data returned';
  li.innerHTML=`<strong>${handler}</strong> → ${result} <em style="color:#4b5563;float:right">${new Date().toLocaleTimeString()}</em>`;
  log.prepend(li);
}
document.getElementById('dispatch').onclick=()=>{
  const t=document.getElementById('opType').value,n=document.getElementById('opName').value.trim()||'Unnamed';
  dispatch(t,n);
};
drawBus();
// seed
const seeds=[['command','CreateUser'],['query','GetUsers'],['command','UpdateOrder'],['query','FindOrder'],['command','DeleteItem'],['query','ListItems']];
seeds.forEach(([t,n],i)=>setTimeout(()=>dispatch(t,n),i*400));