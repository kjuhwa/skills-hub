const services=[
  {name:'API Gateway',in:120,out:110,queue:15,max:200},
  {name:'Order Service',in:90,out:50,queue:80,max:150},
  {name:'Payment Proc',in:60,out:58,queue:5,max:100},
  {name:'Inventory DB',in:45,out:20,queue:95,max:120},
  {name:'Notification',in:200,out:180,queue:40,max:300},
  {name:'Analytics ETL',in:500,out:350,queue:180,max:400}
];
const grid=document.getElementById('grid'),log=document.getElementById('log');
function render(){
  grid.innerHTML='';
  services.forEach(s=>{
    const pct=Math.min(100,(s.queue/s.max*100));
    const st=pct>80?'crit':pct>50?'warn':'ok';
    const lbl=pct>80?'BACKPRESSURE':pct>50?'BUILDING':'HEALTHY';
    const color=st==='crit'?'#f87171':st==='warn'?'#f59e0b':'#6ee7b7';
    grid.innerHTML+=`<div class="card">
      <h3>${s.name}</h3>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="metric"><span>In: ${s.in}/s</span><span>Out: ${s.out}/s</span><span>Q: ${s.queue}/${s.max}</span></div>
      <span class="status ${st}">${lbl}</span>
    </div>`;
  });
}
function simulate(){
  services.forEach(s=>{
    s.in+=Math.floor(Math.random()*20-8);
    s.in=Math.max(10,s.in);
    s.out+=Math.floor(Math.random()*10-4);
    s.out=Math.max(5,Math.min(s.in+10,s.out));
    s.queue+=Math.max(0,s.in-s.out);
    s.queue=Math.max(0,Math.min(s.max,s.queue));
    if(s.queue>=s.max){
      const shed=Math.floor(s.in*0.3);
      s.in-=shed;
      addLog(`⚠ ${s.name}: backpressure activated, shedding ${shed}/s`);
    }
    if(s.queue>s.max*0.5&&Math.random()>0.7){
      s.out=Math.min(s.out+15,s.in);
      addLog(`↑ ${s.name}: consumer scaled up to ${s.out}/s`);
    }
    // natural drain
    s.queue=Math.max(0,s.queue-Math.floor(Math.random()*5));
  });
  render();
}
function addLog(msg){
  const t=new Date().toLocaleTimeString();
  log.innerHTML=`<div>${t} ${msg}</div>`+log.innerHTML;
  if(log.children.length>30)log.lastChild.remove();
}
render();
setInterval(simulate,800);