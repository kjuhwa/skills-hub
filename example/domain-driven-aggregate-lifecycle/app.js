const flows = {
  Order: [
    { cmd: 'CreateOrder', evt: 'OrderCreated', state: { status: 'created', items: ['Widget x2'], total: 49.98 } },
    { cmd: 'AddItem', evt: 'ItemAdded', state: { status: 'created', items: ['Widget x2', 'Gadget x1'], total: 79.97 } },
    { cmd: 'ConfirmOrder', evt: 'OrderConfirmed', state: { status: 'confirmed', items: ['Widget x2', 'Gadget x1'], total: 79.97, confirmedAt: '2026-04-16T10:30:00Z' } },
    { cmd: 'ShipOrder', evt: 'OrderShipped', state: { status: 'shipped', trackingId: 'TRK-88421' } },
    { cmd: 'DeliverOrder', evt: 'OrderDelivered', state: { status: 'delivered', deliveredAt: '2026-04-18T14:00:00Z' } },
  ],
  Customer: [
    { cmd: 'RegisterCustomer', evt: 'CustomerRegistered', state: { name: 'Jane Doe', email: 'jane@example.com', tier: 'standard' } },
    { cmd: 'VerifyEmail', evt: 'EmailVerified', state: { name: 'Jane Doe', email: 'jane@example.com', verified: true, tier: 'standard' } },
    { cmd: 'UpgradeTier', evt: 'TierUpgraded', state: { name: 'Jane Doe', tier: 'premium', since: '2026-04-16' } },
  ],
  Product: [
    { cmd: 'DefineProduct', evt: 'ProductDefined', state: { sku: 'WDG-001', name: 'Widget', price: 24.99, stock: 0 } },
    { cmd: 'Restock', evt: 'Restocked', state: { sku: 'WDG-001', name: 'Widget', price: 24.99, stock: 100 } },
    { cmd: 'ApplyDiscount', evt: 'DiscountApplied', state: { sku: 'WDG-001', price: 19.99, discount: '20%', stock: 100 } },
    { cmd: 'Discontinue', evt: 'ProductDiscontinued', state: { sku: 'WDG-001', status: 'discontinued', stock: 0 } },
  ],
};

let step = 0;
const sel = document.getElementById('aggregate');
const eventsDiv = document.getElementById('events');
const stateEl = document.getElementById('state');
const cmdBtn = document.getElementById('cmdBtn');
const resetBtn = document.getElementById('resetBtn');

function reset() { step = 0; eventsDiv.innerHTML = ''; stateEl.textContent = '{ }'; cmdBtn.textContent = 'Send Command'; updateBtn(); }
function updateBtn() {
  const f = flows[sel.value];
  cmdBtn.textContent = step < f.length ? `▶ ${f[step].cmd}` : '✓ Done';
  cmdBtn.disabled = step >= f.length;
}

cmdBtn.addEventListener('click', () => {
  const f = flows[sel.value];
  if (step >= f.length) return;
  const s = f[step];
  const div = document.createElement('div'); div.className = 'evt';
  div.innerHTML = `<span class="ts">${new Date().toLocaleTimeString()}</span>  <strong>${s.evt}</strong> ← ${s.cmd}`;
  eventsDiv.prepend(div);
  stateEl.textContent = JSON.stringify(s.state, null, 2);
  step++; updateBtn();
});
sel.addEventListener('change', reset);
resetBtn.addEventListener('click', reset);
reset();