const inputX=document.getElementById('inputX'),slider=document.getElementById('nSlider');
const nVal=document.getElementById('nVal'),cardsEl=document.getElementById('cards');
const canvas=document.getElementById('graph'),ctx=canvas.getContext('2d');

const fns=[
  {name:'abs(x)',fn:Math.abs,expect:true},
  {name:'floor(x)',fn:Math.floor,expect:true},
  {name:'x * 2',fn:x=>x*2,expect:false},
  {name:'max(x, 0)',fn:x=>Math.max(x,0),expect:true},
  {name:'x + 1',fn:x=>x+1,expect:false},
  {name:'min(x, 10)',fn:x=>Math.min(x,10),expect:true},
  {name:'x % 5',fn:x=>((x%5)+5)%5,expect:true},
  {name:'round(x)',fn:Math.round,expect:true},
];

function run(){
  const x=parseFloat(inputX.value)||0;const n=parseInt(slider.value);
  nVal.textContent=n;cardsEl.innerHTML='';
  const allSeries=[];
  fns.forEach(({name,fn})=>{
    const series=[x];let v=x;
    for(let i=0;i<n;i++){v=fn(v);series.push(v)}
    const f1=fn(x),f2=fn(f1);const isIdem=f1===f2;
    const card=document.createElement('div');
    card.className='card '+(isIdem?'idem':'not-idem');
    card.innerHTML=`<h3>${name}</h3><span class="badge ${isIdem?'yes':'no'}">${isIdem?'Idempotent':'Not Idempotent'}</span><div class="seq">${series.map(v=>Number.isFinite(v)?parseFloat(v.toFixed(4)):v).join(' → ')}</div>`;
    cardsEl.append(card);allSeries.push({name,series,isIdem});
  });
  drawGraph(allSeries,n);
}

function drawGraph(allSeries,n){
  ctx.clearRect(0,0,700,220);
  const colors=['#6ee7b7','#60a5fa','#f87171','#fbbf24','#c084fc','#fb923c','#34d399','#f472b6'];
  let allVals=allSeries.flatMap(s=>s.series.filter(Number.isFinite));
  let minV=Math.min(...allVals),maxV=Math.max(...allVals);
  if(minV===maxV){minV-=1;maxV+=1}
  const px=60,py=20,pw=600,ph=170;
  ctx.strokeStyle='#2d333b';ctx.lineWidth=1;
  for(let i=0;i<=n;i++){const x=px+pw*(i/n);ctx.beginPath();ctx.moveTo(x,py);ctx.lineTo(x,py+ph);ctx.stroke();
    ctx.fillStyle='#8b949e';ctx.font='10px monospace';ctx.fillText(i,x-3,py+ph+14);}
  allSeries.forEach((s,si)=>{
    ctx.strokeStyle=colors[si%colors.length];ctx.lineWidth=s.isIdem?2:1;
    if(!s.isIdem)ctx.setLineDash([4,4]);else ctx.setLineDash([]);
    ctx.beginPath();
    s.series.forEach((v,i)=>{if(!Number.isFinite(v))return;
      const x=px+pw*(i/n),y=py+ph-(v-minV)/(maxV-minV)*ph;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.fillStyle='#8b949e';ctx.font='10px sans-serif';ctx.fillText('Applications →',px+pw/2-30,py+ph+14);
}

inputX.oninput=run;slider.oninput=run;run();