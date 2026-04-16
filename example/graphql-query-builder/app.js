const schema = {
  User: {
    id: 'ID', name: 'String', email: 'String',
    age: 'Int', posts: '[Post]'
  },
  Post: {
    id: 'ID', title: 'String', body: 'String',
    likes: 'Int', author: 'User'
  },
  Comment: {
    id: 'ID', text: 'String', rating: 'Float'
  }
};

const mockData = {
  User: [
    { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', age: 36, posts: [{ id: 'p1', title: 'On Analytical Engines', likes: 142 }] },
    { id: '2', name: 'Alan Turing', email: 'alan@example.com', age: 41, posts: [{ id: 'p2', title: 'Computing Machinery', likes: 287 }] }
  ],
  Post: [
    { id: 'p1', title: 'GraphQL Intro', body: 'Learn queries', likes: 98 },
    { id: 'p2', title: 'Schema Design', body: 'Types matter', likes: 156 }
  ]
};

const selected = {};
const tree = document.getElementById('schema-tree');

Object.entries(schema).forEach(([type, fields]) => {
  const block = document.createElement('div');
  block.className = 'type-block';
  block.innerHTML = `<div class="type-name">${type}</div>`;
  Object.entries(fields).forEach(([name, t]) => {
    const f = document.createElement('div');
    f.className = 'field';
    f.innerHTML = `<span>${name}</span><span class="field-type">${t}</span>`;
    f.onclick = () => {
      selected[type] = selected[type] || new Set();
      if (selected[type].has(name)) { selected[type].delete(name); f.classList.remove('selected'); }
      else { selected[type].add(name); f.classList.add('selected'); }
      updateQuery();
    };
    block.appendChild(f);
  });
  tree.appendChild(block);
});

function updateQuery() {
  const parts = [];
  Object.entries(selected).forEach(([type, fields]) => {
    if (fields.size === 0) return;
    parts.push(`  ${type.toLowerCase()}s {\n    ${[...fields].join('\n    ')}\n  }`);
  });
  document.getElementById('query-output').textContent =
    parts.length ? `query {\n${parts.join('\n')}\n}` : '// Select fields from the schema';
}

document.getElementById('run-btn').onclick = () => {
  const result = {};
  Object.entries(selected).forEach(([type, fields]) => {
    if (fields.size === 0 || !mockData[type]) return;
    result[type.toLowerCase() + 's'] = mockData[type].map(item => {
      const filtered = {};
      fields.forEach(f => { if (item[f] !== undefined) filtered[f] = item[f]; });
      return filtered;
    });
  });
  document.getElementById('response-output').textContent =
    Object.keys(result).length ? JSON.stringify({ data: result }, null, 2) : '// No fields selected';
};

updateQuery();