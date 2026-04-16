const SHARDS=6,HISTORY=80,COLORS=['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb923c'];
const shards=Array.from({length:SHARDS},(_,i)=>({
  id:i,name:'shard-'+i,qps:0,latency:0,connections:0,history:[],color:COLORS[i]
}));

function tick(){
  shards.forEach(s=>{
    s.qps=200+Math.random()*800+(Math.random()<0.05?2000:0);
    s.latency=5+Math.random()*30+(s.qps>800?Math.random()*60:0);
    s.connections=10+Math.floor(Math.random()*50);
    s.history.push(s.latency);if(s.history.length>HISTORY)s.history.shift();
  });
  renderCards();renderChart();
}

function status(s){return s.latency>60?'crit':s.latency>30?'warn':'ok';}

function renderCards(){
  document.getElementById('grid').innerHTML=shards.map(s=>{
    const st=status(s);
    return`<div class="card ${st}"><div class="name"><span class="status ${st}"></span>${s.name}</div><div class="metric">QPS: <b>${Math.round(s.qps)}</b></div><div class="metric">Latency: <b>${s.latency.toFixed(1)}ms</b></div><div class="metric">Conns: <b>${s.connections}</b></div></div>`;
  }).join('');
}

function renderChart(){
  const c=document.getElementById('chart'),ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#8b949e';ctx.font='10px system-ui';ctx.fillText('Latency (ms) over time',8,14);
  const maxY=100,padL=30,padB=20,gw=c.width-padL-10,gh=c.height-padB-20;
  for(let y=0;y<=maxY;y+=25){
    const py=20+gh-(y/maxY)*gh;
    ctx.strokeStyle='#2d333b';ctx.beginPath();ctx.moveTo(padL,py);ctx.lineTo(padL+gw,py);ctx.stroke();
    ctx.fillStyle='#8b949e';ctx.fillText(y,4,py+3);
  }
  shards.forEach(s=>{
    if(s.history.length<2)return;
    ctx.beginPath();ctx.strokeStyle=s.color;ctx.lineWidth=1.5;ctx.globalAlpha=0.8;
    s.history.forEach((v,i)=>{
      const x=padL+(i/(HISTORY-1))*gw,y=20+gh-(Math.min(v,maxY)/maxY)*gh;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();ctx.globalAlpha=1;
  });
}

setInterval(tick,500);tick();