const services = [
  { name: "API Gateway", region: "us-east-1", history: [], baseline: 45 },
  { name: "Auth Service", region: "us-east-1", history: [], baseline: 28 },
  { name: "Payment Queue", region: "eu-west-1", history: [], baseline: 80 },
  { name: "Database Primary", region: "us-east-1", history: [], baseline: 12 },
  { name: "Search Cluster", region: "ap-south-1", history: [], baseline: 95 },
  { name: "Storage CDN", region: "global", history: [], baseline: 34 },
];
const logs = [];
const grid = document.getElementById("serviceGrid");

services.forEach((s, i) => {
  for (let j = 0; j < 30; j++) s.history.push(s.baseline + Math.random() * 20);
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h3>${s.name}</h3><div class="meta">${s.region}</div>
    <canvas width="260" height="50"></canvas>
    <div class="latency"><span>Latency: <b class="lat">—</b>ms</span><span class="status">Healthy</span></div>`;
  grid.appendChild(card);
  s.el = card;
});

function draw(s) {
  const c = s.el.querySelector("canvas").getContext("2d");
  const w = 260, h = 50;
  c.clearRect(0, 0, w, h);
  const max = Math.max(...s.history, s.baseline * 2);
  c.strokeStyle = s.state === "err" ? "#f87171" : s.state === "warn" ? "#fbbf24" : "#6ee7b7";
  c.lineWidth = 1.5;
  c.beginPath();
  s.history.forEach((v, i) => {
    const x = (i / (s.history.length - 1)) * w;
    const y = h - (v / max) * h;
    i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
  });
  c.stroke();
}

function tick() {
  let up = 0, deg = 0, down = 0;
  services.forEach(s => {
    const spike = Math.random() < 0.05 ? 200 : 0;
    const drop = Math.random() < 0.02;
    const v = drop ? 0 : s.baseline + Math.random() * 30 + spike;
    s.history.push(v);
    if (s.history.length > 30) s.history.shift();
    const last = v;
    const prev = s.state;
    s.state = drop ? "err" : last > s.baseline * 3 ? "warn" : "ok";
    s.el.className = "card" + (s.state !== "ok" ? " " + s.state : "");
    s.el.querySelector(".lat").textContent = drop ? "—" : Math.round(last);
    s.el.querySelector(".status").textContent = drop ? "Down" : s.state === "warn" ? "Degraded" : "Healthy";
    if (prev && prev !== s.state) {
      const msg = s.state === "err" ? `${s.name} went DOWN` : s.state === "warn" ? `${s.name} degraded` : `${s.name} recovered`;
      logs.unshift({ t: new Date().toLocaleTimeString(), msg, cls: s.state });
    }
    draw(s);
    if (s.state === "ok") up++; else if (s.state === "warn") deg++; else down++;
  });
  document.getElementById("upCount").textContent = up;
  document.getElementById("degCount").textContent = deg;
  document.getElementById("downCount").textContent = down;
  document.getElementById("uptime").textContent = ((up / services.length) * 100).toFixed(1) + "%";
  const logList = document.getElementById("logList");
  logList.innerHTML = logs.slice(0, 40).map(l => `<li class="${l.cls}"><span class="t">${l.t}</span>${l.msg}</li>`).join("");
}

services.forEach(draw);
tick();
setInterval(tick, 1200);