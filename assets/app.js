import {esc,money,icon,ago,loadDemo,defaultDemo,saveDemo,demoMutation,shortId} from './data.js';
import {renderPage,titleConfigs,statusPill} from './views.js';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app-shell'),auth=$('#auth-screen'),guestScreen=$('#guest-screen');
const modalLayer=$('#modal-layer'),toastLayer=$('#toast-layer');
const state={mode:'demo',data:null,page:'overview',selectedTableId:null,orderFilter:'all',menuFilter:'All',search:'',guest:null,guestCategory:'All',guestCart:{},guestSuccess:null};
let authMode='login',draftCart={};
function decorate(root=document){$$('[data-icon]',root).forEach(el=>el.innerHTML=icon(el.dataset.icon));}
function toast(text,isError=false){
 const div=document.createElement('div');div.className='toast'+(isError?' error':'');div.textContent=(isError?'⚠ ':'✓ ')+text;toastLayer.appendChild(div);setTimeout(()=>div.remove(),4100);
}
async function api(action,body=null,params={}){
 const u=new URL('/api/index',location.origin);u.searchParams.set('action',action);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
 let res;
 try{res=await fetch(u,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
 catch{throw Error('Could not reach the server. Please try again.');}
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||'Request failed ('+res.status+')');
 return data;
}
function setAuthMode(mode){
 authMode=mode;const register=mode==='register';
 $('#tab-login').classList.toggle('active',!register);$('#tab-register').classList.toggle('active',register);
 $('#register-fields').hidden=!register;$('#password-hint').hidden=!register;
 $('#auth-heading').innerHTML=register?'Create your space <span>✳</span>':'Welcome back <span>👋</span>';
 $('#auth-subtitle').textContent=register?'Every great restaurant deserves a better system.':'Sign in to pick up where you left off.';
 $('#auth-submit').innerHTML=(register?'Create my restaurant':'Sign in')+' <span>↗</span>';
 $('#auth-form').querySelector('[name=password]').setAttribute('autocomplete',register?'new-password':'current-password');
 $('#auth-error').hidden=true;
}
async function loadLive(){
 const data=await api('bootstrap');
 state.mode='live';state.data=data;state.selectedTableId ||=data.tables[0]?.id||null;
 return data;
}
function enterApp(mode,data){
 state.mode=mode;state.data=data;state.page='overview';state.selectedTableId=data.tables[0]?.id||null;
 auth.hidden=true;guestScreen.hidden=true;app.hidden=false;
 render();
}
function enterDemo(){enterApp('demo',loadDemo());toast('You are exploring the interactive demo');}
async function enterLive(){const data=await loadLive();enterApp('live',data);}
async function signOut(){
 if(state.mode==='live'){try{await api('auth.logout',{});}catch(e){toast(e.message,true);}}
 app.hidden=true;guestScreen.hidden=true;auth.hidden=false;closeModal();setAuthMode('login');history.replaceState({},'',location.pathname);
}
function navTo(page){
 if(!titleConfigs[page])return;state.page=page;state.search='';state.orderFilter='all';state.menuFilter='All';
 $('#sidebar').classList.remove('open');$('#sidebar-scrim').hidden=true;
 render();window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
 if(!state.data||app.hidden)return;
 const d=state.data,page=state.page,user=d.user;
 $('#workspace-name').textContent=user.restaurant;$('#workspace-initial').textContent=user.restaurant.charAt(0).toUpperCase();
 $('#profile-name').textContent=user.name;$('#profile-role').textContent=state.mode==='demo'?'Demo workspace':user.role+' · Live';
 $('#mode-badge').textContent=state.mode==='demo'?'DEMO MODE':'LIVE DATABASE';
 $$('.nav-link').forEach(n=>n.classList.toggle('active',n.dataset.page===page));
 $('#nav-order-count').textContent=d.orders.filter(o=>['new','preparing','ready'].includes(o.status)).length;
 const [overline,title,subtitle,action,label]=titleConfigs[page];
 $('#section-label').textContent=overline;
 const greeting=()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'};
 const display=page==='overview'?greeting()+', '+esc(user.name.split(' ')[0])+' ✳':title;
 $('#page-title').innerHTML=display.replace('✳','<span>✳</span>');
 $('#page-subtitle').textContent=subtitle;$('#breadcrumb').textContent=page==='tables'?'Floor & tables':title;
 $('#heading-actions').innerHTML=action?`<button class="btn btn-lime" data-action="${action}">${icon('plus')} ${label.replace('+ ','')}</button>`:'';
 $('#view').innerHTML=renderPage(state);decorate(app);
}
async function refresh(showToast=false){
 if(state.mode==='live')await loadLive();else state.data=loadDemo();
 render();if(showToast)toast('Workspace refreshed');
}
async function mutate(action,payload,success='Changes saved'){
 if(state.mode==='demo'){demoMutation(state.data,action,payload);}
 else{await api(action,payload);await loadLive();}
 render();toast(success);
}
function modal(title,body,wide=false){
 modalLayer.innerHTML=`<div class="modal-backdrop" data-modal-backdrop><div class="modal-box ${wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><h3>${esc(title)}</h3><button type="button" class="modal-close" data-action="closeModal" aria-label="Close dialog">×</button></div>${body}</div></div>`;
 document.body.style.overflow='hidden';decorate(modalLayer);
 setTimeout(()=>$('#modal-layer .field')?.focus(),0);
}
function closeModal(){modalLayer.innerHTML='';document.body.style.overflow='';}
const footer=(label='Save changes')=>`<div class="modal-footer"><button type="button" class="btn btn-dark" data-action="closeModal">Cancel</button><button class="btn btn-lime" type="submit">${esc(label)} ${icon('arrow')}</button></div>`;
const field=(label,name,type,value='',attrs='')=>`<label class="form-field">${label}<input class="field" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
function openTableModal(){
 modal('Add a dining table',`<form id="entity-form" data-kind="table"><div class="modal-body"><div class="form-grid">${field('Table number','name','text','', 'placeholder="T13" required maxlength="25"')}${field('Number of seats','seats','number',4,'min="1" max="20" required')}</div><p class="form-helper">This table will receive a unique QR menu link that guests can scan.</p></div>${footer('Add table')}</form>`);
}
function openProductModal(id){
 const p=state.data.products.find(x=>x.id===id);
 const categories=['Main Course','Pizza','Burgers','Salads','Desserts','Drinks','Breakfast','Sides'];
 modal(p?'Edit menu item':'Add a menu item',`<form id="entity-form" data-kind="product"><input type="hidden" name="id" value="${esc(p?.id||'')}"><div class="modal-body"><div class="form-grid">
 <div class="form-full">${field('Dish name','name','text',p?.name||'','placeholder="e.g. Truffle Pizza" required maxlength="120"')}</div>
 <label class="form-field">Category<select name="category" class="field">${[...new Set([...categories,...(p?[p.category]:[])])].map(c=>`<option value="${esc(c)}" ${p?.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
 ${field('Emoji / icon','emoji','text',p?.emoji||'🍽️','maxlength="10"')}
 ${field('Selling price (MAD)','price','number',p?.price||'','min="0" max="100000" step="0.01" required')}
 ${field('Estimated food cost (MAD)','cost','number',p?.cost||0,'min="0" step="0.01"')}
 ${field('Prep time (minutes)','prep_minutes','number',p?.prep_minutes||15,'min="1" max="180"')}
 <label class="form-field">Availability<select class="field" name="active"><option value="true" ${p?.active!==false?'selected':''}>Active — visible to guests</option><option value="false" ${p?.active===false?'selected':''}>Hidden from menu</option></select></label>
 </div><p class="form-helper">Food cost powers your estimated gross margin. Revenue is calculated using the price at the time of an order.</p></div>${footer(p?'Update item':'Add to menu')}</form>`);
}
function openInventoryModal(id){
 const p=state.data.inventory.find(x=>x.id===id);
 modal(p?'Edit ingredient':'Add ingredient',`<form id="entity-form" data-kind="inventory"><input type="hidden" name="id" value="${esc(p?.id||'')}"><div class="modal-body"><div class="form-grid">
 <div class="form-full">${field('Ingredient name','name','text',p?.name||'','placeholder="e.g. Mozzarella" required')}</div>
 <label class="form-field">Unit<select name="unit" class="field">${['kg','g','L','ml','pcs','bottles','packs'].map(v=>`<option value="${v}" ${p?.unit===v?'selected':''}>${v}</option>`).join('')}</select></label>
 ${field('On-hand quantity','quantity','number',p?.quantity??0,'min="0" step="0.01" required')}
 ${field('Reorder threshold','threshold','number',p?.threshold??5,'min="0" step="0.01" required')}
 ${field('Cost per unit (MAD)','cost_per_unit','number',p?.cost_per_unit??0,'min="0" step="0.01" required')}
 </div><p class="form-helper">A warning appears when stock reaches or drops below the threshold. Automatic recipe deductions require a recipe configuration feature.</p></div>${footer(p?'Update ingredient':'Add ingredient')}</form>`);
}
function localDateTime(d){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes());}
function openReservationModal(){
 const tables=state.data.tables;
 modal('New reservation',`<form id="entity-form" data-kind="reservation"><div class="modal-body"><div class="form-grid">
 ${field('Guest name','guest_name','text','','required placeholder="Full name"')}
 ${field('Phone number','guest_phone','tel','','placeholder="+212 ..."')}
 ${field('Party size','party_size','number',2,'min="1" max="30" required')}
 ${field('Date & time','reserved_for','datetime-local',localDateTime(new Date(Date.now()+7200000)),'required')}
 <label class="form-field form-full">Table<select name="table_id" class="field"><option value="">Assign later</option>${tables.map(t=>`<option value="${esc(t.id)}">${esc(t.name)} — ${t.seats} seats</option>`).join('')}</select></label>
 </div><p class="form-helper">The booking is added to your workspace. Verify table capacity and availability with your team.</p></div>${footer('Create reservation')}</form>`);
}
function orderLines(){
 const products=state.data.products.filter(p=>p.active);
 return products.map(p=>{const count=draftCart[p.id]||0;return `<div class="order-pick"><span class="emoji">${esc(p.emoji)}</span><div><strong>${esc(p.name)}</strong><small>${money(p.price)}</small></div><div class="quantity"><button type="button" data-action="cartAdjust" data-id="${esc(p.id)}" data-delta="-1" aria-label="Decrease">−</button><span>${count}</span><button type="button" data-action="cartAdjust" data-id="${esc(p.id)}" data-delta="1" aria-label="Increase">+</button></div></div>`}).join('');
}
function orderTotalDisplay(){
 return money(state.data.products.reduce((sum,p)=>sum+Number(p.price)*(draftCart[p.id]||0),0));
}
function openOrderModal(tableId){
 if(!state.data.tables.length)return toast('Create a dining table first',true);
 if(!state.data.products.some(p=>p.active))return toast('Add a menu item first',true);
 draftCart={};
 modal('Create a new order',`<form id="entity-form" data-kind="order"><div class="modal-body"><label class="form-field">Serving table<select name="tableId" class="field" required>${state.data.tables.map(t=>`<option value="${esc(t.id)}" ${tableId===t.id?'selected':''}>${esc(t.name)} · ${t.seats} seats (${t.status})</option>`).join('')}</select></label>
 <p class="small muted">Select dishes and quantities</p><div id="order-pick-list" class="order-picker">${orderLines()}</div>
 <div class="order-total"><span>Order total</span><span id="order-total">${orderTotalDisplay()}</span></div><label class="form-field">Kitchen note (optional)<textarea class="field" name="note" maxlength="350" placeholder="Allergies, preferences or special instructions"></textarea></label></div>${footer('Place order')}</form>`,true);
}
function tableLink(table){
 const u=new URL(location.pathname,location.origin);
 u.searchParams.set(state.mode==='demo'?'demoMenu':'menu',state.mode==='demo'?'1':state.data.user.slug);
 u.searchParams.set('table',table.id);
 return u.href;
}
function showQr(id){
 const t=state.data.tables.find(t=>t.id===id);if(!t)return;
 const link=tableLink(t),qr='https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data='+encodeURIComponent(link);
 modal('Guest QR code — '+t.name,`<div class="modal-body qr-preview"><p>Give guests a faster way to order directly from their table.</p><img src="${esc(qr)}" width="225" height="225" alt="QR code for ${esc(t.name)}" referrerpolicy="no-referrer"><div class="settings-url">${esc(link)}</div>
 ${state.mode==='demo'?'<p class="qr-demo-warning">Demo: this link only shares orders within the same browser. Sign up and connect the database for real cross-device ordering.</p>':''}
 <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:18px"><button class="btn btn-lime btn-sm" data-action="copyLink" data-link="${esc(link)}">${icon('link')} Copy link</button><button class="btn btn-dark btn-sm" data-action="openLink" data-link="${esc(link)}">Open menu ↗</button></div></div>`);
}
async function onEntitySubmit(form){
 const b=Object.fromEntries(new FormData(form));
 const kind=form.dataset.kind;
 if(kind==='table'){await mutate('table.create',{name:b.name,seats:Number(b.seats)},'Table added');}
 else if(kind==='product'){await mutate('product.save',{id:b.id||null,name:b.name,category:b.category,emoji:b.emoji,price:Number(b.price),cost:Number(b.cost),prep_minutes:Number(b.prep_minutes),active:b.active==='true'},'Menu saved');}
 else if(kind==='inventory'){await mutate('inventory.save',{id:b.id||null,name:b.name,unit:b.unit,quantity:Number(b.quantity),threshold:Number(b.threshold),cost_per_unit:Number(b.cost_per_unit)},'Inventory updated');}
 else if(kind==='reservation'){await mutate('reservation.create',{guest_name:b.guest_name,guest_phone:b.guest_phone,party_size:Number(b.party_size),reserved_for:new Date(b.reserved_for).toISOString(),table_id:b.table_id||null},'Reservation created');}
 else if(kind==='order'){
  const items=Object.entries(draftCart).filter(([,qty])=>qty>0).map(([id,qty])=>({id,qty}));
  if(!items.length)throw Error('Add at least one menu item');
  await mutate('order.create',{tableId:b.tableId,items,note:b.note},'Order placed in the kitchen');
 }
 closeModal();
}
function exportCsv(){
 const rows=[['Order ID','Created','Table','Status','Source','Total MAD','Items'],...state.data.orders.map(o=>[o.id,o.created_at,o.table_name,o.status,o.source,o.total,o.items.map(i=>i.quantity+'x '+i.name).join('; ')])];
 const csv=rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
 const blob=new Blob([String.fromCharCode(0xfeff)+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='restosphere-orders-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Orders CSV exported');
}
async function clipboard(value){
 try{await navigator.clipboard.writeText(value);toast('Link copied to clipboard');}
 catch{toast('Copy is not available here; select the link in the dialog',true);}
}
async function startGuest(){
 const params=new URLSearchParams(location.search),isDemo=params.get('demoMenu')==='1';
 auth.hidden=true;app.hidden=true;guestScreen.hidden=false;
 try{
  let result;
  if(isDemo){
   const d=loadDemo();const t=d.tables.find(t=>t.id===params.get('table'));
   result={restaurant:{id:'demo-org',name:d.user.restaurant,slug:'restosphere-demo'},table:t||null,products:d.products.filter(p=>p.active),demo:true};
  }else{result=await api('public.menu',null,{slug:params.get('menu')||'',table:params.get('table')||''});}
  state.guest=result;state.guestCart={};state.guestCategory='All';state.guestSuccess=null;
  renderGuest();
 }catch(e){$('#guest-content').innerHTML=`<div class="guest-success"><h2>Menu unavailable</h2><p class="muted">${esc(e.message)}</p><a class="btn btn-lime" href="/">Go to RestoSphere</a></div>`;}
}
function renderGuest(){
 const g=state.guest;if(!g)return;
 if(state.guestSuccess){
  $('#guest-content').innerHTML=`<div class="guest-success"><div class="check-large">✓</div><h2>Order sent to the kitchen!</h2><p class="muted">Order #RS-${esc(shortId(state.guestSuccess.id))}</p><p class="muted">Your team will take care of the rest. Bon appétit!</p><button class="btn btn-lime" data-action="guestAgain">Order more</button></div>`;return;
 }
 const cats=['All',...new Set(g.products.map(p=>p.category))],filtered=g.products.filter(p=>state.guestCategory==='All'||p.category===state.guestCategory);
 const count=Object.values(state.guestCart).reduce((s,n)=>s+n,0),total=g.products.reduce((s,p)=>s+(state.guestCart[p.id]||0)*Number(p.price),0);
 $('#guest-content').innerHTML=`<div class="guest-hero"><div class="eyebrow">✦ FRESHLY PREPARED, JUST FOR YOU</div><h1>Welcome to ${esc(g.restaurant.name)}<span class="lime">.</span></h1><p>Good food is just a few taps away. Browse, choose your favorites, and send your order straight to the kitchen.</p><p>${g.table?'🍽️ Table '+esc(g.table.name):'Browse our menu'}</p></div>
 <div class="guest-wrap"><div class="guest-tabs">${cats.map(c=>`<button class="${state.guestCategory===c?'active':''}" data-action="guestCategory" data-category="${esc(c)}">${esc(c)}</button>`).join('')}</div>
 <div class="guest-products">${filtered.map(p=>`<article class="guest-product"><span class="guest-emoji">${esc(p.emoji)}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ~${p.prep_minutes||15} min</small><b>${money(p.price)}</b></div><button data-action="guestAdd" data-id="${esc(p.id)}" aria-label="Add ${esc(p.name)}">+</button></article>`).join('')}</div></div>
 <div class="guest-cart"><div><strong>${count} item${count===1?'':'s'} · ${money(total)}</strong><small>${g.table?'Ordering for table '+esc(g.table.name):'Ask a waiter for your table QR code'}</small></div><button class="btn btn-lime" data-action="guestCheckout" ${count&&g.table?'':'disabled'}>View order →</button></div>`;
}
function guestCheckout(){
 const g=state.guest,lines=g.products.filter(p=>state.guestCart[p.id]>0),total=lines.reduce((s,p)=>s+(state.guestCart[p.id]||0)*Number(p.price),0);
 if(!lines.length)return;
 modal('Confirm your order',`<form id="entity-form" data-kind="guestOrder"><div class="modal-body"><div class="guest-checkout-list">${lines.map(p=>`<div class="guest-checkout-row"><span>${state.guestCart[p.id]}× ${esc(p.name)}</span><strong>${money(state.guestCart[p.id]*Number(p.price))}</strong></div>`).join('')}</div><div class="order-total"><span>Order total</span><strong>${money(total)}</strong></div><label class="form-field">Any special requests?<textarea name="note" class="field" maxlength="350" placeholder="Allergies, exclusions or preferences"></textarea></label></div>${footer('Send to kitchen')}</form>`);
}
async function submitGuestOrder(form){
 const g=state.guest,items=Object.entries(state.guestCart).filter(([,qty])=>qty>0).map(([id,qty])=>({id,qty})),note=new FormData(form).get('note')||'';
 if(!g.table)throw Error('Scan a table QR to order');
 let result;
 if(g.demo){
  const data=loadDemo();demoMutation(data,'order.create',{tableId:g.table.id,items,note,source:'qr'});result={order:data.orders[0]};
 }else result=await api('public.order',{slug:g.restaurant.slug,tableId:g.table.id,items,note});
 state.guestSuccess=result.order;state.guestCart={};closeModal();renderGuest();
}
async function handleAction(btn){
 const a=btn.dataset.action,id=btn.dataset.id,d=state.data;
 switch(a){
 case 'navigate':navTo(btn.dataset.page);break;
 case 'goTables':navTo('tables');break;
 case 'goOrders':navTo('orders');break;
 case 'goKitchen':navTo('kitchen');break;
 case 'newOrder':openOrderModal(id);break;
 case 'newTable':openTableModal();break;
 case 'newProduct':openProductModal();break;
 case 'newInventory':openInventoryModal();break;
 case 'newReservation':openReservationModal();break;
 case 'selectTable':state.selectedTableId=id;navTo('tables');break;
 case 'setTableStatus':await mutate('table.update',{id,status:btn.dataset.status},'Table status updated');break;
 case 'showQR':showQr(id);break;
 case 'deleteTable':
  if(confirm('Delete this table? Historical orders will remain, but the table will be unassigned.')){await mutate('table.delete',{id},'Table deleted');state.selectedTableId=d.tables[0]?.id||null;render();}break;
 case 'filterOrders':state.orderFilter=btn.dataset.filter;render();break;
 case 'filterMenu':state.menuFilter=btn.dataset.filter;render();break;
 case 'editProduct':openProductModal(id);break;
 case 'editInventory':openInventoryModal(id);break;
 case 'deleteInventory':if(confirm('Remove this ingredient?'))await mutate('inventory.delete',{id},'Ingredient removed');break;
 case 'advanceOrder':await mutate('order.status',{id,status:btn.dataset.status},'Kitchen ticket updated');break;
 case 'cartAdjust':{
  const n=Number(btn.dataset.delta),p=d.products.find(p=>p.id===id);
  if(!p)return;draftCart[id]=Math.max(0,Math.min(20,(draftCart[id]||0)+n));
  $('#order-pick-list').innerHTML=orderLines();$('#order-total').textContent=orderTotalDisplay();break;
 }
 case 'closeModal':closeModal();break;
 case 'copyLink':await clipboard(btn.dataset.link);break;
 case 'openLink':window.open(btn.dataset.link,'_blank','noopener,noreferrer');break;
 case 'exportCSV':exportCsv();break;
 case 'resetDemo':
  if(confirm('Reset all changes to the sample restaurant?')){state.data=defaultDemo();saveDemo(state.data);state.selectedTableId=state.data.tables[0].id;render();toast('Demo reset');}break;
 case 'guestCategory':state.guestCategory=btn.dataset.category;renderGuest();break;
 case 'guestAdd':state.guestCart[id]=Math.min(20,(state.guestCart[id]||0)+1);renderGuest();break;
 case 'guestCheckout':guestCheckout();break;
 case 'guestAgain':state.guestSuccess=null;renderGuest();break;
 }
}
function initialize(){
 decorate();
 $('#tab-login').addEventListener('click',()=>setAuthMode('login'));
 $('#tab-register').addEventListener('click',()=>setAuthMode('register'));
 $('#try-demo').addEventListener('click',enterDemo);
 $('#logout').addEventListener('click',signOut);
 $('#open-sidebar').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#sidebar-scrim').hidden=false;});
 $('#close-sidebar').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#sidebar-scrim').hidden=true;});
 $('#sidebar-scrim').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#sidebar-scrim').hidden=true;});
 $('#top-refresh').addEventListener('click',()=>refresh(true).catch(e=>toast(e.message,true)));
 document.addEventListener('click',async e=>{
  const nav=e.target.closest('.nav-link[data-page]');if(nav){navTo(nav.dataset.page);return;}
  const action=e.target.closest('[data-action]');
  if(action){e.preventDefault();try{await handleAction(action);}catch(err){toast(err.message,true);}}
  else if(e.target.matches('[data-modal-backdrop]'))closeModal();
 });
 document.addEventListener('change',async e=>{
  const el=e.target;
  if(el.dataset.action==='orderStatus'||el.dataset.action==='reservationStatus'){
   try{await mutate(el.dataset.action==='orderStatus'?'order.status':'reservation.status',{id:el.dataset.id,status:el.value},'Status updated');}catch(err){toast(err.message,true);render();}
  }
 });
 document.addEventListener('input',e=>{
  if(e.target.id==='order-search'){
   const start=e.target.selectionStart;
   state.search=e.target.value;render();
   const input=$('#order-search');if(input){input.focus();input.setSelectionRange(start,start);}
  }
 });
 $('#auth-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,details=Object.fromEntries(new FormData(form));
  const button=$('#auth-submit');button.disabled=true;$('#auth-error').hidden=true;
  try{
   if(authMode==='register')await api('auth.register',{name:details.name,restaurant:details.restaurant,email:details.email,password:details.password});
   else await api('auth.login',{email:details.email,password:details.password});
   await enterLive();toast(authMode==='register'?'Your restaurant is ready':'Welcome back!');
  }catch(error){$('#auth-error').textContent=error.message;$('#auth-error').hidden=false;}
  finally{button.disabled=false;}
 });
 document.addEventListener('submit',async e=>{
  if(e.target.id!=='entity-form')return;
  e.preventDefault();const form=e.target,button=form.querySelector('button[type=submit]');button.disabled=true;
  try{if(form.dataset.kind==='guestOrder')await submitGuestOrder(form);else await onEntitySubmit(form);}
  catch(err){toast(err.message,true);button.disabled=false;}
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modalLayer.innerHTML.includes('guest-order-processing'))closeModal();});
 setInterval(()=>{if(state.mode==='live'&&!app.hidden&&!document.hidden&&(!modalLayer.innerHTML)&&['overview','orders','kitchen','tables'].includes(state.page))refresh(false).catch(()=>{});},15000);
 if(new URLSearchParams(location.search).has('menu')||new URLSearchParams(location.search).has('demoMenu'))startGuest();
 else api('auth.me').then(()=>enterLive()).catch(()=>{auth.hidden=false;app.hidden=true;guestScreen.hidden=true;});
}
initialize();
