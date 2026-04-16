const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

const types = [
  { name: 'Query', fields: ['users', 'posts', 'me'], color: '#6ee7b7' },
  { name: 'User', fields: ['id', 'name', 'email', 'posts'], color: '#f0abfc' },
  { name: 'Post', fields: ['id', 'title', 'author', 'comments'], color: '#fbbf24' },
  { name: 'Comment', fields: ['id', 'text', 'author'], color: '#60a5fa' },
  { name: 'Tag', fields: ['id', 'label'], color: '#f87171' },
  { name: 'Mutation', fields: ['createUser', 'addPost'], color: '#6ee7b7' },
  { name: 'Subscription', fields: ['postAdded'], color: '#a78bfa' }
];

const edges = [
  [0,1],[0,2],[0,3],[1,2],[2,1],[2,3],[3,1],[2,4],[5,1],[5,2],[6,2]
];

let nodes = [];
let hovered = -1;
let animating = true;

function layout() {
  nodes = types.map((t, i) => {
    const angle = (i / types.length) * Math.PI * 2;
    return {
      ...t,
      x: W/2 + Math.cos(angle) * 220 + (Math.random()-0.5)*30,
      y: H/2 + Math.sin(angle) * 200 + (Math.random()-0.5)*30,
      vx: (Math.random()-0.5) * 0.4,
      vy: (Math.random()-0.5) * 0.4,
      r: 38 + t.fields.length * 2
    };
  });
}

function step() {
  if (!animating) return;
  for (const n of nodes) {
    n.x += n.vx; n.y += n.vy;
    if (n.x < n.r || n.x > W - n.r) n.vx *= -1;
    if (n.y < n.r || n.y > H - n.r) n.vy *= -1;
  }
}

function draw() {
  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#2a2f3e';
  ctx.lineWidth = 1.5;
  for (const [a, b] of edges) {
    const n1 = nodes[a], n2 = nodes[b];
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.stroke();
    const mx = (n1.x + n2.x)/2, my = (n1.y + n2.y)/2;
    const ang = Math.atan2(n2.y - n1.y, n2.x - n1.x);
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(mx - Math.cos(ang - 0.4)*8, my - Math.sin(ang - 0.4)*8);
    ctx.lineTo(mx - Math.cos(ang + 0.4)*8, my - Math.sin(ang + 0.4)*8);
    ctx.fill();
  }

  nodes.forEach((n, i) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = i === hovered ? n.color : '#0f1117';
    ctx.fill();
    ctx.strokeStyle = n.color;
    ctx.lineWidth = i === hovered ? 4 : 2;
    ctx.stroke();
    ctx.fillStyle = i === hovered ? '#0f1117' : '#e6e6e6';
    ctx.font = 'bold 13px Segoe UI';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.name, n.x, n.y);
  });
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width, sy = H / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;
  hovered = -1;
  nodes.forEach((n, i) => {
    if (Math.hypot(n.x - mx, n.y - my) < n.r) hovered = i;
  });
  const info = document.getElementById('info');
  info.textContent = hovered >= 0
    ? `${types[hovered].name}: { ${types[hovered].fields.join(', ')} }`
    : 'Hover a type node';
});

document.getElementById('reshuffle').onclick = layout;
document.getElementById('toggle-animate').onclick = e => {
  animating = !animating;
  e.target.textContent = animating ? 'Pause Animation' : 'Resume Animation';
};

function loop() { step(); draw(); requestAnimationFrame(loop); }
layout(); loop();