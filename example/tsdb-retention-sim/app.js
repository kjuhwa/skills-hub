const $ = id => document.getElementById(id);
const canvas = $('canvas'), ctx = canvas.getContext('2d');
const inputs = { rate: $('rate'), raw: $('raw'), ds: $('ds'), dsRet: $('dsRet') };
const labels = { rate: $('rateVal'), raw: $('rawVal'), ds: $('dsVal'), dsRet: $('dsRetVal') };
const statsPanel = $('statsPanel');

Object.keys(inputs).forEach(k => inputs[k].oninput = () => { labels[k].textContent = inputs[k].value; simulate(); });
$('simBtn').onclick = simulate;

function fmt(bytes) {
  if (bytes > 1e12) return (bytes / 1e12).toFixed(1) + ' TB';
  if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return (bytes / 1e3).toFixed(1) + ' KB';
}

function simulate() {
  const rate = +inputs.rate.value, rawDays = +inputs.raw.value;
  const dsMin = +inputs.ds.value, dsRetDays = +inputs.dsRet.value;
  const bytesPerPt = 16;

  const rawPts = rate * 86400 * rawDays;
  const dsPts = (86400 / (dsMin * 60)) * dsRetDays;
  const rawSize = rawPts * bytesPerPt;
  const dsSize = dsPts * bytesPerPt;
  const totalSize = rawSize + dsSize;
  const ratio = rawPts > 0 ? (dsPts / rawPts * 100) : 0;

  const stats = [
    ['Raw Points', rawPts.toLocaleString()], ['DS Points', dsPts.toLocaleString()],
    ['Raw Storage', fmt(rawSize)], ['DS Storage', fmt(dsSize)],
    ['Total Storage', fmt(totalSize)], ['Compression', ratio.toFixed(2) + '%']
  ];
  statsPanel.innerHTML = stats.map(([l, v]) => `<div class="stat-card"><div class="v">${v}</div><div class="l">${l}</div></div>`).join('');

  drawTimeline(rawDays, dsRetDays, dsMin, rawSize, dsSize);
}

function drawTimeline(rawDays, dsRetDays, dsMin, rawSize, dsSize) {
  const dpr = devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth, H = canvas.clientHeight, pad = 50;
  ctx.clearRect(0, 0, W, H);

  const totalDays = Math.max(rawDays, dsRetDays);
  const barH = 40, gap = 20;
  const y1 = H / 2 - barH - gap / 2, y2 = H / 2 + gap / 2;
  const dayW = (W - pad * 2) / totalDays;

  // raw bar
  ctx.fillStyle = 'rgba(110,231,183,0.35)';
  ctx.fillRect(pad, y1, dayW * rawDays, barH);
  ctx.strokeStyle = '#6ee7b7'; ctx.lineWidth = 2;
  ctx.strokeRect(pad, y1, dayW * rawDays, barH);

  // ds bar
  ctx.fillStyle = 'rgba(110,231,183,0.12)';
  ctx.fillRect(pad, y2, dayW * dsRetDays, barH);
  ctx.strokeStyle = '#3b7a63'; ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, y2, dayW * dsRetDays, barH);

  ctx.font = '12px monospace'; ctx.fillStyle = '#c9d1d9';
  ctx.fillText(`Raw: ${rawDays}d — ${fmt(rawSize)}`, pad + 8, y1 + 25);
  ctx.fillText(`Downsampled (${dsMin}m): ${dsRetDays}d — ${fmt(dsSize)}`, pad + 8, y2 + 25);

  // axis
  ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 1;
  const axisY = y2 + barH + 25;
  ctx.beginPath(); ctx.moveTo(pad, axisY); ctx.lineTo(W - pad, axisY); ctx.stroke();
  ctx.fillStyle = '#8b949e'; ctx.font = '10px monospace';
  for (let d = 0; d <= totalDays; d += Math.max(1, Math.floor(totalDays / 10))) {
    const x = pad + d * dayW;
    ctx.beginPath(); ctx.moveTo(x, axisY - 4); ctx.lineTo(x, axisY + 4); ctx.stroke();
    ctx.fillText(d + 'd', x - 6, axisY + 16);
  }
}

window.addEventListener('resize', simulate);
simulate();