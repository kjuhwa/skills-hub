const functions = [
  { name: 'Math.abs(x)', fn: x => Math.abs(x), idempotent: true, start: -42 },
  { name: 'Math.floor(x)', fn: x => Math.floor(x), idempotent: true, start: 3.7 },
  { name: 'x.toUpperCase()', fn: x => String(x).toUpperCase(), idempotent: true, start: 'hello', isStr: true },
  { name: 'x + 1', fn: x => x + 1, idempotent: false, start: 0 },
  { name: 'x * 2', fn: x => x * 2, idempotent: false, start: 1 },
  { name: 'Math.max(x, 10)', fn: x => Math.max(x, 10), idempotent: true, start: 5 },
  { name: 'x % 7', fn: x => typeof x === 'number' ? x % 7 : 0, idempotent: false, start: 100 },
  { name: '[...new Set(x)]', fn: x => [...new Set(Array.isArray(x) ? x : [x])], idempotent: true, start: [3,1,2,1,3], isArr: true },
];
const grid = document.getElementById('grid');
functions.forEach((f, i) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h3>${f.idempotent ? '✅' : '❌'} ${f.idempotent ? 'Idempotent' : 'Non-idempotent'}</h3>
    <div class="fn">${f.name}</div><canvas id="c${i}" height="80"></canvas>
    <div class="val" id="v${i}">Start: ${JSON.stringify(f.start)}</div>
    <button id="b${i}">Apply f(x) →</button>`;
  grid.appendChild(card);
  const history = [f.isStr || f.isArr ? 0 : f.start];
  let current = f.start;
  let steps = 0;
  const canvas = card.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  function draw() {
    canvas.width = canvas.clientWidth * 2; canvas.height = 160;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (history.length < 2) return;
    const nums = history.map(Number);
    const mn = Math.min(...nums), mx = Math.max(...nums) || 1;
    const range = mx - mn || 1;
    ctx.beginPath(); ctx.strokeStyle = f.idempotent ? '#6ee7b7' : '#fb7185'; ctx.lineWidth = 2;
    nums.forEach((v, j) => {
      const x = (j / Math.max(nums.length - 1, 1)) * (canvas.width - 20) + 10;
      const y = canvas.height - 10 - ((v - mn) / range) * (canvas.height - 20);
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  card.querySelector('button').addEventListener('click', () => {
    current = f.fn(current);
    steps++;
    const numVal = f.isStr ? current.length : (f.isArr ? current.length : current);
    history.push(numVal);
    if (history.length > 30) history.shift();
    const stable = history.length > 2 && history.slice(-3).every(v => v === history[history.length - 1]);
    card.className = 'card ' + (stable ? 'stable' : 'unstable');
    document.getElementById(`v${i}`).textContent = `Step ${steps}: ${JSON.stringify(current)}`;
    draw();
  });
  // Auto-apply a few times on load
  setTimeout(() => { for (let k = 0; k < 3; k++) card.querySelector('button').click(); }, 200 + i * 150);
});