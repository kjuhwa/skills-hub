(() => {
  const verseEl = document.getElementById('verse');
  const countEl = document.getElementById('count');
  const densityEl = document.getElementById('density');
  const moondeltaEl = document.getElementById('moondelta');
  const paletteEl = document.getElementById('palette');
  const forgeBtn = document.getElementById('forge');
  const copySvg = document.getElementById('copy-svg');
  const copyJson = document.getElementById('copy-json');
  const copyRunes = document.getElementById('copy-runes');
  const permalinkBtn = document.getElementById('permalink');
  const svgEl = document.getElementById('forge-svg');
  const runeLine = document.getElementById('rune-line');
  const logEl = document.getElementById('log');
  const status = document.getElementById('status');
  const mSeed = document.getElementById('m-seed');
  const mGlyph = document.getElementById('m-glyph');
  const mPhase = document.getElementById('m-phase');
  const mName = document.getElementById('m-name');
  const mStorm = document.getElementById('m-storm');

  const RUNES = 'ᚦᛟᛉᛇᛃᛚᚨᛋᚱᛖᛗᛒᚾᛏᚹᚠᚢᛁᛜ◐◑◒◓✧✦❂☍'.split('');
  const PALETTES = {
    copper:  {bg:'#1a0e08', star:'#f4e9c1', edge:'#c88a5b', ink:'#e7c38b'},
    lunar:   {bg:'#0e1220', star:'#ffffff', edge:'#b9c7ff', ink:'#b9c7ff'},
    indigo:  {bg:'#0b0a1a', star:'#c9b8ff', edge:'#8a7bd6', ink:'#b8adf2'},
    verdant: {bg:'#0a1a14', star:'#6ee7b7', edge:'#4aa67b', ink:'#a7e8c8'}
  };

  function fnv1a(str){
    let h = 2166136261 >>> 0;
    for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function xorshift(seed){
    let x = seed || 1;
    return () => { x ^= x<<13; x ^= x>>>17; x ^= x<<5; return ((x>>>0) % 1_000_000) / 1_000_000; };
  }

  function byteLen(s){ return new TextEncoder().encode(s).length; }
  function byteTruncate(s, limit){
    const enc = new TextEncoder();
    let bytes = enc.encode(s);
    if (bytes.length <= limit) return s;
    const suffix = '…';
    const sb = enc.encode(suffix).length;
    let lo = 0, hi = s.length;
    while (lo < hi){
      const mid = (lo+hi+1) >> 1;
      if (byteLen(s.slice(0, mid)) + sb <= limit) lo = mid; else hi = mid - 1;
    }
    return s.slice(0, lo) + suffix;
  }

  function shortHashSuffix(s){
    return (fnv1a(s) & 0xffff).toString(16).padStart(4,'0');
  }

  function forge(){
    const verse = verseEl.value.trim() || '—';
    const count = Math.min(60, Math.max(5, +countEl.value|0));
    const density = +densityEl.value/100;
    const moonDelta = +moondeltaEl.value;
    const palKey = paletteEl.value;
    const pal = PALETTES[palKey];

    const seed = fnv1a(verse + '::' + count + '::' + density + '::' + palKey);
    const rng = xorshift(seed);

    const pad = 40;
    const W = 600, H = 460;

    // place stars using flow-ish sample
    const stars = [];
    for (let i=0;i<count;i++){
      stars.push({
        id:i,
        x: pad + rng()*(W-2*pad),
        y: pad + rng()*(H-2*pad),
        m: 1.2 + rng()*2.6,
        rune: RUNES[Math.floor(rng()*RUNES.length)]
      });
    }

    // edges: nearest neighbor + density threshold
    const edges = [];
    for (let i=0;i<stars.length;i++){
      const a = stars[i];
      const near = stars
        .map((s,j)=>({j,d:Math.hypot(s.x-a.x,s.y-a.y)}))
        .filter(o=>o.j!==i)
        .sort((x,y)=>x.d-y.d).slice(0, 2);
      for (const n of near){
        if (rng() < density && n.d < 180){
          edges.push([i, n.j]);
        }
      }
    }

    // moon phase
    const phaseDeg = (moonDelta + (seed % 360)) % 360;

    // build SVG
    svgEl.innerHTML = '';
    svgEl.style.background = pal.bg;

    const bg = document.createElementNS('http://www.w3.org/2000/svg','rect');
    bg.setAttribute('width', W); bg.setAttribute('height', H); bg.setAttribute('fill', pal.bg);
    svgEl.appendChild(bg);

    // horizon silhouette
    const horizon = document.createElementNS('http://www.w3.org/2000/svg','path');
    let d = `M0 ${H} `;
    for (let x=0;x<=W;x+=12){
      const y = H - 60 + Math.sin(x*0.02 + seed*0.0001)*8 + Math.sin(x*0.04)*4;
      d += `L${x} ${y} `;
    }
    d += `L${W} ${H} Z`;
    horizon.setAttribute('d', d);
    horizon.setAttribute('fill', pal.edge);
    horizon.setAttribute('fill-opacity','0.22');
    svgEl.appendChild(horizon);

    // twin moons
    addMoon(svgEl, W*0.2, 80, 28, pal.star, phaseDeg);
    addMoon(svgEl, W*0.78, 64, 22, pal.star, (phaseDeg+moonDelta)%360);

    // edges
    for (const [i,j] of edges){
      const a = stars[i], b = stars[j];
      const ln = document.createElementNS('http://www.w3.org/2000/svg','line');
      ln.setAttribute('x1',a.x); ln.setAttribute('y1',a.y);
      ln.setAttribute('x2',b.x); ln.setAttribute('y2',b.y);
      ln.setAttribute('class','edge');
      ln.setAttribute('stroke', pal.edge);
      svgEl.appendChild(ln);
    }
    // stars
    for (const s of stars){
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',s.x); c.setAttribute('cy',s.y);
      c.setAttribute('r', s.m);
      c.setAttribute('fill', pal.star);
      c.setAttribute('class','star');
      svgEl.appendChild(c);
    }

    // name (byte-truncated + hash suffix)
    const baseName = verse.split(/\s+/).slice(0,3).join('-').toLowerCase().replace(/[^a-z0-9\-]/g,'');
    const safeName = byteTruncate(baseName, 18) + '-' + shortHashSuffix(verse);

    // runic line (3-byte variable-length metaphor — multiplex seed)
    const runeCount = 12;
    let rl = '';
    let r2 = xorshift(seed ^ 0xA5A5A5A5);
    for (let i=0;i<runeCount;i++) rl += RUNES[Math.floor(r2()*RUNES.length)];
    runeLine.textContent = rl;

    // storm risk: naive baseline-vs-current
    const stormRisk = Math.round(((seed % 91) + density*30 + (count/60)*20));
    mSeed.textContent = '0x' + seed.toString(16);
    mGlyph.textContent = RUNES[seed % RUNES.length];
    mPhase.textContent = phaseDeg + '°';
    mName.textContent = safeName;
    mStorm.textContent = stormRisk + '/100';

    const li = document.createElement('li');
    const chars = new TextEncoder().encode(verse).length;
    li.textContent = `forged · ${stars.length}★ · ${edges.length} edges · ${chars}B verse · ${pal === PALETTES.copper ? 'copper' : palKey}`;
    logEl.prepend(li);
    if (logEl.children.length > 20) logEl.lastChild.remove();
    status.textContent = `constellation "${safeName}" forged from ${chars}-byte verse · phase ${phaseDeg}°`;

    // stash state for exports
    window._forge = {verse, stars, edges, seed, safeName, pal:palKey, phaseDeg, runes:rl};
  }

  function addMoon(parent, x, y, r, color, phaseDeg){
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',r);
    c.setAttribute('fill', color);
    c.setAttribute('fill-opacity','0.85');
    g.appendChild(c);
    const mask = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    const ph = phaseDeg * Math.PI/180;
    mask.setAttribute('cx', x + Math.cos(ph)*r*0.6);
    mask.setAttribute('cy', y);
    mask.setAttribute('rx', Math.abs(Math.sin(ph))*r+1.2);
    mask.setAttribute('ry', r);
    mask.setAttribute('fill','#0b0708');
    mask.setAttribute('fill-opacity','0.85');
    g.appendChild(mask);
    parent.appendChild(g);
  }

  async function clip(text, label){
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = `copied ${label} · ${text.length} chars`;
    } catch {
      status.textContent = `clipboard blocked · select ${label} manually`;
    }
  }

  copySvg.addEventListener('click', () => {
    clip(new XMLSerializer().serializeToString(svgEl), 'SVG');
  });
  copyJson.addEventListener('click', () => {
    const s = window._forge;
    if (!s) return;
    clip(JSON.stringify({
      verse:s.verse,
      seed:s.seed,
      safeName:s.safeName,
      palette:s.pal,
      moonPhase:s.phaseDeg,
      stars:s.stars.map(x=>({x:+x.x.toFixed(1),y:+x.y.toFixed(1),m:+x.m.toFixed(2),rune:x.rune})),
      edges:s.edges
    }, null, 2), 'JSON');
  });
  copyRunes.addEventListener('click', () => {
    clip(runeLine.textContent, 'runes');
  });
  permalinkBtn.addEventListener('click', () => {
    const s = window._forge;
    if (!s) return;
    const payload = btoa(encodeURIComponent(JSON.stringify({
      v:s.verse,c:+countEl.value,d:+densityEl.value,m:+moondeltaEl.value,p:s.pal
    })));
    clip(location.href.split('#')[0] + '#' + payload, 'permalink');
  });
  forgeBtn.addEventListener('click', forge);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') forge();
  });

  // load from hash
  if (location.hash.length > 1){
    try {
      const p = JSON.parse(decodeURIComponent(atob(location.hash.slice(1))));
      if (p.v) verseEl.value = p.v;
      if (p.c) countEl.value = p.c;
      if (p.d) densityEl.value = p.d;
      if (p.m) moondeltaEl.value = p.m;
      if (p.p) paletteEl.value = p.p;
    } catch {}
  }

  forge();
})();