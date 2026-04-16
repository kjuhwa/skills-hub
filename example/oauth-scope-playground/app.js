const SCOPES = ['read:user','write:user','read:data','write:data','admin','delete'];
const ENDPOINTS = [
  { method:'GET', path:'/api/me', needs:['read:user'] },
  { method:'PUT', path:'/api/me', needs:['write:user'] },
  { method:'GET', path:'/api/data', needs:['read:data'] },
  { method:'POST', path:'/api/data', needs:['write:data'] },
  { method:'DELETE', path:'/api/data/:id', needs:['delete','write:data'] },
  { method:'GET', path:'/api/users', needs:['admin'] },
  { method:'POST', path:'/api/users/invite', needs:['admin','write:user'] },
  { method:'GET', path:'/api/audit-log', needs:['admin','read:data'] },
];
let active = new Set(['read:user','read:data']);
const scopeEl = document.getElementById('scopes');
const epEl = document.getElementById('endpoints');
function render() {
  scopeEl.innerHTML = '<h2 style="color:#6ee7b7;margin-bottom:10px;font-size:.85rem">Scopes</h2>';
  SCOPES.forEach(s => {
    const d = document.createElement('span');
    d.className = 'scope-btn ' + (active.has(s) ? 'on' : 'off');
    d.textContent = s;
    d.onclick = () => { active.has(s) ? active.delete(s) : active.add(s); render(); };
    scopeEl.appendChild(d);
  });
  epEl.innerHTML = '<h2 style="color:#6ee7b7;margin-bottom:10px;font-size:.85rem">Endpoints</h2>';
  ENDPOINTS.forEach(ep => {
    const ok = ep.needs.every(n => active.has(n));
    const d = document.createElement('div');
    d.className = 'ep ' + (ok ? 'ok' : 'denied');
    d.innerHTML = `<span><span class="method">${ep.method}</span> ${ep.path}</span><span class="lock">${ok ? '✓ allowed' : '✗ ' + ep.needs.filter(n=>!active.has(n)).join(', ')}</span>`;
    epEl.appendChild(d);
  });
  drawViz();
}
function drawViz() {
  const svg = document.getElementById('viz');
  const total = ENDPOINTS.length;
  const allowed = ENDPOINTS.filter(e => e.needs.every(n => active.has(n))).length;
  const pct = total ? (allowed / total * 100).toFixed(0) : 0;
  svg.innerHTML = `
    <rect x="0" y="0" width="100%" height="160" rx="10" fill="#1a1d27"/>
    <text x="50%" y="30" text-anchor="middle" fill="#8b949e" font-size="13">Access Coverage</text>
    <rect x="60" y="50" width="780" height="30" rx="8" fill="#0f1117"/>
    <rect x="60" y="50" width="${780*pct/100}" height="30" rx="8" fill="#6ee7b7" opacity="0.7">
      <animate attributeName="width" from="0" to="${780*pct/100}" dur="0.4s"/>
    </rect>
    <text x="450" y="71" text-anchor="middle" fill="#0f1117" font-weight="bold" font-size="14">${allowed}/${total} endpoints (${pct}%)</text>
    <text x="450" y="120" text-anchor="middle" fill="#6ee7b7" font-size="12">Active scopes: ${active.size ? [...active].join('  •  ') : 'none'}</text>
    <text x="450" y="145" text-anchor="middle" fill="#555" font-size="11">Toggle scopes above to see real-time access changes</text>`;
}
render();