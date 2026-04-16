const canvas=document.getElementById('flow'),ctx=canvas.getContext('2d'),W=800,H=450;
const stages=[
  {name:'Ingest',x:80,y:H/2,color:'#6ee7b7'},
  {name:'Hot Store',x:260,y:H/2,color:'#60a5fa'},
  {name:'Warm Store',x:440,y:H/2,color:'#fbbf24'},
  {name:'Archive',x:620,y:H/2,color:'#a78bfa'},
  {name:'Deleted',x:740,y:H/2,color:'#f472b6'}
];
const particles=[];let stats={objects:0,archived:0,deleted:0};
function ingest(){
  const p={x:10,y:H/2+Math.random()*40-20,stage:0,progress:0,speed:0.4+Math.random()*0.6,
    name:'obj_'+Math.random().toString(36).slice(2,6),size:Math.floor(Math.random()*500+10)+'KB',
    color:'#6ee7b7',alive:true};
  particles.push(p);stats.objects++;
}
for(let i=0;i<6;i++)ingest();
function drawStage(s){
  ctx.fillStyle=s.color+'22';ctx.strokeStyle=s.color+'66';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(s.x-35,s.y-55,70,110,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=s.color;ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.fillText(s.name,s.x,s.y+65);
}
function drawArrow(x1,x2,y){
  ctx.strokeStyle='#ffffff15';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1+35,y);ctx.lineTo(x2-35,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2-40,y-4);ctx.lineTo(x2-35,y);ctx.lineTo(x2-40,y+4);ctx.strokeStyle='#ffffff25';ctx.stroke();
}
function update(){
  particles.forEach(p=>{if(!p.alive)return;
    const target=stages[p.stage];
    if(p.x<target.x){p.x+=p.speed;p.progress=0;}
    else{p.progress++;
      if(p.progress>200+Math.random()*300){
        if(p.stage<4){p.stage++;p.color=stages[p.stage].color;
          if(p.stage===3)stats.archived++;if(p.stage===4)stats.deleted++;}
        else{p.alive=false;}
      }}});
}
function draw(){ctx.clearRect(0,0,W,H);
  for(let i=0;i<stages.length-1;i++)drawArrow(stages[i].x,stages[i+1].x,H/2);
  stages.forEach(drawStage);
  particles.forEach(p=>{if(!p.alive)return;
    const pulse=Math.sin(Date.now()*0.005+p.x)*0.5+0.5;
    ctx.beginPath();ctx.arc(p.x,p.y,3+pulse,0,Math.PI*2);ctx.fillStyle=p.color+'cc';ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,6+pulse*2,0,Math.PI*2);ctx.fillStyle=p.color+'15';ctx.fill();});
  document.getElementById('count').textContent=`Objects: ${stats.objects} | Archived: ${stats.archived} | Deleted: ${stats.deleted}`;
  update();requestAnimationFrame(draw);}
draw();