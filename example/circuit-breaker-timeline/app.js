const canvas=document.getElementById('timeline'),ctx=canvas.getContext('2d');
const W=canvas.width,H=canvas.height,PAD=40;
const stateColors={closed:'#6ee7b7',open:'#f87171',half:'#fbbf24'};
let state='closed',failures=0,threshold=5,cooldownLeft=0,cooldownMax=10;
const history=[],maxPoints=120;
function simulate(){
  if(state==='open'){cooldownLeft--;if(cooldownLeft<=0){state='half';failures=Math.floor(threshold/2)}pushPoint(null);return}
  const failRate=state==='half'?0.35:0.12;const failed=Math.random()<failRate;
  if(failed){failures++;if(failures>=threshold){state='open';cooldownLeft=cooldownMax+Math.floor(Math.random()*4)}}
  else{if(state==='half'){state='closed';failures=0}failures=Math.max(0,failures-1)}
  pushPoint(failed)}
function pushPoint(failed){history.push({state,failed,failures,t:history.length});if(history.length>maxPoints)history.shift()}
function draw(){
  ctx.clearRect(0,0,W,H);
  const len=history.length;if(len<2)return;
  const xStep=(W-PAD*2)/(maxPoints-1);
  // state band
  for(let i=1;i<len;i++){const x1=PAD+(i-1)*xStep,x2=PAD+i*xStep;ctx.fillStyle=stateColors[history[i].state]+'18';ctx.fillRect(x1,PAD,x2-x1,H-PAD*2)}
  // failure gauge line
  ctx.beginPath();
  for(let i=0;i<len;i++){const x=PAD+i*xStep,y=PAD+(H-PAD*2)*(1-history[i].failures/threshold);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
  ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.stroke();
  // threshold line
  const ty=PAD;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(PAD,ty);ctx.lineTo(W-PAD,ty);ctx.strokeStyle='#f8717166';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#f87171';ctx.font='10px system-ui';ctx.fillText('threshold',W-PAD+4,ty+4);
  // request dots
  for(let i=0;i<len;i++){const p=history[i],x=PAD+i*xStep,y=H-PAD+12;if(p.failed===null)continue;ctx.fillStyle=p.failed?'#f87171':'#6ee7b7';ctx.fillRect(x-2,y-2,4,4)}
  // state labels
  let prev=history[0].state;
  for(let i=1;i<len;i++){if(history[i].state!==prev){const x=PAD+i*xStep;ctx.beginPath();ctx.moveTo(x,PAD);ctx.lineTo(x,H-PAD);ctx.strokeStyle='#ffffff22';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=stateColors[history[i].state];ctx.font='bold 10px system-ui';ctx.fillText(history[i].state.toUpperCase(),x+3,PAD-6);prev=history[i].state}}
  // axes
  ctx.fillStyle='#8b949e';ctx.font='10px system-ui';ctx.fillText('failures',4,PAD+(H-PAD*2)/2);ctx.fillText('time →',W/2,H-6);
  ctx.fillText('0',PAD-14,H-PAD+4);ctx.fillText(threshold,PAD-14,PAD+4)}
function loop(){simulate();draw();setTimeout(loop,350)}
for(let i=0;i<30;i++)simulate();loop();