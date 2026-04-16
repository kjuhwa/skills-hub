let shards=[],nextId=0;const COLORS=['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb923c','#34d399','#f87171'];
function makeShard(){return{id:nextId++,name:'shard_'+nextId,records:0,color:COLORS[(nextId-1)%COLORS.length],hot:false};}
function init(){for(let i=0;i<4;i++)shards.push(makeShard());distribute(200);render();}

function distribute(n){for(let i=0;i<n;i++){const idx=Math.floor(Math.random()*shards.length);shards[idx].records++;}}

function render(){
  const el=document.getElementById('shards'),max=Math.max(...shards.map(s=>s.records),1);
  const avg=shards.reduce((a,s)=>a+s.records,0)/shards.length;
  el.innerHTML=shards.map(s=>{
    const pct=(s.records/max*100).toFixed(0);
    const skew=Math.abs(s.records-avg)/avg*100;
    s.hot=skew>30;
    return`<div class="shard"><div class="name">${s.name}<span class="badge${s.hot?' show':''}">${s.hot?'HOT':''}</span></div><div class="bar-bg"><div class="bar" style="width:${pct}%;background:${s.color}"></div></div><div class="count">${s.records} records (${pct}%)</div></div>`;
  }).join('');
  const total=shards.reduce((a,s)=>a+s.records,0);
  const std=Math.sqrt(shards.reduce((a,s)=>a+Math.pow(s.records-avg,2),0)/shards.length);
  document.getElementById('stats').innerHTML=`Total: <span>${total}</span> &nbsp;|&nbsp; Shards: <span>${shards.length}</span> &nbsp;|&nbsp; Avg: <span>${Math.round(avg)}</span> &nbsp;|&nbsp; StdDev: <span>${std.toFixed(1)}</span>`;
}

document.getElementById('addShard').onclick=()=>{shards.push(makeShard());render();};
document.getElementById('addData').onclick=()=>{distribute(50);render();};
document.getElementById('rebalance').onclick=()=>{
  const total=shards.reduce((a,s)=>a+s.records,0),avg=Math.floor(total/shards.length);
  let rem=total-avg*shards.length;
  shards.forEach(s=>{s.records=avg;if(rem>0){s.records++;rem--;}});render();
};
init();