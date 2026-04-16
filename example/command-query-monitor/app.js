const svg=document.getElementById('chart'),feed=document.getElementById('feed');
const W=760,H=180,BARS=40;
let data=Array.from({length:BARS},()=>({c:0,q:0}));
let totalC=0,totalQ=0,latencies=[];
const cmds=['CreateOrder','UpdateCart','DeleteUser','ResetPassword','SavePrefs'];
const qrys=['GetDashboard','FindUser','ListOrders','SearchProducts','CountSessions'];

function renderChart(){
  const max=Math.max(6,...data.map(d=>d.c+d.q));
  const bw=W/BARS;
  let html=data.map((d,i)=>{
    const ch=(d.c/max)*(H-20),qh=(d.q/max)*(H-20);
    const x=i*bw+2,w=bw-4;
    return`<rect x="${x}" y="${H-ch-qh}" width="${w}" height="${qh}" fill="#6ee7b780" rx="2"/>
           <rect x="${x}" y="${H-ch}" width="${w}" height="${ch}" fill="#f9731680" rx="2"/>`;
  }).join('');
  svg.innerHTML=html;
}

function addEvent(){
  const isCmd=Math.random()<0.45;
  const name=isCmd?cmds[Math.random()*5|0]:qrys[Math.random()*5|0];
  const lat=Math.round(isCmd?20+Math.random()*80:5+Math.random()*30);
  if(isCmd)totalC++;else totalQ++;
  latencies.push(lat);if(latencies.length>100)latencies.shift();
  data[data.length-1][isCmd?'c':'q']++;
  document.getElementById('cmdCount').textContent=totalC;
  document.getElementById('qryCount').textContent=totalQ;
  document.getElementById('ratio').textContent=totalQ?`1:${(totalQ/Math.max(totalC,1)).toFixed(1)}`:'–';
  document.getElementById('avgLat').textContent=Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length)+'ms';
  const d=document.createElement('div');
  d.className=isCmd?'c':'q';
  d.textContent=`${isCmd?'CMD':'QRY'} ${name} — ${lat}ms`;
  feed.prepend(d);
  if(feed.children.length>50)feed.lastChild.remove();
  renderChart();
}

setInterval(()=>{data.push({c:0,q:0});data.shift();renderChart();},1000);
setInterval(addEvent,300);
renderChart();