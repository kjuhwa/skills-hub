(() => {
  const $ = id => document.getElementById(id);

  // Mood registry — keyed map, not array (registry-json-dict-not-list).
  // strategy-spi-list-to-map-autoinject analogue: lookups are O(1) by key.
  const MOODS = {
    'silver-river':    { tokens: ['silver','river','current','ripple','reflect','stream','moon','ink','hush','glide'],        scale: [0,3,5,7,10], jitterPct: 8 },
    'sleeping-fox':    { tokens: ['fox','curled','warm','breath','dream','tail','tuck','pine','ember','slow'],                scale: [0,2,4,7,9],  jitterPct: 12 },
    'mountain-bell':   { tokens: ['mountain','bell','distant','echo','peak','snow','iron','sage','toll','long'],              scale: [0,2,5,7,9],  jitterPct: 5 },
    'paper-crane':     { tokens: ['paper','crane','fold','wing','origami','drift','flutter','white','thread','wish'],         scale: [0,4,7,9,12], jitterPct: 10 },
    'forgotten-hush':  { tokens: ['forgotten','old','lullaby','quiet','dusk','veil','memory','soft','brass','low'],           scale: [0,3,5,8,10], jitterPct: 15 },
  };
  const COMMON = ['and','the','under','beside','between','across','beneath','where','carries','falls','rests','remembers','gathers','keeps'];

  // fnv1a + xorshift32 — text-to-procedural-seed
  function fnv1a(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function xors(seed) { let s = seed | 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); }; }

  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // byte-aware-sms-truncation: UTF-8 aware, ellipsis appended without overflow
  function bytesOf(s) { return new TextEncoder().encode(s).length; }
  function truncBytes(s, cap) {
    const enc = new TextEncoder();
    if (enc.encode(s).length <= cap) return s;
    const ELLIPSIS = '…';
    const elBytes = enc.encode(ELLIPSIS).length;
    const budget = cap - elBytes;
    if (budget <= 0) return '';
    let out = '';
    for (const ch of s) {
      const n = enc.encode(out + ch).length;
      if (n > budget) break;
      out += ch;
    }
    return out + ELLIPSIS;
  }

  // compact varint encoding for the packet
  function varintEncode(n) {
    const bytes = [];
    let x = n >>> 0;
    while (x >= 0x80) { bytes.push((x & 0x7f) | 0x80); x >>>= 7; }
    bytes.push(x & 0x7f);
    return bytes;
  }
  function buildPacket(meta, notes) {
    const out = [0xC7, 0x03]; // magic + version
    out.push(...varintEncode(meta.seed >>> 0));
    out.push(...varintEncode(meta.verses));
    out.push(...varintEncode(meta.tempo));
    out.push(meta.moodIdx & 0xff);
    out.push(...varintEncode(notes.length));
    for (const n of notes) {
      out.push(...varintEncode(n.pitch + 24));
      out.push(...varintEncode(Math.round(n.start * 1000)));
      out.push(...varintEncode(Math.round(n.dur * 1000)));
    }
    // CRC-ish fold
    let c = 0;
    for (const b of out) c = ((c + b) * 131) >>> 0;
    out.push(...varintEncode(c & 0xffffff));
    return out;
  }

  // identifier-truncate-with-hash-suffix
  function shortId(str, cap = 10) {
    const h = fnv1a(str).toString(16).padStart(8, '0').slice(0, 6);
    return str.length <= cap ? str : str.slice(0, cap - 7) + '-' + h;
  }

  // --- Forge ---
  function forge() {
    const seedStr = $('seed').value.trim();
    if (!seedStr) return;
    const moodKey = $('mood').value;
    const mood = MOODS[moodKey] || MOODS['silver-river']; // registry whitelist guard
    const verses = +$('verses').value;
    const tempo = +$('tempo').value;
    const cap = +$('cap').value;
    const seed = fnv1a(seedStr + '|' + moodKey + '|' + verses);
    const rand = xors(seed);

    // Lyrics
    const lines = [];
    for (let v = 0; v < verses; v++) {
      const a = pick(rand, mood.tokens);
      const b = pick(rand, mood.tokens);
      const c = pick(rand, COMMON);
      const d = pick(rand, mood.tokens);
      const line = `${capitalize(a)} ${c} ${b}, ${d}`;
      lines.push(line);
    }
    const lyrics = lines.join('\n');
    const sms = truncBytes(lyrics, cap);

    // Melody: pentatonic walk in mood scale, incommensurate-sine phrasing
    const beatSec = 60 / tempo;
    const scale = mood.scale;
    const notes = [];
    const jitter = mood.jitterPct / 100;
    let tCur = 0;
    const baseOct = 60; // C4 MIDI
    for (let v = 0; v < verses; v++) {
      const phraseLen = 6 + Math.floor(rand() * 4);
      for (let n = 0; n < phraseLen; n++) {
        const deg = scale[Math.floor(rand() * scale.length)] + (rand() < 0.2 ? 12 : 0);
        const pitch = baseOct + deg;
        const dur = beatSec * (0.5 + rand() * 0.9) * (1 + (rand() * 2 - 1) * jitter);
        notes.push({ pitch, start: tCur, dur: Math.max(0.12, dur), scaleIdx: scale.indexOf(deg % 12) });
        tCur += dur;
      }
      // verse gap
      tCur += beatSec * 1.2;
    }

    const moodIdx = Object.keys(MOODS).indexOf(moodKey);
    const packet = buildPacket({ seed, verses, tempo, moodIdx }, notes);
    const hex = packet.map(b => b.toString(16).padStart(2, '0')).join(' ');

    // avro-event-change-flag style envelope
    const envelope = {
      actionType: 'LULLABY_FORGED',
      id: shortId(seedStr.toLowerCase().replace(/\s+/g, '-')),
      seedHash: '0x' + seed.toString(16),
      changed: {
        lyrics: true,
        melody: true,
        mood: true,
        packet: true,
      },
      mock: false,
      ts: Date.now(),
    };

    // Render
    $('lyrics').textContent = lyrics;
    $('sms').textContent = sms;
    $('sms-stats').textContent = `${bytesOf(sms)} / ${cap} bytes · ${sms.length} chars`;
    $('hex').textContent = hex;
    $('hex-stats').textContent = `${packet.length} bytes · crc ${(packet.at(-1)).toString(16)}`;
    $('envelope').textContent = JSON.stringify(envelope, null, 2);
    $('fingerprint').innerHTML =
      `seed <b>0x${seed.toString(16)}</b>` +
      `<span>mood <b>${moodKey}</b></span>` +
      `<span>notes <b>${notes.length}</b></span>` +
      `<span>id <b>${envelope.id}</b></span>`;

    drawRoll(notes, tCur);
    state.notes = notes; state.tempo = tempo;
  }

  function drawRoll(notes, total) {
    const c = $('roll'), ctx = c.getContext('2d');
    const dpr = devicePixelRatio || 1;
    const r = c.getBoundingClientRect();
    c.width = r.width * dpr; c.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width, H = r.height;
    ctx.clearRect(0, 0, W, H);
    const pitchMin = Math.min(...notes.map(n => n.pitch)) - 2;
    const pitchMax = Math.max(...notes.map(n => n.pitch)) + 2;
    const rows = pitchMax - pitchMin;
    // row gridlines
    ctx.strokeStyle = '#1f2433'; ctx.lineWidth = 1;
    for (let p = pitchMin; p <= pitchMax; p++) {
      const y = H - ((p - pitchMin) / rows) * (H - 4) - 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    const colors = ['#6ee7b7','#f6c177','#9bb0ff','#f87171','#c9b5fe'];
    notes.forEach(n => {
      const x = (n.start / total) * W;
      const w = (n.dur / total) * W;
      const y = H - ((n.pitch - pitchMin) / rows) * (H - 4) - 6;
      ctx.fillStyle = colors[Math.max(0, n.scaleIdx) % colors.length];
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x + 1, y, Math.max(2, w - 2), 5);
    });
    ctx.globalAlpha = 1;
    if (state.playing) {
      const p = (performance.now() - state.playStart) / 1000;
      const x = Math.min(W, (p / total) * W);
      ctx.strokeStyle = '#e6ecff'; ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
  }

  // simple WebAudio preview — no deps
  const state = { notes: [], tempo: 58, playing: false, playStart: 0, ctxA: null };
  function play() {
    if (!state.notes.length) return;
    if (!state.ctxA) state.ctxA = new (window.AudioContext || window.webkitAudioContext)();
    state.playing = true; state.playStart = performance.now();
    const A = state.ctxA;
    const now = A.currentTime + 0.05;
    state.notes.forEach(n => {
      const freq = 440 * Math.pow(2, (n.pitch - 69) / 12);
      const osc = A.createOscillator(); const g = A.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + n.start);
      g.gain.exponentialRampToValueAtTime(0.15, now + n.start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);
      osc.connect(g).connect(A.destination);
      osc.start(now + n.start); osc.stop(now + n.start + n.dur + 0.05);
    });
    const total = state.notes.at(-1).start + state.notes.at(-1).dur;
    const frame = () => {
      if (!state.playing) return;
      drawRoll(state.notes, total);
      if ((performance.now() - state.playStart) / 1000 > total + 0.1) { state.playing = false; drawRoll(state.notes, total); return; }
      requestAnimationFrame(frame);
    };
    frame();
  }

  // mood menu populate
  const moodSel = $('mood');
  Object.keys(MOODS).forEach(k => {
    const o = document.createElement('option'); o.value = k; o.textContent = k; moodSel.appendChild(o);
  });

  // range output mirrors
  ['verses','tempo','cap'].forEach(id => {
    const inp = $(id), out = $(id + '-v');
    inp.addEventListener('input', () => { out.value = inp.value; forge(); });
  });
  $('seed').addEventListener('input', forge);
  $('mood').addEventListener('change', forge);
  $('forge').onclick = forge;
  $('reseed').onclick = () => { $('seed').value = $('seed').value + ' ' + (Math.random() * 1e4 | 0); forge(); };
  $('play').onclick = play;

  document.querySelectorAll('button[data-copy]').forEach(b => {
    b.onclick = () => {
      const target = $(b.dataset.copy);
      navigator.clipboard?.writeText(target.textContent || '').then(
        () => { const orig = b.textContent; b.textContent = 'copied'; setTimeout(() => b.textContent = orig, 900); },
        () => { b.textContent = 'err'; }
      );
    };
  });

  forge();
})();