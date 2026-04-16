const subscriptions = [
  { name: 'postAdded', color: '#6ee7b7', enabled: true,
    gen: () => ({ title: ['Hello GraphQL','Schema Stitching','Fragments 101','Unions Deep Dive'][Math.floor(Math.random()*4)], author: pick(['ada','alan','grace']) }) },
  { name: 'commentCreated', color: '#fbbf24', enabled: true,
    gen: () => ({ text: pick(['Great post!','Thanks!','I disagree','Interesting']), postId: 'p' + (1 + Math.floor(Math.random()*20)) }) },
  { name: 'userOnline', color: '#f0abfc', enabled: true,
    gen: () => ({ userId: 'u' + (1 + Math.floor(Math.random()*99)), status: pick(['online','away','busy']) }) },
  { name: 'likeToggled', color: '#60a5fa', enabled: false,
    gen: () => ({ postId: 'p' + (1 + Math.floor(Math.random()*20)), delta: Math.random() > 0.5 ? 1 : -1 }) }
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let connected = true;
let count = 0;
const subsEl = document.getElementById('subs');
const eventsEl = document.getElementById('events');
const indicator = document.getElementById('indicator');
const statusText = document.getElementById('status-text');
const countEl = document.getElementById('count');
const toggleBtn = document.getElementById('toggle-conn');

function renderSubs() {
  subsEl.innerHTML = '';
  subscriptions.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'sub' + (s.enabled ? '' : ' off');
    d.style.borderLeftColor = s.enabled ? s.color : '#8b93a7';
    d.innerHTML = `<b>${s.name}</b>${s.enabled ? 'active' : 'paused'}`;
    d.onclick = () => { s.enabled = !s.enabled; renderSubs(); };
    subsEl.appendChild(d);
  });
}

function setConnection(on) {
  connected = on;
  indicator.className = 'dot ' + (on ? 'connected' : 'disconnected');
  statusText.textContent = on ? 'ws://api.example.com/graphql' : 'Disconnected';
  toggleBtn.textContent = on ? 'Disconnect' : 'Connect';
  toggleBtn.className = on ? '' : 'off';
}

toggleBtn.onclick = () => setConnection(!connected);

function addEvent() {
  if (!connected) return;
  const active = subscriptions.filter(s => s.enabled);
  if (!active.length) return;
  const sub = active[Math.floor(Math.random() * active.length)];
  const data = sub.gen();
  const time = new Date().toLocaleTimeString();

  const div = document.createElement('div');
  div.className = 'event';
  div.style.borderLeftColor = sub.color;
  div.innerHTML = `<span class="time">${time}</span><span class="op" style="color:${sub.color}">${sub.name}</span><span class="data">${JSON.stringify(data)}</span>`;
  eventsEl.insertBefore(div, eventsEl.firstChild);

  while (eventsEl.children.length > 40) eventsEl.removeChild(eventsEl.lastChild);
  countEl.textContent = ++count;
}

renderSubs();
setTimeout(() => setConnection(true), 600);
setInterval(addEvent, 900);
setInterval(() => { if (connected && Math.random() > 0.7) addEvent(); }, 400);