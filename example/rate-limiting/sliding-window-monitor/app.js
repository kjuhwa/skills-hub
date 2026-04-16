const endpoints=[
  {name:'GET /api/users',limit:20,count:0,window:[]},
  {name:'POST /api/login',limit:5,count:0,window:[]},
  {name:'GET /api/feed',limit:30,count:0,window:[]},
  {name:'PUT /api/profile',limit:10,count:0,window:[]},
  {name:'GET /api/search',limit:15,count:0,window:[]}
];
let totalAllowed=0,totalDenied=0;const history=Array(60).fill({a:0,d:0});
const svg=document.getElementById('chart');
function slidingCheck(ep){const now=Date.now();ep.window=ep.window.filter(t=>now-t<1000);if(ep.window.length<ep.limit){ep.window.push(now);ep.count++;totalAllowed++;return true}totalDenied++;return false}
function simulate(){endpoints.forEach(ep=>{const freq=Math.random()*ep.limit*1.4;for(let i=0;i<freq;i++)slidingCheck(ep)})}
function renderEndpoints(){const c=document.getElementById('endpoints');c.innerHTML='';endpoints.forEach(ep=>{const now=Date.now();const active=ep.window.filter(t=>now-t<1000).length;const pct=Math.min(active/ep.limit*100,100);const color=pct>90?'#f87171':pct>60?'#fbbf24':'#6ee7b7';
c.innerHTML+=`<div class="ep"><div><div class="ep-name">${ep.name}</div><div class="ep-bar"><div class="ep-fill" style="width:${pct}%;background:${color}"></div></div></div><div class="ep-count">${active}/${ep.limit}</div></div>`})}
function renderChart(){const max=Math.max(...history.map(h=>h.a+h.d),1);let pa='',pd='';history.forEach((h,i)=>{const x=i*(800/59);const ya=200-h.a/max*180;const yd=200-h.d/max*180;pa+=`${i?'L':'M'}${x},${ya}`;pd+=`${i?'L':'M'}${x},${yd}`});
svg.innerHTML=`<path d="${pa}" fill="none" stroke="#6ee7b7" stroke-width="2"/><path d="${pd}" fill="none" stroke="#f87171" stroke-width="1.5" stroke-dasharray="4"/><text x="10" y="16" fill="#94a3b8" font-size="11">— allowed  --- denied</text>`}
function updateStats(){const last=history[history.length-1];document.getElementById('rps').textContent=last.a+last.d;document.getElementById('allowed').textContent=totalAllowed;document.getElementById('denied').textContent=totalDenied;const r=totalAllowed+totalDenied?Math.round(totalAllowed/(totalAllowed+totalDenied)*100):100;document.getElementById('ratio').textContent=r+'%'}
let secA=0,secD=0;const origA=()=>totalAllowed,origD=()=>totalDenied;let prevA=0,prevD=0;
setInterval(()=>{simulate();renderEndpoints()},200);
setInterval(()=>{const a=totalAllowed-prevA,d=totalDenied-prevD;prevA=totalAllowed;prevD=totalDenied;history.push({a,d});history.shift();renderChart();updateStats()},1000);
renderChart();renderEndpoints();