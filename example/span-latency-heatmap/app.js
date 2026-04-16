const SERVICES = ['api-gateway','auth-svc','user-svc','order-svc','payment-svc','inventory-svc','cache','db-pool'];
const BUCKETS = 30;
const data = SERVICES.map(()=> Array.from({length:BUCKETS},()=> Math.random()*100|0));

const canvas = document.getElementById('heatmap');
const ctx = canvas.getContext('2d');
const tip = document.getElementById('tooltip');

function lerp(a,b,t){return a+(b-a)*t;}
function heatColor(v){
  const t=v/100;
  if(t<0.5){const u=t*2; return `rgb(${lerp(26,60,u)|0},${lerp(29,165,u)|0},${lerp(39,96,u)|0})`;}
  else{const u=(t-0.5)*2; return `rgb(${lerp(60,244,u)|0},${lerp(165,63,u)|0},${lerp(96,94,u)|0})`;}
}

function render(){
  const W=canvas.parentElement.clientWidth-130;
  canvas.width=W; canvas.height=SERVICES.length*24;
  const cw=W/BUCKETS, ch=24;
  data.forEach((row,y)=> row.forEach((v,x)=>{
    ctx.fillStyle=heatColor(v); ctx.fillRect(x*cw,y*ch,cw-1,ch-1);
  }));
}

const yLabels=document.getElementById('yLabels');
SERVICES.forEach(s=>{const d=document.createElement('div');d.textContent=s;yLabels.appendChild(d);});

const xLabels=document.getElementById('xLabels');
for(let i=0;i<6;i++){const s=document.createElement('span');const m=i*5;s.textContent=`-${30-m}m`;xLabels.appendChild(s);}

const legend=document.getElementById('legend');
['Low','','','','High'].forEach((l,i)=>{
  const s=document.createElement('span');s.style.background=heatColor(i*25);legend.appendChild(s);
  if(l){const t=document.createTextNode(l);legend.appendChild(t);}
});

canvas.addEventListener('mousemove',e=>{
  const rect=canvas.getBoundingClientRect();
  const x=((e.clientX-rect.left)/rect.width*BUCKETS)|0;
  const y=((e.clientY-rect.top)/rect.height*SERVICES.length)|0;
  if(x>=0&&x<BUCKETS&&y>=0&&y<SERVICES.length){
    tip.classList.remove('hidden');
    tip.innerHTML=`<strong style="color:#6ee7b7">${SERVICES[y]}</strong><br>Bucket: -${BUCKETS-x}m<br>p99: ${data[y][x]}ms`;
    tip.style.left=e.clientX+14+'px'; tip.style.top=e.clientY-10+'px';
  } else tip.classList.add('hidden');
});
canvas.addEventListener('mouseleave',()=>tip.classList.add('hidden'));

render();
addEventListener('resize',render);
setInterval(()=>{
  data.forEach(row=>{row.shift();row.push(Math.random()*100|0);});
  render();
},2000);