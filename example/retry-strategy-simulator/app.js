const canvas=document.getElementById('timeline'),ctx=canvas.getContext('2d');
const log=document.getElementById('log'),fireBtn=document.getElementById('fireBtn');
const els={strategy:'strategy',baseDelay:'baseDelay',maxRetries:'maxRetries',failRate:'failRate'};
let sessions=[],animId;

function val(id){return document.getElementById(id).value}
document.querySelectorAll('input[type=range]').forEach(r=>{
  r.addEventListener('input',()=>document.getElementById(r.id+'Val').textContent=r.value);
});

function getDelay(strategy,base,attempt){
  if(strategy==='exponential')return base*Math.pow(2,attempt)*(0.8+Math.random()*0.4);
  if(strategy==='linear')return base*(attempt+1);
  return base;
}

function addLog(msg,cls){
  const d=document.createElement('div');d.className=cls;d.textContent=msg;
  log.prepend(d);if(log.children.length>40)log.lastChild.remove();
}

function fireRequest(){
  const strategy=val('strategy'),base=+val('baseDelay'),max=+val('maxRetries'),failPct=+val('failRate');
  const session={attempts:[],startTime:performance.now(),strategy,base,max,failPct,done:false,y:30+sessions.length*40};
  sessions.push(session);if(sessions.length>4){sessions.shift();}
  session.y=30+((sessions.length-1)%4)*45;
  runAttempt(session,0);
}

function runAttempt(s,attempt){
  const now=performance.now();
  const success=Math.random()*100>s.failPct;
  s.attempts.push({time:now-s.startTime,success,attempt});
  addLog(`[${s.strategy}] Attempt ${attempt+1}: ${success?'SUCCESS':'FAIL'}`,success?'ok':'fail');
  if(success){s.done=true;return;}
  if(attempt>=s.max){s.done=true;addLog(`[${s.strategy}] Max retries exhausted`,'info');return;}
  const delay=getDelay(s.strategy,s.base,attempt);
  addLog(`  ↳ retrying in ${Math.round(delay)}ms`,'info');
  setTimeout(()=>runAttempt(s,attempt+1),delay);
}

function draw(){
  canvas.width=canvas.clientWidth*devicePixelRatio;
  canvas.height=canvas.clientHeight*devicePixelRatio;
  ctx.scale(devicePixelRatio,devicePixelRatio);
  const w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  sessions.forEach(s=>{
    ctx.strokeStyle='#30363d';ctx.beginPath();ctx.moveTo(40,s.y);ctx.lineTo(w-10,s.y);ctx.stroke();
    ctx.fillStyle='#8b949e';ctx.font='11px sans-serif';ctx.fillText(s.strategy,4,s.y+4);
    const scale=(w-60)/Math.max(12000,s.attempts.length?s.attempts[s.attempts.length-1].time*1.2:1);
    s.attempts.forEach(a=>{
      const x=50+a.time*scale;
      ctx.beginPath();ctx.arc(x,s.y,6,0,Math.PI*2);
      ctx.fillStyle=a.success?'#6ee7b7':'#f87171';ctx.fill();
      ctx.fillStyle='#0f1117';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
      ctx.fillText(a.attempt+1,x,s.y+3);ctx.textAlign='left';
      if(a.attempt>0){
        const prev=s.attempts[a.attempt-1];const px=50+prev.time*scale;
        ctx.strokeStyle='#6ee7b744';ctx.setLineDash([4,4]);ctx.beginPath();
        ctx.moveTo(px+7,s.y);ctx.lineTo(x-7,s.y);ctx.stroke();ctx.setLineDash([]);
      }
    });
  });
  animId=requestAnimationFrame(draw);
}
fireBtn.addEventListener('click',fireRequest);
draw();
fireRequest();