const data = {
  users: [
    { id:1, name:'Alice', email:'alice@ex.com', role:'admin' },
    { id:2, name:'Bob', email:'bob@ex.com', role:'user' },
    { id:3, name:'Carol', email:'carol@ex.com', role:'user' }
  ],
  orders: [
    { id:101, user_id:1, total:59.99, status:'shipped' },
    { id:102, user_id:2, total:23.50, status:'pending' },
    { id:103, user_id:3, total:120.00, status:'delivered' }
  ]
};
const changes = [
  { table:'users', op:'UPDATE', key:2, field:'role', val:'moderator' },
  { table:'orders', op:'UPDATE', key:102, field:'status', val:'shipped' },
  { table:'users', op:'INSERT', row:{ id:4, name:'Dan', email:'dan@ex.com', role:'user' }},
  { table:'orders', op:'DELETE', key:101 },
  { table:'users', op:'UPDATE', key:1, field:'email', val:'alice@new.com' },
  { table:'orders', op:'INSERT', row:{ id:104, user_id:4, total:45.00, status:'pending' }},
];
let ci = 0, sel = document.getElementById('tableSelect'), logEl = document.getElementById('log');
Object.keys(data).forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });

function render(tableId, rows, diffs) {
  const el = document.getElementById(tableId);
  if (!rows.length) { el.innerHTML = '<tr><td>Empty</td></tr>'; return; }
  const cols = Object.keys(rows[0]);
  el.innerHTML = '<tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr>' +
    rows.map(r => {
      const d = diffs && diffs.find(x => x.id === r.id);
      const cls = d ? d.type : '';
      return `<tr class="${cls}">` + cols.map(c => `<td class="${d && d.field === c ? 'diff' : ''}">${r[c]}</td>`).join('') + '</tr>';
    }).join('');
}

function show() {
  const t = sel.value, rows = data[t];
  render('before', rows, null); render('after', rows, null);
  document.getElementById('counter').textContent = `${ci}/${changes.length} applied`;
}

document.getElementById('applyBtn').onclick = function() {
  if (ci >= changes.length) return;
  const c = changes[ci++];
  sel.value = c.table;
  const rows = data[c.table], before = rows.map(r => ({...r}));
  let diffInfo = null;
  if (c.op === 'UPDATE') {
    const r = rows.find(r => r.id === c.key);
    if (r) { r[c.field] = c.val; diffInfo = { id: c.key, type:'changed', field: c.field }; }
  } else if (c.op === 'INSERT') {
    rows.push({...c.row}); diffInfo = { id: c.row.id, type:'added' };
  } else if (c.op === 'DELETE') {
    const idx = rows.findIndex(r => r.id === c.key);
    const rm = rows[idx]; diffInfo = { id: c.key, type:'removed' };
    render('before', before, [diffInfo]);
    rows.splice(idx, 1); render('after', rows, null);
    addLog(c); document.getElementById('counter').textContent = `${ci}/${changes.length} applied`; return;
  }
  render('before', before, null); render('after', rows, diffInfo ? [diffInfo] : null);
  addLog(c); document.getElementById('counter').textContent = `${ci}/${changes.length} applied`;
};

function addLog(c) {
  const cls = c.op === 'INSERT' ? 'op-i' : c.op === 'UPDATE' ? 'op-u' : 'op-d';
  const msg = c.op === 'UPDATE' ? `${c.table}.${c.key}: ${c.field} → ${c.val}` : c.op === 'INSERT' ? `${c.table}: +row id=${c.row.id}` : `${c.table}: -row id=${c.key}`;
  logEl.innerHTML = `<div class="${cls}">[${c.op}] ${msg}</div>` + logEl.innerHTML;
}

sel.onchange = show; show();