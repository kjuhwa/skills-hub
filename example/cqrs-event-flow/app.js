const canvas = document.getElementById('flow-canvas');
const ctx = canvas.getContext('2d');
const particles = [];
const readModel = { orders: 0, stock: 50, cancelled: 0 };

function sendCommand(type) {
  const log = document.getElementById('command-log');
  const ts = new Date().toLocaleTimeString();
  log.innerHTML = `<div class="log-entry">${ts} → ${type}</div>` + log.innerHTML;
  if (type === 'CreateOrder') { readModel.orders++; readModel.stock = Math.max(0, readModel.stock - 1); }
  else if (type === 'UpdateStock') { readModel.stock += 5; }
  else if (type === 'CancelOrder' && readModel.orders > 0) { readModel.orders--; readModel.cancelled++; readModel.stock++; }
  for (let i = 0; i < 3; i++) particles.push({ x: 10, y: 50 + Math.random() * 300, vx: 1.5 + Math.random(), life: 80, type });
  updateReadModel();
}

function updateReadModel() {
  document.getElementById('read-model').innerHTML =
    `<div class="read-row">📦 Orders: ${readModel.orders}</div>
     <div class="read-row">📊 Stock: ${readModel.stock}</div>
     <div class="read-row">❌ Cancelled: ${readModel.cancelled}</div>`;
}

function animate() {
  ctx.clearRect(0, 0, 200, 400);
  ctx.strokeStyle = '#1a1d27'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(100, 400); ctx.stroke();
  ctx.fillStyle = '#6ee7b744'; ctx.font = '11px sans-serif'; ctx.fillText('Event Bus', 72, 20);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.life--;
    const alpha = p.life / 80;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(110,231,183,${alpha})`; ctx.fill();
    if (p.life <= 0) particles.splice(i, 1);
  }
  requestAnimationFrame(animate);
}
updateReadModel();
sendCommand('CreateOrder'); sendCommand('UpdateStock');
animate();