const canvas=document.getElementById('timeline'),ctx=canvas.getContext('2d');
const entries=[];let idCounter=0;
const TYPES={COMMAND:{label:'CMD',color:'#f87171'},QUERY:{label:'QRY',color:'#60a5fa'}};
function addEntry(type){
  entries.push({id:++idCounter,type,time:Date.now(),name:type===TYPES.COMMAND?randomCmd():randomQry(),duration:Math.random()*80+20});
  if(entries.length>30)entries.shift();draw();updateStats();
}
const cmds=['CreateUser','UpdateOrder','DeleteItem','PublishEvent','SendEmail','ResetCache'];
const qrys=['GetUsers','FindOrder','ListItems','CountEvents','FetchReport','SearchLogs'];
function randomCmd(){return cmds[Math.floor(Math.random()*cmds.length)]}
function randomQry(){return qrys[Math.floor(Math.random()*qrys.length)]}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const midY=170,laneH=60;
  ctx.strokeStyle='#2d3348';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(40,midY);ctx.lineTo(860,midY);ctx.stroke();
  ctx.fillStyle='#4b5563';ctx.font='11px sans-serif';
  ctx.fillText('COMMANDS ↑',42,midY-laneH-4);ctx.fillText('QUERIES ↓',42,midY+laneH+14);
  entries.forEach((e,i)=>{
    const x=60+i*26,isCmd=e.type===TYPES.COMMAND;
    const h=e.duration*0.5,y=isCmd?midY-h-4:midY+4;
    ctx.fillStyle=e.type.color;ctx.globalAlpha=0.85;
    ctx.fillRect(x,y,18,h);ctx.globalAlpha=1;
    ctx.fillStyle='#c9d1d9';ctx.font='9px sans-serif';
    ctx.save();ctx.translate(x+9,isCmd?y-4:y+h+10);
    ctx.rotate(-0.5);ctx.fillText(e.name,0,0);ctx.restore();
  });
}
function updateStats(){
  const c=entries.filter(e=>e.type===TYPES.COMMAND).length;
  const q=entries.length-c;
  document.getElementById('stats').innerHTML=
    `<span class="c">Commands: ${c}</span><span class="q">Queries: ${q}</span><span class="r">Ratio: ${c?((q/c).toFixed(1)):'-'}</span>`;
}
document.getElementById('btnCommand').onclick=()=>addEntry(TYPES.COMMAND);
document.getElementById('btnQuery').onclick=()=>addEntry(TYPES.QUERY);
document.getElementById('btnClear').onclick=()=>{entries.length=0;idCounter=0;draw();updateStats()};
// seed initial data
for(let i=0;i<12;i++)addEntry(Math.random()>.4?TYPES.QUERY:TYPES.COMMAND);