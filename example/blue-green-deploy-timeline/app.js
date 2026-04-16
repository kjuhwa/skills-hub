const timeline=document.getElementById('timeline');
const detTitle=document.getElementById('detTitle'),detBody=document.getElementById('detBody');
const names=['Auth Service','API Gateway','User Service','Payment','Notifications'];
const authors=['alice','bob','carol','dave'];
const deploys=[];
function randStatus(){const r=Math.random();return r<.7?'success':r<.85?'rolled-back':'failed'}
function fmtTime(d){return d.toLocaleString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function makeDeploy(idx){
  const env=idx%2===0?'blue':'green';
  const ver=`v${idx+1}.${Math.random()*9|0}.0`;
  const status=randStatus();
  const svc=names[idx%names.length];
  const author=authors[idx%authors.length];
  const duration=5+Math.random()*55|0;
  const date=new Date(Date.now()-((deploys.length-idx)*3600000*6));
  return{env,ver,status,svc,author,duration,date,idx};
}
function renderCard(d){
  const el=document.createElement('div');
  el.className=`deploy ${d.env}`;
  const st=d.status==='success'?'ok':d.status==='failed'?'fail':'rollback';
  el.innerHTML=`<div class="card" data-idx="${d.idx}"><div class="top"><span class="ver ${d.env}">${d.ver}</span><span class="time">${fmtTime(d.date)}</span></div><div style="font-size:.78rem;color:#888">${d.svc}</div><div class="tags"><span class="tag">${d.env}</span><span class="tag ${st}">${d.status}</span><span class="tag">${d.duration}s</span></div></div>`;
  el.onclick=()=>{
    document.querySelectorAll('.card').forEach(c=>c.classList.remove('active'));
    el.querySelector('.card').classList.add('active');
    detTitle.textContent=`${d.ver} — ${d.svc}`;
    detBody.innerHTML=`<b>Environment:</b> ${d.env}<br><b>Status:</b> ${d.status}<br><b>Author:</b> ${d.author}<br><b>Duration:</b> ${d.duration}s<br><b>Deployed:</b> ${d.date.toLocaleString()}<br><b>Commit:</b> ${Math.random().toString(36).slice(2,10)}<br><b>Health checks:</b> ${d.status==='failed'?'3/5 passed':'5/5 passed'}`;
  };
  return el;
}
for(let i=7;i>=0;i--){const d=makeDeploy(i);deploys.push(d);timeline.appendChild(renderCard(d))}
function addDeploy(){const d=makeDeploy(deploys.length);deploys.push(d);timeline.prepend(renderCard(d))}