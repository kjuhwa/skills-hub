const svg = document.getElementById('ship');
const NS = 'http://www.w3.org/2000/svg';
const COMP = 8;
const compartments = Array.from({ length: COMP }, (_, i) => ({
  id: i,
  name: `C${i + 1}`,
  flooded: false,
  level: 0
}));

function buildShip() {
  svg.innerHTML = '';
  const hull = document.createElementNS(NS, 'path');
  hull.setAttribute('d', 'M 40 120 L 820 120 Q 870 170 820 260 L 90 260 Q 40 230 40 120 Z');
  hull.setAttribute('fill', '#1a1d27');
  hull.setAttribute('stroke', '#3a4055');
  hull.setAttribute('stroke-width', '3');
  svg.appendChild(hull);
  const width = (820 - 40) / COMP;
  compartments.forEach((c, i) => {
    const x = 40 + i * width;
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x + 2);
    rect.setAttribute('y', 125);
    rect.setAttribute('width', width - 4);
    rect.setAttribute('height', 130);
    rect.setAttribute('class', 'compartment sealed');
    rect.setAttribute('data-id', i);
    svg.appendChild(rect);
    c.rect = rect;

    const waterClip = document.createElementNS(NS, 'clipPath');
    waterClip.setAttribute('id', `clip${i}`);
    const clipR = document.createElementNS(NS, 'rect');
    clipR.setAttribute('x', x + 2);
    clipR.setAttribute('y', 255);
    clipR.setAttribute('width', width - 4);
    clipR.setAttribute('height', 0);
    waterClip.appendChild(clipR);
    svg.appendChild(waterClip);
    c.waterClipRect = clipR;

    const water = document.createElementNS(NS, 'rect');
    water.setAttribute('x', x + 2);
    water.setAttribute('y', 125);
    water.setAttribute('width', width - 4);
    water.setAttribute('height', 130);
    water.setAttribute('fill', '#3b82f6');
    water.setAttribute('opacity', '0.85');
    water.setAttribute('clip-path', `url(#clip${i})`);
    svg.appendChild(water);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('class', 'label');
    label.setAttribute('x', x + width / 2 - 8);
    label.setAttribute('y', 115);
    label.textContent = c.name;
    svg.appendChild(label);
  });

  const deck = document.createElementNS(NS, 'rect');
  deck.setAttribute('x', 40); deck.setAttribute('y', 100);
  deck.setAttribute('width', 780); deck.setAttribute('height', 25);
  deck.setAttribute('fill', '#2a3040');
  svg.appendChild(deck);
}

function floodCompartment(i) {
  const c = compartments[i];
  if (c.flooded) return;
  c.flooded = true;
  c.rect.classList.add('flooded');
}

svg.addEventListener('click', e => {
  const id = e.target.getAttribute && e.target.getAttribute('data-id');
  if (id != null) floodCompartment(+id);
});

function tick() {
  compartments.forEach(c => {
    if (c.flooded && c.level < 130) {
      c.level = Math.min(130, c.level + 1.5);
      c.waterClipRect.setAttribute('y', 255 - c.level);
      c.waterClipRect.setAttribute('height', c.level);
    }
  });
  const floodedCount = compartments.filter(c => c.flooded).length;
  const buoy = Math.max(0, 100 - floodedCount * 14);
  document.getElementById('buoy-fill').style.width = buoy + '%';
  document.getElementById('buoy-val').textContent = buoy + '%';
  document.getElementById('flood-fill').style.width = (floodedCount / COMP * 100) + '%';
  document.getElementById('flood-val').textContent = `${floodedCount} / ${COMP}`;
  const status = document.getElementById('status');
  if (buoy <= 0)       status.textContent = 'Ship lost — too many compartments flooded';
  else if (floodedCount === 0) status.textContent = 'All compartments dry';
  else if (floodedCount <= 3)  status.textContent = `Contained: ${floodedCount} compartment(s) flooded, ship stable`;
  else                         status.textContent = `Critical: ${floodedCount} flooded, buoyancy ${buoy}%`;
  requestAnimationFrame(tick);
}

document.getElementById('torpedo').onclick = () => {
  const dry = compartments.filter(c => !c.flooded);
  if (dry.length) floodCompartment(dry[Math.floor(Math.random() * dry.length)].id);
};
document.getElementById('repair').onclick = () => {
  const flooded = compartments.filter(c => c.flooded);
  if (!flooded.length) return;
  const c = flooded[Math.floor(Math.random() * flooded.length)];
  c.flooded = false; c.level = 0;
  c.waterClipRect.setAttribute('height', 0);
  c.rect.classList.remove('flooded');
};
document.getElementById('reset').onclick = () => {
  compartments.forEach(c => {
    c.flooded = false; c.level = 0;
    c.waterClipRect.setAttribute('height', 0);
    c.rect.classList.remove('flooded');
  });
};

buildShip();
requestAnimationFrame(tick);