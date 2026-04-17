const canvas=document.getElementById('stage'),ctx=canvas.getContext('2d');
let W,H,lanterns=[],stars=[];
function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight}
resize();addEventListener('resize',resize);
for(let i=0;i<120;i++)stars.push({x:Math.random()*W,y:Math.random()*H*0.8,r:Math.random()*1.2,t:Math.random()*Math.PI*2});

const WISHES=['Peace','Health','Love','Fortune','Wisdom','Joy','Courage','Hope'];

class Lantern{
  constructor(x,y,wish){
    this.x=x;this.y=y||H+20;
    this.vx=(Math.random()-0.5)*0.3;
    this.vy=-(0.4+Math.random()*0.6);
    this.sway=Math.random()*Math.PI*2;
    this.size=14+Math.random()*10;
    this.wish=wish||WISHES[Math.floor(Math.random()*WISHES.length)];
    this.hue=20+Math.random()*30;
    this.flicker=0;
    this.age=0;
  }
  update(){
    this.age++;
    this.sway+=0.02;
    this.x+=this.vx+Math.sin(this.sway)*0.3;
    this.y+=this.vy;
    this.vy*=0.995;
    this.flicker=0.8+Math.sin(this.age*0.2)*0.2;
    return this.y>-100
  }
  draw(){
    const glow=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.size*4);
    glow.addColorStop(0,`hsla(${this.hue},100%,70%,${0.3*this.flicker})`);
    glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;
    ctx.fillRect(this.x-this.size*4,this.y-this.size*4,this.size*8,this.size*8);
    
    ctx.fillStyle=`hsla(${this.hue},80%,55%,0.9)`;
    ctx.beginPath();
    ctx.ellipse(this.x,this.y,this.size*0.8,this.size,0,0,Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle=`hsla(${this.hue},100%,75%,${this.flicker})`;
    ctx.beginPath();
    ctx.ellipse(this.x,this.y,this.size*0.5,this.size*0.7,0,0,Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle='#6ee7b7';
    ctx.lineWidth=0.5;
    ctx.beginPath();
    ctx.moveTo(this.x-this.size*0.7,this.y);
    ctx.lineTo(this.x+this.size*0.7,this.y);
    ctx.stroke();
    
    if(this.age<120){
      ctx.fillStyle=`rgba(230,231,235,${Math.min(1,this.age/30)*Math.max(0,1-(this.age-60)/60)})`;
      ctx.font='11px Segoe UI';
      ctx.textAlign='center';
      ctx.fillText(this.wish,this.x,this.y-this.size-8);
    }
  }
}

function release(wish,x){
  lanterns.push(new Lantern(x||Math.random()*W,H+20,wish));
  document.getElementById('count').textContent=lanterns.length;
}

canvas.addEventListener('click',e=>release(document.getElementById('wish').value||null,e.clientX));
document.getElementById('release').onclick=()=>release(document.getElementById('wish').value||null);
document.getElementById('swarm').onclick=()=>{for(let i=0;i<20;i++)setTimeout(()=>release(),i*80)};

for(let i=0;i<8;i++)setTimeout(()=>release(),i*400);

function loop(){
  ctx.fillStyle='rgba(15,17,23,0.15)';
  ctx.fillRect(0,0,W,H);
  stars.forEach(s=>{
    s.t+=0.02;
    ctx.fillStyle=`rgba(230,231,235,${0.3+Math.sin(s.t)*0.3})`;
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
  });
  lanterns=lanterns.filter(l=>{l.update();l.draw();return l.y>-100});
  document.getElementById('count').textContent=lanterns.length;
  requestAnimationFrame(loop);
}
loop();