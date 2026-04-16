const stateEl = document.getElementById('state');
const eventsEl = document.getElementById('events');
const cmdSel = document.getElementById('command');
const btn = document.getElementById('dispatch');

let seq = 0;
let aggregate = null;
const eventLog = [];

function emit(name, data) {
  const evt = { seq: ++seq, name, data, ts: new Date().toLocaleTimeString() };
  eventLog.push(evt);
  apply(evt);
  renderEvent(evt);
}

function apply(evt) {
  switch (evt.name) {
    case 'OrderCreated': aggregate = { id: evt.data.id, status: 'Draft', items: [], version: evt.seq }; break;
    case 'ItemAdded': aggregate.items.push(evt.data.item); aggregate.version = evt.seq; break;
    case 'ItemRemoved': aggregate.items = aggregate.items.filter(i => i !== evt.data.item); aggregate.version = evt.seq; break;
    case 'OrderSubmitted': aggregate.status = 'Submitted'; aggregate.version = evt.seq; break;
    case 'OrderCancelled': aggregate.status = 'Cancelled'; aggregate.version = evt.seq; break;
  }
  stateEl.textContent = JSON.stringify(aggregate, null, 2);
}

function renderEvent(evt, err) {
  const div = document.createElement('div');
  div.className = 'event' + (err ? ' err' : '');
  div.innerHTML = `<strong>${evt.name}</strong> <span class="ts">#${evt.seq} ${evt.ts}</span><br>${JSON.stringify(evt.data)}`;
  eventsEl.prepend(div);
}

function error(msg) {
  const evt = { seq: '-', name: 'REJECTED', data: { reason: msg }, ts: new Date().toLocaleTimeString() };
  renderEvent(evt, true);
}

const items = ['Widget A', 'Gadget B', 'Module C', 'Sensor D'];
let itemIdx = 0;

btn.addEventListener('click', () => {
  const cmd = cmdSel.value;
  if (cmd === 'CreateOrder') {
    if (aggregate && aggregate.status === 'Draft') return error('Order already exists in Draft');
    emit('OrderCreated', { id: 'ORD-' + Math.random().toString(36).slice(2, 7).toUpperCase() });
  } else if (!aggregate) { return error('No aggregate — dispatch CreateOrder first'); }
  else if (cmd === 'AddItem') {
    if (aggregate.status !== 'Draft') return error('Can only add items to Draft orders');
    emit('ItemAdded', { item: items[itemIdx++ % items.length] });
  } else if (cmd === 'RemoveItem') {
    if (!aggregate.items.length) return error('No items to remove');
    emit('ItemRemoved', { item: aggregate.items[aggregate.items.length - 1] });
  } else if (cmd === 'SubmitOrder') {
    if (aggregate.status !== 'Draft') return error('Only Draft orders can be submitted');
    if (!aggregate.items.length) return error('Cannot submit empty order');
    emit('OrderSubmitted', {});
  } else if (cmd === 'CancelOrder') {
    if (aggregate.status === 'Cancelled') return error('Already cancelled');
    emit('OrderCancelled', {});
  }
});