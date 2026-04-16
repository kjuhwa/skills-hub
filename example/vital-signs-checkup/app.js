const checks = [
  { id: "sleep", label: "Hours of sleep last night", type: "slider", min: 0, max: 12, val: 6, scoreFn: v => Math.max(0, 100 - Math.abs(v - 8) * 15) },
  { id: "water", label: "Glasses of water today", type: "slider", min: 0, max: 16, val: 3, scoreFn: v => Math.min(100, (v / 8) * 100) },
  { id: "mood", label: "How do you feel right now?", type: "opts", opts: ["Terrible","Low","Okay","Good","Great"], val: 2, scoreFn: v => (v / 4) * 100 },
  { id: "energy", label: "Physical energy level", type: "opts", opts: ["Drained","Tired","Fine","Energetic","Pumped"], val: 2, scoreFn: v => (v / 4) * 100 },
  { id: "exercise", label: "Minutes of movement today", type: "slider", min: 0, max: 120, val: 15, scoreFn: v => Math.min(100, (v / 30) * 100) },
  { id: "stress", label: "Stress level", type: "opts", opts: ["None","Low","Some","High","Severe"], val: 2, scoreFn: v => 100 - (v / 4) * 100 },
];

const qC = document.getElementById("questions");
checks.forEach(c => {
  const d = document.createElement("div");
  d.className = "q";
  if (c.type === "slider") {
    d.innerHTML = `<h3>${c.label}<span class="sval" id="v-${c.id}">${c.val}</span></h3>
      <input type="range" min="${c.min}" max="${c.max}" value="${c.val}" class="slider" data-id="${c.id}">`;
  } else {
    d.innerHTML = `<h3>${c.label}</h3><div class="opts">${c.opts.map((o, i) =>
      `<div class="opt ${i === c.val ? "active" : ""}" data-id="${c.id}" data-i="${i}">${o}</div>`).join("")}</div>`;
  }
  qC.appendChild(d);
});

qC.addEventListener("input", e => {
  if (e.target.classList.contains("slider")) {
    const c = checks.find(x => x.id === e.target.dataset.id);
    c.val = +e.target.value;
    document.getElementById("v-" + c.id).textContent = c.val;
    render();
  }
});
qC.addEventListener("click", e => {
  if (e.target.classList.contains("opt")) {
    const c = checks.find(x => x.id === e.target.dataset.id);
    c.val = +e.target.dataset.i;
    qC.querySelectorAll(`.opt[data-id="${c.id}"]`).forEach((o, i) => o.classList.toggle("active", i === c.val));
    render();
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  checks.forEach(c => c.val = c.type === "slider" ? Math.floor((c.max + c.min) / 2) : 2);
  qC.innerHTML = ""; buildQ(); render();
});
function buildQ() {
  checks.forEach(c => {
    const d = document.createElement("div"); d.className = "q";
    if (c.type === "slider") d.innerHTML = `<h3>${c.label}<span class="sval" id="v-${c.id}">${c.val}</span></h3><input type="range" min="${c.min}" max="${c.max}" value="${c.val}" class="slider" data-id="${c.id}">`;
    else d.innerHTML = `<h3>${c.label}</h3><div class="opts">${c.opts.map((o, i) => `<div class="opt ${i === c.val ? "active" : ""}" data-id="${c.id}" data-i="${i}">${o}</div>`).join("")}</div>`;
    qC.appendChild(d);
  });
}

function render() {
  const scores = checks.map(c => ({ id: c.id, label: c.label, score: c.scoreFn(c.val) }));
  const total = Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length);
  const arc = document.getElementById("arc");
  const circ = 502;
  arc.setAttribute("stroke-dashoffset", circ - (total / 100) * circ);
  arc.setAttribute("stroke", total > 70 ? "#6ee7b7" : total > 40 ? "#fbbf24" : "#f87171");
  document.getElementById("scoreT").textContent = total;
  document.getElementById("labelT").textContent = total > 80 ? "Thriving" : total > 60 ? "Healthy" : total > 40 ? "Needs Care" : "At Risk";
  document.getElementById("breakdown").innerHTML = scores.map(s =>
    `<div class="row ${s.score < 40 ? "low" : s.score < 70 ? "mid" : ""}"><span>${s.label}</span><span>${Math.round(s.score)}</span></div>`).join("");
}
render();