const timeline=document.getElementById('timeline'),toolbar=document.getElementById('toolbar');
const catLabels={event:'Domain Event',command:'Command',actor:'Actor',policy:'Policy',readmodel:'Read Model'};
const seed=[
  {cat:'actor',text:'Customer'},{cat:'command',text:'Place Order'},{cat:'event',text:'Order Placed'},
  {cat:'policy',text:'When Order Placed → Reserve Stock'},{cat:'event',text:'Stock Reserved'},
  {cat:'command',text:'Process Payment'},{cat:'event',text:'Payment Processed'},
  {cat:'readmodel',text:'Order Summary View'},{cat:'policy',text:'When Payment → Send Confirmation'},
  {cat:'event',text:'Confirmation Sent'},{cat:'actor',text:'Warehouse Staff'},
  {cat:'command',text:'Ship Order'},{cat:'event',text:'Order Shipped'}
];
function createSticky(cat,text){
  const el=document.createElement('div');el.className=`sticky ${cat}`;el.draggable=true;
  el.innerHTML=`<span class="label">${catLabels[cat]}</span><span class="txt" contenteditable="true">${text}</span><button class="del">×</button>`;
  el.querySelector('.del').onclick=()=>el.remove();
  el.ondragstart=e=>{e.dataTransfer.setData('text/plain','');el._dragging=true;setTimeout(()=>el.style.opacity='.4',0)};
  el.ondragend=()=>{el.style.opacity='1';el._dragging=false};
  el.ondragover=e=>e.preventDefault();
  el.ondrop=e=>{e.preventDefault();const dragged=timeline.querySelector('[style*="opacity: 0.4"]')||timeline.querySelector('.sticky[draggable]');
    if(dragged&&dragged!==el)timeline.insertBefore(dragged,el)};
  timeline.appendChild(el);
}
seed.forEach(s=>createSticky(s.cat,s.text));
toolbar.addEventListener('click',e=>{const cat=e.target.dataset.cat;if(cat)createSticky(cat,'New '+catLabels[cat])});