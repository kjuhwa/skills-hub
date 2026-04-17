// Quorum Rift Rhythm — Byzantine commander rhythm game
const N = 7;
const F = 2;
const NEED_COMMITS = 2*F + 1; // 5 for safety
const NAMES = ['Arda','Basil','Corvus','Drusia','Evren','Fenna','Galia'];

function fnv1a(s){ let h=0x811c9dc5; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function xor32(seed){ let s=seed>>>0 || 1; return () => { s^=s<<13; s^=s>>>17; s^=s<<5; return (s>>>0)/4294967295; }; }
const seed = fnv1a('quorum-rift-' + Date.now());
const rand = xor32(seed);

const game = {
  round: 1,
  maxRounds: 12,
  score: 0,
  pity: 0,
  budget: 6,
  beat: 0,
  beatMode: 'idle', // idle | heating | perfect | falling | missed
  commanders: [],
  queue: [],
  log: [],
  partitioned: new Set(), // pair keys
  statusEffects: [],
  target: 0,
  active: false,
  history: [], // replay log
  saboteurStrategy: 'concentrate', // or 'scatter' / 'mimic'
};

function resetCommanders(){
  game.commanders = NAMES.map((n,i) => ({
    id: i+1, idx: i, name: n,
    prepared: false, committed: false, faulty: false,
    partitioned: false, trust: 100,
    angle: (i/N)*Math.PI*2,
    glow: 0,
  }));
  // Pick f faulty hidden until revealed
  const pool = [...game.commanders.keys()];
  for (let k=0;k<F;k++){
    const pick = Math.floor(rand()*pool.length);
    game.commanders[pool[pick]].faulty = true;
    pool.splice(pick,1);
  }
}

function newGame(){
  game.round = 1; game.score = 0; game.pity = 0;
  game.budget = 6; game.queue.length = 0; game.log.length = 0;
  game.history.length = 0; game.partitioned.clear();
  game.statusEffects.length = 0; game.active = false;
  resetCommanders();
  log('info','--- new game seed 0x' + seed.toString(16) + ' ---');
  render();
}

function beginRound(){
  if (game.round > game.maxRounds){
    log('info', 'Game over · final score ' + game.score);
    return;
  }
  game.active = true;
  game.beat = 0;
  game.beatMode = 'heating';
  game.budget = 6;
  game.queue.length = 0;
  game.commanders.forEach(c => { c.prepared = false; c.committed = false; });
  // Saboteur strategy hot-swap (adaptive)
  const strategies = ['concentrate','scatter','mimic'];
  if (rand() < 0.35){
    game.saboteurStrategy = strategies[Math.floor(rand()*3)];
    log('info','saboteur adopts ' + game.saboteurStrategy);
  }
  // Possibly partition at round start
  if (rand() < 0.55) injectPartition();
  log('info','round ' + game.round + ' begins');
  document.getElementById('commitBtn').disabled = false;
  render();
  runBeatLoop();
}

function injectPartition(){
  const a = Math.floor(rand()*N);
  let b = Math.floor(rand()*N);
  if (a === b) b = (b+1)%N;
  const key = [a,b].sort().join('-');
  game.partitioned.add(key);
  game.commanders[a].partitioned = true;
  game.commanders[b].partitioned = true;
  log('bad','partition ' + game.commanders[a].name + ' ⇎ ' + game.commanders[b].name);
}

function queueAction(kind, targetIdx){
  if (!game.active){ return; }
  if (game.budget <= 0){ log('bad','no budget for ' + kind); return; }
  if (targetIdx == null) targetIdx = game.target;
  game.budget--;
  game.queue.push({ kind, target: targetIdx, at: game.beat });
  // apply action
  const c = game.commanders[targetIdx];
  if (kind === 'prepare'){
    if (c.partitioned && rand() < 0.6){
      log('bad', 'prepare to ' + c.name + ' lost (partition)');
    } else if (c.faulty && rand() < 0.45){
      log('bad', c.name + ' returns bad prepare signature');
    } else {
      c.prepared = true; c.glow = 1;
      log('info','prepare delivered to ' + c.name);
    }
  } else if (kind === 'commit'){
    if (!c.prepared){
      log('bad', c.name + ' not prepared — commit ignored');
    } else if (c.partitioned && rand() < 0.6){
      log('bad','commit to ' + c.name + ' dropped');
    } else if (c.faulty && rand() < 0.55){
      log('bad', c.name + ' signs conflicting commit');
    } else {
      c.committed = true; c.glow = 1;
      log('good','commit delivered to ' + c.name);
    }
  } else if (kind === 'rumor'){
    // attempt to expose faulty
    if (c.faulty){
      c.trust -= 40;
      log('good','rumor reveals ' + c.name + ' may be byzantine (trust '+c.trust+')');
    } else {
      c.trust -= 10;
      log('bad','rumor misfires on honest ' + c.name);
    }
  }
  render();
}

// ---- Pure reducer: returns {state, events} without mutating ----
// For replay evidence only — live game uses the mutation path above
function reducer(stateIn, action){
  const next = JSON.parse(JSON.stringify(stateIn));
  const events = [];
  if (action.kind === 'prepare' || action.kind === 'commit' || action.kind === 'rumor'){
    events.push({ t: next.beat, actor: 'you', kind: action.kind, target: action.target });
  }
  return { state: next, events, done: false };
}

function runBeatLoop(){
  if (!game.active) return;
  game.beat = (game.beat + 1) % 100;
  // Beat window: perfect at 60-70, safe 50-80, heating < 50, falling > 80
  if (game.beat < 50) game.beatMode = 'heating';
  else if (game.beat <= 60) game.beatMode = 'rising';
  else if (game.beat <= 70) game.beatMode = 'perfect';
  else if (game.beat <= 80) game.beatMode = 'falling';
  else if (game.beat < 95) game.beatMode = 'missed';
  else {
    // window closed without commit
    failRound('beat window closed');
    return;
  }
  // Saboteur AI — periodically try to flip trust or corrupt
  if (game.beat % 14 === 0){
    saboteurTurn();
  }
  // Glow decay
  game.commanders.forEach(c => c.glow = Math.max(0, c.glow - 0.08));
  render();
  if (game.active) setTimeout(runBeatLoop, 120);
}

function saboteurTurn(){
  const faulty = game.commanders.filter(c => c.faulty);
  if (!faulty.length) return;
  if (game.saboteurStrategy === 'concentrate'){
    // focus damage on most-trusted honest
    const honest = game.commanders.filter(c => !c.faulty).sort((a,b)=>b.trust-a.trust);
    if (honest[0]){ honest[0].trust -= 8;
      log('bad', 'saboteur erodes trust in ' + honest[0].name); }
  } else if (game.saboteurStrategy === 'scatter'){
    game.commanders.forEach(c => { if (!c.faulty) c.trust -= 2; });
    log('bad','saboteur scatters misinformation');
  } else if (game.saboteurStrategy === 'mimic'){
    // revive a previously exposed faulty
    faulty.forEach(c => c.trust = Math.min(100, c.trust + 20));
    log('bad','saboteur launders reputation');
  }
}

function commit(){
  if (!game.active) return;
  // Count valid commits considering quorum rules
  const commits = game.commanders.filter(c => c.committed && !c.faulty).length;
  const ok = commits >= NEED_COMMITS;
  let grade = 'missed';
  let delta = 0;
  const b = game.beat;
  if (b >= 60 && b <= 70){
    grade = 'perfect';
    delta = ok ? 500 : 250;
  } else if (b >= 50 && b <= 80){
    grade = 'good';
    delta = ok ? 300 : 100;
  } else if (b >= 40 && b <= 90){
    grade = 'late';
    delta = ok ? 150 : 0;
  } else {
    grade = 'missed'; delta = 0;
  }
  // Soft/hard pity — after N missed rounds, buff next grading
  if (grade === 'missed' || !ok){
    game.pity++;
    if (game.pity >= 3){
      delta = Math.max(delta, 50 * game.pity);
      log('info','pity counter '+game.pity+' — partial score granted');
    }
    if (game.pity >= 6){
      log('good','HARD PITY triggers — next round guaranteed one honest reveal');
      const hidden = game.commanders.find(c => c.faulty && c.trust > 50);
      if (hidden){ hidden.trust = 0; }
      game.pity = 0;
    }
  } else {
    game.pity = 0;
  }
  game.score += delta;
  log(grade === 'perfect' ? 'perfect' : ok ? 'good' : 'bad',
      `commit ${grade.toUpperCase()} — commits=${commits}/${NEED_COMMITS} — +${delta}`);
  game.history.push({ round: game.round, grade, commits, beat: b, delta, ok });
  game.active = false;
  document.getElementById('commitBtn').disabled = true;
  // round end: partial heal
  game.partitioned.clear();
  game.commanders.forEach(c => { c.partitioned = false; });
  game.round++;
  render();
}

function failRound(reason){
  log('bad','round failed: ' + reason);
  game.active = false;
  game.pity++;
  game.history.push({ round: game.round, grade: 'missed', reason, delta: 0 });
  game.round++;
  game.partitioned.clear();
  game.commanders.forEach(c => { c.partitioned = false; });
  document.getElementById('commitBtn').disabled = true;
  render();
}

function abort(){
  if (!game.active) return;
  failRound('aborted by commander');
}

function log(cls, msg){
  game.log.push({ cls, msg, t: Date.now() });
  if (game.log.length > 60) game.log.shift();
}

// ---------- Rendering ----------
const bc = document.getElementById('boardCanvas');
const bctx = bc.getContext('2d');

function render(){
  // HUD
  document.getElementById('roundNum').textContent = Math.min(game.round, game.maxRounds);
  document.getElementById('scoreNum').textContent = game.score;
  document.getElementById('beatBar').style.setProperty('--w', game.beat + '%');
  document.getElementById('pityBar').style.setProperty('--w', Math.min(100, game.pity*16) + '%');
  document.getElementById('budgetBar').style.setProperty('--w', (game.budget/6)*100 + '%');
  document.getElementById('modeReadout').textContent = game.active ? game.beatMode : 'idle';
  const okCommits = game.commanders.filter(c => c.committed && !c.faulty).length;
  document.getElementById('quorumReadout').textContent =
    'commits ' + okCommits + '/' + NEED_COMMITS + ' (f=' + F + ')';

  // Roster
  document.getElementById('roster').innerHTML =
    game.commanders.map(c => `
      <div class="row ${c.faulty&&c.trust<40?'faulty':''} ${c.partitioned?'partitioned':''}">
        <div class="idbox">${c.id}</div>
        <div>${c.name}${c.prepared?' ✓P':''}${c.committed?' ✓C':''}</div>
        <div style="color:var(--muted)">trust ${c.trust}</div>
        <div style="color:var(--muted)">${c===game.commanders[game.target]?'◀':''}</div>
      </div>`).join('');

  // Action queue
  document.getElementById('actionQueue').innerHTML =
    game.queue.slice(-10).map(a =>
      `<li>${a.kind} → ${game.commanders[a.target].name} @${a.at}</li>`).join('');

  // Status effects
  document.getElementById('statusEffects').innerHTML =
    `saboteur strategy: <b>${game.saboteurStrategy}</b><br>` +
    `active partitions: ${game.partitioned.size}<br>` +
    `pity counter: ${game.pity}<br>` +
    `mode: ${game.beatMode}`;

  // Log
  document.getElementById('gameLog').innerHTML =
    game.log.slice().reverse().map(e =>
      `<li class="${e.cls}">${e.msg}</li>`).join('');

  renderBoard();
}

function renderBoard(){
  const W = bc.width, H = bc.height;
  bctx.fillStyle = '#0f1117'; bctx.fillRect(0,0,W,H);
  const cx = W/2, cy = H/2, R = 190;
  // background rings per beat zone
  const beatFrac = game.beat / 100;
  // perfect zone arc
  bctx.strokeStyle = 'rgba(139,250,255,0.4)';
  bctx.lineWidth = 6;
  bctx.beginPath();
  bctx.arc(cx, cy, R + 40,
    Math.PI*(0.6*2 - 0.5), Math.PI*(0.7*2 - 0.5));
  bctx.stroke();
  // good zone
  bctx.strokeStyle = 'rgba(110,231,183,0.2)';
  bctx.lineWidth = 3;
  bctx.beginPath();
  bctx.arc(cx, cy, R + 40,
    Math.PI*(0.5*2 - 0.5), Math.PI*(0.8*2 - 0.5));
  bctx.stroke();
  // beat indicator
  const beatAngle = Math.PI * (beatFrac*2 - 0.5);
  const bx = cx + Math.cos(beatAngle)*(R + 40);
  const by = cy + Math.sin(beatAngle)*(R + 40);
  bctx.fillStyle = game.beatMode === 'perfect' ? '#8bfaff' :
    game.beatMode === 'rising' || game.beatMode === 'falling' ? '#6ee7b7' :
    game.beatMode === 'missed' ? '#ef7a7a' : '#f4c17a';
  bctx.shadowColor = bctx.fillStyle; bctx.shadowBlur = 20;
  bctx.beginPath(); bctx.arc(bx, by, 9, 0, Math.PI*2); bctx.fill();
  bctx.shadowBlur = 0;
  // partition lines (red X)
  for (const key of game.partitioned){
    const [ia,ib] = key.split('-').map(Number);
    const a = game.commanders[ia], b = game.commanders[ib];
    const ax = cx + Math.cos(a.angle)*R, ay = cy + Math.sin(a.angle)*R;
    const bxp = cx + Math.cos(b.angle)*R, byp = cy + Math.sin(b.angle)*R;
    bctx.strokeStyle = 'rgba(239,122,122,0.5)';
    bctx.setLineDash([4,6]); bctx.beginPath();
    bctx.moveTo(ax,ay); bctx.lineTo(bxp,byp); bctx.stroke();
    bctx.setLineDash([]);
  }
  // commanders
  for (const c of game.commanders){
    const x = cx + Math.cos(c.angle)*R, y = cy + Math.sin(c.angle)*R;
    const pulse = 4 + Math.sin(Date.now()*0.003 + c.idx)*1.5 + c.glow*6;
    bctx.fillStyle = c.trust < 40 && c.faulty ? '#ef7a7a' :
      c.committed ? '#8bfaff' : c.prepared ? '#6ee7b7' : '#d6dae4';
    bctx.shadowColor = bctx.fillStyle; bctx.shadowBlur = 10 + c.glow*15;
    bctx.beginPath(); bctx.arc(x, y, 18 + pulse*0.35, 0, Math.PI*2); bctx.fill();
    bctx.shadowBlur = 0;
    bctx.fillStyle = '#0f1117';
    bctx.font = 'bold 14px ui-monospace';
    bctx.textAlign = 'center'; bctx.textBaseline = 'middle';
    bctx.fillText(c.id, x, y);
    // name outside
    bctx.fillStyle = c === game.commanders[game.target] ? '#6ee7b7' : '#d6dae4';
    bctx.font = '11px ui-monospace';
    bctx.fillText(c.name, x + Math.cos(c.angle)*34, y + Math.sin(c.angle)*34);
    // trust bar
    bctx.fillStyle = '#2c3040';
    bctx.fillRect(x-18, y+28, 36, 3);
    bctx.fillStyle = c.trust>60 ? '#6ee7b7' : c.trust>30 ? '#f4c17a' : '#ef7a7a';
    bctx.fillRect(x-18, y+28, 36 * (c.trust/100), 3);
  }
  // center quorum gauge
  const okCommits = game.commanders.filter(c => c.committed && !c.faulty).length;
  bctx.fillStyle = '#242837';
  bctx.beginPath(); bctx.arc(cx, cy, 50, 0, Math.PI*2); bctx.fill();
  bctx.fillStyle = okCommits >= NEED_COMMITS ? '#6ee7b7' : '#f4c17a';
  bctx.font = 'bold 24px ui-monospace';
  bctx.textAlign='center'; bctx.textBaseline='middle';
  bctx.fillText(okCommits + '/' + NEED_COMMITS, cx, cy-4);
  bctx.font = '10px ui-monospace';
  bctx.fillStyle = '#6b7080';
  bctx.fillText('commit quorum', cx, cy+16);
  // round text
  bctx.fillStyle = '#6b7080';
  bctx.font = '11px ui-monospace';
  bctx.textAlign = 'left';
  bctx.fillText('round ' + Math.min(game.round,game.maxRounds) + '/' + game.maxRounds,
    16, 22);
  bctx.fillText('mode ' + game.beatMode, 16, 38);
  bctx.fillText('score ' + game.score, 16, 54);
  // right column
  bctx.textAlign = 'right';
  bctx.fillText('sabotage: ' + game.saboteurStrategy, W-16, 22);
  bctx.fillText('partitions: ' + game.partitioned.size, W-16, 38);
  bctx.fillText('budget: ' + game.budget, W-16, 54);
}

// ---------- Input ----------
document.getElementById('beginBtn').onclick = beginRound;
document.getElementById('commitBtn').onclick = commit;
document.getElementById('abortBtn').onclick = abort;
document.getElementById('newGameBtn').onclick = newGame;

window.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key;
  if (k >= '1' && k <= '7'){
    game.target = parseInt(k,10) - 1;
    render();
  } else if (k === 's' || k === 'S'){
    queueAction('prepare', game.target);
  } else if (k === 'c' || k === 'C'){
    queueAction('commit', game.target);
  } else if (k === 'r' || k === 'R'){
    queueAction('rumor', game.target);
  } else if (k === ' '){
    e.preventDefault(); if (!document.getElementById('commitBtn').disabled) commit();
  } else if (k === 'Enter'){
    beginRound();
  }
});

// initial paint loop (for commander glow pulse even when idle)
function paintLoop(){ renderBoard(); requestAnimationFrame(paintLoop); }
paintLoop();

newGame();