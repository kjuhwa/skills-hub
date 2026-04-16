const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d');
const list=document.getElementById('agg-list');
const aggregates=[
  {name:'Order',root:'Order',entities:['OrderLine','Discount'],values:['Money','Address','OrderStatus'],invariants:['Total must be positive','Max 50 line items']},
  {name:'Customer',root:'Customer',entities:['Membership'],values:['Email','PhoneNumber','FullName'],invariants:['Email must be unique','One active membership']},
  {name:'Product',root:'Product',entities:['Variant','Review'],values:['SKU','Price','Dimensions'],invariants:['SKU is immutable','Price > 0']},
  {name:'Shipment',root:'Shipment',entities:['Parcel','TrackingEvent'],values:['Weight','Carrier','TrackingId'],invariants:['Must have carrier','Weight > 0']}
];
let active=0;
function resize(){canvas.width=canvas.parentElement.clientWidth-200;canvas.height=window.innerHeight}
function draw(){
  const a=aggregates[active],w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const cx=w/2,cy=h/2;
  // boundary
  ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*0.42,0,Math.PI*2);
  ctx.strokeStyle='#6ee7b733';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#6ee7b711';ctx.fill();
  // root
  ctx.fillStyle='#6ee7b7';ctx.font='bold 16px system-ui';ctx.textAlign='center';
  ctx.fillText(a.root+' (Root)',cx,cy-8);
  ctx.strokeStyle='#6ee7b7';ctx.lineWidth=2;roundRect(cx-60,cy-28,120,32,8);ctx.stroke();
  // entities
  const elen=a.entities.length;
  a.entities.forEach((e,i)=>{
    const angle=-Math.PI/2+((i+1)/(elen+1))*Math.PI-Math.PI/4;
    const r=140,ex=cx+Math.cos(angle)*r,ey=cy+Math.sin(angle)*r;
    ctx.strokeStyle='#3b82f6';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.fillStyle='#1a1d27';roundRect(ex-45,ey-12,90,24,6);ctx.fill();
    ctx.strokeStyle='#3b82f6';roundRect(ex-45,ey-12,90,24,6);ctx.stroke();
    ctx.fillStyle='#3b82f6';ctx.font='12px system-ui';ctx.fillText(e,ex,ey+4);
  });
  // value objects
  const vlen=a.values.length;
  a.values.forEach((v,i)=>{
    const angle=Math.PI/4+((i)/(vlen-1||1))*Math.PI/2;
    const r=160,vx=cx+Math.cos(angle)*r,vy=cy+Math.sin(angle)*r;
    ctx.strokeStyle='#f59e0b55';ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(vx,vy);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#f59e0b';ctx.font='11px system-ui';ctx.fillText(v,vx,vy+4);
  });
  // invariants
  ctx.fillStyle='#ef444488';ctx.font='11px system-ui';ctx.textAlign='left';
  a.invariants.forEach((inv,i)=>{ctx.fillText('⚠ '+inv,20,h-40+i*18)});
  // legend
  ctx.textAlign='left';ctx.font='10px system-ui';
  [['#6ee7b7','Aggregate Root'],['#3b82f6','Entity'],['#f59e0b','Value Object']].forEach(([c,l],i)=>{
    ctx.fillStyle=c;ctx.fillRect(w-150,20+i*18,10,10);ctx.fillText(l,w-134,29+i*18);
  });
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y)}
aggregates.forEach((a,i)=>{
  const li=document.createElement('li');li.textContent=a.name;
  if(i===0)li.classList.add('active');
  li.addEventListener('click',()=>{active=i;list.querySelectorAll('li').forEach(l=>l.classList.remove('active'));li.classList.add('active');draw()});
  list.appendChild(li);
});
window.addEventListener('resize',()=>{resize();draw()});
resize();draw();