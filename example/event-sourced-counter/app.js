const events = [];
const writeVal = document.getElementById('writeVal');
const eventLog = document.getElementById('eventLog');
const replay = document.getElementById('replay');

let state = 0;

function dispatch(cmd) {
  let evt;
  switch (cmd) {
    case 'increment': evt = { type: 'Incremented', delta: 1 }; break;
    case 'decrement': evt = { type: 'Decremented', delta: -1 }; break;
    case 'double': evt = { type: 'Doubled', delta: state }; break;
    case 'reset': evt = { type: 'Reset', delta: -state }; break;
  }
  evt.ts = Date.now();
  evt.id = events.length + 1;
  events.push(evt);
  state += evt.delta;
  render();
}

function computeProjection(upTo = events.length) {
  let v = 0, inc = 0, dec = 0, max = 0, min = 0;
  for (let i = 0; i < upTo; i++) {
    const e = events[i];
    v += e.delta;
    if (e.type === 'Incremented') inc++;
    if (e.type === 'Decremented') dec++;
    if (v > max) max = v;
    if (v < min) min = v;
  }
  return { v, inc, dec, max, min, total: upTo };
}

function render() {
  writeVal.textContent = state;
  writeVal.style.color = state >= 0 ? '#6ee7b7' : '#fca5a5';
  
  eventLog.innerHTML = '';
  events.slice().reverse().slice(0, 20).forEach(e => {
    const li = document.createElement('li');
    li.textContent = `#${e.id} ${e.type} (Δ${e.delta >= 0 ? '+' : ''}${e.delta})`;
    eventLog.appendChild(li);
  });
  
  const p = computeProjection();
  document.getElementById('pCurrent').textContent = p.v;
  document.getElementById('pTotal').textContent = p.total;
  document.getElementById('pInc').textContent = p.inc;
  document.getElementById('pDec').textContent = p.dec;
  document.getElementById('pMax').textContent = p.max;
  document.getElementById('pMin').textContent = p.min;
  
  replay.max = events.length;
  replay.value = events.length;
  updateReplay();
}

function updateReplay() {
  const idx = +replay.value;
  const p = computeProjection(idx);
  document.getElementById('replayIdx').textContent = idx;
  document.getElementById('replayState').textContent = p.v;
}

document.querySelectorAll('[data-cmd]').forEach(b => {
  b.onclick = () => dispatch(b.dataset.cmd);
});
replay.oninput = updateReplay;

['increment', 'increment', 'increment', 'double', 'decrement', 'increment'].forEach(dispatch);