const bus = {};
const topics = [];
const subs = [];
const streamEl = document.getElementById('stream');

function on(topic, cb) { (bus[topic] = bus[topic] || []).push(cb); }
function emit(topic, msg) {
  (bus[topic] || []).forEach(cb => cb(msg));
  const time = new Date().toLocaleTimeString();
  streamEl.innerHTML = `<div class="evt"><span class="t">${time}</span> <span class="n">${topic}</span>: ${msg}</div>` + streamEl.innerHTML;
  if (streamEl.children.length > 80) streamEl.lastChild.remove();
}

function addTopic(name) {
  if (!name || topics.includes(name)) return;
  topics.push(name);
  renderTopics();
}

function addSub(name, topicList) {
  const s = { name, topics: topicList, inbox: [] };
  subs.push(s);
  topicList.forEach(t => on(t, msg => { s.inbox.unshift({ t, msg }); if (s.inbox.length > 10) s.inbox.pop(); renderSubs(); }));
  renderSubs();
}

function renderTopics() {
  document.getElementById('topic-list').innerHTML = topics.map(t => `<span class="topic-tag">${t}</span>`).join('');
  const sel = document.getElementById('pub-select');
  sel.innerHTML = topics.map(t => `<option>${t}</option>`).join('');
}

function renderSubs() {
  document.getElementById('sub-list').innerHTML = subs.map(s =>
    `<div class="sub-card"><strong>${s.name}</strong><div class="topics-line">→ ${s.topics.join(', ')}</div><div class="inbox">${s.inbox.slice(0, 5).map(m => `<div><b>${m.t}</b>: ${m.msg}</div>`).join('')}</div></div>`
  ).join('');
}

document.getElementById('add-topic').onclick = () => { addTopic(document.getElementById('new-topic').value.trim()); document.getElementById('new-topic').value = ''; };
document.getElementById('pub-btn').onclick = () => { const t = document.getElementById('pub-select').value; const m = document.getElementById('pub-msg').value || 'ping'; emit(t, m); document.getElementById('pub-msg').value = ''; };

['chat', 'metrics', 'errors'].forEach(addTopic);
addSub('Logger', ['chat', 'errors']);
addSub('Dashboard', ['metrics']);
addSub('AlertBot', ['errors']);
addSub('Archiver', ['chat', 'metrics', 'errors']);

const payloads = ['user logged in', 'cpu 82%', 'timeout err', 'new message', 'mem 1.2GB', 'disk warning', '404 not found', 'session started'];
setInterval(() => { const t = topics[(Math.random() * topics.length) | 0]; emit(t, payloads[(Math.random() * payloads.length) | 0]); }, 1800);
renderTopics();