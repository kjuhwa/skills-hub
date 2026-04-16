const topicsMeta = [
  { name: 'user.signup', color: '#6ee7b7' },
  { name: 'order.created', color: '#60a5fa' },
  { name: 'payment.failed', color: '#f87171' },
  { name: 'inventory.low', color: '#fbbf24' }
];
const board = document.getElementById('board');
const pubTopic = document.getElementById('pubTopic');
const msgCount = document.getElementById('msgCount');
let total = 0;
const columns = {};

topicsMeta.forEach(t => {
  const col = document.createElement('div');
  col.className = 'topic-col';
  col.innerHTML = `<h2>${t.name} <span class="dot" style="background:${t.color}"></span></h2><div class="msgs"></div>`;
  board.appendChild(col);
  columns[t.name] = { el: col.querySelector('.msgs'), color: t.color };
  const opt = document.createElement('option');
  opt.value = t.name; opt.textContent = t.name;
  pubTopic.appendChild(opt);
});

function publish(topic, message) {
  const col = columns[topic];
  if (!col) return;
  const div = document.createElement('div');
  div.className = 'msg';
  div.style.setProperty('--tc', col.color);
  div.innerHTML = `${message}<div class="ts">${new Date().toLocaleTimeString()}</div>`;
  col.el.prepend(div);
  if (col.el.children.length > 20) col.el.lastChild.remove();
  total++;
  msgCount.textContent = total + ' msgs';
}

const mockMsgs = {
  'user.signup': ['New user: alice@test.com', 'New user: bob@dev.io', 'User verified: charlie'],
  'order.created': ['Order #1042 — $59.99', 'Order #1043 — $12.50', 'Bulk order #1044 — $340'],
  'payment.failed': ['Card declined: *4242', 'Insufficient funds: *1234', 'Expired card: *5678'],
  'inventory.low': ['Widget A: 3 left', 'Gadget B: 0 left!', 'Cable C: 5 remaining']
};

document.getElementById('btnSend').onclick = () => {
  const msg = document.getElementById('msgInput').value.trim();
  if (msg) { publish(pubTopic.value, msg); document.getElementById('msgInput').value = ''; }
};
document.getElementById('msgInput').onkeydown = e => { if (e.key === 'Enter') document.getElementById('btnSend').click(); };

setInterval(() => {
  const t = topicsMeta[Math.random() * topicsMeta.length | 0];
  const msgs = mockMsgs[t.name];
  publish(t.name, msgs[Math.random() * msgs.length | 0]);
}, 1800);