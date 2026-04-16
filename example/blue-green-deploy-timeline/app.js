const deploys = [
  { id:1, time:'2026-04-16 09:12', ver:'v3.8.0', env:'green', status:'ok', dur:42,
    detail:'Deployed 3 services. Health checks passed in 12s.\nTraffic cutover at 09:12:42.\nZero errors during switch.' },
  { id:2, time:'2026-04-16 07:45', ver:'v3.7.2', env:'blue', status:'ok', dur:38,
    detail:'Hotfix for payment timeout.\nCanary at 5% for 10m, then full cutover.\nP99 latency dropped from 820ms to 210ms.' },
  { id:3, time:'2026-04-15 22:10', ver:'v3.7.1', env:'green', status:'err', dur:15,
    detail:'Deploy failed health check after 15s.\nError: connection pool exhausted on db-replica-2.\nAutomatic rollback triggered.' },
  { id:4, time:'2026-04-15 22:11', ver:'v3.7.0', env:'blue', status:'roll', dur:3,
    detail:'Rollback to v3.7.0 on blue.\nTraffic restored in 3s.\nIncident INC-4412 opened.' },
  { id:5, time:'2026-04-15 16:30', ver:'v3.7.0', env:'blue', status:'ok', dur:55,
    detail:'Major release — new dashboard module.\n12 containers replaced.\nSoak test ran 20m with 0.00% error rate.' },
  { id:6, time:'2026-04-15 11:00', ver:'v3.6.5', env:'green', status:'ok', dur:30,
    detail:'Dependency bump (lodash, axios).\nNo behavior changes. Smoke tests green.' },
  { id:7, time:'2026-04-14 14:20', ver:'v3.6.4', env:'blue', status:'ok', dur:48,
    detail:'Database migration included.\nBlue/green DB schema compatible.\nRollback window extended to 2h.' },
];

const timeline = document.getElementById('timeline');
const detail = document.getElementById('detail');

function statusTag(s) {
  const map = { ok: ['SUCCESS','ok'], err: ['FAILED','err'], roll: ['ROLLBACK','roll'] };
  const [label, cls] = map[s];
  return `<span class="tag ${cls}">${label}</span>`;
}

deploys.forEach(d => {
  const el = document.createElement('div');
  el.className = `event ${d.env}${d.status === 'err' ? ' fail' : ''}`;
  el.innerHTML = `
    <div class="dot"></div>
    <div class="time">${d.time}</div>
    <div class="title">${d.ver} → ${d.env.charAt(0).toUpperCase() + d.env.slice(1)} ${statusTag(d.status)}</div>
    <div class="meta">${d.dur}s deploy time</div>`;
  el.onclick = () => {
    document.getElementById('detailTitle').textContent = `${d.ver} — ${d.env} environment`;
    document.getElementById('detailBody').textContent = d.detail;
    detail.classList.remove('hidden');
  };
  timeline.appendChild(el);
});