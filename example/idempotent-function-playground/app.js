const fns = {
  abs: { fn: x => Math.abs(parseFloat(x) || 0), idempotent: true, parse: x => parseFloat(x) || 0 },
  upper: { fn: x => String(x).toUpperCase(), idempotent: true, parse: x => String(x) },
  round: { fn: x => Math.round(parseFloat(x) || 0), idempotent: true, parse: x => parseFloat(x) || 0 },
  trim: { fn: x => String(x).trim(), idempotent: true, parse: x => String(x) },
  double: { fn: x => (parseFloat(x) || 0) * 2, idempotent: false, parse: x => parseFloat(x) || 0 },
  increment: { fn: x => (parseFloat(x) || 0) + 1, idempotent: false, parse: x => parseFloat(x) || 0 },
  reverse: { fn: x => {
    const arr = Array.isArray(x) ? x : String(x).split(',').map(s => s.trim());
    return arr.slice().reverse();
  }, idempotent: false, parse: x => String(x).split(',').map(s => s.trim()) }
};

let chain = [];
const $ = id => document.getElementById(id);

function display(v) {
  if (Array.isArray(v)) return '[' + v.join(', ') + ']';
  if (typeof v === 'string') return `"${v}"`;
  return String(v);
}

function render() {
  const steps = $('steps');
  steps.innerHTML = '';
  chain.forEach((v, i) => {
    const prev = i > 0 ? display(chain[i - 1]) : null;
    const curr = display(v);
    const stable = prev !== null && prev === curr;
    const d = document.createElement('div');
    d.className = 'step ' + (i === 0 ? '' : stable ? 'stable' : 'changed');
    d.innerHTML = `
      <div class="n">${i === 0 ? 'x' : 'f'.repeat(Math.min(i, 3)) + (i > 3 ? '…' : '')}</div>
      <div class="val">${curr}</div>
      ${i > 0 ? `<span class="arrow">${stable ? '= fixed point' : '≠ changed'}</span>` : ''}
    `;
    steps.appendChild(d);
  });

  const verdict = $('verdict');
  if (chain.length < 2) { verdict.className = ''; verdict.textContent = ''; return; }
  const last = display(chain[chain.length - 1]);
  const prev = display(chain[chain.length - 2]);
  if (last === prev) {
    verdict.className = 'idempotent';
    verdict.textContent = '✓ Reached fixed point — f(f(x)) = f(x)';
  } else {
    verdict.className = 'not-idempotent';
    verdict.textContent = '⚠ Still changing — not idempotent here';
  }
}

function apply() {
  const fnName = $('fn').value;
  const { fn, parse } = fns[fnName];
  if (chain.length === 0) chain.push(parse($('input').value));
  chain.push(fn(chain[chain.length - 1]));
  render();
}

function reset() {
  chain = [];
  render();
}

$('apply').addEventListener('click', apply);
$('reset').addEventListener('click', reset);
$('fn').addEventListener('change', reset);
$('input').addEventListener('input', reset);

// Seed demo
apply();
apply();