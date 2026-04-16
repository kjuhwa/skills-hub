const canvas=document.getElementById('resultChart'),ctx=canvas.getContext('2d');
const sensors=['temp-01','temp-02','humid-01','press-01'];
const db=[];
(function seed(){
  const now=Date.now();
  for(let i=0;i<720;i++){
    const t=now-i*60000;
    sensors.forEach(s=>{
      let base=s.startsWith('temp')?22:s.startsWith('humid')?55:1013;
      db.push({time:t,sensor:s,value:base+Math.sin(i/30)*5+Math.random()*3});
    });
  }
  db.sort((a,b)=>a.time-b.time);
})();

function parseQuery(q){
  const sensorMatch=q.match(/sensor\s*=\s*'([^']+)'/i);
  const timeMatch=q.match(/now\(\)\s*-\s*(\d+)(m|h|d)/i);
  const groupMatch=q.match(/time\((\d+)(m|h)\)/i);
  const isAvg=/avg\(/i.test(q);
  const sensor=sensorMatch?sensorMatch[1]:'temp-01';
  let ms=3600000;
  if(timeMatch){const n=+timeMatch[1];const u=timeMatch[2];ms=n*(u==='m'?60000:u==='h'?3600000:86400000)}
  let groupMs=300000;
  if(groupMatch){const n=+groupMatch[1];groupMs=n*(groupMatch[2]==='h'?3600000:60000)}
  return{sensor,ms,groupMs,isAvg};
}

function runQuery(){
  const start=performance.now();
  const q=document.getElementById('query').value;
  const{sensor,ms,groupMs,isAvg}=parseQuery(q);
  const cutoff=Date.now()-ms;
  const filtered=db.filter(r=>r.sensor===sensor&&r.time>=cutoff);
  let rows=[];
  if(isAvg&&groupMs){
    const buckets={};
    filtered.forEach(r=>{const k=Math.floor(r.time/groupMs)*groupMs;if(!buckets[k])buckets[k]={sum:0,count:0};buckets[k].sum+=r.value;buckets[k].count++});
    rows=Object.keys(buckets).sort().map(k=>({time:+k,value:buckets[k].sum/buckets[k].count}));
  }else{rows=filtered.map(r=>({time:r.time,value:r.value}))}
  const elapsed=performance.now()-start;
  document.getElementById('elapsed').textContent=`✓ ${rows.length} rows in ${elapsed.toFixed(1)}ms | scanned ${filtered.length} points`;
  document.getElementById('rowCount').textContent=rows.length+' rows';
  document.getElementById('explain').innerHTML=`<b>Query Plan:</b><br>→ Filter: sensor="${sensor}"<br>→ Time range: last ${ms/60000}min<br>→ ${isAvg?'Aggregate: avg, bucket '+groupMs/60000+'min':'Raw scan'}<br>→ Result: ${rows.length} rows`;
  renderChart(rows);renderTable(rows);
}

function renderChart(rows){
  canvas.width=canvas.offsetWidth;canvas.height=220;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!rows.length)return;
  const pad=40,w=canvas.width-pad*2,h=canvas.height-pad*2;
  let minV=Infinity,maxV=-Infinity;
  rows.forEach(r=>{if(r.value<minV)minV=r.value;if(r.value>maxV)maxV=r.value});
  const rV=maxV-minV||1,minT=rows[0].time,rT=rows[rows.length-1].time-minT||1;
  ctx.strokeStyle='#2a2d37';
  for(let i=0;i<=4;i++){const y=pad+h*i/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(pad+w,y);ctx.stroke();
    ctx.fillStyle='#8b949e';ctx.font='10px monospace';ctx.fillText((maxV-rV*i/4).toFixed(1),2,y+3)}
  ctx.beginPath();
  rows.forEach((r,i)=>{const x=pad+(r.time-minT)/rT*w,y=pad+h-(r.value-minV)/rV*h;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});
  ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;ctx.stroke();
  rows.forEach(r=>{const x=pad+(r.time-minT)/rT*w,y=pad+h-(r.value-minV)/rV*h;
    ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#6ee7b7';ctx.fill()});
}

function renderTable(rows){
  const thead=document.querySelector('#resultTable thead');
  const tbody=document.querySelector('#resultTable tbody');
  thead.innerHTML='<tr><th>Time</th><th>Value</th></tr>';tbody.innerHTML='';
  rows.slice(-100).forEach(r=>{const tr=tbody.insertRow();
    tr.innerHTML=`<td>${new Date(r.time).toISOString().substr(11,8)}</td><td>${r.value.toFixed(4)}</td>`});
}
runQuery();