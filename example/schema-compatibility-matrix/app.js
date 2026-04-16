const subjects = ["user-events","order-created","payment-processed","inventory-update","notification-sent","audit-log"];
const versions = ["v1","v2","v3","v4","v5"];
const statusColors = {"PASS":"#6ee7b7","WARN":"#f5a623","FAIL":"#f47067"};

function genStatus() {
  const r = Math.random();
  return r < 0.6 ? "PASS" : r < 0.85 ? "WARN" : "FAIL";
}

const data = {};
subjects.forEach(s => {
  data[s] = {};
  const maxV = 2 + Math.floor(Math.random() * 4);
  versions.forEach((v, i) => {
    data[s][v] = i < maxV ? genStatus() : null;
  });
});

const matrix = document.getElementById("matrix");
const info = document.getElementById("info");
matrix.style.setProperty("--cols", versions.length);

const corner = document.createElement("div");
corner.className = "cell header";
matrix.appendChild(corner);
versions.forEach(v => {
  const c = document.createElement("div");
  c.className = "cell header";
  c.textContent = v;
  matrix.appendChild(c);
});

subjects.forEach(subj => {
  const label = document.createElement("div");
  label.className = "cell row-label";
  label.textContent = subj;
  matrix.appendChild(label);

  versions.forEach(v => {
    const c = document.createElement("div");
    const st = data[subj][v];
    if (st) {
      c.className = "cell compat";
      c.textContent = st;
      c.style.background = statusColors[st];
      c.onmouseenter = () => {
        const msgs = {
          PASS: "Fully compatible — safe to evolve.",
          WARN: "Partially compatible — review field changes.",
          FAIL: "Breaking change detected — consumers may fail."
        };
        info.innerHTML = `<strong>${subj}</strong> @ ${v}: ${st}<br>${msgs[st]}`;
      };
    } else {
      c.className = "cell";
      c.style.background = "#15171f";
      c.textContent = "—";
      c.style.color = "#333";
    }
    matrix.appendChild(c);
  });
});

info.innerHTML = `Hover a cell to inspect compatibility.<div class="legend">
  <span><i style="background:#6ee7b7"></i>Pass</span>
  <span><i style="background:#f5a623"></i>Warn</span>
  <span><i style="background:#f47067"></i>Fail</span>
</div>`;