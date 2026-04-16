const data={
  reasons:[
    {name:"Timeout",count:142,color:"#6ee7b7"},
    {name:"SchemaValidation",count:98,color:"#fbbf24"},
    {name:"AuthFailure",count:56,color:"#ef5350"},
    {name:"DownstreamError",count:77,color:"#60a5fa"},
    {name:"InvalidJSON",count:34,color:"#c084fc"}
  ],
  topics:[
    {name:"orders.v2",count:156},
    {name:"payments.charge",count:112},
    {name:"inventory.sync",count:78},
    {name:"notifications.email",count:41},
    {name:"user.signup",count:20}
  ],
  timeline:Array.from({length:48},(_,i)=>({t:i,v:Math.floor(20+Math.sin(i/4)*10+Math.random()*25)}))
};
const total=data.reasons.reduce((a,b)=>a+b.count,0);
document.getElementById("total").textContent=total;

// donut
const donut=document.getElementById("donut");
let angle=-Math.PI/2;const cx=100,cy=100,r=80,ir=50;
data.reasons.forEach(rs=>{
  const frac=rs.count/total,end=angle+frac*Math.PI*2;
  const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
  const x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
  const x3=cx+ir*Math.cos(end),y3=cy+ir*Math.sin(end);
  const x4=cx+ir*Math.cos(angle),y4=cy+ir*Math.sin(angle);
  const large=frac>0.5?1:0;
  const d=`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${ir},${ir} 0 ${large} 0 ${x4},${y4} Z`;
  const p=document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d",d);p.setAttribute("fill",rs.color);
  donut.appendChild(p);
  angle=end;
});

// legend
const legend=document.getElementById("legend");
data.reasons.forEach(rs=>{
  const li=document.createElement("li");
  li.innerHTML=`<span><span class="dot" style="background:${rs.color}"></span>${rs.name}</span><span class="count">${rs.count} (${(rs.count/total*100).toFixed(1)}%)</span>`;
  legend.appendChild(li);
});

// timeline
const tl=document.getElementById("timeline");
const max=Math.max(...data.timeline.map(d=>d.v));
const w=400/data.timeline.length;
data.timeline.forEach((d,i)=>{
  const h=(d.v/max)*180;
  const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");
  rect.setAttribute("x",i*w+1);rect.setAttribute("y",200-h);
  rect.setAttribute("width",w-2);rect.setAttribute("height",h);
  rect.setAttribute("fill","#6ee7b7");rect.setAttribute("opacity",0.3+0.7*(d.v/max));
  tl.appendChild(rect);
});

// bars
const bars=document.getElementById("bars");
const maxT=Math.max(...data.topics.map(t=>t.count));
data.topics.forEach(t=>{
  const row=document.createElement("div");row.className="bar-row";
  row.innerHTML=`<span class="lbl">${t.name}</span><span class="bar"><span class="fill" style="width:${t.count/maxT*100}%"></span></span><span class="v">${t.count}</span>`;
  bars.appendChild(row);
});

// recommendations
const actions=document.getElementById("actions");
const recs=[];
const topReason=data.reasons.sort((a,b)=>b.count-a.count)[0];
recs.push(`<b>${topReason.name}</b> is the dominant failure (${(topReason.count/total*100).toFixed(1)}%). Investigate retry/backoff config.`);
const topTopic=data.topics[0];
recs.push(`Topic <b>${topTopic.name}</b> produces ${topTopic.count} dead letters — consider dedicated DLQ + alerting.`);
recs.push(`Add a <b>schema validator</b> upstream to cut ${data.reasons.find(r=>r.name==="SchemaValidation").count} validation failures.`);
recs.push(`Purge messages older than <b>7 days</b> with no replay attempts to keep DLQ size manageable.`);
recs.forEach(r=>{const li=document.createElement("li");li.innerHTML=r;actions.appendChild(li);});