const sky = document.getElementById('sky');
const logEl = document.getElementById('log');
const state = { demand: 0, emitted: 0, inFlight: [] };

function log(msg, cls=''){
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(line);
  while (logEl.children.length > 40) logEl.lastChild.remove();
}

function request(n){
  state.demand += n;
  document.getElementById('demand').textContent = state.demand;
  log(`subscriber.request(${n}) → demand=${state.demand}`,'acc');
  pump();
}

function pump(){
  while (state.demand > 0 && state.inFlight.length < 10){
    state.demand--;
    state.emitted++;
    document.getElementById('demand').textContent = state.demand;
    document.getElementById('emitted').textContent = state.emitted;
    const item = { id: state.emitted, x: 60, y: 150 + (Math.random()*40-20), vy: (Math.random()*.8-.4), born: performance.now() };
    state.inFlight.push(item);
    log(`publisher.emit(#${item.id})`);
  }
}

function render(){
  const dt = 1.8;
  state.inFlight.forEach(it => { it.x += dt; it.y += it.vy * dt; });
  state.inFlight = state.inFlight.filter(it => {
    if (it.x > 740){ log(`subscriber.onNext(#${it.id})`); return false; }
    return true;
  });
  sky.innerHTML = '';
  const ns = 'http://www.w3.org/2000/svg';
  for (let x=60; x<=740; x+=40){
    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',x); c.setAttribute('cy',150); c.setAttribute('r',1.5);
    c.setAttribute('fill','#2a2f3d');
    sky.appendChild(c);
  }
  state.inFlight.forEach(it => {
    const g = document.createElementNS(ns,'g');
    const c = document.createElementNS(ns,'circle');
    c.setAttribute('cx',it.x); c.setAttribute('cy',it.y); c.setAttribute('r',14);
    c.setAttribute('fill','#6ee7b7'); c.setAttribute('opacity','.85');
    const t = document.createElementNS(ns,'text');
    t.setAttribute('x',it.x); t.setAttribute('y',it.y+4);
    t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#0f1117');
    t.setAttribute('font-weight','700'); t.setAttribute('font-size','11');
    t.textContent = it.id;
    g.appendChild(c); g.appendChild(t);
    sky.appendChild(g);
  });
  requestAnimationFrame(render);
}

document.getElementById('req1').addEventListener('click',()=>request(1));
document.getElementById('req5').addEventListener('click',()=>request(5));
document.getElementById('reset').addEventListener('click',()=>{
  state.demand=0; state.emitted=0; state.inFlight=[];
  document.getElementById('demand').textContent='0';
  document.getElementById('emitted').textContent='0';
  log('stream reset','acc');
});

log('juggler ready — click request(n) to pull items','acc');
requestAnimationFrame(render);