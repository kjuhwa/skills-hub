const cv=document.getElementById('pipeline'),cx=cv.getContext('2d'),logEl=document.getElementById('log');
let W,H;function resize(){W=cv.width=cv.parentElement.clientWidth-24;H=cv.height=cv.parentElement.clientHeight-40}
resize();addEventListener('resize',resize);

const stages=['Client','Sidecar\nOutbound','Network','Sidecar\nInbound','Service'];
let mode='normal',reqs=[];

document.getElementById('btnNormal').onclick=()=>mode='normal';
document.getElementById('btnSpike').onclick=()=>mode='spike';
document.getElementById('btnFault').onclick=()=>mode='fault';

function addReq(){
  const isFault=mode==='fault'&&Math.random()<.4;
  const latency=mode==='spike'?200+Math.random()*800:30+Math.random()*120;
  reqs.push({t:0,spd:.003+(isFault?.001:.002+Math.random()*.003),fault:isFault,lat:latency|0,status:isFault?(Math.random()<.5?503:429):200,stage:0,logged:false});
}

const methods=['GET','POST','PUT','DELETE'];
const paths=['/api/users','/api/orders','/api/products','/api/health','/api/metrics'];

function addLog(r){
  const m=methods[Math.random()*4|0],p=paths[Math.random()*5|0];
  const cls=r.status<400?'log-ok':r.status<500?'log-warn':'log-err';
  const line=document.createElement('div');line.className='log-line '+cls;
  line.textContent=`${new Date().toLocaleTimeString()} ${m} ${p} ${r.status} ${r.lat}ms`;
  logEl.prepend(line);
  if(logEl.children.length>200)logEl.lastChild.remove();
}

setInterval(()=>{const n=mode==='spike'?4:1;for(let i=0;i<n;i++)addReq()},300);

function draw(){ctx(cx);requestAnimationFrame(draw)}
function ctx(c){
  c.clearRect(0,0,W,H);
  const sw=70,gap=(W-sw*5)/(5+1),cy=H/2;

  stages.forEach((s,i)=>{
    const x=gap+(sw+gap)*i;
    c.fillStyle=i===0||i===4?'#252a36':'#1e3a2f';
    c.strokeStyle=i===0||i===4?'#333':'#6ee7b744';
    c.lineWidth=1;c.beginPath();c.roundRect(x,cy-30,sw,60,8);c.fill();c.stroke();
    c.fillStyle=i===0||i===4?'#888':'#6ee7b7';c.font='10px system-ui';c.textAlign='center';
    s.split('\n').forEach((l,li)=>c.fillText(l,x+sw/2,cy-4+li*13));
    if(i<4){c.beginPath();c.moveTo(x+sw+4,cy);c.lineTo(x+sw+gap-4,cy);c.strokeStyle='#2a2e3a';c.setLineDash([3,3]);c.stroke();c.setLineDash([])}
  });

  reqs=reqs.filter(r=>{r.t+=r.spd;if(r.t>=1){if(!r.logged){addLog(r);r.logged=true}return false}
    const stageIdx=(r.t*5)|0;const px=gap+(sw+gap)*(r.t*4.5)+sw/2;
    c.beginPath();c.arc(px,cy+((Math.random()-.5)*20),4,0,Math.PI*2);
    c.fillStyle=r.fault?'#f87171':'#6ee7b7';c.globalAlpha=1-r.t*.5;c.fill();c.globalAlpha=1;
    return true});
}
draw();