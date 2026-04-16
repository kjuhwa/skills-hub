const svg=document.getElementById('ring'),sidebar=document.getElementById('sidebar'),info=document.getElementById('info');
const NODES=[{id:'ingress',label:'Ingress LB'},{id:'api',label:'API Server'},{id:'auth',label:'Auth Service'},{id:'db',label:'Database'},{id:'cache',label:'Redis Cache'},{id:'queue',label:'Message Queue'},{id:'worker',label:'Worker Pool'},{id:'storage',label:'Object Store'}];
const EDGES=[[0,1],[1,2],[1,3],[1,4],[1,5],[5,6],[6,3],[6,7],[2,3],[4,3]];
const LVLS=['INFO','WARN','ERROR'];
let nodeData={};
NODES.forEach(n=>{const errs=Math.floor(Math.random()*30);const warns=Math.floor(Math.random()*60);const infos=Math.floor(Math.random()*500);nodeData[n.id]={errors:errs,warns,infos,total:errs+warns+infos,rate:Math.floor(50+Math.random()*200),logs:[]};for(let i=0;i<8;i++){const l=LVLS[Math.random()<.1?2:Math.random()<.3?1:0];nodeData[n.id].logs.push({lvl:l,msg:`${l==='ERROR'?'connection timeout':'request processed'} id=${Math.floor(Math.random()*9999)}`})}});
function render(){const box=svg.getBoundingClientRect();const cx=box.width/2,cy=box.height/2,R=Math.min(cx,cy)*0.65;svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.innerHTML='';
const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<filter id="glow"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';svg.appendChild(defs);
const pos=NODES.map((_,i)=>{const a=(i/NODES.length)*Math.PI*2-Math.PI/2;return{x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)}});
EDGES.forEach(([a,b])=>{const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',pos[a].x);l.setAttribute('y1',pos[a].y);l.setAttribute('x2',pos[b].x);l.setAttribute('y2',pos[b].y);l.setAttribute('stroke','#2a2d37');l.setAttribute('stroke-width','1.5');svg.appendChild(l)});
NODES.forEach((n,i)=>{const d=nodeData[n.id];const r=18+d.total/40;const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.classList.add('node');
const circ=document.createElementNS('http://www.w3.org/2000/svg','circle');circ.setAttribute('cx',pos[i].x);circ.setAttribute('cy',pos[i].y);circ.setAttribute('r',r);const hue=d.errors>20?'#f87171':d.errors>10?'#fbbf24':'#6ee7b7';circ.setAttribute('fill',hue+'22');circ.setAttribute('stroke',hue);circ.setAttribute('stroke-width','2');circ.setAttribute('filter','url(#glow)');g.appendChild(circ);
const txt=document.createElementNS('http://www.w3.org/2000/svg','text');txt.setAttribute('x',pos[i].x);txt.setAttribute('y',pos[i].y+r+14);txt.setAttribute('text-anchor','middle');txt.setAttribute('fill','#888');txt.setAttribute('font-size','11');txt.textContent=n.label;g.appendChild(txt);
const cnt=document.createElementNS('http://www.w3.org/2000/svg','text');cnt.setAttribute('x',pos[i].x);cnt.setAttribute('y',pos[i].y+4);cnt.setAttribute('text-anchor','middle');cnt.setAttribute('fill','#c9d1d9');cnt.setAttribute('font-size','12');cnt.setAttribute('font-weight','bold');cnt.textContent=d.total;g.appendChild(cnt);
g.onclick=()=>showDetail(n,d);svg.appendChild(g)})}
function showDetail(n,d){info.textContent=n.label;sidebar.innerHTML=`<div class="sidebar-title">${n.label}</div>`+
[['Total Logs',d.total],['Errors',d.errors],['Warnings',d.warns],['Info',d.infos],['Rate',d.rate+'/min']].map(([k,v])=>`<div class="stat"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('')+
'<br><div class="sidebar-title">Recent Logs</div>'+d.logs.map(l=>`<div class="log-entry"><span class="lvl-${l.lvl[0].toLowerCase()}">[${l.lvl}]</span> ${l.msg}</div>`).join('')}
render();window.onresize=render;
showDetail(NODES[0],nodeData[NODES[0].id]);