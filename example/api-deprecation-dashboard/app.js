const versionData = [
  { ver: "v3", pct: 64, status: "stable", cls: "green" },
  { ver: "v2", pct: 31, status: "sunset 2026-06", cls: "yellow" },
  { ver: "v1", pct: 5, status: "EOL 2025-12", cls: "red" }
];
const consumers = [
  { name: "Mobile App", v3: 92 }, { name: "Web Dashboard", v3: 78 },
  { name: "Partner SDK", v3: 45 }, { name: "Internal CLI", v3: 100 },
  { name: "Legacy Batch", v3: 12 }
];
const daily = [
  [320,180,40],[340,170,35],[360,160,30],[380,150,28],[400,140,25],[410,135,22],[430,125,20]
];
const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// Cards
document.getElementById("cards").innerHTML = versionData.map(v =>
  `<div class="card ${v.cls}"><div class="label">Traffic share</div><h2>${v.pct}%</h2>
   <div style="font-size:.9rem;color:#aaa">${v.ver}</div>
   <div class="badge">${v.status}</div></div>`).join("");

// Consumers
document.getElementById("consumers").innerHTML = consumers.map(c => {
  const color = c.v3 > 80 ? "#6ee7b7" : c.v3 > 50 ? "#facc15" : "#f87171";
  return `<div class="consumer"><span class="name">${c.name}</span>
    <div class="bar-bg"><div class="bar-fill" style="width:${c.v3}%;background:${color}"></div></div>
    <span class="pct" style="color:${color}">${c.v3}%</span></div>`;
}).join("");

// SVG stacked area chart
const svg = document.getElementById("chart");
const W = 800, H = 200, pad = 40, cw = W - pad * 2, ch = H - pad * 1.5;
const maxY = 550;
let paths = ["","",""];
const colors = ["#6ee7b7","#facc15","#f87171"];
daily.forEach((d, i) => {
  const x = pad + (i / 6) * cw;
  let cum = 0;
  d.forEach((val, vi) => {
    const y0 = H - pad - (cum / maxY) * ch;
    cum += val;
    const y1 = H - pad - (cum / maxY) * ch;
    paths[vi] += (i === 0 ? `M${x},${y0} L${x},${y1}` : ` L${x},${y1}`);
  });
});
// build filled areas
daily.forEach((d, i) => {
  const x = pad + (i / 6) * cw;
  let cum = 0;
  [0,1,2].forEach(vi => { cum += d[vi]; });
});
// simpler: bars
let svgHTML = "";
daily.forEach((d, i) => {
  const x = pad + i * (cw / 7) + 10, bw = cw / 7 - 20;
  let cum = 0;
  d.forEach((val, vi) => {
    const h = (val / maxY) * ch;
    const y = H - pad - cum - h;
    svgHTML += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${colors[vi]}" rx="3" opacity="0.85"/>`;
    cum += h;
  });
  svgHTML += `<text x="${x + bw/2}" y="${H - 10}" fill="#666" font-size="10" text-anchor="middle">${days[i]}</text>`;
});
svg.innerHTML = svgHTML;