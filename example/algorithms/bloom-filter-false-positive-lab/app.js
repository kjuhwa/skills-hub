const mIn = document.getElementById('m');
const kIn = document.getElementById('k');
const nIn = document.getElementById('n');
const svg = document.getElementById('chart');

function theoFpr(m, k, n) {
  return Math.pow(1 - Math.exp(-k * n / m), k);
}
function optimalK(m, n) {
  return Math.max(1, Math.round((m / n) * Math.log(2)));
}

function hash(seed, x) {
  let h = seed ^ x;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function simulate(m, k, n) {
  const bits = new Uint8Array(m);
  const seeds = Array.from({ length: k }, (_, i) => 2654435761 + i * 97);
  for (let i = 0; i < n; i++) {
    const v = (Math.random() * 2 ** 31) | 0;
    for (const s of seeds) bits[hash(s, v) % m] = 1;
  }
  const queries = 2000;
  let fp = 0;
  for (let q = 0; q < queries; q++) {
    const v = ((Math.random() + 0.5) * 2 ** 31 + 0xdeadbeef) | 0;
    let hit = true;
    for (const s of seeds) if (!bits[hash(s, v) % m]) { hit = false; break; }
    if (hit) fp++;
  }
  return fp / queries;
}

function render() {
  const m = +mIn.value, k = +kIn.value, n = +nIn.value;
  document.getElementById('mVal').textContent = m;
  document.getElementById('kVal').textContent = k;
  document.getElementById('nVal').textContent = n;

  const theo = theoFpr(m, k, n);
  const emp = simulate(m, k, n);
  document.getElementById('theoFpr').textContent = (theo * 100).toFixed(2) + '%';
  document.getElementById('empFpr').textContent = (emp * 100).toFixed(2) + '%';
  document.getElementById('optK').textContent = optimalK(m, n);
  document.getElementById('bpi').textContent = (m / n).toFixed(1);

  const W = 640, H = 280, pad = 32;
  const maxK = 12;
  const maxY = 1;
  svg.innerHTML = '';
  for (let i = 0; i <= 4; i++) {
    const y = pad + (H - 2 * pad) * (i / 4);
    svg.insertAdjacentHTML('beforeend',
      `<line x1="${pad}" x2="${W - pad}" y1="${y}" y2="${y}" stroke="#22262f" stroke-width="1"/>
       <text x="${pad - 6}" y="${y + 3}" fill="#8b93a7" font-size="10" text-anchor="end">${((1 - i / 4) * 100).toFixed(0)}%</text>`);
  }
  let path = '';
  for (let kk = 1; kk <= maxK; kk++) {
    const y = pad + (H - 2 * pad) * (1 - theoFpr(m, kk, n) / maxY);
    const x = pad + (W - 2 * pad) * ((kk - 1) / (maxK - 1));
    path += (kk === 1 ? 'M' : 'L') + x + ',' + y + ' ';
    svg.insertAdjacentHTML('beforeend',
      `<text x="${x}" y="${H - 10}" fill="#8b93a7" font-size="10" text-anchor="middle">${kk}</text>`);
  }
  svg.insertAdjacentHTML('beforeend', `<path d="${path}" fill="none" stroke="#f87171" stroke-width="2"/>`);

  const cx = pad + (W - 2 * pad) * ((k - 1) / (maxK - 1));
  const cy = pad + (H - 2 * pad) * (1 - theo / maxY);
  svg.insertAdjacentHTML('beforeend',
    `<circle cx="${cx}" cy="${cy}" r="6" fill="#6ee7b7"/>
     <line x1="${cx}" x2="${cx}" y1="${cy}" y2="${H - pad}" stroke="#6ee7b7" stroke-dasharray="2,2" stroke-width="1"/>`);

  const barX = W - pad - 30;
  const barTop = pad + (H - 2 * pad) * (1 - emp / maxY);
  svg.insertAdjacentHTML('beforeend',
    `<rect x="${barX}" y="${barTop}" width="18" height="${H - pad - barTop}" fill="#6ee7b7" opacity="0.35"/>
     <text x="${barX + 9}" y="${barTop - 4}" fill="#6ee7b7" font-size="11" text-anchor="middle">sim</text>`);
}

[mIn, kIn, nIn].forEach(el => el.addEventListener('input', render));
render();