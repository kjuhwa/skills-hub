const routes = [
  { method: 'GET',    pattern: /^\/v1\/users\/\d+$/,   name: 'user-svc',   latency: 40 },
  { method: 'GET',    pattern: /^\/v1\/users$/,        name: 'user-svc',   latency: 60 },
  { method: 'POST',   pattern: /^\/v1\/orders$/,       name: 'order-svc',  latency: 90 },
  { method: 'GET',    pattern: /^\/v1\/orders\/\w+$/,  name: 'order-svc',  latency: 55 },
  { method: 'DELETE', pattern: /^\/v1\/orders\/\w+$/,  name: 'order-svc',  latency: 70 },
  { method: 'GET',    pattern: /^\/v1\/catalog$/,      name: 'catalog-svc',latency: 30 },
  { method: 'POST',   pattern: /^\/v1\/pay$/,          name: 'payment-svc',latency: 120 },
];
const middleware = ['auth', 'rate-limit', 'cors', 'validate', 'route', 'transform'];
const history = [];

function renderRoutes() {
  document.getElementById('routeList').innerHTML = routes.map(r =>
    `<li><span class="method">${r.method}</span>${r.pattern.source.replace(/\\/g, '').replace(/[\^\$]/g, '')} → ${r.name}</li>`
  ).join('');
  document.getElementById('mwList').innerHTML =
    middleware.map(m => `<li>${m}</li>`).join('');
  renderPipeline(-1);
}

function renderPipeline(active, failAt) {
  document.getElementById('pipeline').innerHTML = middleware.map((m, i) => {
    const cls = failAt === i ? 'fail' : (i <= active ? 'active' : '');
    return `<div class="stage ${cls}">
      <div class="label">stage ${i + 1}</div>
      <div class="val">${m}</div>
    </div>`;
  }).join('');
}

function matchRoute(method, path) {
  return routes.find(r => r.method === method && r.pattern.test(path));
}

async function send() {
  const method = document.getElementById('method').value;
  const path = document.getElementById('path').value.trim();
  const resultEl = document.getElementById('result');
  resultEl.textContent = 'Processing...';

  const hasAuth = Math.random() > 0.1;
  const underLimit = Math.random() > 0.08;
  const route = matchRoute(method, path);

  const start = performance.now();
  let status = 200, body, failAt = null;

  for (let i = 0; i < middleware.length; i++) {
    renderPipeline(i);
    await new Promise(r => setTimeout(r, 200));
    const m = middleware[i];
    if (m === 'auth' && !hasAuth)       { status = 401; failAt = i; break; }
    if (m === 'rate-limit' && !underLimit) { status = 429; failAt = i; break; }
    if (m === 'route' && !route)        { status = 404; failAt = i; break; }
  }

  if (failAt !== null) renderPipeline(middleware.length, failAt);

  const ms = Math.round(performance.now() - start + (route?.latency || 0));

  if (status === 200) {
    body = {
      gateway: 'api-gateway-01',
      route: route.name,
      upstream: `${route.name}.internal:8080${path}`,
      traceId: Math.random().toString(36).slice(2, 10),
      data: mockPayload(path),
    };
  } else {
    body = {
      error: { 401: 'Unauthorized', 429: 'Too Many Requests', 404: 'No route matched' }[status],
      status, path, method,
    };
  }

  resultEl.textContent = JSON.stringify(body, null, 2);
  history.unshift({ time: new Date().toLocaleTimeString(), method, path, route: route?.name || '—', status, ms });
  if (history.length > 8) history.pop();
  renderHistory();
}

function mockPayload(path) {
  if (/\/users\/\d+/.test(path))  return { id: 42, name: 'Ada Lovelace', plan: 'pro' };
  if (/\/users$/.test(path))      return [{ id: 42, name: 'Ada' }, { id: 43, name: 'Alan' }];
  if (/\/orders\/\w+/.test(path)) return { id: 'ord_9f3', total: 129.00, status: 'shipped' };
  if (/\/orders$/.test(path))     return { id: 'ord_9f3', created: true };
  if (/\/catalog/.test(path))     return { items: ['widget', 'gadget', 'gizmo'] };
  if (/\/pay/.test(path))         return { ok: true, txn: 'txn_48a' };
  return {};
}

function renderHistory() {
  const tbody = document.querySelector('#history tbody');
  tbody.innerHTML = history.map(h => {
    const cls = h.status < 300 ? 's2xx' : h.status < 500 ? 's4xx' : 's5xx';
    return `<tr><td>${h.time}</td><td>${h.method}</td><td>${h.path}</td><td>${h.route}</td><td class="${cls}">${h.status}</td><td>${h.ms}</td></tr>`;
  }).join('');
}

document.getElementById('send').onclick = send;
document.getElementById('path').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

renderRoutes();
send();