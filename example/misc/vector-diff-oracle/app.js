// Vector Diff Oracle — D3 v7 terminal calculator
// Skills referenced: see README commentary in the outer block.

// ---------- RNG (per `fnv1a-xorshift-text-to-procedural-seed`) ----------
function fnv1a(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h>>>0}
function mkrng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)/4294967296)}}

// ---------- Model ----------
const state = {
  N:24, keys:5000, overlap:72, fanout:3, fpPct:1.0, tick:1000, churn:40,
  seed:'oracle-01',
  peers:[], links:[], sim:null, history:[]
};

function buildPeers(){
  const r=mkrng(fnv1a(state.seed));
  state.peers = d3.range(state.N).map(i=>({
    id:'peer-'+i.toString(36).padStart(2,'0'),
    idx:i,
    keys: Math.floor(state.keys*(0.85+r()*0.3)),
    bloomMatch: state.overlap/100 + (r()-0.5)*0.12,
    lag: Math.floor(r()*120),
    partition: r()<0.04,
    leader: false,
    x: Math.cos(2*Math.PI*i/state.N)*150+400,
    y: Math.sin(2*Math.PI*i/state.N)*150+240
  }));
  // pick leader (fence-token style)
  const lead=Math.floor(r()*state.N);
  state.peers[lead].leader=true;
  // build links (small-world-ish)
  state.links=[];
  for(let i=0;i<state.N;i++){
    for(let j=1;j<=state.fanout;j++){
      const t=(i+j)%state.N;
      state.links.push({source:i,target:t, weight:Math.max(0, (state.peers[i].bloomMatch+state.peers[t].bloomMatch)/2)});
    }
    if(r()<0.3){
      const t=Math.floor(r()*state.N);
      if(t!==i) state.links.push({source:i,target:t, weight:r()});
    }
  }
}

// ---------- Bloom sizing math (respecting `bloom-filter-implementation-pitfall`) ----------
// Given n items and target fp p, optimal m = -(n ln p)/(ln2)^2, k = (m/n) ln 2
function bloomSize(n,p){
  const m = Math.ceil(-(n*Math.log(p))/(Math.LN2*Math.LN2));
  const k = Math.max(1, Math.round((m/n)*Math.LN2));
  return {m,k};
}

// Rounds-to-converge model: ~ log₂(N)/log₂(1+fanout) with overlap dampening
function roundsToConverge(N,fanout,overlapPct){
  const base = Math.log2(N)/Math.log2(1+fanout);
  const damp = 1 + (1-overlapPct/100)*1.4;
  return base*damp;
}

// Merkle depth
function merkleDepth(n){return n<=1?1:Math.ceil(Math.log2(n))}

// ---------- Sidebar readout ----------
function updateReadout(){
  const n = state.keys;
  const p = Math.max(0.00001, state.fpPct/100);
  const {m,k} = bloomSize(n,p);
  const rounds = roundsToConverge(state.N,state.fanout,state.overlap);
  const md = merkleDepth(n);
  const bytesPerPeer = Math.ceil(m/8);
  const gossipBw = bytesPerPeer*state.fanout*(1000/state.tick); // per second
  const churnBudget = state.churn * state.N / Math.max(1,state.fanout);
  const items = [
    ['bloom m (bits)', m.toLocaleString()],
    ['bloom k (hashes)', k],
    ['bytes/peer', bytesPerPeer.toLocaleString()],
    ['gossip bw b/s', gossipBw.toFixed(0)],
    ['rounds→conv', rounds.toFixed(2)],
    ['merkle depth', md],
    ['keys total', (n*state.N).toLocaleString()],
    ['churn budget', churnBudget.toFixed(0)+' kps'],
    ['fp budget', (p*100).toFixed(2)+'%'],
  ];
  const ul = d3.select('#readout').selectAll('li').data(items,d=>d[0]);
  ul.enter().append('li')
    .each(function(d){ d3.select(this).append('span'); d3.select(this).append('span'); })
    .merge(ul)
    .each(function(d){
      const sp=d3.select(this).selectAll('span');
      sp.filter((_,i)=>i===0).text(d[0]);
      sp.filter((_,i)=>i===1).text(d[1]);
    });
  ul.exit().remove();
  d3.select('#meta').text(`N=${state.N} · fanout=${state.fanout} · overlap=${state.overlap}% · seed=${state.seed}`);
}

// ---------- Chart: bloom sizing ----------
function renderSizing(){
  const svg = d3.select('#chart-sizing');
  svg.selectAll('*').remove();
  const m={l:60,r:30,t:20,b:40}, W=820-m.l-m.r, H=420-m.t-m.b;
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const fps=d3.range(0.01,5.01,0.01);
  const n=state.keys;
  const data=fps.map(fp=>({fp, ...bloomSize(n,fp/100)}));
  const x=d3.scaleLog().domain([0.01,5]).range([0,W]);
  const y=d3.scaleLog().domain([d3.min(data,d=>d.m), d3.max(data,d=>d.m)]).range([H,0]);
  g.append('g').attr('class','grid').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickFormat(d=>d+'%').ticks(6));
  g.append('g').attr('class','grid').call(d3.axisLeft(y).tickFormat(d3.format('~s')));
  g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickFormat(d=>d+'%').ticks(6));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).tickFormat(d3.format('~s')));
  const line=d3.line().x(d=>x(d.fp)).y(d=>y(d.m));
  g.append('path').datum(data).attr('class','line').attr('d',line);
  // highlight current fp
  const cur = bloomSize(n, state.fpPct/100);
  g.append('line').attr('x1',x(state.fpPct)).attr('x2',x(state.fpPct)).attr('y1',0).attr('y2',H)
    .attr('stroke','var(--warn)').attr('stroke-dasharray','4 3');
  g.append('circle').attr('class','dot alt').attr('cx',x(state.fpPct)).attr('cy',y(cur.m)).attr('r',5);
  g.append('text').attr('x',x(state.fpPct)+6).attr('y',y(cur.m)-6).attr('fill','var(--warn)')
    .text(`fp=${state.fpPct.toFixed(2)}% → m=${cur.m.toLocaleString()} bits · k=${cur.k}`);
  g.append('text').attr('x',W-4).attr('y',-6).attr('text-anchor','end').attr('fill','var(--ink-dim)').text('log-log axes');
  g.append('text').attr('x',0).attr('y',-6).attr('fill','var(--ink-dim)').text('bits required for N='+n.toLocaleString());
}

// ---------- Chart: round projection ----------
function renderRounds(){
  const svg=d3.select('#chart-rounds');
  svg.selectAll('*').remove();
  const m={l:60,r:20,t:20,b:40}, W=820-m.l-m.r, H=420-m.t-m.b;
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const fs=d3.range(1,9);
  const data=fs.map(f=>({f, r:roundsToConverge(state.N,f,state.overlap)}));
  const x=d3.scaleLinear().domain([1,8]).range([0,W]);
  const y=d3.scaleLinear().domain([0, d3.max(data,d=>d.r)*1.15]).range([H,0]);
  g.append('g').attr('class','grid').call(d3.axisLeft(y).tickSize(-W));
  g.append('g').attr('class','axis').attr('transform',`translate(0,${H})`).call(d3.axisBottom(x).tickValues(fs).tickFormat(d=>'fan '+d));
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(6));

  const sel=g.selectAll('rect.bar').data(data,d=>d.f);
  sel.enter().append('rect').attr('class','bar')
    .attr('x',d=>x(d.f)-18).attr('y',H).attr('width',36).attr('height',0)
    .attr('fill','var(--accent-fade)').attr('stroke','var(--accent)')
    .merge(sel).transition().duration(700)
    .attr('x',d=>x(d.f)-18).attr('y',d=>y(d.r))
    .attr('height',d=>H-y(d.r))
    .attr('fill',d=>d.f===state.fanout?'rgba(255,255,51,0.25)':'var(--accent-fade)')
    .attr('stroke',d=>d.f===state.fanout?'var(--warn)':'var(--accent)');
  sel.exit().remove();

  g.selectAll('text.lbl').data(data,d=>d.f).join('text').attr('class','lbl')
    .attr('x',d=>x(d.f)).attr('y',d=>y(d.r)-4).attr('text-anchor','middle').attr('fill','var(--accent)')
    .text(d=>d.r.toFixed(2));

  // overlay line of ideal fanout
  const line=d3.line().x(d=>x(d.f)).y(d=>y(d.r)).curve(d3.curveMonotoneX);
  g.append('path').datum(data).attr('class','line alt').attr('d',line).attr('stroke-dasharray','4 3');
  g.append('text').attr('x',W-4).attr('y',14).attr('text-anchor','end').attr('fill','var(--ink-dim)')
    .text(`overlap=${state.overlap}% · N=${state.N}`);
}

// ---------- Chart: topology (d3-force) ----------
function renderTopology(){
  const svg=d3.select('#chart-topology');
  svg.selectAll('*').remove();
  const W=820,H=500;
  if(state.sim) state.sim.stop();
  const nodes = state.peers.map(p=>({...p}));
  const links = state.links.map(l=>({...l}));

  state.sim = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-160))
    .force('center', d3.forceCenter(W/2,H/2))
    .force('link', d3.forceLink(links).id(d=>d.idx).distance(d=>80 - d.weight*40).strength(0.4))
    .force('collide', d3.forceCollide(18));

  const linkSel=svg.append('g').selectAll('line').data(links).join('line')
    .attr('class',d=> d.weight>0.75?'link hot':'link')
    .attr('stroke-width',d=>0.5+d.weight*1.8);

  const nodeSel=svg.append('g').selectAll('circle').data(nodes).join('circle')
    .attr('class',d=> (d.partition?'node partition':(d.leader?'node leader':'node')))
    .attr('r',d=>8+Math.log10(d.keys)*2)
    .call(d3.drag()
      .on('start',(e,d)=>{ if(!e.active)state.sim.alphaTarget(0.3).restart(); d.fx=d.x;d.fy=d.y; })
      .on('drag',(e,d)=>{ d.fx=e.x;d.fy=e.y; })
      .on('end',(e,d)=>{ if(!e.active)state.sim.alphaTarget(0); d.fx=null;d.fy=null; }))
    .on('mouseover',(e,d)=>showTip(e,`${d.id}<br/>keys ${d.keys}<br/>bloom-match ${(d.bloomMatch*100).toFixed(1)}%<br/>lag ${d.lag}ms${d.leader?'<br/>[leader]':''}${d.partition?'<br/>[PARTITIONED]':''}`))
    .on('mouseout',hideTip);

  const labels=svg.append('g').selectAll('text').data(nodes).join('text')
    .attr('fill','var(--ink-dim)').attr('font-size',9).attr('text-anchor','middle').attr('dy','0.3em')
    .text(d=>d.id.slice(-3));

  state.sim.on('tick',()=>{
    linkSel.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    nodeSel.attr('cx',d=>d.x).attr('cy',d=>d.y);
    labels.attr('x',d=>d.x).attr('y',d=>d.y);
  });

  // legend
  const lg=svg.append('g').attr('transform','translate(14,14)').attr('fill','var(--ink-dim)').attr('font-size',10);
  lg.append('text').attr('y',0).text('● leader  ● partitioned  — hot link');
}

// ---------- Chart: vector-diff matrix ----------
function renderDiff(){
  const svg=d3.select('#chart-diff');
  svg.selectAll('*').remove();
  const m={l:60,t:40,r:20,b:20};
  const W=820-m.l-m.r, H=480-m.t-m.b;
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
  const N=state.peers.length;
  const cell=Math.floor(Math.min(W,H)/N);
  const color=d3.scaleSequential(d3.interpolateGreens).domain([0.2,1]);

  const data=[];
  for(let i=0;i<N;i++) for(let j=0;j<N;j++){
    if(i===j) continue;
    const a=state.peers[i].bloomMatch, b=state.peers[j].bloomMatch;
    // synthetic jaccard ~ product with cap
    const v = Math.min(1, (a*b) + 0.08*Math.sin((i*7+j*11)*0.5));
    data.push({i,j,v});
  }

  g.selectAll('rect').data(data,d=>d.i+'-'+d.j).join('rect')
    .attr('class','cell')
    .attr('x',d=>d.i*cell).attr('y',d=>d.j*cell).attr('width',cell-1).attr('height',cell-1)
    .attr('fill',d=>color(d.v))
    .on('mouseover',(e,d)=>showTip(e,`${state.peers[d.i].id} × ${state.peers[d.j].id}<br/>bloom-jaccard ${(d.v*100).toFixed(1)}%`))
    .on('mouseout',hideTip);

  // row/col labels
  const sparseStep = Math.max(1,Math.ceil(N/18));
  g.selectAll('text.rl').data(state.peers).join('text')
    .attr('class','rl').attr('x',-6).attr('y',(d,i)=>i*cell+cell-4)
    .attr('text-anchor','end').attr('fill','var(--ink-dim)').attr('font-size',9)
    .text((d,i)=> i%sparseStep===0? d.id.slice(-3):'');
  g.selectAll('text.cl').data(state.peers).join('text')
    .attr('class','cl').attr('x',(d,i)=>i*cell+cell/2).attr('y',-6)
    .attr('text-anchor','middle').attr('fill','var(--ink-dim)').attr('font-size',9)
    .text((d,i)=> i%sparseStep===0? d.id.slice(-3):'');

  // colorbar
  const cb=svg.append('g').attr('transform',`translate(${m.l+W-220},${m.t+H+10})`);
  const cbs=d3.range(0,1.01,0.05);
  cbs.forEach((v,i)=> cb.append('rect').attr('x',i*10).attr('y',0).attr('width',10).attr('height',8).attr('fill',color(0.2+v*0.8)));
  cb.append('text').attr('y',22).attr('fill','var(--ink-dim)').attr('font-size',10).text('bloom-jaccard 0% → 100%');
}

// ---------- Tooltip ----------
const tooltip = d3.select('body').append('div').attr('class','tooltip');
function showTip(e,html){
  tooltip.style('left',(e.clientX+12)+'px').style('top',(e.clientY+12)+'px').style('opacity',1).html(html);
}
function hideTip(){ tooltip.style('opacity',0); }

// ---------- View routing ----------
let currentView = 'sizing';
function renderAll(){
  updateReadout();
  renderSizing();
  renderRounds();
  renderTopology();
  renderDiff();
}
function activateView(v){
  currentView=v;
  d3.selectAll('.tab').classed('active',function(){ return this.dataset.view===v; });
  d3.selectAll('.view').classed('active',function(){ return this.dataset.view===v; });
  d3.select('#status').html('<span class="blink">█</span> view: '+v);
}

// ---------- History (log-aggregation-data-simulation inspired) ----------
function pushHistory(kind){
  state.history.unshift({
    t:new Date().toLocaleTimeString(),
    kind,
    N:state.N,
    bloom:bloomSize(state.keys,state.fpPct/100).m,
    rounds:roundsToConverge(state.N,state.fanout,state.overlap).toFixed(2)
  });
  if(state.history.length>40) state.history.length=40;
  const sel=d3.select('#history').selectAll('div.h').data(state.history,d=>d.t+d.kind);
  sel.enter().append('div').attr('class','h')
    .html(d=>`&gt; <b>${d.t}</b> ${d.kind}  N=${d.N}  m=${d.bloom.toLocaleString()}  r=${d.rounds}`)
    .merge(sel);
  sel.exit().remove();
}

// ---------- Input wiring ----------
function bindInputs(){
  const map=[
    ['#in-n','v-n','N',v=>+v, v=>v],
    ['#in-k','v-k','keys',v=>+v, v=>v],
    ['#in-o','v-o','overlap',v=>+v, v=>v],
    ['#in-f','v-f','fanout',v=>+v, v=>v],
    ['#in-fp','v-fp','fpPct', v=>(+v)/10, v=>(+v/10).toFixed(2)+'%'],
    ['#in-tick','v-tick','tick',v=>+v, v=>v],
    ['#in-ch','v-ch','churn',v=>+v, v=>v],
  ];
  map.forEach(([sel,lbl,key,parse,format])=>{
    const el=document.querySelector(sel);
    el.addEventListener('input',e=>{
      state[key]=parse(e.target.value);
      document.getElementById(lbl).textContent=format(e.target.value);
      if(key==='N' || key==='fanout'){ buildPeers(); renderAll(); }
      else { updateReadout(); renderSizing(); renderRounds(); renderDiff(); }
    });
  });
  document.querySelector('#in-seed').addEventListener('change',e=>{ state.seed=e.target.value; buildPeers(); renderAll(); pushHistory('reseed'); });
  document.querySelector('#btn-run').addEventListener('click',()=>{ buildPeers(); renderAll(); pushHistory('run'); });
  document.querySelector('#btn-reseed').addEventListener('click',()=>{ state.seed=state.seed+'-'+Math.floor(Math.random()*999); document.querySelector('#in-seed').value=state.seed; buildPeers(); renderAll(); pushHistory('reseed'); });
  document.querySelector('#btn-jitter').addEventListener('click',()=>{
    // cache-variance-ttl-jitter inspired
    state.peers.forEach(p=>p.bloomMatch = Math.max(0.2, Math.min(1, p.bloomMatch + (Math.random()-0.5)*0.2)));
    renderTopology(); renderDiff(); pushHistory('jitter-ttl');
  });
  document.querySelector('#btn-clear').addEventListener('click',()=>{
    state.history=[]; d3.select('#history').selectAll('div').remove();
  });
  d3.selectAll('.tab').on('click',function(){ activateView(this.dataset.view); });
  window.addEventListener('keydown',e=>{
    if(e.key==='1') activateView('sizing');
    if(e.key==='2') activateView('rounds');
    if(e.key==='3') activateView('topology');
    if(e.key==='4') activateView('diff');
    if(e.key==='r' && !e.shiftKey){ document.querySelector('#btn-run').click(); }
    if(e.key==='R' || (e.key==='r'&&e.shiftKey)){ document.querySelector('#btn-reseed').click(); }
  });
}

// ---------- Boot ----------
bindInputs();
buildPeers();
renderAll();
pushHistory('boot');
activateView('sizing');