const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const log = document.getElementById('log');
canvas.width = Math.min(window.innerWidth - 20, 800);
canvas.height = 400;

const actors = [];
const messages = [];
let idCounter = 0;

function addActor(x, y, name) {
  actors.push({ id: idCounter++, x: x || 100 + Math.random() * (canvas.width - 200), y: y || 60 + Math.random() * 280, name: name || 'Actor-' + idCounter, mailbox: 0, r: 24 });
}
['Supervisor', 'Worker-A', 'Worker-B', 'Logger', 'Cache'].forEach((n, i) => addActor(100 + i * 150, 120 + (i % 2) * 160, n));

function sendMessage(from, to) {
  messages.push({ from, to, x: from.x, y: from.y, t: 0, label: ['ping', 'task', 'ack', 'data', 'log'][Math.random() * 5 | 0] });
  logMsg(`${from.name} → ${to.name}: ${messages[messages.length - 1].label}`);
}
function logMsg(txt) { const d = document.createElement('div'); d.textContent = `[${new Date().toLocaleTimeString()}] ${txt}`; log.prepend(d); if (log.children.length > 30) log.lastChild.remove(); }

document.getElementById('addActor').onclick = () => addActor();
document.getElementById('sendMsg').onclick = () => { if (actors.length < 2) return; const a = actors[Math.random() * actors.length | 0]; let b; do { b = actors[Math.random() * actors.length | 0]; } while (b === a); sendMessage(a, b); };
document.getElementById('broadcast').onclick = () => { const src = actors[0]; actors.slice(1).forEach(a => sendMessage(src, a)); };

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  actors.forEach(a => {
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1d27'; ctx.fill();
    ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#6ee7b7'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(a.name, a.x, a.y + 4);
    if (a.mailbox > 0) { ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(a.x + 18, a.y - 18, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.fillText(a.mailbox, a.x + 18, a.y - 15); }
  });
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]; m.t += 0.02;
    if (m.t >= 1) { m.to.mailbox++; setTimeout(() => m.to.mailbox = Math.max(0, m.to.mailbox - 1), 600); messages.splice(i, 1); continue; }
    const x = m.from.x + (m.to.x - m.from.x) * m.t;
    const y = m.from.y + (m.to.y - m.from.y) * m.t;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = '#6ee7b7'; ctx.fill();
    ctx.fillStyle = '#6ee7b7aa'; ctx.font = '9px sans-serif'; ctx.fillText(m.label, x, y - 10);
  }
  requestAnimationFrame(draw);
}
draw();
setInterval(() => { if (actors.length >= 2 && Math.random() > 0.5) document.getElementById('sendMsg').click(); }, 1200);