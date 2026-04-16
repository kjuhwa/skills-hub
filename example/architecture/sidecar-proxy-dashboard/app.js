const latencyData=[],maxPoints=30;
const svg=document.getElementById('svgLatency');
const logEl=document.getElementById('log');
const codes={200:0,201:0,404:0,500:0};
const colors={200:'#6ee7b7',201:'#58a6ff',404:'#f0883e',500:'#f85149'};
const methods=['GET','POST','PUT','DELETE'];
const paths=['/api/users','/api/orders','/health','/api/items','/api/auth'];
function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function updateChart(){
  const pts=latencyData.map((v,i)=>{const x=i*(300/(maxPoints-1));const y=120-v/3;return`${x},${y}`}).join(' ');
  svg.innerHTML=`<polyline points="${pts}" fill="none" stroke="#6ee7b7" stroke-width="2"/>
    ${latencyData.map((v,i)=>`<circle cx="${i*(300/(maxPoints-1))}" cy="${120-v/3}" r="2" fill="#6ee7b7"/>`).join('')}`;
}
function updateBars(){
  const total=Object.values(codes).reduce((a,b)=>a+b,1);
  document.getElementById('bars').innerHTML=Object.entries(codes).map(([c,v])=>
    `<div class="bar-row"><span>${c}</span><div class="bar-fill" style="width:${(v/total)*100}%;background:${colors[c]}"></div><span>${v}</span></div>`).join('');
}
function tick(){
  const lat=randInt(2,120);latencyData.push(lat);if(latencyData.length>maxPoints)latencyData.shift();
  updateChart();
  const code=[200,200,200,200,201,201,404,500][randInt(0,7)];codes[code]++;
  updateBars();
  document.getElementById('rpsVal').textContent=randInt(80,350);
  const m=methods[randInt(0,3)],p=paths[randInt(0,4)];
  const entry=document.createElement('div');
  entry.style.color=colors[code];entry.textContent=`[sidecar] ${m} ${p} → ${code} ${lat}ms`;
  logEl.prepend(entry);if(logEl.children.length>30)logEl.lastChild.remove();
}
setInterval(tick,800);tick();