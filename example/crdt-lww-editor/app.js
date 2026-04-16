const users = ['alice', 'bob'];
const replica = {
  alice: {
    title: { value: 'Meeting Notes', ts: 1, node: 'alice' },
    body:  { value: 'Discuss roadmap.', ts: 1, node: 'alice' },
    clock: 1,
  },
  bob: {
    title: { value: 'Meeting Notes', ts: 1, node: 'alice' },
    body:  { value: 'Discuss roadmap.', ts: 1, node: 'alice' },
    clock: 1,
  },
};

function bindPanel(user) {
  const panel = document.querySelector(`[data-user="${user}"]`);
  panel.querySelectorAll('[data-field]').forEach(el => {
    el.value = replica[user][el.dataset.field].value;
    el.addEventListener('input', () => {
      replica[user].clock += 1;
      replica[user][el.dataset.field] = {
        value: el.value,
        ts: replica[user].clock,
        node: user,
      };
      updateMeta(user);
    });
  });
}

function updateMeta(user) {
  document.getElementById(`clock-${user}`).textContent = `t=${replica[user].clock}`;
  const r = replica[user];
  document.getElementById(`meta-${user}`).innerHTML =
    `title: ts=${r.title.ts}@${r.title.node}<br>body: ts=${r.body.ts}@${r.body.node}`;
}

function mergeField(a, b) {
  if (b.ts > a.ts) return b;
  if (a.ts > b.ts) return a;
  return a.node <= b.node ? a : b;
}

function sync() {
  const merged = {
    title: mergeField(replica.alice.title, replica.bob.title),
    body:  mergeField(replica.alice.body, replica.bob.body),
  };
  const clock = Math.max(replica.alice.clock, replica.bob.clock);
  for (const u of users) {
    replica[u].title = { ...merged.title };
    replica[u].body = { ...merged.body };
    replica[u].clock = clock;
    const panel = document.querySelector(`[data-user="${u}"]`);
    panel.querySelector('[data-field="title"]').value = merged.title.value;
    panel.querySelector('[data-field="body"]').value = merged.body.value;
    updateMeta(u);
  }
  const out = document.getElementById('resolvedBody');
  out.innerHTML =
    `<span class="win">title</span> → "${merged.title.value}"  (winner: ${merged.title.node} @ t=${merged.title.ts})\n` +
    `<span class="win">body</span>  → "${merged.body.value}"  (winner: ${merged.body.node} @ t=${merged.body.ts})`;
}

users.forEach(bindPanel);
users.forEach(updateMeta);
document.getElementById('sync').onclick = sync;

// seed divergence
replica.alice.clock = 3;
replica.alice.title = { value: 'Q2 Roadmap', ts: 3, node: 'alice' };
replica.bob.clock = 4;
replica.bob.body = { value: 'Ship CRDT prototype by Friday.', ts: 4, node: 'bob' };
users.forEach(u => {
  const panel = document.querySelector(`[data-user="${u}"]`);
  panel.querySelector('[data-field="title"]').value = replica[u].title.value;
  panel.querySelector('[data-field="body"]').value = replica[u].body.value;
  updateMeta(u);
});