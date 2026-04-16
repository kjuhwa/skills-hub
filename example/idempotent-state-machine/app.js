const states = ['DRAFT','SUBMITTED','APPROVED','SHIPPED','DELIVERED'];
const transitions = { DRAFT:'SUBMIT', SUBMITTED:'APPROVE', APPROVED:'SHIP', SHIPPED:'DELIVER' };
const eventToNext = { SUBMIT:'SUBMITTED', APPROVE:'APPROVED', SHIP:'SHIPPED', DELIVER:'DELIVERED' };
let current = 'DRAFT';
let transitionCount = 0, duplicateCount = 0;
const svg = document.getElementById('diagram');
const log = document.getElementById('eventLog');

function renderSVG() {
  const w = 700, gap = w / states.length;
  let html = '';
  states.forEach((s, i) => {
    const x = gap * i + gap / 2, y = 110, r = 35;
    const active = s === current;
    const past = states.indexOf(s) < states.indexOf(current);
    const fill = active ? '#6ee7b7' : past ? '#2d3748' : '#1a1d27';
    const stroke = active ? '#6ee7b7' : past ? '#6ee7b7' : '#334155';
    const textFill = active ? '#0f1117' : past ? '#6ee7b7' : '#64748b';
    html += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    html += `<text x="${x}" y="${y + 4}" text-anchor="middle" fill="${textFill}" font-size="10" font-weight="600" font-family="monospace">${s}</text>`;
    if (i < states.length - 1) {
      const x2 = gap * (i + 1) + gap / 2;
      const done = states.indexOf(current) > i;
      html += `<line x1="${x + r + 4}" y1="${y}" x2="${x2 - r - 4}" y2="${y}" stroke="${done ? '#6ee7b7' : '#334155'}" stroke-width="2" marker-end="url(#arrow)"/>`;
      html += `<text x="${(x + x2) / 2}" y="${y - 44}" text-anchor="middle" fill="#94a3b8" font-size="9" font-family="monospace">${transitions[states[i]]}</text>`;
    }
  });
  html += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6ee7b7"/></marker></defs>`;
  svg.innerHTML = html;
}

function addLog(msg, cls) {
  log.innerHTML = `<div><span class="${cls}">${msg}</span></div>` + log.innerHTML;
}

function dispatch(event) {
  const expected = eventToNext[event];
  if (!expected) return;
  const requiredState = Object.keys(transitions).find(k => transitions[k] === event);
  if (current === expected) {
    duplicateCount++;
    addLog(`⚡ ${event} → already in ${expected} — no-op (idempotent!) [dupes: ${duplicateCount}]`, 'd');
  } else if (current === requiredState) {
    current = expected;
    transitionCount++;
    addLog(`✅ ${event} → ${requiredState} ➜ ${expected} [transition #${transitionCount}]`, 't');
  } else {
    addLog(`— ${event} ignored: current state is ${current}, need ${requiredState}`, 'i');
  }
  renderSVG();
}

document.querySelectorAll('[data-ev]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.id === 'resetBtn') {
      current = 'DRAFT'; transitionCount = 0; duplicateCount = 0;
      addLog('🔄 Reset to DRAFT', 'i');
      renderSVG();
    } else dispatch(btn.dataset.ev);
  });
});

renderSVG();
// Seed demo
setTimeout(() => dispatch('SUBMIT'), 400);
setTimeout(() => dispatch('SUBMIT'), 900);
setTimeout(() => dispatch('APPROVE'), 1400);