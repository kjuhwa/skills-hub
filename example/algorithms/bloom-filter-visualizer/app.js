const SIZE = 64, HASHES = 3;
let bits = new Uint8Array(SIZE), items = new Set();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const input = document.getElementById('input');
const status = document.getElementById('status');

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = 220 * devicePixelRatio;
  canvas.style.height = '220px';
  ctx.scale(devicePixelRatio, devicePixelRatio);
}
resize(); window.addEventListener('resize', () => { resize(); draw(); });

function hash(str, seed) {
  let h = seed;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % SIZE;
}
function getIndices(str) { return [hash(str,7),hash(str,13),hash(str,31)]; }

let highlights = [];
function draw() {
  const w = canvas.clientWidth, h = 220;
  ctx.clearRect(0,0,w,h);
  const cols = 16, rows = SIZE/cols, cellW = (w-40)/cols, cellH = 22, startX = 20, startY = 30;
  ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < SIZE; i++) {
    const col = i%cols, row = Math.floor(i/cols);
    const x = startX+col*cellW, y = startY+row*(cellH+6);
    const hl = highlights.includes(i);
    ctx.fillStyle = bits[i] ? (hl ? '#6ee7b7' : '#3b8268') : (hl ? '#4a3a20' : '#1e2233');
    ctx.strokeStyle = hl ? '#6ee7b7' : '#2d3348';
    ctx.lineWidth = hl ? 2 : 1;
    ctx.beginPath(); ctx.roundRect(x,y,cellW-4,cellH,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bits[i] ? '#0f1117' : '#556';
    ctx.fillText(bits[i], x+cellW/2-2, y+cellH/2);
  }
  ctx.fillStyle = '#6b7280'; ctx.font = '11px sans-serif';
  ctx.fillText(`${SIZE}-bit array  ·  ${HASHES} hash functions`, w/2, h-10);
}

function updateStats() {
  document.getElementById('countItems').textContent = items.size;
  const set = bits.reduce((a,b)=>a+b,0);
  document.getElementById('countBits').textContent = set;
  document.getElementById('fillRate').textContent = (set/SIZE*100).toFixed(1)+'%';
}

function addItem(val) {
  if(!val) return;
  const idx = getIndices(val);
  idx.forEach(i => bits[i]=1);
  items.add(val);
  highlights = idx;
  status.textContent = `Added "${val}" → bits [${idx.join(', ')}]`;
  status.style.color = '#6ee7b7';
  draw(); updateStats();
}

function checkItem(val) {
  if(!val) return;
  const idx = getIndices(val);
  const found = idx.every(i => bits[i]);
  highlights = idx;
  status.textContent = found
    ? `"${val}" → Probably in set (bits [${idx.join(',')}] all set)`
    : `"${val}" → Definitely NOT in set`;
  status.style.color = found ? '#fbbf24' : '#f87171';
  draw();
}

document.getElementById('addBtn').onclick = () => { addItem(input.value.trim()); input.value=''; };
document.getElementById('checkBtn').onclick = () => { checkItem(input.value.trim()); };
document.getElementById('resetBtn').onclick = () => { bits.fill(0); items.clear(); highlights=[]; status.textContent='Reset'; status.style.color='#e2e8f0'; draw(); updateStats(); };
input.addEventListener('keydown', e => { if(e.key==='Enter') { addItem(input.value.trim()); input.value=''; }});

['apple','banana','cherry','date','elderberry'].forEach(w => addItem(w));
highlights = [];
status.textContent = 'Try checking "fig" or "apple"';
status.style.color = '#e2e8f0';
draw();