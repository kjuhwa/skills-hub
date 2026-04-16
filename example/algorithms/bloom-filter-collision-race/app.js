const configs = [
  { m: 64,   k: 3 },
  { m: 256,  k: 4 },
  { m: 1024, k: 5 },
];
const lanes = [...document.querySelectorAll('.lane')].map((el, i) => {
  const canvas = el.querySelector('canvas');
  return {
    el, canvas, ctx: canvas.getContext('2d'),
    bits: new Uint8Array(configs[i].m),
    inserted: new Set(),
    tested: 0, falsePositives: 0,
    m: configs[i].m, k: configs[i].k,
    readout: el.querySelector('.readout'),
  };
});

function hash(str, seed, m) {
  let h = seed * 2654435761;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return Math.abs(h) % m;
}
function insert(lane, token) {
  for (let i = 0; i < lane.k; i++) lane.bits[hash(token, i + 1, lane.m)] = 1;
  lane.inserted.add(token);
}
function query(lane, token) {
  for (let i = 0; i < lane.k; i++) if (!lane.bits[hash(token, i + 1, lane.m)]) return false;
  return true;
}

function randomToken() {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * 26)];
  return s;
}

function draw(lane) {
  const { ctx, canvas, bits, m } = lane;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const bw = W / m;
  for (let i = 0; i < m; i++) {
    if (bits[i]) {
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(i * bw, 0, Math.max(bw - 0.5, 1), H);
    }
  }
}

function updateReadout(lane) {
  const set = lane.bits.reduce((a, b) => a + b, 0);
  const fill = ((set / lane.m) * 100).toFixed(1);
  const fpr = lane.tested ? ((lane.falsePositives / lane.tested) * 100).toFixed(2) : '0.00';
  lane.readout.innerHTML = `
    <div>inserted<b>${lane.inserted.size}</b></div>
    <div>fill<b>${fill}%</b></div>
    <div>tested<b>${lane.tested}</b></div>
    <div>FP<b>${fpr}%</b></div>`;
}

let running = false, speed = 10;
const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const summary = document.getElementById('summary');

function tick() {
  if (!running) return;
  for (let step = 0; step < speed; step++) {
    const token = randomToken();
    lanes.forEach(lane => {
      if (Math.random() < 0.5) {
        insert(lane, token);
      } else {
        lane.tested++;
        const predicted = query(lane, token);
        const actual = lane.inserted.has(token);
        if (predicted && !actual) lane.falsePositives++;
      }
    });
  }
  lanes.forEach(l => { draw(l); updateReadout(l); });
  checkRace();
  requestAnimationFrame(tick);
}

function checkRace() {
  const fills = lanes.map(l => l.bits.reduce((a, b) => a + b, 0) / l.m);
  const maxFill = Math.max(...fills);
  if (maxFill >= 0.95) {
    running = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    lanes.forEach((l, i) => {
      l.el.classList.remove('winner', 'loser');
      if (fills[i] >= 0.95) l.el.classList.add('loser');
    });
    const best = lanes.reduce((a, b) => (a.tested && a.falsePositives / a.tested < b.falsePositives / (b.tested || 1)) ? a : b);
    best.el.classList.add('winner');
    const name = best.el.querySelector('h2').textContent;
    summary.innerHTML = `<strong>${name}</strong> filter wins — lowest false-positive rate under the same insert/test load.`;
  }
}

playBtn.onclick = () => {
  running = true;
  playBtn.disabled = true;
  pauseBtn.disabled = false;
  summary.textContent = 'Racing...';
  tick();
};
pauseBtn.onclick = () => {
  running = false;
  playBtn.disabled = false;
  pauseBtn.disabled = true;
};
resetBtn.onclick = () => {
  running = false;
  playBtn.disabled = false;
  pauseBtn.disabled = true;
  lanes.forEach(l => {
    l.bits.fill(0);
    l.inserted.clear();
    l.tested = 0; l.falsePositives = 0;
    l.el.classList.remove('winner', 'loser');
    draw(l); updateReadout(l);
  });
  summary.textContent = 'Press play to start the race.';
};
document.getElementById('speed').oninput = e => speed = +e.target.value;

lanes.forEach(l => { draw(l); updateReadout(l); });