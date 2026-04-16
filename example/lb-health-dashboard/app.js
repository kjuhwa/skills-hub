const nodes=[
  {id:"us-east-1a",cpu:42,mem:61,rps:1280,latency:12,status:"up",errors:0.1},
  {id:"us-east-1b",cpu:78,mem:74,rps:1890,latency:24,status:"up",errors:0.4},
  {id:"us-west-2a",cpu:91,mem:88,rps:2100,latency:89,status:"degraded",errors:2.1},
  {id:"eu-west-1a",cpu:35,mem:52,rps:940,latency:8,status:"up",errors:0.05},
  {id:"ap-south-1a",cpu:15,mem:30,rps:320,latency:5,status:"up",errors:0},
  {id:"eu-central-1",cpu:99,mem:95,rps:50,latency:450,status:"down",errors:12.3}
];
const history=Array.from({length:60},()=>nodes.map(n=>n.rps+Math.random()*200-100));

function renderCards(){
  const dash=document.getElementById("dash");dash.innerHTML="";
  nodes.forEach(n=>{
    const cls=n.status==="down"?"crit":n.status==="degraded"?"warn":"";
    dash.innerHTML+=`<div class="card ${cls}">
      <h3>${n.id}<span class="dot ${n.status}"></span></h3>
      <div class="metric"><span>CPU</span><span>${n.cpu}%</span></div>
      <div class="metric"><span>Memory</span><span>${n.mem}%</span></div>
      <div class="metric"><span>RPS</span><span>${n.rps.toLocaleString()}</span></div>
      <div class="metric"><span>Latency</span><span>${n.latency}ms</span></div>
      <div class="metric"><span>Error %</span><span>${n.errors}%</span></div>
    </div>`;
  });
}

function drawChart(){
  const canvas=document.getElementById("chart"),ctx=canvas.getContext("2d");
  canvas.width=canvas.parentElement.clientWidth-28;
  const W=canvas.width,H=canvas.height;
  ctx.fillStyle="#1a1d27";ctx.fillRect(0,0,W,H);
  const colors=["#6ee7b7","#67e8f9","#a78bfa","#fbbf24","#f87171","#fb923c"];
  const max=3000,pts=history.length;
  // grid
  for(let i=0;i<=4;i++){const y=H*i/4;ctx.strokeStyle="#2a2d37";ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    ctx.fillStyle="#9ca3af";ctx.font="10px system-ui";ctx.textAlign="left";ctx.fillText(Math.round(max-max*i/4),2,y+10)}
  // lines
  nodes.forEach((n,ni)=>{
    ctx.beginPath();ctx.strokeStyle=colors[ni];ctx.lineWidth=1.5;ctx.globalAlpha=0.8;
    history.forEach((snap,xi)=>{
      const x=(xi/(pts-1))*W,y=H-(Math.max(0,snap[ni])/max)*H;
      xi===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });ctx.stroke()});
  ctx.globalAlpha=1;
  // legend
  ctx.font="10px system-ui";let lx=W-140;
  nodes.slice(0,3).forEach((n,i)=>{ctx.fillStyle=colors[i];ctx.fillRect(lx,6,8,8);ctx.fillStyle="#9ca3af";ctx.fillText(n.id,lx+12,14);lx=lx;lx+=0;});
}

function tick(){
  nodes.forEach(n=>{
    if(n.status!=="down"){
      n.cpu=Math.min(99,Math.max(5,n.cpu+Math.round(Math.random()*10-5)));
      n.mem=Math.min(99,Math.max(10,n.mem+Math.round(Math.random()*4-2)));
      n.rps=Math.max(0,n.rps+Math.round(Math.random()*200-100));
      n.latency=Math.max(1,n.latency+Math.round(Math.random()*10-5));
    }
    n.status=n.cpu>95?"down":n.cpu>85?"degraded":"up";
  });
  history.push(nodes.map(n=>n.rps));if(history.length>60)history.shift();
  renderCards();drawChart();
  document.getElementById("clock").textContent=new Date().toLocaleTimeString();
}

renderCards();drawChart();setInterval(tick,1000);