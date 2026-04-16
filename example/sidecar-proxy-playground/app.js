const svg=document.getElementById('diagram');
const nodes=[
  {id:'client',label:'Client',x:60,y:200,color:'#9ca3af'},
  {id:'sidecarA',label:'Sidecar A',x:200,y:200,color:'#6ee7b7'},
  {id:'sidecarB',label:'Sidecar B',x:400,y:200,color:'#6ee7b7'},
  {id:'service',label:'Service',x:540,y:200,color:'#fbbf24'}
];
function renderDiagram(){svg.innerHTML='';
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  defs.innerHTML='<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10" fill="#6ee7b7"/></marker>';
  svg.appendChild(defs);
  for(let i=0;i<nodes.length-1;i++){const a=nodes[i],b=nodes[i+1];const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',a.x+40);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x-40);l.setAttribute('y2',b.y);l.setAttribute('stroke','#2a2f3e');l.setAttribute('stroke-width','2');l.setAttribute('marker-end','url(#arr)');svg.appendChild(l)}
  nodes.forEach(n=>{const g=document.createElementNS('http://www.w3.org/2000/svg','g');const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',n.x-40);r.setAttribute('y',n.y-30);r.setAttribute('width',80);r.setAttribute('height',60);r.setAttribute('rx',8);r.setAttribute('fill','#1a1d27');r.setAttribute('stroke',n.color);r.setAttribute('stroke-width',2);r.setAttribute('id','rect-'+n.id);const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',n.x);t.setAttribute('y',n.y+5);t.setAttribute('text-anchor','middle');t.setAttribute('fill',n.color);t.setAttribute('font-size','12');t.setAttribute('font-family','monospace');t.textContent=n.label;g.appendChild(r);g.appendChild(t);svg.appendChild(g)});
  const p=document.createElementNS('http://www.w3.org/2000/svg','circle');p.setAttribute('id','packet');p.setAttribute('r',6);p.setAttribute('fill','#6ee7b7');p.setAttribute('cx',-20);p.setAttribute('cy',200);svg.appendChild(p)}
renderDiagram();
const logs=document.getElementById('logs');
function log(msg,type='ok'){const e=document.createElement('div');e.className='entry '+type;e.innerHTML=`<span class="ts">${new Date().toLocaleTimeString()}</span>${msg}`;logs.insertBefore(e,logs.firstChild);while(logs.children.length>50)logs.removeChild(logs.lastChild)}
function flash(id,color){const el=document.getElementById('rect-'+id);if(!el)return;const orig=el.getAttribute('stroke');el.setAttribute('stroke',color);el.setAttribute('stroke-width',4);setTimeout(()=>{el.setAttribute('stroke',orig);el.setAttribute('stroke-width',2)},300)}
function moveTo(x,cb){const p=document.getElementById('packet');const start=parseFloat(p.getAttribute('cx'));const t0=performance.now();const dur=400;function step(t){const k=Math.min(1,(t-t0)/dur);p.setAttribute('cx',start+(x-start)*k);if(k<1)requestAnimationFrame(step);else cb&&cb()}requestAnimationFrame(step)}
async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function sendRequest(){const btn=document.getElementById('send');btn.disabled=true;
  const cfg={mtls:document.getElementById('mtls').checked,retry:document.getElementById('retry').checked,cb:document.getElementById('cb').checked,rate:document.getElementById('rate').checked,trace:document.getElementById('trace').checked,fault:document.getElementById('fault').value};
  const reqId='req-'+Math.random().toString(36).slice(2,7);
  log(`[${reqId}] Client → Sidecar A`);flash('client','#6ee7b7');moveTo(200,async()=>{flash('sidecarA','#6ee7b7');
    if(cfg.trace)log(`[${reqId}] trace-id injected`,'ok');
    if(cfg.rate&&Math.random()<.3){log(`[${reqId}] 429 rate limited`,'err');btn.disabled=false;return}
    if(cfg.mtls)log(`[${reqId}] mTLS handshake complete`,'ok');
    await sleep(200);moveTo(400,async()=>{flash('sidecarB','#6ee7b7');
      if(cfg.fault==='delay'){log(`[${reqId}] fault: +500ms delay`,'warn');await sleep(500)}
      let fail=cfg.fault==='error'||(cfg.fault==='abort'&&Math.random()<.5);
      if(fail){
        if(cfg.cb){log(`[${reqId}] circuit breaker OPEN - fast fail`,'err');flash('sidecarB','#ef4444');btn.disabled=false;return}
        if(cfg.retry){for(let i=1;i<=3;i++){log(`[${reqId}] retry ${i}/3`,'warn');await sleep(200);if(Math.random()<.5){fail=false;break}}}
      }
      if(fail){log(`[${reqId}] 503 upstream failure`,'err');flash('service','#ef4444');btn.disabled=false;return}
      moveTo(540,async()=>{flash('service','#6ee7b7');log(`[${reqId}] 200 OK (${(Math.random()*40+10).toFixed(0)}ms)`,'ok');await sleep(300);moveTo(-20);btn.disabled=false})})})}
document.getElementById('send').onclick=sendRequest;
log('Mesh initialized. Sidecars ready.','ok');