const svg=document.getElementById('hull'),NS='http://www.w3.org/2000/svg';
const hullTop=60,hullBot=240,hullLeft=60,hullRight=740;
let walls=[200,400,580],dragging=null;
function el(tag,attrs){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e}
function draw(){svg.innerHTML='';
const hull=el('path',{d:`M${hullLeft},${hullTop} L${hullRight},${hullTop} Q${hullRight+30},${(hullTop+hullBot)/2} ${hullRight},${hullBot} L${hullLeft},${hullBot} Q${hullLeft-30},${(hullTop+hullBot)/2} ${hullLeft},${hullTop}`,fill:'none',stroke:'#3d444d',['stroke-width']:2});
svg.appendChild(hull);
walls.forEach((x,i)=>{const line=el('rect',{x:x-3,y:hullTop,width:6,height:hullBot-hullTop,fill:'#6ee7b7',rx:2,cursor:'ew-resize','data-i':i,opacity:.85});
line.addEventListener('mousedown',e=>{dragging=i;e.preventDefault()});
svg.appendChild(line);
const label=el('text',{x,y:hullBot+20,fill:'#8b949e','font-size':'11','text-anchor':'middle'});label.textContent='B'+(i+1);svg.appendChild(label)});
const sections=getSections();sections.forEach((s,i)=>{const t=el('text',{x:(s[0]+s[1])/2,y:(hullTop+hullBot)/2+4,fill:'#4d5566','font-size':'11','text-anchor':'middle'});
t.textContent=Math.round(s[1]-s[0])+'u';svg.appendChild(t)})}
function getSections(){const pts=[hullLeft,...walls.slice().sort((a,b)=>a-b),hullRight];const s=[];for(let i=0;i<pts.length-1;i++)s.push([pts[i],pts[i+1]]);return s}
svg.addEventListener('mousemove',e=>{if(dragging===null)return;const r=svg.getBoundingClientRect();const x=((e.clientX-r.left)/r.width)*800;walls[dragging]=Math.max(hullLeft+20,Math.min(hullRight-20,x));draw()});
window.addEventListener('mouseup',()=>dragging=null);
document.getElementById('addWall').onclick=()=>{if(walls.length<8){walls.push(hullLeft+Math.random()*(hullRight-hullLeft-40)+20);draw()}};
document.getElementById('testBtn').onclick=()=>{const sections=getSections();const maxWidth=Math.max(...sections.map(s=>s[1]-s[0]));const ideal=(hullRight-hullLeft)/(walls.length+1);
const variance=sections.reduce((a,s)=>a+Math.abs(s[1]-s[0]-ideal),0)/sections.length;
const score=Math.max(0,Math.round(100-variance/2));
document.getElementById('score').textContent=`Integrity: ${score}% — ${score>80?'Excellent':'Reinforce weak sections'}`;
sections.forEach(s=>{const w=s[1]-s[0];const c=w>ideal*1.5?'rgba(255,80,80,0.12)':'rgba(110,231,183,0.08)';
const r=el('rect',{x:s[0],y:hullTop+1,width:w,height:hullBot-hullTop-2,fill:c});svg.insertBefore(r,svg.firstChild.nextSibling)})};
draw();