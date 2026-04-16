const states = {
  NS_GREEN:   { a: 'g', b: 'r', duration: 5, next: 'NS_YELLOW' },
  NS_YELLOW:  { a: 'y', b: 'r', duration: 2, next: 'EW_GREEN' },
  EW_GREEN:   { a: 'r', b: 'g', duration: 5, next: 'EW_YELLOW' },
  EW_YELLOW:  { a: 'r', b: 'y', duration: 2, next: 'NS_GREEN' },
  EMERGENCY:  { a: 'r', b: 'r', duration: 4, next: null }
};

let current = 'NS_GREEN';
let countdown = states[current].duration;
let preEmergency = null;
let running = true;

const label = document.getElementById('state-label');
const timerEl = document.getElementById('timer');
const history = document.getElementById('history');

function setLights(aColor, bColor) {
  ['r','y','g'].forEach(c => {
    document.getElementById('a-' + c).classList.toggle('on', c === aColor);
    document.getElementById('b-' + c).classList.toggle('on', c === bColor);
  });
}

function enter(state) {
  const prev = current;
  current = state;
  countdown = states[current].duration;
  label.textContent = current;
  setLights(states[current].a, states[current].b);
  const d = document.createElement('div');
  d.innerHTML = `<span>${prev}</span> → <span>${current}</span>`;
  history.prepend(d);
}

function tick() {
  countdown--;
  timerEl.textContent = countdown;
  if (countdown <= 0) {
    if (current === 'EMERGENCY') {
      enter(preEmergency || 'NS_GREEN');
      preEmergency = null;
    } else {
      enter(states[current].next);
    }
  }
}

function update() {
  timerEl.textContent = countdown;
  setLights(states[current].a, states[current].b);
}

document.getElementById('emergency').onclick = () => {
  if (current === 'EMERGENCY') return;
  preEmergency = states[current].next;
  enter('EMERGENCY');
};

document.getElementById('manual').onclick = () => {
  if (current === 'EMERGENCY') {
    enter(preEmergency || 'NS_GREEN');
    preEmergency = null;
  } else {
    enter(states[current].next);
  }
};

update();
setInterval(tick, 1000);