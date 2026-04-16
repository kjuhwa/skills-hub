const topics={orders:[],alerts:[],logs:[]};
const dlq=[],events=[];
let seq=0;
function ts(){return new Date().toLocaleTimeString()}
function addEvent(text,err){
  events.unshift({time:ts(),text,err});
  const el=document.getElementById('timeline');
  el.innerHTML=events.slice(0,50).map(e=>`<div class="evt${e.err?' err':''}"><span class="time">${e.time}</span><span class="act">${e.text}</span></div>`).join('');
}
function publish(topic,body){
  const msg={id:++seq,body,topic,ts:Date.now()};
  topics[topic].push(msg);addEvent(`Published #${msg.id} → ${topic}`);render();
}
function consume(topic){
  if(!topics[topic].length)return;
  const msg=topics[topic].shift();
  if(Math.random()<.15){dlq.push(msg);addEvent(`#${msg.id} failed → DLQ`,true);}
  else addEvent(`Consumed #${msg.id} from ${topic}`);
  render();
}
function render(){
  document.getElementById('queues').innerHTML=Object.keys(topics).map(t=>
    `<div class="q"><span class="name">${t}</span><span class="badge">${topics[t].length}</span><button onclick="consume('${t}')">Consume</button></div>`
  ).join('');
  document.getElementById('dlq').innerHTML=dlq.slice(-10).reverse().map(m=>`<div>#${m.id} [${m.topic}] ${m.body}</div>`).join('');
}
document.getElementById('btnSend').onclick=()=>{
  const topic=document.getElementById('topic').value;
  const body=document.getElementById('msgInput').value||'ping';
  publish(topic,body);document.getElementById('msgInput').value='';
};
render();
const samples=['New order placed','Payment received','User signed up','Inventory low','Alert triggered','Log rotated'];
setInterval(()=>{
  const t=['orders','alerts','logs'][Math.floor(Math.random()*3)];
  publish(t,samples[Math.floor(Math.random()*samples.length)]);
},2500);
setInterval(()=>{
  const t=['orders','alerts','logs'][Math.floor(Math.random()*3)];
  if(topics[t].length)consume(t);
},3200);