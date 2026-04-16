const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.min(window.innerWidth - 40, 900);
canvas.height = 420;

const servers = [
  { name: 'srv-1', x: 680, y: 60, conns: 0, health: 1, color: '#6ee7b7' },
  { name: 'srv-2', x: 680, y: 150, conns: 0, health: 1, color: '#6ee7b7' },
  { name: 'srv-3', x: 680, y: 240, conns: 0, health: 0.8, color: '#fbbf24' },
  { name: 'srv-4', x: 680, y: 330, conns: 0, health: 1, color: '#6ee7b7' }
];
const lb = { x: 340, y: 195 };
const packets = [];
let rrIndex = 0;

function pick() {
  const algo = document.getElementById('algoSelect').value;
  const alive = servers.filter(s => s.health > 0.3);
  if (algo === 'round-robin') { rrIndex = (rrIndex + 1) % alive.length; return alive[rrIndex]; }
  if (algo === 'least-conn') return alive.reduce((a, b) => a.conns <= b.conns ? a : b);
  return alive[Math.floor(Math.random() * alive.length)];
}

function send() {
  const target = pick();
  target.conns++;
  packets.push({ x: 60, y: 195, phase: 0, target, t: 0, alpha: 1 });
}

document.getElementById('sendBtn').onclick = send;
document.getElementById('burstBtn').onclick = () => { for (let i = 0; i < 10; i++) setTimeout(send, i * 80); };

function drawNode(x, y, r, label, col, conns) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = col + '22'; ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#e2e8f0'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 4);
  if (conns !== undefined) { ctx.fillStyle = col; ctx.fillText(conns + ' conn', x, y + 20); }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawNode(60, 195, 28, 'Client', '#818cf8');
  drawNode(lb.x, lb.y, 32, 'LB', '#6ee7b7');
  servers.forEach(s => drawNode(s.x, s.y, 26, s.name, s.color, s.conns));
  // dashed lines
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#ffffff11'; ctx.lineWidth = 1;
  servers.forEach(s => { ctx.beginPath(); ctx.moveTo(lb.x + 32, lb.y); ctx.lineTo(s.x - 26, s.y); ctx.stroke(); });
  ctx.setLineDash([]);
  // packets
  for (let i = packets.length - 1; i >= 0; i--) {
    const p = packets[i]; p.t += 0.018;
    if (p.phase === 0) {
      p.x = 60 + (lb.x - 60) * p.t; p.y = 195;
      if (p.t >= 1) { p.phase = 1; p.t = 0; }
    } else {
      p.x = lb.x + (p.target.x - lb.x) * p.t;
      p.y = lb.y + (p.target.y - lb.y) * p.t;
      if (p.t >= 1) { p.target.conns = Math.max(0, p.target.conns - 1); packets.splice(i, 1); continue; }
    }
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6ee7b7'; ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();
setInterval(send, 1200);