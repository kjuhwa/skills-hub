const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),tip=document.getElementById('tooltip');
const W=cv.width=Math.min(760,innerWidth-40),H=cv.height=420;
const services=['Order','Inventory','Payment','Shipping','Notification'];
const colors=['#6ee7b7','#38bdf8','#facc15','#fb923c','#a78bfa'];
const sagas=[
  {id:'S-1',steps:[{s:0,t:0,d:3,ok:true},{s:1,t:3,d:2,ok:true},{s:2,t:5,d:4,ok:true},{s:3,t:9,d:3,ok:true},{s:4,t:12,d:1,ok:true}]},
  {id:'S-2',steps:[{s:0,t:1,d:2,ok:true},{s:1,t:3,d:3,ok:true},{s:2,t:6,d:2,ok:false},{s:1,t:9,d:2,ok:true,comp:true},{s:0,t:11,d:1,ok:true,comp:true}]},
  {id:'S-3',steps:[{s:0,t:4,d:2,ok:true},{s:1,t:6,d:2,ok:true},{s:2,t:8,d:3,ok:true},{s:3,t:11,d:4,ok:false},{s:2,t:15,d:1,ok:true,comp:true},{s:1,t:16,d:1,ok:true,comp:true},{s:0,t:17,d:1,ok:true,comp:true}]}
];
const maxT=20,laneH=50,padL=110,padT=60,padR=20;
let blocks=[];

function draw(){
  ctx.clearRect(0,0,W,H);
  const gw=W-padL-padR,unit=gw/maxT;
  // grid
  ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;
  for(let t=0;t<=maxT;t++){const x=padL+t*unit;ctx.beginPath();ctx.moveTo(x,padT-10);ctx.lineTo(x,padT+services.length*laneH);ctx.stroke();ctx.fillStyle='#666';ctx.font='10px sans-serif';ctx.fillText(t+'s',x-6,padT-16);}
  // lanes
  services.forEach((s,i)=>{
    const y=padT+i*laneH;
    ctx.fillStyle='#ffffff06';if(i%2===0)ctx.fillRect(padL,y,gw,laneH);
    ctx.fillStyle=colors[i];ctx.font='bold 11px sans-serif';ctx.textAlign='right';ctx.fillText(s,padL-12,y+laneH/2+4);ctx.textAlign='left';
  });
  // blocks
  blocks=[];
  sagas.forEach((saga,si)=>{
    saga.steps.forEach(st=>{
      const x=padL+st.t*unit+2,y=padT+st.s*laneH+8+si*12,w=st.d*unit-4,h=10;
      const c=st.comp?'#a78bfa':st.ok?colors[st.s]:'#f87171';
      ctx.fillStyle=c+'cc';ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.fillText(saga.id,x+3,y+8);
      blocks.push({x,y,w,h,saga:saga.id,service:services[st.s],t0:st.t,dur:st.d,ok:st.ok,comp:!!st.comp});
    });
  });
  // legend
  const ly=H-30;
  [['Forward','#6ee7b7'],['Failed','#f87171'],['Compensate','#a78bfa']].forEach(([l,c],i)=>{
    const lx=W/2-100+i*80;ctx.fillStyle=c;ctx.fillRect(lx,ly,12,12);ctx.fillStyle='#999';ctx.font='10px sans-serif';ctx.fillText(l,lx+16,ly+10);
  });
}
draw();

cv.onmousemove=e=>{
  const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
  const b=blocks.find(b=>mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h);
  if(b){tip.style.display='block';tip.style.left=e.clientX+12+'px';tip.style.top=e.clientY-10+'px';tip.innerHTML=`<b>${b.saga}</b> → ${b.service}<br>Time: ${b.t0}s – ${b.t0+b.dur}s<br>Status: ${b.comp?'⟲ Compensation':b.ok?'✓ Success':'✗ Failed'}`;}
  else tip.style.display='none';
};
cv.onmouseleave=()=>tip.style.display='none';