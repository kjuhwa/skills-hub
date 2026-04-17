const { useState, useEffect, useRef, useMemo, useCallback, memo } = React;

// --- deterministic PRNG (xorshift32) — see fnv1a-xorshift-text-to-procedural-seed ---
function xorshift32(seed) {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

// --- simulated cluster model ---
const TOPICS = [
  { name: 'orders.v1', partitions: 12, classOfData: 'metric-history', retention: 'cluster' },
  { name: 'metrics.1m', partitions: 6, classOfData: 'scatter', retention: '60s' },
  { name: 'audit.events', partitions: 3, classOfData: 'audit', retention: '7d' },
  { name: 'telemetry.raw', partitions: 24, classOfData: 'high-volume', retention: 'cluster' },
  { name: 'dlq.poison', partitions: 2, classOfData: 'dlq', retention: '30d' },
  { name: 'rebalance.ctrl', partitions: 1, classOfData: 'ctrl', retention: '1d' },
];
const GROUPS = [
  { id: 'cg-orders-shipper', topics: ['orders.v1'], members: 4, style: 'batch' },
  { id: 'cg-metrics-reducer', topics: ['metrics.1m', 'telemetry.raw'], members: 6, style: 'semaphore' },
  { id: 'cg-audit-sink', topics: ['audit.events'], members: 2, style: 'standard' },
  { id: 'cg-dlq-triage', topics: ['dlq.poison'], members: 1, style: 'errorhandling' },
  { id: 'cg-heat-bench', topics: ['telemetry.raw'], members: 3, style: 'uuid' },
];

function initCluster(seed) {
  const rnd = xorshift32(seed);
  const partitions = [];
  TOPICS.forEach((t, ti) => {
    for (let p = 0; p < t.partitions; p++) {
      partitions.push({
        topic: t.name,
        partition: p,
        ti,
        hwm: Math.floor(1000 + rnd() * 50000),
        lso: Math.floor(1000 + rnd() * 40000),
        rate: 40 + rnd() * 400,
        owner: null,
        watermark: Date.now() - rnd() * 120000,
        checkpoint: Date.now() - rnd() * 60000,
        lag: 0,
      });
    }
  });
  return partitions;
}

// --- rebalance: consistent-hashing ring assigns partitions to members ---
function rebalance(partitions, group, ring) {
  const members = [];
  for (let i = 0; i < group.members; i++) {
    members.push(`${group.id}-m${i}`);
  }
  partitions.forEach((p) => {
    if (!group.topics.includes(p.topic)) return;
    const key = `${p.topic}-${p.partition}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % members.length;
    p.owner = members[idx];
  });
}

function tickCluster(partitions, dt, clock) {
  partitions.forEach((p) => {
    p.hwm += p.rate * dt * (0.8 + Math.sin(clock * 0.4 + p.partition) * 0.2);
    const consumeRate = p.rate * (0.7 + Math.cos(clock * 0.3 + p.ti) * 0.25);
    p.lso += consumeRate * dt;
    if (p.lso > p.hwm) p.lso = p.hwm;
    p.lag = Math.max(0, p.hwm - p.lso);
    if (Math.random() < 0.02) p.watermark = Date.now();
    if (Math.random() < 0.005) p.checkpoint = Date.now();
  });
}

// --- Canvas scene: tidepool rendering (flowfield + sine silhouettes) ---
const ReefCanvas = memo(function ReefCanvas({ partitions, selectedGroup, onHover, playing, clock }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ particles: [], last: performance.now() });

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr; c.height = r.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const st = stateRef.current;
    // seed particles — canvas-flowfield-particle-advection
    if (st.particles.length === 0) {
      for (let i = 0; i < 140; i++) {
        st.particles.push({
          x: Math.random() * 1000, y: Math.random() * 700,
          vx: 0, vy: 0, life: Math.random() * 400, hue: 185 + Math.random() * 30,
        });
      }
    }
    const draw = (now) => {
      const dt = Math.min(0.05, (now - st.last) / 1000);
      st.last = now;
      const w = c.clientWidth, h = c.clientHeight;
      // alpha overpaint trail — canvas-trail-fade-vs-clear
      ctx.fillStyle = 'rgba(10, 14, 26, 0.22)';
      ctx.fillRect(0, 0, w, h);

      // --- horizon silhouettes — parallax-sine-silhouette-horizon ---
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const y0 = h * (0.62 + layer * 0.09);
        ctx.moveTo(0, y0);
        for (let x = 0; x <= w; x += 20) {
          const y = y0 + Math.sin((x + now * 0.02) * 0.008 + layer) * (8 + layer * 4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
        ctx.fillStyle = `rgba(17, 26, 46, ${0.35 + layer * 0.15})`;
        ctx.fill();
      }

      // --- partition tidepools ---
      const activePartitions = partitions.filter((p) => {
        if (!selectedGroup) return true;
        return GROUPS.find((g) => g.id === selectedGroup)?.topics.includes(p.topic);
      });
      const cols = 10;
      const cellW = Math.min(90, w / cols);
      activePartitions.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = 40 + col * cellW + cellW / 2;
        const cy = 60 + row * 80;
        const lagPct = Math.min(1, p.lag / 20000);
        // incommensurate-sine-organic-flicker
        const flick = Math.sin(now * 0.003 + p.partition) * 0.4
                    + Math.sin(now * 0.0071 + p.ti) * 0.3
                    + Math.sin(now * 0.0133 + p.partition * 1.7) * 0.3;
        const r = 18 + flick * 3 + lagPct * 10;
        const hue = 195 - lagPct * 60;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
        grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0.9)`);
        grad.addColorStop(0.5, `hsla(${hue}, 80%, 50%, 0.4)`);
        grad.addColorStop(1, 'hsla(200, 60%, 30%, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, r * 2, 0, Math.PI * 2); ctx.fill();

        // crescent watermark — availability-ttl-punctuate-processor
        const wmAge = (Date.now() - p.watermark) / 1000;
        if (wmAge < 3) {
          ctx.strokeStyle = `rgba(160, 128, 255, ${1 - wmAge / 3})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, r + 4 + wmAge * 8, 0, Math.PI * 2); ctx.stroke();
        }
        // checkpoint ripple
        const cpAge = (Date.now() - p.checkpoint) / 1000;
        if (cpAge < 5) {
          ctx.strokeStyle = `rgba(124, 255, 192, ${0.6 - cpAge / 8})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, r + 12 + cpAge * 10, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.fillStyle = 'rgba(215, 229, 255, 0.6)';
        ctx.font = '9px monospace';
        ctx.fillText(`${p.topic.slice(0, 7)}/${p.partition}`, cx - 22, cy + r + 14);
      });

      // --- flowfield particles ---
      st.particles.forEach((part) => {
        const angle = Math.sin(part.x * 0.006 + now * 0.0007) + Math.cos(part.y * 0.004 - now * 0.0005);
        part.vx = part.vx * 0.92 + Math.cos(angle) * 0.4;
        part.vy = part.vy * 0.92 + Math.sin(angle) * 0.4;
        part.x += part.vx; part.y += part.vy; part.life -= dt * 60;
        if (part.x < 0 || part.x > w || part.y < 0 || part.y > h || part.life < 0) {
          part.x = Math.random() * w; part.y = Math.random() * h;
          part.life = 200 + Math.random() * 300;
        }
        ctx.fillStyle = `hsla(${part.hue}, 90%, 65%, 0.4)`;
        ctx.fillRect(part.x, part.y, 1.2, 1.2);
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, partitions, selectedGroup]);

  const handleMove = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    // canvas-event-coord-devicepixel-rescale
    const x = (e.clientX - r.left) * (canvasRef.current.width / r.width);
    const y = (e.clientY - r.top) * (canvasRef.current.height / r.height);
    onHover({ x, y });
  };

  return <canvas ref={canvasRef} onMouseMove={handleMove} />;
});

// --- Sidebar: group list ---
const GroupList = memo(function GroupList({ groups, partitions, selected, onSelect }) {
  return (
    <div>
      <h2>Consumer Groups</h2>
      {groups.map((g) => {
        const lag = partitions
          .filter((p) => g.topics.includes(p.topic))
          .reduce((s, p) => s + p.lag, 0);
        return (
          <div
            key={g.id}
            className={`group-row ${selected === g.id ? 'active' : ''}`}
            onClick={() => onSelect(g.id)}
          >
            <div className="dot" />
            <div className="name">{g.id}</div>
            <div className="lag">{Math.round(lag / 1000)}k</div>
          </div>
        );
      })}
    </div>
  );
});

// --- Inspector: selected group detail + partition grid ---
const Inspector = memo(function Inspector({ group, partitions }) {
  if (!group) {
    return (
      <div>
        <h2>Inspector</h2>
        <div style={{ color: 'var(--muted)', fontSize: 11 }}>
          Select a consumer group to inspect partition ownership, lag, and checkpoints.
        </div>
        <h2 style={{ marginTop: 24 }}>Topology Notes</h2>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
          Partition counts are asymmetric per <span className="chip">kafka-partition-topology-design</span>.
          Group ids derive from stable hostnames per <span className="chip">kafka-consumer-group-id-hostname-not-timezone</span>.
        </div>
      </div>
    );
  }
  const owned = partitions.filter((p) => group.topics.includes(p.topic));
  const totalLag = owned.reduce((s, p) => s + p.lag, 0);
  const maxLag = owned.reduce((m, p) => Math.max(m, p.lag), 1);
  const rebalances = owned.filter((p) => Date.now() - p.watermark < 2000).length;
  return (
    <div>
      <h2>Group: {group.id}</h2>
      <div className="kv"><span className="k">members</span><span className="v">{group.members}</span></div>
      <div className="kv"><span className="k">style</span><span className="v">{group.style}</span></div>
      <div className="kv"><span className="k">topics</span><span className="v">{group.topics.length}</span></div>
      <div className="kv"><span className="k">partitions</span><span className="v">{owned.length}</span></div>
      <div className="kv"><span className="k">total lag</span><span className="v">{totalLag.toLocaleString()}</span></div>
      <div className="kv"><span className="k">rebalancing</span><span className="v">{rebalances}</span></div>

      <h2>Partitions</h2>
      <div className="partition-grid">
        {owned.slice(0, 24).map((p) => {
          const lagPct = Math.min(1, p.lag / maxLag);
          const hot = lagPct > 0.7;
          const cold = lagPct < 0.1;
          return (
            <div
              key={`${p.topic}-${p.partition}`}
              className={`partition-cell ${hot ? 'hot' : ''} ${cold ? 'cold' : ''}`}
              title={`${p.topic}/${p.partition} lag=${Math.round(p.lag)}`}
            >
              <div className="hwm" style={{ top: '10%' }} />
              <div className="lso" style={{ top: `${10 + lagPct * 80}%` }} />
              <div className="label">{p.partition}</div>
            </div>
          );
        })}
      </div>

      <h2>Envelope</h2>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
        <span className="chip">SNAPSHOT</span>
        <span className="chip">DELTA</span>
        <span className="chip">ACK</span>
        <span className="chip">ERROR</span>
        uniform via <span className="skill-tag">feed-envelope-frame</span>
      </div>

      <h2>Applied Skills</h2>
      <div>
        {[
          'kafka-batch-consumer-partition-tuning',
          'kafka-consumer-semaphore-chunking',
          'kafka-consumer-errorhandling-wrapper',
          'kafka-consumer-tenant-fan-out',
          'kafka-message-header-metadata',
          'kafka-debounce-event-coalescing',
          'thread-pool-queue-backpressure',
          'consistent-hashing-visualization-pattern',
          'consistent-hashing-data-simulation',
          'availability-ttl-punctuate-processor',
          'second-aggregation-snapshot-merge',
        ].map((s) => <span key={s} className="skill-tag">{s}</span>)}
      </div>
    </div>
  );
});

// --- Timeline: scrolling event log ---
function Timeline({ events }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);
  return (
    <div className="timeline">
      <h2>Event Stream — feed-envelope-frame</h2>
      <div className="events" ref={ref}>
        {events.map((e, i) => (
          <div key={i} className={`event ${e.type}`}>
            <span className="ts">{new Date(e.ts).toISOString().slice(11, 23)}</span>
            <span className="t">{e.type}</span>
            <span className="msg">
              <span className="chip">{e.topic || 'cluster'}</span>
              {e.partition !== undefined ? <span className="chip">p{e.partition}</span> : null}
              {e.group ? <span className="chip">{e.group}</span> : null}
              {e.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Header strip ---
function Header({ partitions, playing, onToggle, onReseed, speed, onSpeed }) {
  const totalLag = partitions.reduce((s, p) => s + p.lag, 0);
  const totalHwm = partitions.reduce((s, p) => s + p.hwm, 0);
  const partitionCount = partitions.length;
  const topics = TOPICS.length;
  return (
    <div className="header">
      <h1>◈ OFFSET TIDEPOOL ATLAS</h1>
      <span className="sub">
        message queue · partition offset · consumer group · rebalance · lag · watermark · checkpoint
      </span>
      <div className="metrics">
        <div className="metric-pill"><span className="k">topics</span><span className="v">{topics}</span></div>
        <div className="metric-pill"><span className="k">partitions</span><span className="v">{partitionCount}</span></div>
        <div className="metric-pill"><span className="k">hwm Σ</span><span className="v">{(totalHwm / 1e6).toFixed(2)}M</span></div>
        <div className="metric-pill"><span className="k">lag Σ</span><span className="v">{(totalLag / 1000).toFixed(1)}k</span></div>
        <div className="controls">
          <button className={`ctrl ${playing ? 'active' : ''}`} onClick={onToggle}>{playing ? 'pause' : 'play'}</button>
          <button className="ctrl" onClick={onReseed}>reseed</button>
          <button className="ctrl" onClick={() => onSpeed(speed === 1 ? 3 : 1)}>{speed}×</button>
        </div>
      </div>
    </div>
  );
}

// --- Root ---
function App() {
  const [seed, setSeed] = useState(1337);
  const [partitions, setPartitions] = useState(() => initCluster(1337));
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState('cg-metrics-reducer');
  const [events, setEvents] = useState([]);
  const [clock, setClock] = useState(0);

  // initial rebalance for all groups
  useEffect(() => {
    GROUPS.forEach((g) => rebalance(partitions, g));
  }, []);

  // tick loop — deterministic pulse — message-queue-data-simulation
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPartitions((prev) => {
        const next = prev.map((p) => ({ ...p }));
        tickCluster(next, 0.25 * speed, clock);
        return next;
      });
      setClock((c) => c + 0.25 * speed);
    }, 250);
    return () => clearInterval(id);
  }, [playing, speed, clock]);

  // event emission — retry-strategy + circuit-breaker + dlq triage
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const rnd = Math.random();
      const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)].name;
      const partition = Math.floor(Math.random() * 12);
      let ev;
      if (rnd < 0.15) {
        ev = { type: 'rebalance', topic, partition, group: GROUPS[Math.floor(Math.random() * GROUPS.length)].id,
               msg: 'ring rotation — consistent-hashing-data-simulation', ts: Date.now() };
      } else if (rnd < 0.35) {
        ev = { type: 'commit', topic, partition, group: selected, msg: 'checkpoint commit — idempotency-visualization-pattern', ts: Date.now() };
      } else if (rnd < 0.75) {
        ev = { type: 'produce', topic, partition, msg: 'gzip avro batch 30MB cap — kafka-avro-producer-gzip-30mb', ts: Date.now() };
      } else if (rnd < 0.9) {
        ev = { type: 'watermark', topic, partition, msg: 'punctuate wall-clock TTL — availability-ttl-punctuate-processor', ts: Date.now() };
      } else {
        ev = { type: 'dlq', topic: 'dlq.poison', partition: 0, msg: 'poison record isolated — kafka-consumer-errorhandling-wrapper', ts: Date.now() };
      }
      setEvents((es) => [...es.slice(-120), ev]);
    }, 420);
    return () => clearInterval(id);
  }, [playing, selected]);

  const handleReseed = useCallback(() => {
    const s = Math.floor(Math.random() * 1e9);
    setSeed(s);
    const fresh = initCluster(s);
    GROUPS.forEach((g) => rebalance(fresh, g));
    setPartitions(fresh);
    setEvents((es) => [...es, { type: 'rebalance', msg: `reseed ${s} — full cluster rebalance`, ts: Date.now() }]);
  }, []);

  const onHover = useCallback(() => {}, []);
  const selectedGroup = GROUPS.find((g) => g.id === selected);

  return (
    <div className="app">
      <Header
        partitions={partitions}
        playing={playing}
        onToggle={() => setPlaying((p) => !p)}
        onReseed={handleReseed}
        speed={speed}
        onSpeed={setSpeed}
      />
      <aside className="sidebar">
        <GroupList groups={GROUPS} partitions={partitions} selected={selected} onSelect={setSelected} />
        <h2 style={{ marginTop: 18 }}>Topics</h2>
        {TOPICS.map((t) => (
          <div key={t.name} className="group-row">
            <div className="dot" style={{ background: 'var(--muted)', boxShadow: 'none' }} />
            <div className="name">{t.name}</div>
            <div className="lag" style={{ color: 'var(--muted)' }}>{t.partitions}p</div>
          </div>
        ))}
        <h2 style={{ marginTop: 18 }}>Controls</h2>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.8 }}>
          <div>▶ spacebar · toggle playback</div>
          <div>⟲ R · reseed cluster</div>
          <div>⟳ click group · inspect</div>
        </div>
      </aside>
      <section className="canvas-wrap">
        <ReefCanvas
          partitions={partitions}
          selectedGroup={selected}
          onHover={onHover}
          playing={playing}
          clock={clock}
        />
        <div className="canvas-overlay">
          viewing <span className="hot">{selectedGroup?.id}</span> over {selectedGroup?.topics.join(', ')}<br />
          seed <span className="hot">{seed}</span> · clock <span className="hot">{clock.toFixed(1)}s</span>
        </div>
        <div className="legend">
          <div className="sw" style={{ color: 'var(--accent)' }}>hwm</div>
          <div className="sw" style={{ color: 'var(--warn)' }}>lag</div>
          <div className="sw" style={{ color: '#a080ff' }}>watermark</div>
          <div className="sw" style={{ color: 'var(--ok)' }}>checkpoint</div>
        </div>
      </section>
      <aside className="inspector">
        <Inspector group={selectedGroup} partitions={partitions} />
      </aside>
      <Timeline events={events} />
    </div>
  );
}

// keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); document.querySelector('button.ctrl')?.click(); }
});

ReactDOM.createRoot(document.getElementById('root')).render(<App />);