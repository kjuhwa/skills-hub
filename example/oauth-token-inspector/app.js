function b64url(s) { return btoa(JSON.stringify(s)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64decode(s) {
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while (s.length % 4) s += '=';
  return JSON.parse(atob(s));
}

const now = Math.floor(Date.now()/1000);
const sampleHeader = { alg:'RS256', typ:'JWT', kid:'key-2024-03' };
const samplePayload = { sub:'user-8842', name:'Ada Lovelace', email:'ada@example.com', scope:'read write admin', iss:'https://auth.example.com', aud:'my-client-app', iat: now - 1800, exp: now + 1800, jti:'tkn_' + Math.random().toString(36).slice(2,10) };

function makeMockJWT(h, p) { return b64url(h) + '.' + b64url(p) + '.mock-signature-xyz'; }

function loadSample() {
  document.getElementById('token-input').value = makeMockJWT(sampleHeader, samplePayload);
  decodeToken();
}

function decodeToken() {
  const raw = document.getElementById('token-input').value.trim();
  const parts = raw.split('.');
  if (parts.length < 2) { document.getElementById('header-out').textContent = 'Invalid token format'; return; }
  try {
    const header = b64decode(parts[0]);
    const payload = b64decode(parts[1]);
    document.getElementById('header-out').textContent = JSON.stringify(header, null, 2);
    document.getElementById('payload-out').textContent = JSON.stringify(payload, null, 2);
    const statusEl = document.getElementById('status-out');
    if (payload.exp) {
      const diff = payload.exp - now;
      if (diff > 0) { statusEl.textContent = 'VALID — expires in ' + Math.floor(diff/60) + 'm'; statusEl.style.background = '#6ee7b722'; statusEl.style.color = '#6ee7b7'; }
      else { statusEl.textContent = 'EXPIRED — ' + Math.abs(Math.floor(diff/60)) + 'm ago'; statusEl.style.background = '#f0883e22'; statusEl.style.color = '#f0883e'; }
    } else { statusEl.textContent = 'No expiry claim'; statusEl.style.background = '#333'; statusEl.style.color = '#888'; }
    drawTimeline(payload);
  } catch(e) { document.getElementById('header-out').textContent = 'Decode error: ' + e.message; }
}

function drawTimeline(p) {
  const c = document.getElementById('tl-canvas'), ctx = c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  if (!p.iat || !p.exp) return;
  const span = p.exp - p.iat, pad = 40;
  const w = c.width - pad*2;
  const toX = t => pad + ((t - p.iat) / span) * w;
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(pad, 35); ctx.lineTo(pad+w, 35); ctx.stroke();
  [[p.iat,'Issued','#6ee7b7'],[now,'Now','#f0883e'],[p.exp,'Expires','#ef4444']].forEach(([t,l,col]) => {
    const x = Math.min(Math.max(toX(t), pad), pad+w);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 35, 6, 0, Math.PI*2); ctx.fill();
    ctx.font = '11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(l, x, 58);
  });
  const elapsed = Math.min(Math.max((now - p.iat)/span, 0), 1);
  ctx.fillStyle = '#6ee7b733'; ctx.fillRect(pad, 26, w * elapsed, 18);
}

loadSample();