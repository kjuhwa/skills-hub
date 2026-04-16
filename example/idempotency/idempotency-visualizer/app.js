const svg=document.getElementById('viz'),keysEl=document.getElementById('keys');
const store={};let lastKey=null,autoId=null,seq=0;
const ns='http://www.w3.org/2000/svg';

function el(tag,attrs){const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e}

function drawBase(){
  svg.innerHTML='';
  const client=el('rect',{x:30,y:130,width:100,height:60,rx:8,fill:'#1a1d27',stroke:'#6ee7b7','stroke-width':2});
  const server=el('rect',{x:360,y:110,width:120,height:100,rx:8,fill:'#1a1d27',stroke:'#6ee7b7','stroke-width':2});
  const db=el('rect',{x:620,y:130,width:100,height:60,rx:8,fill:'#1a1d27',stroke:'#374151','stroke-width':2});
  svg.append(client,server,db);
  [['Client',65,165],['Server',390,165],['Database',640,165]].forEach(([t,x,y])=>{
    const txt=el('text',{x,y,fill:'#c9d1d9','font-size':'13','font-family':'sans-serif','text-anchor':'start'});txt.textContent=t;svg.append(txt);
  });
}
drawBase();

function animateRequest(key,isDup){
  const color=isDup?'#f87171':'#6ee7b7';
  const circle=el('circle',{cx:130,cy:160,r:6,fill:color});svg.append(circle);
  const label=el('text',{x:130,y:145,fill:color,'font-size':'10','font-family':'monospace'});label.textContent=key.slice(0,8);svg.append(label);
  let t=0;const anim=()=>{t+=4;const x=130+t;
    circle.setAttribute('cx',x);label.setAttribute('x',x-20);
    if(x<360){requestAnimationFrame(anim)}
    else if(!isDup){let t2=0;const anim2=()=>{t2+=5;circle.setAttribute('cx',480+t2);label.setAttribute('x',460+t2);
      if(480+t2<620)requestAnimationFrame(anim2);else{setTimeout(()=>{circle.remove();label.remove()},600)}};requestAnimationFrame(anim2)}
    else{const rej=el('text',{x:350,y:250,fill:'#f87171','font-size':'12','font-family':'monospace'});rej.textContent='↩ 200 OK (cached)';svg.append(rej);
      setTimeout(()=>{circle.remove();label.remove();rej.remove()},1200)}
  };requestAnimationFrame(anim);
}

function genKey(){return'ik-'+Math.random().toString(36).slice(2,10)}

function send(forceKey){
  seq++;const key=forceKey||genKey();const isDup=!!store[key];
  if(!isDup)store[key]={status:'201',time:new Date().toLocaleTimeString()};
  lastKey=key;animateRequest(key,isDup);renderKeys(isDup?key:null);
}

function renderKeys(dupKey){
  keysEl.innerHTML='';for(const[k,v]of Object.entries(store)){
    const d=document.createElement('div');d.className='key-tag'+(k===dupKey?' dup':'');
    d.innerHTML=`${k.slice(0,12)} <span class="status">${v.status}</span>`;keysEl.append(d);
  }
}

document.getElementById('btn-send').onclick=()=>send();
document.getElementById('btn-dup').onclick=()=>{if(lastKey)send(lastKey);else send()};
document.getElementById('btn-auto').onclick=function(){
  if(autoId){clearInterval(autoId);autoId=null;this.textContent='▶ Auto Simulate';this.classList.remove('active');return}
  this.textContent='■ Stop';this.classList.add('active');
  autoId=setInterval(()=>{Math.random()>0.4?send():send(lastKey)},900);
};