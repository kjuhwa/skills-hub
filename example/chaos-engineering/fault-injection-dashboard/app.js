const faults=new Set();
document.querySelectorAll('[data-fault]').forEach(btn=>{
  btn.addEventListener('click',()=>{const f=btn.dataset.fault;faults.has(f)?faults.delete(f):faults.add(f);btn.classList.toggle('active',faults.has(f))})
});
const latencyData=Array(60).fill(45),errorData=Array(60).fill(0.1);
function drawChart(canvas,data,max,color,warn){
  const ctx=canvas.getContext('2d');canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;
  const w=canvas.width,h=canvas.height,step=w/data.length;
  ctx.clearRect(0,0,w,h);
  ctx.beginPath();ctx.moveTo(0,h);
  data.forEach((v,i)=>{const y=h-Math.min(v/max,1)*h;if(i===0)ctx.moveTo(0,y);else ctx.lineTo(i*step,y)});
  ctx.lineTo(w,h);ctx.closePath();
  const grad=ctx.createLinearGradient(0,0,0,h);grad.addColorStop(0,color+'60');grad.addColorStop(1,color+'05');
  ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();data.forEach((v,i)=>{const y=h-Math.min(v/max,1)*h;if(i===0)ctx.moveTo(0,y);else ctx.lineTo(i*step,y)});
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  if(warn!=null){const wy=h-(warn/max)*h;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(0,wy);ctx.lineTo(w,wy);ctx.strokeStyle='#f8717180';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([])}
}
const statusEl=document.getElementById('status');
const mT=document.getElementById('mThroughput'),mL=document.getElementById('mLatency'),mE=document.getElementById('mError'),mC=document.getElementById('mCpu');
function tick(){
  let lat=40+Math.random()*15,err=0.05+Math.random()*0.1,cpu=20+Math.random()*8,tp=1200+Math.random()*100;
  if(faults.has('latency')){lat+=180+Math.random()*80}
  if(faults.has('errors')){err+=12+Math.random()*8}
  if(faults.has('packet')){tp*=0.4;lat+=50+Math.random()*30}
  if(faults.has('cpu')){cpu+=55+Math.random()*20}
  latencyData.push(lat);latencyData.shift();errorData.push(err);errorData.shift();
  drawChart(document.getElementById('latencyChart'),latencyData,500,'#6ee7b7',200);
  drawChart(document.getElementById('errorChart'),errorData,30,'#f87171',5);
  mT.textContent=Math.round(tp)+' req/s';mL.textContent=Math.round(lat)+'ms';
  mE.textContent=err.toFixed(1)+'%';mC.textContent=Math.round(cpu)+'%';
  const severity=faults.size;
  statusEl.textContent=severity===0?'System nominal':severity<=1?'Degraded — fault active':'CRITICAL — multiple faults';
  statusEl.className='status '+(severity===0?'ok':severity<=1?'warn':'crit');
}
setInterval(tick,500);tick();