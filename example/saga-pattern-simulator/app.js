const steps=[
  {name:'Order',comp:'Cancel Order'},
  {name:'Inventory',comp:'Restock'},
  {name:'Payment',comp:'Refund'},
  {name:'Delivery',comp:'Abort Ship'},
  {name:'Notify',comp:'Undo Notify'}
];
const fails=new Set();
let busy=false;

function buildUI(){
  const p=document.getElementById('pipeline');
  p.innerHTML=steps.map((s,i)=>`<div class="node" id="n${i}"><div class="label">${s.name}</div><div class="toggle" data-i="${i}"><div class="sw" id="sw${i}"></div><span>inject fail</span></div><div class="state" id="st${i}"></div></div>`).join('');
  document.querySelectorAll('.toggle').forEach(t=>t.onclick=()=>{
    const i=+t.dataset.i,sw=document.getElementById('sw'+i);
    if(fails.has(i)){fails.delete(i);sw.classList.remove('on')}else{fails.add(i);sw.classList.add('on')}
  });
  drawArrows();
}

function drawArrows(){
  const svg=document.getElementById('flow');
  const n=steps.length,gap=700/n;
  let h='';
  for(let i=0;i<n;i++){
    const cx=gap*i+gap/2;
    h+=`<circle cx="${cx}" cy="30" r="16" fill="#1a1d27" stroke="#6ee7b755" stroke-width="1.5" id="dot${i}"/>`;
    h+=`<text x="${cx}" y="34" text-anchor="middle" fill="#6ee7b7" font-size="11" font-weight="bold">${i+1}</text>`;
    if(i<n-1)h+=`<line x1="${cx+18}" y1="30" x2="${cx+gap-18}" y2="30" stroke="#333" stroke-width="1.5" id="ln${i}"/>`;
  }
  h+=`<text x="350" y="72" text-anchor="middle" fill="#555" font-size="11" id="flowlabel">forward →</text>`;
  svg.innerHTML=h;
}

async function run(){
  if(busy)return;busy=true;
  const res=document.getElementById('result');res.textContent='';res.style.color='#6ee7b7';
  steps.forEach((_,i)=>{document.getElementById('n'+i).className='node';document.getElementById('st'+i).textContent='';});
  document.getElementById('flowlabel').textContent='forward →';
  const done=[];
  for(let i=0;i<steps.length;i++){
    const nd=document.getElementById('n'+i);
    nd.classList.add('active');document.getElementById('st'+i).textContent='executing...';
    const dot=document.getElementById('dot'+i);dot.setAttribute('fill','#facc1544');
    await new Promise(r=>setTimeout(r,600));
    if(fails.has(i)){
      nd.className='node fail';document.getElementById('st'+i).textContent='FAILED';
      dot.setAttribute('fill','#f8717144');
      document.getElementById('flowlabel').textContent='← compensating';
      for(let j=done.length-1;j>=0;j--){
        const ci=done[j],cn=document.getElementById('n'+ci);
        cn.className='node comp';document.getElementById('st'+ci).textContent=steps[ci].comp;
        document.getElementById('dot'+ci).setAttribute('fill','#a78bfa44');
        if(j<done.length-1){const l=document.getElementById('ln'+done[j+1]);if(l)l.setAttribute('stroke','#a78bfa55');}
        await new Promise(r=>setTimeout(r,400));
      }
      res.textContent='Saga rolled back';res.style.color='#f87171';busy=false;return;
    }
    nd.className='node active';document.getElementById('st'+i).textContent='✓ done';
    dot.setAttribute('fill','#6ee7b744');
    if(i>0){const l=document.getElementById('ln'+(i-1));if(l)l.setAttribute('stroke','#6ee7b755');}
    done.push(i);
  }
  res.textContent='Saga completed!';busy=false;
}

document.getElementById('go').onclick=run;
buildUI();