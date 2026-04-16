const svcNames = ['api-gateway','auth-service','order-service','payment-service','inventory-svc','mailer'];
const svcs = svcNames.map(name => ({
  name, state: 'closed', failures: 0, threshold: 5, successStreak: 0, cooldown: 0, injectedFault: false, requests: 0
}));

const panel = document.getElementById('panel');
const log = document.getElementById('log');

function addLog(msg, cls) {
  const d = document.createElement('div'); d.className = cls; d.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  log.prepend(d);
  if (log.children.length > 60) log.removeChild(log.lastChild);
}

function render() {
  panel.innerHTML = svcs.map((s, i) => `<div class="svc ${s.state}" onclick="inject(${i})">
    <h3>${s.name}</h3><div class="state">${s.state.replace('-',' ')}</div>
    <div class="meta">fails: ${s.failures}/${s.threshold} | reqs: ${s.requests}</div>
  </div>`).join('');
}

window.inject = function(i) {
  const s = svcs[i];
  s.injectedFault = !s.injectedFault;
  addLog(`${s.injectedFault ? 'Injecting' : 'Removing'} fault on ${s.name}`, s.injectedFault ? 'log-fail' : 'log-ok');
};

function tick() {
  svcs.forEach(s => {
    s.requests++;
    if (s.state === 'open') {
      s.cooldown--;
      if (s.cooldown <= 0) { s.state = 'half-open'; addLog(`${s.name} → HALF-OPEN (probing)`, 'log-warn'); }
      return;
    }
    const fail = s.injectedFault ? Math.random() < 0.7 : Math.random() < 0.05;
    if (fail) {
      s.failures++; s.successStreak = 0;
      if (s.failures >= s.threshold) { s.state = 'open'; s.cooldown = 8; addLog(`${s.name} → OPEN (tripped)`, 'log-fail'); }
    } else {
      s.successStreak++;
      if (s.state === 'half-open' && s.successStreak >= 3) { s.state = 'closed'; s.failures = 0; addLog(`${s.name} → CLOSED (recovered)`, 'log-ok'); }
    }
  });
  render();
}

render();
setInterval(tick, 800);
addLog('Simulator started — click services to inject faults', 'log-ok');