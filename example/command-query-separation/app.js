const codeEl=document.getElementById('code'),resultsEl=document.getElementById('results');
const sampleCode=`class UserService {
  // Pure command - good
  setName(name) {
    this.name = name;
  }
  // Pure query - good
  getName() {
    return this.name;
  }
  // Violation! Mutates AND returns
  removeAndCount(id) {
    this.items = this.items.filter(i => i.id !== id);
    return this.items.length;
  }
  // Pure command
  addItem(item) {
    this.items.push(item);
  }
  // Pure query
  getTotal() {
    return this.items.reduce((s,i) => s + i.price, 0);
  }
  // Violation! Side-effect in getter
  getAndLog(key) {
    console.log('accessed', key);
    this.accessCount++;
    return this.data[key];
  }
}`;
codeEl.value=sampleCode;

function analyze(src){
  const methodRe=/^\s*(async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/gm;
  const methods=[];let m;
  const lines=src.split('\n');
  while((m=methodRe.exec(src))!==null){
    const name=m[2],start=src.substring(0,m.index).split('\n').length-1;
    let depth=0,end=start;
    for(let i=start;i<lines.length;i++){
      for(const ch of lines[i]){if(ch==='{')depth++;if(ch==='}')depth--}
      if(depth<=0){end=i;break}
    }
    const body=lines.slice(start,end+1).join('\n');
    methods.push({name,body});
  }
  return methods.map(fn=>{
    const hasReturn=/return\s+[^;]/.test(fn.body)&&!/return\s*;/.test(fn.body);
    const mutates=/this\.\w+\s*[=+\-]|\.push\(|\.splice\(|\.pop\(|\.shift\(|\.filter\(.*=/.test(fn.body);
    const logs=/console\.|\.log\(/.test(fn.body);
    const sideEffect=mutates||logs;
    let type='query',violation=false;
    if(sideEffect&&!hasReturn)type='command';
    else if(!sideEffect&&hasReturn)type='query';
    else if(sideEffect&&hasReturn){type='violation';violation=true}
    const reason=violation?'Mutates state AND returns a value — breaks CQS':type==='command'?'Modifies state, returns nothing':'Returns data without side effects';
    return{name:fn.name,type,reason,violation};
  });
}
function render(methods){
  resultsEl.innerHTML=methods.map(m=>{
    const cls=m.violation?'violation':m.type;
    const tag=m.violation?'<span class="tag viol">VIOLATION</span>':(m.type==='command'?'<span class="tag cmd">COMMAND</span>':'<span class="tag qry">QUERY</span>');
    return`<div class="method-card ${cls}"><h3>${m.name}()${tag}</h3><p>${m.reason}</p></div>`;
  }).join('');
}
document.getElementById('analyze').onclick=()=>render(analyze(codeEl.value));
render(analyze(sampleCode));