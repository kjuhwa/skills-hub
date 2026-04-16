let day = 0, running = false, timer = null, totalCost = 0;
const rates = { hot: 0.023, warm: 0.0125, cold: 0.004 };
const objects = [];

function seed() {
  const names = ['img','log','db','bak','vid','csv','cfg','tmp','raw','pkg','rpt','arc'];
  for (let i = 0; i < 12; i++) {
    objects.push({
      id: i, name: names[i], sizeMB: Math.random() * 50 + 5,
      tier: 'hot', born: 0, toWarm: 15 + (Math.random() * 20 | 0),
      toCold: 45 + (Math.random() * 30 | 0), toDelete: 90 + (Math.random() * 60 | 0),
      color: `hsl(${160 + i * 15}, 60%, ${50 + (i % 3) * 10}%)`
    });
  }
}
seed();

function render() {
  ['hot', 'warm', 'cold', 'deleted'].forEach(t => document.getElementById(t).innerHTML = '');
  objects.forEach(o => {
    const el = document.createElement('div');
    el.className = 'obj'; el.style.background = o.tier === 'deleted' ? '#555' : o.color;
    el.textContent = o.name; el.title = `${o.name} · ${o.sizeMB.toFixed(0)}MB · Day ${o.born}`;
    document.getElementById(o.tier === 'deleted' ? 'deleted' : o.tier).appendChild(el);
  });
  let hc = 0, wc = 0, cc = 0;
  objects.forEach(o => {
    const gb = o.sizeMB / 1024;
    if (o.tier === 'hot') hc += gb * rates.hot;
    else if (o.tier === 'warm') wc += gb * rates.warm;
    else if (o.tier === 'cold') cc += gb * rates.cold;
  });
  totalCost += hc + wc + cc;
  document.getElementById('hot-cost').textContent = `$${hc.toFixed(4)}/day`;
  document.getElementById('warm-cost').textContent = `$${wc.toFixed(4)}/day`;
  document.getElementById('cold-cost').textContent = `$${cc.toFixed(4)}/day`;
  document.getElementById('total').textContent = `Total accumulated cost: $${totalCost.toFixed(3)} over ${day} days`;
  document.getElementById('day-label').textContent = `Day ${day}`;
}

function step() {
  day++;
  objects.forEach(o => {
    if (o.tier === 'deleted') return;
    const age = day - o.born;
    if (age >= o.toDelete) o.tier = 'deleted';
    else if (age >= o.toCold) o.tier = 'cold';
    else if (age >= o.toWarm) o.tier = 'warm';
  });
  render();
}

function play() { if (!running) { running = true; timer = setInterval(step, 300); } }
function pause() { running = false; clearInterval(timer); }
function reset() { pause(); day = 0; totalCost = 0; objects.forEach(o => o.tier = 'hot'); render(); }
render();