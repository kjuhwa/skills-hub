const input=document.getElementById('input');
const results=document.getElementById('results');
const cmdPrefixes=['set','update','delete','remove','create','add','insert','save','put','post','send','reset','clear'];
const qryPrefixes=['get','find','fetch','list','count','is','has','check','search','load','read','query','select'];

function classify(name){
  const lower=name.toLowerCase().replace(/[^a-z]/g,'');
  if(cmdPrefixes.some(p=>lower.startsWith(p)))return'cmd';
  if(qryPrefixes.some(p=>lower.startsWith(p)))return'qry';
  if(name.includes('=')||/void/i.test(name))return'cmd';
  return'qry';
}

function reason(name,type){
  const lower=name.toLowerCase().replace(/[^a-z]/g,'');
  const p=type==='cmd'?cmdPrefixes.find(p=>lower.startsWith(p)):qryPrefixes.find(p=>lower.startsWith(p));
  return p?`prefix: ${p}`:type==='cmd'?'mutator pattern':'accessor pattern';
}

function analyze(){
  const raw=input.value.trim();if(!raw)return;
  const methods=raw.split(/[,\n;]+/).map(s=>s.trim()).filter(Boolean);
  const cmds=[],qrys=[];
  methods.forEach(m=>{const t=classify(m);(t==='cmd'?cmds:qrys).push({name:m,reason:reason(m,t)});});
  results.innerHTML=`
    <div class="col cmd"><h2>Commands (${cmds.length})</h2>${cmds.map(c=>`<div class="method">${c.name}<span class="badge">${c.reason}</span></div>`).join('')}</div>
    <div class="col qry"><h2>Queries (${qrys.length})</h2>${qrys.map(q=>`<div class="method">${q.name}<span class="badge">${q.reason}</span></div>`).join('')}</div>`;
}

document.getElementById('analyze').onclick=analyze;
input.value='getUser(id)\nsetName(id, name)\ndeleteOrder(id)\nfindProducts(query)\nisActive(id)\nupdateEmail(id, email)\ncountItems()\nclearCache()\nfetchReport(date)\nsaveSettings(data)';
analyze();