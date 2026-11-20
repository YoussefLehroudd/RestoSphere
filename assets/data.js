export const svgPaths={
 overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>',
 bag:'<path d="M4 8h16l-1.5 13h-13L4 8zM9 9V6a3 3 0 0 1 6 0v3"/>',
 chef:'<path d="M6 13a4 4 0 0 1-1-8 5 5 0 0 1 9-1 4 4 0 1 1 4 7v8H6v-6zM6 15h12"/>',
 book:'<path d="M4 4a2 2 0 0 1 2-2h14v18H6a2 2 0 0 0-2 2V4zM4 18a2 2 0 0 1 2-2h14"/>',
 boxes:'<path d="M4 8 12 3l8 5-8 5-8-5zM4 8v9l8 5 8-5V8M12 13v9"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-8"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M4 9h2l1-2-1-2 3-2 2 2h2l2-2 3 2-1 2 1 2h2v6h-2l-1 2 1 2-3 2-2-2h-2l-2 2-3-2 1-2-1-2H4V9z"/>',
 logout:'<path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/>',
 check:'<path d="M5 12l4 4L19 6"/>',
 printer:'<path d="M6 8V3h12v5M6 18H3v-8h18v8h-3M6 14h12v7H6z"/>',
 sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z"/>',
 link:'<path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l2-2"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 qr:'<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM6 6h1M17 6h1M6 17h1M14 14h3v3h-3zM20 14v7M14 21h3"/>'
};
export function icon(name){return '<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true">'+(svgPaths[name]||svgPaths.sparkles)+'</svg>'}
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=v=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(Number(v)||0)+' MAD';
export const dateShort=v=>new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
export const timeShort=v=>new Date(v).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
export const ago=v=>{let m=Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000));return m<1?'Just now':m<60?m+' min ago':m<1440?Math.floor(m/60)+' h ago':dateShort(v)};
export const capital=s=>String(s||'').replace(/\b\w/g,x=>x.toUpperCase());
export const shortId=id=>String(id||'').replaceAll('-','').slice(0,7).toUpperCase();
export const orderTotal=o=>Number(o.total)||0;
export const today = ()=>new Date().toDateString();
export const isToday=v=>new Date(v).toDateString()===today();
const minutesAgo=n=>new Date(Date.now()-n*60000).toISOString();
const dayAgo=(days,hours)=>{const d=new Date();d.setDate(d.getDate()-days);d.setHours(hours,Math.floor(Math.random()*30),0,0);return d.toISOString()};
export function defaultDemo(){
 const p=[
  ['p1','Margherita Pizza','Pizza','🍕',75,28,15],['p2','Truffle Tagliatelle','Main Course','🍝',110,43,20],
  ['p3','Smash Burger','Burgers','🍔',95,36,18],['p4','Caesar Salad','Salads','🥗',65,22,10],
  ['p5','Grilled Salmon','Main Course','🐟',145,67,25],['p6','Tiramisu','Desserts','🍰',55,18,8],
  ['p7','Iced Matcha','Drinks','🍵',42,12,5],['p8','Fresh Lemonade','Drinks','🍋',35,9,5],
  ['p9','Chocolate Fondant','Desserts','🍫',62,20,12],['p10','Margherita Mocktail','Drinks','🍹',48,13,6]
 ].map(([id,name,category,emoji,price,cost,prep_minutes])=>({id,name,category,emoji,price,cost,prep_minutes,active:true}));
 const status=['available','occupied','reserved','occupied','available','occupied','available','cleaning','occupied','reserved','available','occupied'];
 const tables=Array.from({length:12},(_,i)=>({id:'t'+(i+1),name:'T'+String(i+1).padStart(2,'0'),seats:i%4===0?6:i%3===0?2:4,status:status[i]}));
 const recipes=[['p1',2],['p2',1],['p3',2],['p5',1],['p4',2],['p6',1]];
 const template=[
  ['t2','new',8,[['p1',2],['p8',2]],'No onions'],
  ['t3','preparing',14,[['p2',2],['p7',2]],''],
  ['t4','ready',19,[['p3',2],['p9',1]],'Extra crispy'],
  ['t6','preparing',24,[['p5',1],['p4',2]],''],
  ['t8','served',48,[['p1',1],['p3',1],['p6',2]],''],
  ['t10','paid',92,[['p3',1],['p7',2]],''],
  ['t1','paid',135,[['p5',2],['p8',2]],''],
  ['t9','paid',200,[['p1',2],['p6',2]],''],
  ['t12','paid',280,[['p2',1],['p4',1],['p7',2]],''],
  ['t5','paid',370,[['p3',3],['p8',3]],'']
 ];
 const orders=template.map(([tableId,status,minute,line,note],i)=>{
  const items=line.map(([id,quantity])=>({id:'oi'+i+id,product_id:id,name:p.find(x=>x.id===id).name,quantity,unit_price:p.find(x=>x.id===id).price}));
  return {id:'ord'+(101+i),table_id:tableId,table_name:tables.find(t=>t.id===tableId)?.name||'—',status,source:i%3?'staff':'qr',note,total:items.reduce((s,x)=>s+x.unit_price*x.quantity,0),items,created_at:minutesAgo(minute)};
 });
 for(let day=1;day<=6;day++)for(let i=0;i<4;i++){
  const prod=p[(day*2+i)%p.length],qty=1+(i%3),it={product_id:prod.id,name:prod.name,quantity:qty,unit_price:prod.price};
  orders.push({id:'history'+day+'-'+i,table_id:tables[i].id,table_name:tables[i].name,status:'paid',source:'staff',note:'',total:it.quantity*it.unit_price,items:[it],created_at:dayAgo(day,11+i*2)});
 }
 return {user:{id:'demo-user',name:'Alex Morgan',email:'demo@restosphere.app',role:'owner',org_id:'demo-org',restaurant:'Maison Olive',slug:'restosphere-demo'},tables,products:p,inventory:[
  ['i1','Fresh Tomatoes','kg',14,5,14],['i2','Mozzarella','kg',8,4,65],['i3','Flour','kg',22,8,9],
  ['i4','Chicken Breast','kg',3,5,52],['i5','Olive Oil','L',10,4,76],['i6','Coffee Beans','kg',2.5,3,120],
  ['i7','Salmon Fillet','kg',5,4,138],['i8','Fresh Lemons','kg',12,5,18]
 ].map(([id,name,unit,quantity,threshold,cost_per_unit])=>({id,name,unit,quantity,threshold,cost_per_unit})),orders,
 reservations:[
 {id:'r1',guest_name:'Sofia Bennett',guest_phone:'+212 600 000 111',party_size:4,reserved_for:new Date(Date.now()+3600000*4).toISOString(),table_id:'t3',table_name:'T03',status:'confirmed'},
 {id:'r2',guest_name:'Adam Parker',guest_phone:'+212 600 000 222',party_size:2,reserved_for:new Date(Date.now()+3600000*7).toISOString(),table_id:'t8',table_name:'T08',status:'confirmed'},
 {id:'r3',guest_name:'Lina Chen',guest_phone:'+212 600 000 333',party_size:6,reserved_for:new Date(Date.now()+86400000+3600000*3).toISOString(),table_id:'t1',table_name:'T01',status:'confirmed'}
 ]};
}
export function loadDemo(){try{const v=JSON.parse(localStorage.getItem('restosphere-demo-v4')||'null');if(v&&Array.isArray(v.tables)&&Array.isArray(v.orders)&&v.user)return v;}catch{}return defaultDemo();}
export function saveDemo(d){try{localStorage.setItem('restosphere-demo-v4',JSON.stringify(d))}catch{}}
export function demoMutation(data,action,b){
 const rand=()=>String(Date.now())+Math.random().toString(36).slice(2,7);
 const find=(list,id)=>list.find(x=>x.id===id);
 const accepted=['available','occupied','reserved','cleaning'];
 if(action==='table.create'){if(!b.name?.trim())throw Error('Table name required');if(data.tables.some(t=>t.name===b.name.trim().toUpperCase()))throw Error('Table already exists');data.tables.push({id:rand(),name:b.name.trim().toUpperCase(),seats:Number(b.seats)||4,status:'available'});}
 else if(action==='table.update'){const t=find(data.tables,b.id);if(t&&accepted.includes(b.status))t.status=b.status;}
 else if(action==='table.delete'){data.tables=data.tables.filter(t=>t.id!==b.id);}
 else if(action==='product.save'){
  const item={id:b.id||rand(),name:String(b.name||'').trim(),category:b.category||'Main Course',emoji:b.emoji||'🍽️',price:Number(b.price),cost:Number(b.cost)||0,prep_minutes:Number(b.prep_minutes)||15,active:b.active!==false};
  if(!item.name||!Number.isFinite(item.price)||item.price<0)throw Error('Invalid menu item');
  const idx=data.products.findIndex(p=>p.id===item.id);if(idx>=0)data.products[idx]=item;else data.products.push(item);
 }
 else if(action==='product.delete'){const p=find(data.products,b.id);if(p)p.active=false;}
 else if(action==='inventory.save'){
  const item={id:b.id||rand(),name:String(b.name||'').trim(),unit:b.unit||'kg',quantity:Number(b.quantity),threshold:Number(b.threshold),cost_per_unit:Number(b.cost_per_unit)||0};
  if(!item.name||!Number.isFinite(item.quantity)||item.quantity<0||item.threshold<0)throw Error('Invalid inventory item');
  const idx=data.inventory.findIndex(p=>p.id===item.id);if(idx>=0)data.inventory[idx]=item;else data.inventory.push(item);
 }
 else if(action==='inventory.delete'){data.inventory=data.inventory.filter(i=>i.id!==b.id);}
 else if(action==='order.create'){
  const table=find(data.tables,b.tableId);if(!table)throw Error('Select a table');
  const items=(b.items||[]).filter(i=>Number(i.qty)>0).map(i=>{const p=find(data.products,i.id);if(!p||!p.active)throw Error('Product unavailable');return{id:rand(),product_id:p.id,name:p.name,quantity:Number(i.qty),unit_price:Number(p.price)}});
  if(!items.length)throw Error('Choose a menu item');
  data.orders.unshift({id:rand(),table_id:table.id,table_name:table.name,status:'new',source:b.source||'staff',note:b.note||'',total:items.reduce((s,i)=>s+i.unit_price*i.quantity,0),items,created_at:new Date().toISOString()});
  table.status='occupied';
 }
 else if(action==='order.status'){const o=find(data.orders,b.id);if(o)o.status=b.status;}
 else if(action==='reservation.create'){
  if(!b.guest_name||!b.reserved_for)throw Error('Name and date required');
  const t=find(data.tables,b.table_id);
  data.reservations.unshift({id:rand(),guest_name:b.guest_name,guest_phone:b.guest_phone||'',party_size:Number(b.party_size)||2,reserved_for:new Date(b.reserved_for).toISOString(),table_id:b.table_id||null,table_name:t?.name||'Unassigned',status:'confirmed'});
 }
 else if(action==='reservation.status'){const r=find(data.reservations,b.id);if(r)r.status=b.status;}
 saveDemo(data);
 return data;
}
export function weeklyRevenue(data){
 const dates=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d});
 return dates.map(d=>({label:d.toLocaleDateString('en-US',{weekday:'short'}),value:data.orders.filter(o=>['paid','served'].includes(o.status)&&new Date(o.created_at).toDateString()===d.toDateString()).reduce((s,o)=>s+orderTotal(o),0)}));
}
export function popularProducts(data){
 const map=new Map();
 data.orders.filter(o=>o.status!=='cancelled').forEach(o=>o.items.forEach(i=>{const k=i.product_id||i.name;const a=map.get(k)||{name:i.name,quantity:0,revenue:0};a.quantity+=Number(i.quantity)||0;a.revenue+=Number(i.quantity)*Number(i.unit_price);map.set(k,a)}));
 return [...map.values()].sort((a,b)=>b.quantity-a.quantity);
}
export function smartInsights(data){
 const low=data.inventory.filter(i=>Number(i.quantity)<=Number(i.threshold)),popular=popularProducts(data)[0],open=data.orders.filter(o=>['new','preparing','ready'].includes(o.status)).length;
 const paid=data.orders.filter(o=>['paid','served'].includes(o.status)),revenue=paid.reduce((s,o)=>s+orderTotal(o),0);
 const cost=paid.reduce((s,o)=>s+o.items.reduce((t,i)=>t+(Number(data.products.find(p=>p.id===i.product_id)?.cost)||0)*Number(i.quantity),0),0);
 const margin=revenue?Math.round((revenue-cost)/revenue*100):0;
 return [
 {emoji:'📦',title:low.length?low.length+' ingredient'+(low.length>1?'s':'')+' running low':'Inventory is looking healthy',detail:low.length?'Replenish '+low.slice(0,3).map(i=>i.name).join(', ')+'.':'All your listed ingredients are above their reorder thresholds.'},
 {emoji:'🔥',title:popular?'Top seller: '+popular.name:'Your top seller will appear here',detail:popular?popular.quantity+' units ordered in the current data set. Keep this favorite in stock.':'Process orders to unlock item-level insights.'},
 {emoji:'⏱️',title:open+' orders need attention',detail:open?'Keep the kitchen display open to move orders through preparation.':'Your kitchen queue is clear.'},
 {emoji:'📈',title:'Estimated gross margin: '+margin+'%',detail:'Based on saved menu item costs, excluding labor, overhead and taxes.'}
 ];
}
