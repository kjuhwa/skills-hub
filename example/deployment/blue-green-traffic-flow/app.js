const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('slider');
let greenPct = 0, particles = [];

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = 60;
    this.y = 210;
    this.speed = 1.5 + Math.random() * 1.5;
    this.phase = 0; // 0=moving right to split, 1=going to target, 2=at server
    this.isGreen = Math.random() * 100 < greenPct;
    this.targetY = this.isGreen ? 330 : 90;
    this.alpha = 1;
    this.done = false;
  }
  update() {
    if (this.phase === 0) {
      this.x += this.speed * 2;
      if (this.x >= 350) { this.phase = 1; }
    } else if (this.phase === 1) {
      this.x += this.speed * 1.5;
      this.y += (this.targetY - this.y) * 0.08;
      if (this.x >= 680) { this.phase = 2; this.timer = 30; }
    } else {
      this.timer--;
      this.alpha = this.timer / 30;
      if (this.timer <= 0) this.done = true;
    }
  }
  draw() {
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = this.isGreen ? '#6ee7b7' : '#60a5fa';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

let blueCount = 0, greenCount = 0, frame = 0;
function drawStatic() {
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, 800, 420);
  // Users
  ctx.fillStyle = '#334155';
  ctx.fillRect(20, 190, 40, 40);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Users', 40, 250);
  // LB
  ctx.fillStyle = '#334155';
  ctx.beginPath(); ctx.arc(350, 210, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText('LB', 350, 214);
  // Blue server
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(680, 65, 80, 50);
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('Blue', 720, 95);
  // Green server
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(680, 305, 80, 50);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText('Green', 720, 335);
  // Lines
  ctx.strokeStyle = '#252a36';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(60, 210); ctx.lineTo(350, 210); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(350, 210); ctx.lineTo(680, 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(350, 210); ctx.lineTo(680, 330); ctx.stroke();
  ctx.setLineDash([]);
}

function loop() {
  greenPct = +slider.value;
  document.getElementById('pctLabel').textContent =
    greenPct === 0 ? '100% Blue' : greenPct === 100 ? '100% Green' : `${100 - greenPct}% Blue / ${greenPct}% Green`;
  frame++;
  if (frame % 6 === 0) particles.push(new Particle());
  drawStatic();
  blueCount = 0; greenCount = 0;
  particles.forEach(p => { p.update(); p.draw(); p.isGreen ? greenCount++ : blueCount++; });
  particles = particles.filter(p => !p.done);
  document.getElementById('blueReq').textContent = Math.round(blueCount * 2.5);
  document.getElementById('greenReq').textContent = Math.round(greenCount * 2.5);
  requestAnimationFrame(loop);
}
loop();