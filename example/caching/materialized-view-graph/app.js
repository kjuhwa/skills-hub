const nodes = [
  { id: "orders", type: "table", x: 120, y: 100 },
  { id: "customers", type: "table", x: 120, y: 240 },
  { id: "products", type: "table", x: 120, y: 380 },
  { id: "mv_daily_sales", type: "view", x: 380, y: 100, stale: 0 },
  { id: "mv_top_customers", type: "view", x: 380, y: 240, stale: 0 },
  { id: "mv_product_rank", type: "view", x: 380, y: 380, stale: 0 },
  { id: "mv_revenue_dashboard", type: "view", x: 640, y: 170, stale: 0 },
  { id: "mv_executive_summary", type: "view", x: 640, y: 340, stale: 0 },
];
const edges = [
  ["orders", "mv_daily_sales"], ["orders", "mv_top_customers"],
  ["customers", "mv_top_customers"], ["products", "mv_product_rank"],
  ["orders", "mv_product_rank"], ["mv_daily_sales", "mv_revenue_dashboard"],
  ["mv_top_customers", "mv_revenue_dashboard"], ["mv_product_rank", "mv_executive_summary"],
  ["mv_revenue_dashboard", "mv_executive_summary"],
];

const svg = document.getElementById("graph");
const SVG_NS = "http://www.w3.org/2000/svg";

function getNode(id) { return nodes.find(n => n.id === id); }

function render() {
  svg.innerHTML = "";
  for (const [from, to] of edges) {
    const a = getNode(from), b = getNode(to);
    const line = document.createElementNS(SVG_NS, "path");
    const cx = (a.x + b.x) / 2;
    line.setAttribute("d", `M${a.x + 50} ${a.y} C${cx} ${a.y}, ${cx} ${b.y}, ${b.x - 50} ${b.y}`);
    line.setAttribute("class", "edge");
    line.dataset.from = from; line.dataset.to = to;
    svg.appendChild(line);
  }
  for (const n of nodes) {
    const g = document.createElementNS(SVG_NS, "g");
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", n.x); c.setAttribute("cy", n.y);
    const baseR = n.type === "table" ? 24 : 30;
    c.setAttribute("r", baseR);
    c.style.setProperty("--base", baseR + "px");
    const stale = n.stale || 0;
    const color = n.type === "table" ? "#60a5fa" : (stale > 0 ? "#f59e0b" : "#6ee7b7");
    c.setAttribute("fill", color + "33");
    c.setAttribute("stroke", color);
    c.setAttribute("stroke-width", stale > 2 ? 3 : 2);
    c.setAttribute("class", "node-circle");
    c.dataset.id = n.id;
    c.onclick = () => onClick(n.id);
    g.appendChild(c);
    const t = document.createElementNS(SVG_NS, "text");
    t.setAttribute("x", n.x); t.setAttribute("y", n.y + 4);
    t.setAttribute("class", "node-label");
    t.textContent = n.id;
    g.appendChild(t);
    svg.appendChild(g);
  }
}

function log(msg, cls = "") {
  const li = document.createElement("li");
  li.className = cls;
  li.textContent = `${new Date().toLocaleTimeString()} ${msg}`;
  const ul = document.getElementById("log");
  ul.insertBefore(li, ul.firstChild);
  while (ul.children.length > 20) ul.removeChild(ul.lastChild);
}

function showInfo(id) {
  const n = getNode(id);
  const deps = edges.filter(e => e[1] === id).map(e => e[0]);
  const dependents = edges.filter(e => e[0] === id).map(e => e[1]);
  document.getElementById("info").innerHTML = `
    <div><span class="label">name:</span> ${n.id}</div>
    <div><span class="label">type:</span> ${n.type === "table" ? "base table" : "materialized view"}</div>
    <div><span class="label">depends on:</span> ${deps.join(", ") || "—"}</div>
    <div><span class="label">feeds:</span> ${dependents.join(", ") || "—"}</div>
    <div><span class="label">stale count:</span> ${n.stale || 0}</div>`;
}

async function refreshCascade(id) {
  const n = getNode(id);
  if (n.type === "view") {
    n.stale = 0;
    log(`REFRESH ${n.id}`, "fresh");
  } else {
    log(`DML on ${n.id} — invalidating dependents`);
  }
  const circle = svg.querySelector(`[data-id="${id}"]`);
  if (circle) {
    circle.classList.remove("pulse");
    void circle.offsetWidth;
    circle.classList.add("pulse");
  }
  const downstream = edges.filter(e => e[0] === id).map(e => e[1]);
  for (const d of downstream) {
    const edge = svg.querySelector(`[data-from="${id}"][data-to="${d}"]`);
    if (edge) { edge.classList.add("active"); setTimeout(() => edge.classList.remove("active"), 800); }
    const target = getNode(d);
    target.stale = (target.stale || 0) + 1;
    await new Promise(r => setTimeout(r, 400));
    render();
  }
  render();
}

function onClick(id) {
  showInfo(id);
  refreshCascade(id);
}

render();
setInterval(() => {
  const tables = nodes.filter(n => n.type === "table");
  const t = tables[Math.floor(Math.random() * tables.length)];
  refreshCascade(t.id);
}, 5000);