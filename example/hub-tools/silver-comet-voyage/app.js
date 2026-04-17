(() => {
  const CELL = 32;
  const N = 16;
  const cv = document.getElementById('board');
  const g = cv.getContext('2d');
  cv.width = CELL * N; cv.height = CELL * N;
  const evEl = document.getElementById('evlist');

  const NAMES = ['Loom','Reed','Sail','Owl','Fox','Anchor','Kite','Veil','Hare','Lantern','Harp','Moth','Stag','Quill'];

  let state;

  function init() {
    const stars = [];
    for (let i = 0; i < 28; i++) {
      stars.push({ x: (Math.random() * N) | 0, y: (Math.random() * N) | 0, claimed: false, lost: false });
    }
    state = {
      turn: 0,
      player: { x: 8, y: 8 },
      stars,
      comets: [],
      constellations: [],
      pending: [],
      score: 0,
      events: []
    };
    evEl.innerHTML = '';
    emit('Voyage begins.', 'good');
    render();
  }

  function emit(msg, cls = '') {
    const li = document.createElement('li');
    li.textContent = msg;
    if (cls) li.className = cls;
    evEl.prepend(li);
    state.events.push({ t: state.turn, msg });
  }

  function reduce(action) {
    const events = [];
    const s = state;
    if (action.type === 'move') {
      const nx = Math.max(0, Math.min(N - 1, s.player.x + action.dx));
      const ny = Math.max(0, Math.min(N - 1, s.player.y + action.dy));
      s.player.x = nx; s.player.y = ny;
      const hit = s.stars.find(st => !st.claimed && !st.lost && st.x === nx && st.y === ny);
      if (hit) {
        hit.claimed = true;
        s.pending.push({ x: hit.x, y: hit.y });
        events.push({ msg: `Claimed star (${hit.x},${hit.y}).`, cls: 'good' });
      }
    } else if (action.type === 'stitch') {
      if (s.pending.length >= 3) {
        const name = NAMES[s.constellations.length % NAMES.length];
        const picked = s.pending.slice(-3);
        s.constellations.push({ name, stars: picked });
        s.pending = s.pending.slice(0, -3);
        s.score += 30 + picked.length * 5;
        events.push({ msg: `Stitched constellation "${name}" (+${30 + picked.length*5}).`, cls: 'good' });
      } else {
        events.push({ msg: `Need 3 claimed stars to stitch (have ${s.pending.length}).`, cls: 'warn' });
      }
    }
    s.turn++;
    tickComets(events);
    events.forEach(e => emit(e.msg, e.cls || ''));
  }

  function tickComets(events) {
    if (state.turn % 3 === 0) {
      const side = Math.floor(Math.random() * 4);
      let cx, cy, dx, dy;
      if (side === 0) { cx = Math.random() * N | 0; cy = 0; dx = 0; dy = 1; }
      else if (side === 1) { cx = N - 1; cy = Math.random() * N | 0; dx = -1; dy = 0; }
      else if (side === 2) { cx = Math.random() * N | 0; cy = N - 1; dx = 0; dy = -1; }
      else { cx = 0; cy = Math.random() * N | 0; dx = 1; dy = 0; }
      state.comets.push({ x: cx, y: cy, dx, dy, life: 0, ttl: N + 2 });
    }
    for (let i = state.comets.length - 1; i >= 0; i--) {
      const c = state.comets[i];
      c.x += c.dx; c.y += c.dy; c.life++;
      const hitPlayer = c.x === state.player.x && c.y === state.player.y;
      if (hitPlayer) {
        events.push({ msg: `Silver comet clipped you! -10`, cls: 'warn' });
        state.score = Math.max(0, state.score - 10);
      }
      for (const st of state.stars) {
        if (st.claimed && !st.lost && st.x === c.x && st.y === c.y) {
          st.lost = true;
          state.pending = state.pending.filter(p => !(p.x === st.x && p.y === st.y));
          events.push({ msg: `Lost claimed star at (${st.x},${st.y}).`, cls: 'warn' });
        }
      }
      if (c.life > c.ttl || c.x < 0 || c.x >= N || c.y < 0 || c.y >= N) {
        state.comets.splice(i, 1);
      }
    }
  }

  function render() {
    g.fillStyle = '#0a0c12';
    g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = '#1a1d27';
    for (let i = 0; i <= N; i++) {
      g.beginPath(); g.moveTo(i*CELL,0); g.lineTo(i*CELL,cv.height); g.stroke();
      g.beginPath(); g.moveTo(0,i*CELL); g.lineTo(cv.width,i*CELL); g.stroke();
    }
    for (const st of state.stars) {
      const px = st.x * CELL + CELL/2, py = st.y * CELL + CELL/2;
      if (st.lost) {
        g.fillStyle = 'rgba(120,120,140,0.3)';
        g.fillRect(st.x*CELL+10, st.y*CELL+10, 12, 12);
      } else if (st.claimed) {
        g.fillStyle = '#6ee7b7';
        g.beginPath(); g.arc(px, py, 5, 0, Math.PI*2); g.fill();
      } else {
        g.fillStyle = '#d9c8a0';
        g.beginPath(); g.arc(px, py, 3, 0, Math.PI*2); g.fill();
      }
    }
    for (const co of state.constellations) {
      g.strokeStyle = 'rgba(110,231,183,0.7)';
      g.lineWidth = 1.2;
      g.beginPath();
      for (let i = 0; i < co.stars.length; i++) {
        const s = co.stars[i];
        const x = s.x*CELL+CELL/2, y = s.y*CELL+CELL/2;
        if (i === 0) g.moveTo(x,y); else g.lineTo(x,y);
      }
      g.stroke();
      const first = co.stars[0];
      g.fillStyle = '#6ee7b7';
      g.font = '10px Georgia';
      g.fillText(co.name, first.x*CELL+6, first.y*CELL-4);
    }
    for (const c of state.comets) {
      const px = c.x * CELL + CELL/2, py = c.y * CELL + CELL/2;
      g.fillStyle = '#d6e2ee';
      g.beginPath(); g.arc(px, py, 4, 0, Math.PI*2); g.fill();
      g.strokeStyle = 'rgba(214,226,238,0.4)';
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px - c.dx*CELL*2, py - c.dy*CELL*2);
      g.stroke();
    }
    const p = state.player;
    g.fillStyle = '#ffdca8';
    g.beginPath();
    g.arc(p.x*CELL+CELL/2, p.y*CELL+CELL/2, 7, 0, Math.PI*2);
    g.fill();
    g.strokeStyle = '#6ee7b7';
    g.lineWidth = 1.5;
    g.stroke();
    document.getElementById('turn').textContent = state.turn;
    document.getElementById('claimed').textContent = state.stars.filter(s => s.claimed && !s.lost).length;
    document.getElementById('named').textContent = state.constellations.length;
    document.getElementById('score').textContent = state.score;
  }

  const keyMap = {
    ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
    w:[0,-1], s:[0,1], a:[-1,0], d:[1,0]
  };
  window.addEventListener('keydown', e => {
    if (keyMap[e.key]) {
      e.preventDefault();
      const [dx, dy] = keyMap[e.key];
      reduce({ type: 'move', dx: Math.sign(dx), dy: Math.sign(dy) });
      render();
    } else if (e.key === ' ') {
      e.preventDefault();
      reduce({ type: 'stitch' });
      render();
    }
  });
  document.getElementById('restart').addEventListener('click', init);
  init();
})();