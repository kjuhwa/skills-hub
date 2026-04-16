const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const W = 700, H = 260, MAX = 60;
const cmdData = [], qryData = [];
let cmdAvg = 0, qryAvg = 0;

function addPoint() {
  const cmd = 20 + Math.random() * 40 + (Math.random() > 0.9 ? 60 : 0);
  const qry = 3 + Math.random() * 12;
  cmdData.push(cmd); qryData.push(qry);
  if (cmdData.length > MAX) { cmdData.shift(); qryData.shift(); }
  cmdAvg = cmdData.reduce((a, b) => a + b, 0) / cmdData.length;
  qryAvg = qryData.reduce((a, b) => a + b, 0) / qryData.length;
}

function drawLine(data, color) {
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
  data.forEach((v, i) => {
    const x = (i / (MAX - 1)) * W;
    const y = H - (v / 120) * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#1a1d2700';
  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * H;
    ctx.strokeStyle = '#ffffff08'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.font = '10px sans-serif'; ctx.fillText(Math.round(120 - (i / 4) * 120) + 'ms', 2, y + 12);
  }
  drawLine(cmdData, '#f97316');
  drawLine(qryData, '#6ee7b7');
  document.getElementById('metrics').innerHTML =
    `<div class="metric"><b>${cmdAvg.toFixed(1)}ms</b>Cmd avg</div>
     <div class="metric"><b>${qryAvg.toFixed(1)}ms</b>Qry avg</div>
     <div class="metric"><b>${(cmdAvg / Math.max(qryAvg, 1)).toFixed(1)}x</b>Ratio</div>`;
}

for (let i = 0; i < MAX; i++) addPoint();
draw();
setInterval(() => { addPoint(); draw(); }, 800);