const svg = document.getElementById('diagram');
const infoEl = document.getElementById('info');
const histEl = document.getElementById('history');

const STATES = {
  follower:  { x: 130, y: 170, color: '#3b82f6', desc: 'Follower: Listens for heartbeats from leader. Starts election on timeout.' },
  candidate: { x: 330, y: 60,  color: '#fbbf24', desc: 'Candidate: Increments term, votes for self, requests votes from peers.' },
  leader:    { x: 530, y: 170, color: '#6ee7b7', desc: 'Leader: Sends heartbeats, replicates log entries to followers.' }
};

const TRANSITIONS = [
  { from: 'follower',  to: 'candidate', label: 'timeout', path: 'M170,148 Q250,40 300,72' },
  { from: 'candidate', to: 'candidate', label: 'split vote / timeout', path: 'M330,28 C380,-10 280,-10 330,28' },
  { from: 'candidate', to: 'leader',    label: 'majority votes', path: 'M362,50 Q440,30 500,148' },
  { from: 'candidate', to: 'follower',  label: 'discover leader/higher term', path: 'M300,82 Q250,160 170,185' },
  { from: 'leader',    to: 'follower',  label: 'higher term discovered', path: 'M500,200 Q330,290 165,195' }
];

let current = 'follower';
let term = 0;
let history = [];

function buildSVG() {
  svg.innerHTML = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#4b5563"/></marker>
    <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
    <polygon points="0 0, 8 3, 0 6" fill="#6ee7b7"/></marker></defs>`;

  TRANSITIONS.forEach((t, i) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', t.path);
    path.setAttribute('class', 'arrow');
    path.id = `arrow-${i}`;
    path.setAttribute('data-from', t.from);
    path.setAttribute('data-to', t.to);
    svg.appendChild(path);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const mid = pathMid(t.path);
    text.setAttribute('x', mid.x);
    text.setAttribute('y', mid.y - 6);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('class', 'arrow-label');
    text.textContent = t.label;
    svg.appendChild(text);
  });

  Object.entries(STATES).forEach(([key, s]) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'state-circle');
    g.setAttribute('data-state', key);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', s.x); circle.setAttribute('cy', s.y); circle.setAttribute('r', 38);
    circle.setAttribute('fill', s.color); circle.id = `circle-${key}`;
    g.appendChild(circle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', s.x); text.setAttribute('y', s.y + 5);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('class', 'state-text');
    text.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    g.appendChild(text);
    g.addEventListener('click', () => tryTransition(key));
    svg.appendChild(g);
  });
  updateVisuals();
}

function pathMid(d) {
  const nums = d.match(/-?\d+/g).map(Number);
  if (nums.length >= 6) return { x: nums[2], y: nums[3] };
  return { x: (nums[0] + nums[2]) / 2, y: (nums[1] + nums[3]) / 2 };
}

function tryTransition(target) {
  const valid = TRANSITIONS.find(t => t.from === current && t.to === target);
  if (!valid) { infoEl.innerHTML = `<strong>Invalid:</strong> No transition from ${current} to ${target}.`; return; }
  if (target === 'candidate') term++;
  const prev = current;
  current = target;
  history.unshift(`${prev} → ${current} (${valid.label}, term ${term})`);
  if (history.length > 20) history.pop();
  updateVisuals();
}

function updateVisuals() {
  document.querySelectorAll('.state-circle circle').forEach(c => c.classList.remove('glow'));
  const active = document.getElementById(`circle-${current}`);
  if (active) active.classList.add('glow');
  document.querySelectorAll('.arrow').forEach(a => {
    a.classList.remove('active');
    a.setAttribute('marker-end', 'url(#arrowhead)');
  });
  TRANSITIONS.forEach((t, i) => {
    if (t.from === current) {
      const el = document.getElementById(`arrow-${i}`);
      el.classList.add('active');
      el.setAttribute('marker-end', 'url(#arrowhead-active)');
    }
  });
  infoEl.innerHTML = `<strong>${current.toUpperCase()}</strong> (Term ${term})<br>${STATES[current].desc}<br><em>Click a valid target state to transition.</em>`;
  histEl.innerHTML = history.length ? history.map(h => `<div>${h}</div>`).join('') : '<div>No transitions yet</div>';
}

buildSVG();