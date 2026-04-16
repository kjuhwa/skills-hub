const events = [
  { t: 0,  type: "CartCreated",   data: { cartId: "c-42", user: "ada" } },
  { t: 8,  type: "ItemAdded",     data: { sku: "book-01", qty: 1, price: 19 } },
  { t: 15, type: "ItemAdded",     data: { sku: "pen-03",  qty: 2, price: 3 } },
  { t: 24, type: "CouponApplied", data: { code: "SAVE10", pct: 10 } },
  { t: 33, type: "ItemRemoved",   data: { sku: "pen-03" } },
  { t: 44, type: "ItemAdded",     data: { sku: "mug-07",  qty: 1, price: 12 } },
  { t: 55, type: "AddressSet",    data: { city: "Seoul" } },
  { t: 68, type: "CheckoutStarted", data: { } },
  { t: 80, type: "PaymentCaptured", data: { amount: 27.9, method: "card" } },
  { t: 94, type: "OrderPlaced",   data: { orderId: "o-901" } }
];
const TOTAL_TIME = 100;

function fold(upto) {
  const state = { items: {}, coupon: null, address: null, status: "empty", total: 0 };
  for (let i = 0; i <= upto; i++) {
    const e = events[i]; if (!e) break;
    switch (e.type) {
      case "CartCreated":   state.status = "active"; state.cartId = e.data.cartId; state.user = e.data.user; break;
      case "ItemAdded":     state.items[e.data.sku] = { qty: e.data.qty, price: e.data.price }; break;
      case "ItemRemoved":   delete state.items[e.data.sku]; break;
      case "CouponApplied": state.coupon = e.data; break;
      case "AddressSet":    state.address = e.data.city; break;
      case "CheckoutStarted": state.status = "checkout"; break;
      case "PaymentCaptured": state.status = "paid"; state.paid = e.data.amount; break;
      case "OrderPlaced":   state.status = "placed"; state.orderId = e.data.orderId; break;
    }
  }
  let sub = 0;
  for (const k in state.items) sub += state.items[k].qty * state.items[k].price;
  state.total = state.coupon ? +(sub * (1 - state.coupon.pct / 100)).toFixed(2) : sub;
  return state;
}

const canvas = document.getElementById("timeline");
const ctx = canvas.getContext("2d");
const stateList = document.getElementById("state-list");
const eventDetail = document.getElementById("event-detail");
const position = document.getElementById("position");
const playBtn = document.getElementById("play");
const resetBtn = document.getElementById("reset");
const speedEl = document.getElementById("speed");

let cursor = 0;
let playing = false;

function drawTimeline() {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = "#0f1117"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#252a36"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, H/2); ctx.lineTo(W - 40, H/2); ctx.stroke();

  events.forEach((e, i) => {
    const x = 40 + (e.t / TOTAL_TIME) * (W - 80);
    const active = i <= cursor;
    ctx.fillStyle = active ? "#6ee7b7" : "#374151";
    ctx.beginPath(); ctx.arc(x, H/2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = active ? "#e5e7eb" : "#64748b";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(e.type, x, H/2 - 18);
    ctx.fillText("#" + i, x, H/2 + 28);
  });

  const cx = 40 + (events[cursor].t / TOTAL_TIME) * (W - 80);
  ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H - 10); ctx.stroke();
}

function renderState() {
  const s = fold(cursor);
  stateList.innerHTML = "";
  const rows = [
    ["status", s.status],
    ["user", s.user || "—"],
    ["items", Object.keys(s.items).join(", ") || "—"],
    ["coupon", s.coupon ? s.coupon.code + " -" + s.coupon.pct + "%" : "—"],
    ["address", s.address || "—"],
    ["total", "$" + s.total],
    ["orderId", s.orderId || "—"]
  ];
  rows.forEach(([k, v]) => {
    const li = document.createElement("li");
    li.textContent = k + ": " + v;
    stateList.appendChild(li);
  });
  eventDetail.textContent = JSON.stringify(events[cursor], null, 2);
  position.textContent = "Event " + (cursor + 1) + " / " + events.length;
}

function setCursor(i) {
  cursor = Math.max(0, Math.min(events.length - 1, i));
  drawTimeline(); renderState();
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  let best = 0, bestD = Infinity;
  events.forEach((ev, i) => {
    const ex = 40 + (ev.t / TOTAL_TIME) * (canvas.width - 80);
    const d = Math.abs(ex - x);
    if (d < bestD) { bestD = d; best = i; }
  });
  playing = false; playBtn.textContent = "▶ Play";
  setCursor(best);
});

playBtn.addEventListener("click", () => {
  playing = !playing;
  playBtn.textContent = playing ? "⏸ Pause" : "▶ Play";
  if (playing && cursor === events.length - 1) cursor = 0;
  tick();
});
resetBtn.addEventListener("click", () => { playing = false; playBtn.textContent = "▶ Play"; setCursor(0); });

let last = 0;
function tick(ts) {
  if (!playing) return;
  if (!last) last = ts || performance.now();
  const now = ts || performance.now();
  const interval = 1100 - speedEl.value * 100;
  if (now - last > interval) {
    last = now;
    if (cursor < events.length - 1) setCursor(cursor + 1);
    else { playing = false; playBtn.textContent = "▶ Play"; return; }
  }
  requestAnimationFrame(tick);
}

setCursor(0);