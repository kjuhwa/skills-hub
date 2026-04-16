const names=['Alice','Bob','Charlie','Diana','Eve','Frank'];
const phrases=['Hey everyone!','WebSockets are awesome','Anyone here?','Just deployed a new build',
  'The latency is incredible','Binary frames are underrated','ping? pong!','Love real-time updates',
  'Check out this payload size','Connection upgrade complete','RFC 6455 for life','Frames flowing smooth'];
const usersEl=document.getElementById('users'),msgsEl=document.getElementById('messages');
const connEl=document.getElementById('conn'),form=document.getElementById('form'),input=document.getElementById('input');
const online=names.slice(0,4);
function renderUsers(){
  usersEl.innerHTML=names.map(n=>{
    const on=online.includes(n);
    return `<div><span class="user-dot ${on?'online':'idle'}"></span>${n}</div>`;
  }).join('');
}
renderUsers();
function addMsg(name,text,me=false){
  const d=document.createElement('div');d.className='msg '+(me?'me':'other');
  d.innerHTML=`<div class="name">${name}</div><div class="text">${text}</div><div class="time">${new Date().toLocaleTimeString()}</div>`;
  msgsEl.append(d);msgsEl.scrollTop=msgsEl.scrollHeight;
}
function botMsg(){
  const n=online[Math.random()*online.length|0];
  const p=phrases[Math.random()*phrases.length|0];
  addMsg(n,p);
}
form.addEventListener('submit',e=>{e.preventDefault();const v=input.value.trim();if(!v)return;
  addMsg('You',v,true);input.value='';setTimeout(botMsg,800+Math.random()*1200)});
setInterval(botMsg,3000+Math.random()*2000);
setInterval(()=>{if(Math.random()>0.9){
  const i=Math.random()*names.length|0;
  if(online.includes(names[i]))online.splice(online.indexOf(names[i]),1);else online.push(names[i]);
  renderUsers();
}},4000);
setInterval(()=>{if(Math.random()>0.92){connEl.textContent='● Reconnecting...';connEl.style.color='#fbbf24';
  setTimeout(()=>{connEl.textContent='● Connected';connEl.style.color='#6ee7b7'},2000)}},5000);