const views=[
  {name:'mv_daily_revenue',schema:'analytics',rows:365,sizeKB:84,refreshSec:60,query:'SUM(amount) GROUP BY date',lastRefresh:0,elapsed:0,state:'ok',history:[]},
  {name:'mv_user_segments',schema:'marketing',rows:12000,sizeKB:2100,refreshSec:120,query:'CLUSTER(users) BY behavior',lastRefresh:0,elapsed:0,state:'ok',history:[]},
  {name:'mv_product_ranks',schema:'catalog',rows:500,sizeKB:46,refreshSec:30,query:'RANK() OVER(ORDER BY sales)',lastRefresh:0,elapsed:0,state:'ok',history:[]},
  {name:'mv_geo_heatmap',schema:'analytics',rows:48000,sizeKB:8900,refreshSec:90,query:'COUNT(*) GROUP BY lat_bin,lon_bin',lastRefresh:0,elapsed:0,state:'ok',history:[]},
  {name:'mv_funnel_steps',schema:'growth',rows:7,sizeKB:2,refreshSec:45,query:'COUNT(DISTINCT uid) per step',lastRefresh:0,elapsed:0,state:'ok',history:[]},
  {name:'mv_error_digest',schema:'ops',rows:1200,sizeKB:310,refreshSec:20,query:'GROUP BY error_class, 1h window',lastRefresh:0,elapsed:0,state:'ok',history:[]}
];
views.forEach(v=>{v.elapsed=Math.random()*v.refreshSec|0;v.history=Array.from({length:20},()=>200+Math.random()*800|0)});
const grid=document.getElementById('grid'),clock=document.getElementById('clock');
function sparkSVG(hist,w=280,h=30){
  const max=Math.max(...hist),pts=hist.map((v,i)=>`${i*(w/(hist.length-1))},${h-v/max*h}`).join(' ');
  return `<svg class="sparkline" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="#6ee7b7" stroke-width="1.5" opacity="0.6"/></svg>`;
}
function renderCard(v){
  const pct=Math.min(100,v.elapsed/v.refreshSec*100);
  const badge=v.state==='refreshing'?'refreshing':v.state==='stale'?'stale':'ok';
  const label=v.state==='refreshing'?'REFRESHING':v.state==='stale'?'STALE':'OK';
  return `<div class="card ${v.state}"><div class="card-head"><h2>${v.name}</h2><span class="badge ${badge}">${label}</span></div>
<div class="meta">Schema: <span>${v.schema}</span> &middot; Rows: <span>${v.rows.toLocaleString()}</span> &middot; Size: <span>${v.sizeKB}KB</span><br>
Interval: <span>${v.refreshSec}s</span> &middot; Elapsed: <span>${v.elapsed}s</span> &middot; Last: <span>${v.history[v.history.length-1]}ms</span></div>
<div class="bar-wrap"><div class="bar" style="width:${pct}%"></div></div>${sparkSVG(v.history)}</div>`;
}
function render(){grid.innerHTML=views.map(renderCard).join('')}
function tick(){
  views.forEach(v=>{
    v.elapsed++;
    if(v.state==='refreshing'){
      if(v.elapsed>2){v.state='ok';v.elapsed=0;v.history.push(150+Math.random()*900|0);v.history.shift();v.rows+=Math.random()*10|0}
    }else if(v.elapsed>=v.refreshSec){
      v.state=Math.random()>.15?'refreshing':'stale';v.elapsed=0;
    }
  });
  clock.textContent=new Date().toLocaleTimeString();
  render();
}
render();setInterval(tick,1000);