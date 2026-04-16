const BIT_SIZE=16,HASHES=3,bits=new Uint8Array(BIT_SIZE),wordColors={};
const palette=['#6ee7b7','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb923c','#34d399','#e879f9'];
let wordList=[],ci=0;
function hash(s,seed){let h=seed;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return((h%BIT_SIZE)+BIT_SIZE)%BIT_SIZE}
function addWord(w){if(wordList.includes(w))return;wordColors[w]=palette[ci++%palette.length];wordList.push(w);
const idx=Array.from({length:HASHES},(_,i)=>hash(w,i*31+7));idx.forEach(i=>bits[i]=1);render();renderTags()}
function render(){const svg=document.getElementById('network');let html='<defs><marker id="ah" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="#4a5568"/></marker></defs>';
const wX=60,hX=350,bX=640,wGap=wordList.length>1?300/(wordList.length-1):0,hGap=300/(HASHES-1),bGap=300/(BIT_SIZE-1);
const hY=i=>50+i*hGap,bY=i=>50+i*bGap;
for(let i=0;i<HASHES;i++){html+=`<circle cx="${hX}" cy="${hY(i)}" r="18" fill="#1a1d27" stroke="#2d3348" stroke-width="1.5"/>`;html+=`<text x="${hX}" y="${hY(i)+4}" text-anchor="middle" fill="#94a3b8" font-size="11">H${i}</text>`}
for(let i=0;i<BIT_SIZE;i++){const c=bits[i]?'#6ee7b7':'#2d3348';html+=`<rect x="${bX-8}" y="${bY(i)-6}" width="16" height="12" rx="2" fill="${bits[i]?'#1a3a2a':'#1a1d27'}" stroke="${c}"/>`;html+=`<text x="${bX}" y="${bY(i)+4}" text-anchor="middle" fill="${c}" font-size="9">${i}</text>`}
wordList.forEach((w,wi)=>{const wy=50+wi*wGap,col=wordColors[w];
html+=`<text x="${wX}" y="${wy+4}" text-anchor="middle" fill="${col}" font-size="13" font-weight="600">${w}</text>`;
for(let h=0;h<HASHES;h++){const bi=hash(w,h*31+7);
html+=`<line x1="${wX+30}" y1="${wy}" x2="${hX-20}" y2="${hY(h)}" stroke="${col}" stroke-width="1" opacity=".4" marker-end="url(#ah)"/>`;
html+=`<line x1="${hX+20}" y1="${hY(h)}" x2="${bX-18}" y2="${bY(bi)}" stroke="${col}" stroke-width="1" opacity=".4" marker-end="url(#ah)"/>`}});
svg.innerHTML=html}
function renderTags(){const el=document.getElementById('words');el.innerHTML=wordList.map(w=>`<span style="color:${wordColors[w]}">${w}</span>`).join('')}
document.getElementById('addBtn').onclick=()=>{const v=document.getElementById('wordInput').value.trim();if(v){addWord(v);document.getElementById('wordInput').value=''}};
document.getElementById('wordInput').onkeydown=e=>{if(e.key==='Enter')document.getElementById('addBtn').click()};
['cat','dog','fish','bird'].forEach(addWord);