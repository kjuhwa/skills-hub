const schemas = {
  "v1": {
    "GET /users": { id: "int", name: "string", email: "string" },
    "POST /users": { name: "string", email: "string" },
    "GET /orders": { id: "int", total: "float" }
  },
  "v2": {
    "GET /users": { id: "uuid", name: "string", email: "string", created_at: "timestamp" },
    "POST /users": { name: "string", email: "string", password: "string" },
    "GET /orders": { id: "uuid", total_cents: "int", currency: "string" },
    "DELETE /users/:id": { confirm: "boolean" }
  },
  "v3": {
    "GET /users": { id: "uuid", profile: { name: "string", email: "string" }, created_at: "timestamp" },
    "POST /users": { profile: { name: "string", email: "string" }, credentials: { password: "string" } },
    "GET /orders": { id: "uuid", amount: { value: "int", currency: "string" } },
    "DELETE /users/:id": { confirm: "boolean", reason: "string" },
    "GET /analytics": { metric: "string", range: "string" }
  }
};

const fromSel = document.getElementById("from");
const toSel = document.getElementById("to");
Object.keys(schemas).forEach(v => {
  fromSel.innerHTML += `<option value="${v}">${v}</option>`;
  toSel.innerHTML += `<option value="${v}">${v}</option>`;
});
fromSel.value = "v1";
toSel.value = "v2";

function renderSchema(schema, other, direction) {
  const lines = [];
  const endpoints = new Set([...Object.keys(schema), ...Object.keys(other)]);
  [...endpoints].sort().forEach(ep => {
    const s = schema[ep], o = other[ep];
    if (!s) return;
    let cls = "";
    if (!o) cls = direction === "from" ? "line-removed" : "line-added";
    else if (JSON.stringify(s) !== JSON.stringify(o)) cls = "line-modified";
    lines.push(`<span class="${cls}">${ep}\n${JSON.stringify(s, null, 2).split("\n").map(l => "  " + l).join("\n")}</span>`);
  });
  return lines.join("\n\n");
}

function update() {
  const a = schemas[fromSel.value], b = schemas[toSel.value];
  document.getElementById("from-label").textContent = `Schema ${fromSel.value}`;
  document.getElementById("to-label").textContent = `Schema ${toSel.value}`;
  document.getElementById("from-code").innerHTML = renderSchema(a, b, "from");
  document.getElementById("to-code").innerHTML = renderSchema(b, a, "to");

  let added = 0, removed = 0, modified = 0;
  const all = new Set([...Object.keys(a), ...Object.keys(b)]);
  all.forEach(ep => {
    if (!a[ep]) added++;
    else if (!b[ep]) removed++;
    else if (JSON.stringify(a[ep]) !== JSON.stringify(b[ep])) modified++;
  });
  document.getElementById("summary").innerHTML = `
    <div class="stat added"><span class="n">+${added}</span><span class="l">Added</span></div>
    <div class="stat removed"><span class="n">-${removed}</span><span class="l">Removed</span></div>
    <div class="stat modified"><span class="n">~${modified}</span><span class="l">Modified</span></div>
  `;
}
fromSel.onchange = toSel.onchange = update;
update();