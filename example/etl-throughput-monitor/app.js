const history = { rps: [], err: [], queue: [] };
let total = 0;
let startTime = Date.now();

const jobTemplates = [
  'sync.postgres.users',
  'kafka.events.clickstream',
  's3.logs.nginx',
  'api.stripe.charges',
  'mongo.products.catalog',
  'ftp.vendor.inventory',
];

let jobs = jobTemplates.slice(0, 4).map(createJob);

function createJob(name) {
  return {
    name,
    progress: 0,
    state: 'extract',
    rows: 0,
    rate: 50 + Math.random() * 300,
  };
}

function advanceJobs() {
  jobs.forEach(j => {
    if (j.state === 'done') return;
    j.progress += j.rate / 500;
    j.rows += Math.floor(j.rate / 10);
    if (j.progress >= 33 && j.state === 'extract') j.state = 'transform';
    else if (j.progress >= 66 && j.state === 'transform') j.state = 'load';
    if (j.progress >= 100) {
      j.progress = 100;
      j.state = 'done';
      total += j.rows;
    }
  });
  // replace done jobs
  jobs = jobs.map(j => {
    if (j.state === 'done' && Math.random() < 0.3) {
      return createJob(jobTemplates[Math.floor(Math.random() * jobTemplates.length)]);
    }
    return j;
  });
}

function renderJobs() {
  document.getElementById('jobList').innerHTML = jobs.map(j => `
    <div class="job">
      <div class="job-name">${j.name}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${j.progress}%"></div></div>
      <div class="job-state state-${j.state}">${j.state.toUpperCase()}</div>
      <div class="job-rows">${j.rows.toLocaleString()} rows</div>
    </div>
  `).join('');
}

function drawSpark(id, data, color) {
  const svg = document.getElementById(id);
  if (data.length < 2) { svg.innerHTML = ''; return; }
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = 300 / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${55 - ((v - min) / range) * 50}`).join(' ');
  const areaPts = `0,60 ${pts} 300,60`;
  svg.innerHTML = `
    <polygon points="${areaPts}" fill="${color}" fill-opacity="0.15"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2"/>
  `;
}

function pushSample(arr, v) {
  arr.push(v);
  if (arr.length > 40) arr.shift();
}

function tick() {
  advanceJobs();
  const active = jobs.filter(j => j.state !== 'done');
  const rps = active.reduce((s, j) => s + j.rate, 0);
  const errRate = Math.max(0, 1.5 + Math.sin(Date.now() / 3000) * 1.2 + (Math.random() - 0.5));
  const queue = Math.max(0, Math.floor(500 + Math.sin(Date.now() / 5000) * 300 + (Math.random() - 0.5) * 100));

  pushSample(history.rps, rps);
  pushSample(history.err, errRate);
  pushSample(history.queue, queue);

  document.getElementById('rps').textContent = Math.round(rps).toLocaleString();
  document.getElementById('err').textContent = errRate.toFixed(2) + '%';
  document.getElementById('queue').textContent = queue.toLocaleString();
  document.getElementById('total').textContent = total.toLocaleString();
  const sec = Math.floor((Date.now() - startTime) / 1000);
  document.getElementById('uptime').textContent = `uptime ${sec}s`;

  drawSpark('spark', history.rps, '#6ee7b7');
  drawSpark('spark2', history.err, '#f87171');
  drawSpark('spark3', history.queue, '#fbbf24');

  renderJobs();
}

setInterval(tick, 400);
tick();