const output=document.getElementById('output'),cmd=document.getElementById('cmd');
const store={};const history=[];let hIdx=-1;

function seed(){
  const b={images:{},logs:{},data:{}};
  b.images['hero.png']={size:2400,date:'2026-04-10'};
  b.images['icon.svg']={size:12,date:'2026-04-12'};
  b.logs['app.log']={size:8700,date:'2026-04-15'};
  b.logs['error.log']={size:320,date:'2026-04-15'};
  b.data['export.csv']={size:4500,date:'2026-04-14'};
  b.data['backup.sql.gz']={size:18200,date:'2026-04-09'};
  Object.assign(store,b);
}
seed();

function print(text,cls=''){const d=document.createElement('div');d.className=cls;d.textContent=text;output.appendChild(d);output.scrollTop=output.scrollHeight}

function fmt(kb){return kb>=1024?`${(kb/1024).toFixed(1)} MB`:`${kb} KB`}

const cmds={
  help(){print('Commands:','info');['  ls [bucket]        - list buckets or objects','  put <bucket> <key> [sizeKB] - upload object','  get <bucket> <key> - download (simulated)','  rm <bucket> <key>  - delete object','  mb <name>          - make bucket','  rb <name>          - remove empty bucket','  stat               - storage statistics','  clear              - clear terminal','  help               - show this help'].forEach(l=>print(l,'dim'))},
  ls(args){
    if(!args[0]){Object.keys(store).forEach(b=>{const n=Object.keys(store[b]).length;print(`  ${b}/  (${n} objects)`,'ok')});return}
    const b=args[0];if(!store[b])return print(`Bucket "${b}" not found`,'err');
    const objs=store[b];if(!Object.keys(objs).length)return print('  (empty)','dim');
    Object.entries(objs).forEach(([k,v])=>print(`  ${k.padEnd(24)} ${fmt(v.size).padStart(10)}   ${v.date}`,'dim'));
  },
  put(args){
    const[b,k]=args;const sz=parseInt(args[2])||Math.floor(Math.random()*5000)+10;
    if(!b||!k)return print('Usage: put <bucket> <key> [sizeKB]','err');
    if(!store[b])return print(`Bucket "${b}" not found. Use: mb ${b}`,'err');
    store[b][k]={size:sz,date:'2026-04-16'};print(`PUT ${b}/${k} (${fmt(sz)})`,'ok');
  },
  get(args){
    const[b,k]=args;if(!b||!k)return print('Usage: get <bucket> <key>','err');
    if(!store[b]||!store[b][k])return print('Object not found','err');
    print(`GET ${b}/${k} → downloaded ${fmt(store[b][k].size)}`,'ok');
  },
  rm(args){
    const[b,k]=args;if(!b||!k)return print('Usage: rm <bucket> <key>','err');
    if(!store[b]||!store[b][k])return print('Object not found','err');
    delete store[b][k];print(`Deleted ${b}/${k}`,'ok');
  },
  mb(args){
    if(!args[0])return print('Usage: mb <name>','err');
    if(store[args[0]])return print('Bucket already exists','err');
    store[args[0]]={};print(`Bucket "${args[0]}" created`,'ok');
  },
  rb(args){
    if(!args[0])return print('Usage: rb <name>','err');
    if(!store[args[0]])return print('Bucket not found','err');
    if(Object.keys(store[args[0]]).length)return print('Bucket not empty','err');
    delete store[args[0]];print(`Bucket "${args[0]}" removed`,'ok');
  },
  stat(){
    let total=0,count=0;Object.values(store).forEach(b=>{Object.values(b).forEach(o=>{total+=o.size;count++})});
    print(`Buckets: ${Object.keys(store).length}  Objects: ${count}  Total: ${fmt(total)}`,'info');
  },
  clear(){output.innerHTML=''}
};

print('ObjStore CLI v1.0 — Type "help" for commands\n','info');
cmds.stat();print('');

cmd.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const raw=cmd.value.trim();cmd.value='';if(!raw)return;
    history.push(raw);hIdx=history.length;
    print(`objstore> ${raw}`);
    const[c,...args]=raw.split(/\s+/);
    if(cmds[c])cmds[c](args);else print(`Unknown command: ${c}. Type "help"`,'err');
    print('');
  }else if(e.key==='ArrowUp'){e.preventDefault();if(hIdx>0){hIdx--;cmd.value=history[hIdx]}}
  else if(e.key==='ArrowDown'){e.preventDefault();if(hIdx<history.length-1){hIdx++;cmd.value=history[hIdx]}else{hIdx=history.length;cmd.value=''}}
});