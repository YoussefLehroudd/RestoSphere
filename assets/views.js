import {esc,money,icon,ago,dateShort,timeShort,orderTotal,isToday,weeklyRevenue,popularProducts,smartInsights,shortId} from './data.js';
const box=(title,subtitle,body,action='')=>`<section class="panel"><div class="panel-head"><div><h3>${title}</h3>${subtitle?`<p>${subtitle}</p>`:''}</div>${action}</div>${body}</section>`;
const headAction=(text,action)=>`<button class="panel-action" data-action="${action}">${text} →</button>`;
const blank=(emoji,title,text,action='')=>`<div class="empty-state"><div class="empty-symbol">${emoji}</div><strong>${title}</strong><p>${text}</p>${action}</div>`;
export const statusPill=status=>`<span class="pill ${esc(status)}">${esc(status)}</span>`;
const tableName=(d,id)=>d.tables.find(t=>t.id===id)?.name||'Unassigned';
export const titleConfigs={
 overview:['THE BIG PICTURE','Good morning, chef ✳',"Here’s what’s happening at your restaurant today.",'newOrder','+ New order'],
 tables:['YOUR RESTAURANT FLOOR','Floor & tables','A live view of every seat, service, and table.','newTable','+ Add table'],
 orders:['ALL ORDERS IN ONE PLACE','Orders','Stay on top of every plate, from placed to paid.','newOrder','+ New order'],
 kitchen:['THE HEART OF YOUR RESTAURANT','Kitchen display','Every ticket, every station. Keep your team in sync.','',''],
 menu:['CRAFT YOUR MENU','Menu manager','Manage your dishes, categories, and prices.','newProduct','+ Add menu item'],
 inventory:['KNOW WHAT YOU HAVE','Inventory','Track ingredients, costs and low-stock alerts.','newInventory','+ Add ingredient'],
 reservations:['EVERY SEAT MATTERS','Reservations','Keep every booking organized and every guest welcome.','newReservation','+ New reservation'],
 insights:['DECISIONS, NOT GUESSWORK','Insights','Actionable numbers to help your restaurant grow.','',''],
 settings:['YOUR SPACE, YOUR RULES','Settings','Manage your restaurant and share your digital menu.','','']
};
function revenueSvg(data){
 const days=weeklyRevenue(data),max=Math.max(200,...days.map(d=>d.value))*1.17;
 const pts=days.map((d,i)=>[30+i*90,168-d.value/max*138]);
 const poly=pts.map(a=>a.join(',')).join(' '),area='30,174 '+poly+' 570,174';
 return `<svg class="revenue-chart" viewBox="0 0 600 200" preserveAspectRatio="none" aria-label="Last seven days revenue chart" role="img">
 <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c8f57e" stop-opacity=".28"/><stop offset="100%" stop-color="#c8f57e" stop-opacity="0"/></linearGradient></defs>
 <g stroke="#2d3a47" stroke-dasharray="4 7"><path d="M20 37h565M20 83h565M20 129h565M20 174h565"/></g>
 <polygon points="${area}" fill="url(#chart-fill)"/><polyline points="${poly}" fill="none" stroke="#c8f57e" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
 ${pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#c8f57e"><title>${days[i].label}: ${money(days[i].value)}</title></circle>`).join('')}
 </svg><div class="chart-axes">${days.map(d=>`<span>${d.label}</span>`).join('')}</div>`;
}
const makeRecentRows=(data,orders,limit)=> {
 if(!orders.length)return blank('🍽️','No orders yet','Your upcoming orders will show up here.');
 return `<div class="table-scroll"><table class="data-table"><thead><tr><th>ORDER</th><th>TABLE</th><th>TIME</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>
 ${orders.slice(0,limit).map(o=>`<tr><td><span class="order-id">#RS-${shortId(o.id)}</span></td><td>${esc(o.table_name||tableName(data,o.table_id))}</td><td class="secondary-cell">${ago(o.created_at)}</td><td class="strong">${money(o.total)}</td><td>${statusPill(o.status)}</td></tr>`).join('')}
 </tbody></table></div>`;
};
export function renderOverview(ctx){
 const d=ctx.data,dayOrders=d.orders.filter(o=>isToday(o.created_at)),paid=dayOrders.filter(o=>['paid','served'].includes(o.status));
 const revenue=paid.reduce((s,o)=>s+orderTotal(o),0),occupied=d.tables.filter(t=>t.status==='occupied').length;
 const available=d.tables.filter(t=>t.status==='available').length,active=d.orders.filter(o=>['new','preparing','ready'].includes(o.status)).length;
 const popular=popularProducts(d).slice(0,4),max=popular[0]?.quantity||1;
 return `
 <div class="welcome-strip"><div><strong>✳ Every great service starts with a great overview.</strong><p>Everything your team needs to stay a step ahead, beautifully in one place. ${ctx.mode==='demo'?'You’re exploring a sample restaurant — everything is interactive.':'Your restaurant data refreshes whenever you open a page.'}</p></div><button class="btn btn-lime btn-sm" data-action="navigate" data-page="kitchen">Open kitchen ${icon('arrow')}</button></div>
 <div class="metrics">
  <div class="panel metric metric-accent"><div class="metric-title">Today's revenue <span class="icon-wrap">${icon('chart')}</span></div><div class="metric-value">${money(revenue)}</div><div class="metric-foot"><b>${paid.length} completed orders</b> today</div></div>
  <div class="panel metric"><div class="metric-title">Today's orders <span class="icon-wrap">${icon('bag')}</span></div><div class="metric-value">${dayOrders.length}</div><div class="metric-foot"><b>${active} still in progress</b></div></div>
  <div class="panel metric"><div class="metric-title">Occupied tables <span class="icon-wrap">${icon('grid')}</span></div><div class="metric-value">${occupied}<span class="muted" style="font-size:15px"> / ${d.tables.length}</span></div><div class="metric-foot"><b>${available} tables available</b></div></div>
  <div class="panel metric"><div class="metric-title">Avg. order value <span class="icon-wrap">${icon('users')}</span></div><div class="metric-value">${money(paid.length?revenue/paid.length:0)}</div><div class="metric-foot">Based on completed orders</div></div>
 </div>
 <div class="section-grid wide-left">
  ${box('Revenue overview','Completed sales in the last 7 days',`<div class="chart-top"><span class="chart-legend"><span><span class="legend-dot"></span>Revenue (MAD)</span></span><span class="small muted">Last 7 days</span></div>${revenueSvg(d)}`)}
  ${box('Top selling items','Your guests’ current favorites',popular.length?popular.map((p,i)=>`<div class="stat-row"><span>${i+1}. ${esc(p.name)}</span><strong>${p.quantity} sold</strong></div><div class="progress-track"><div class="progress-fill ${i===1?'orange':i===2?'blue':''}" style="width:${Math.max(3,p.quantity/max*100)}%"></div></div>`).join(''):blank('🍕','No items yet','Popular dishes appear after orders are placed.'))}
 </div>
 <div class="section-grid wide-left top-gap">
  ${box('Recent orders','The latest activity from your dining room',makeRecentRows(d,d.orders,6),headAction('View all orders','goOrders'))}
  ${box('Your floor, at a glance','Tap a table to open it',`<div class="quick-tables">${d.tables.slice(0,8).map(t=>`<button class="mini-table ${esc(t.status)}" data-action="selectTable" data-id="${esc(t.id)}"><span class="mini-table-icon">${esc(t.name)}</span><small>${esc(t.status)}</small></button>`).join('')}</div>${!d.tables.length?blank('🪑','No tables','Add your first dining table.'):''}`,headAction('View floor','goTables'))}
 </div>`;
}
export function renderTables(ctx){
 const d=ctx.data,selected=d.tables.find(t=>t.id===ctx.selectedTableId)||d.tables[0];
 const counts=['available','occupied','reserved','cleaning'].map(s=>({label:s,num:d.tables.filter(t=>t.status===s).length}));
 const floor=`<div class="floor-area"><div class="floor-room-head"><strong>⌗ MAIN DINING AREA</strong><span>${d.tables.length} tables · Live status</span></div><div class="floor-grid">${d.tables.map(t=>`<button class="floor-table ${esc(t.status)} ${t.id===selected?.id?'selected':''}" data-action="selectTable" data-id="${esc(t.id)}"><span class="floor-table-shape">${esc(t.name)}</span><small>${esc(t.status)}</small></button>`).join('')}</div></div><div class="floor-legend">${[['available','#56d5a7'],['occupied','#f4b66a'],['reserved','#86b6ff'],['cleaning','#ff8591']].map(([s,c])=>`<span><i class="legend-color" style="background:${c}"></i>${s}</span>`).join('')}</div>`;
 const side=selected?`<div class="panel selection-panel"><div class="panel-head"><div><h3>Table details</h3><p>Selected dining table</p></div>${statusPill(selected.status)}</div><div class="selection-big">${esc(selected.name)}</div><div class="detail-row"><span>Table number</span><strong>${esc(selected.name)}</strong></div><div class="detail-row"><span>Seats</span><strong>${Number(selected.seats)} guests</strong></div><div class="detail-row"><span>Current status</span>${statusPill(selected.status)}</div><div class="detail-row"><span>Open orders</span><strong>${d.orders.filter(o=>o.table_id===selected.id&&['new','preparing','ready'].includes(o.status)).length}</strong></div><h3 style="font-size:12px;margin-top:24px">Update status</h3><div class="status-picker">${['available','occupied','reserved','cleaning'].map(s=>`<button class="${selected.status===s?'active':''}" data-action="setTableStatus" data-id="${esc(selected.id)}" data-status="${s}">${s}</button>`).join('')}</div><div class="detail-actions"><button class="btn btn-lime btn-sm" data-action="newOrder" data-id="${esc(selected.id)}">${icon('plus')} New order</button><button class="btn btn-dark btn-sm" data-action="showQR" data-id="${esc(selected.id)}">${icon('qr')} Guest QR</button><button class="btn btn-dark btn-sm" data-action="deleteTable" data-id="${esc(selected.id)}">${icon('trash')} Remove table</button><button class="btn btn-dark btn-sm" data-action="navigate" data-page="orders">${icon('bag')} See orders</button></div></div>`:box('No table selected','Add a table to get started',blank('🪑','A clean slate','Your table management will appear here.'));
 return `<div class="table-summary">${counts.map(x=>`<div class="summary-chip"><strong>${x.num}</strong><span>${x.label}</span></div>`).join('')}</div><div class="floor-layout"><div>${floor}</div>${side}</div>`;
}
export function renderOrders(ctx){
 const d=ctx.data,fil=ctx.orderFilter||'all',query=(ctx.search||'').toLowerCase();
 const list=d.orders.filter(o=>(fil==='all'||o.status===fil)&&(!query||[o.id,o.table_name,o.status,...o.items.map(i=>i.name)].join(' ').toLowerCase().includes(query)));
 return `<div class="toolbar"><div class="filter-tabs">${['all','new','preparing','ready','served','paid'].map(s=>`<button class="${fil===s?'active':''}" data-action="filterOrders" data-filter="${s}">${s==='all'?'All orders':s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}</div><input id="order-search" class="search-input" placeholder="Search orders..." value="${esc(ctx.search||'')}" aria-label="Search orders"></div>
 ${box('Order management',list.length+' orders matching your filters',list.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>ORDER</th><th>TABLE</th><th>ITEMS</th><th>TOTAL</th><th>PLACED</th><th>STATUS</th><th>UPDATE</th></tr></thead><tbody>
 ${list.slice(0,100).map(o=>`<tr><td><div class="order-id">#RS-${shortId(o.id)}</div><small class="muted">${esc(o.source||'staff')}</small></td><td>${esc(o.table_name||tableName(d,o.table_id))}</td><td class="secondary-cell" title="${esc(o.items.map(i=>i.name).join(', '))}">${o.items.reduce((s,i)=>s+Number(i.quantity),0)} items</td><td><strong>${money(o.total)}</strong></td><td class="secondary-cell">${ago(o.created_at)}</td><td>${statusPill(o.status)}</td><td><select class="field" style="padding:7px 10px;min-width:120px" data-action="orderStatus" data-id="${esc(o.id)}">${['new','preparing','ready','served','paid','cancelled'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:blank('📋','No orders found','Try another status or create a new order.'),headAction('Kitchen board','goKitchen'))}`;
}
export function renderKitchen(ctx){
 const d=ctx.data,cols=[['new','New orders','Start preparing','preparing'],['preparing','In preparation','Mark ready','ready'],['ready','Ready to serve','Mark served','served']];
 const open=d.orders.filter(o=>['new','preparing','ready'].includes(o.status));
 return `<div class="welcome-strip"><div><strong>👩‍🍳 Kitchen mode is on.</strong><p>Clear priorities, calm service. Move tickets from new to preparing to ready — your whole team knows what’s next.</p></div><span class="pill preparing">${open.length} active tickets</span></div>
 <div class="kitchen-grid">${cols.map(([s,title,label,next])=>`<div class="kitchen-col"><div class="kitchen-col-head"><strong>${title}</strong><span>${open.filter(o=>o.status===s).length}</span></div>${open.filter(o=>o.status===s).length?open.filter(o=>o.status===s).map(o=>`<div class="kitchen-card"><div class="kitchen-card-top"><strong>${esc(o.table_name||tableName(d,o.table_id))}</strong><small>#RS-${shortId(o.id)}</small></div><div class="kitchen-duration">⏱ ${ago(o.created_at)}</div><div style="margin-top:12px">${o.items.map(i=>`<div class="kitchen-item">${Number(i.quantity)}× ${esc(i.name)}</div>`).join('')}</div>${o.note?`<div class="kitchen-note">⚠ ${esc(o.note)}</div>`:''}<button class="btn ${s==='ready'?'btn-lime':'btn-dark'} btn-sm" data-action="advanceOrder" data-id="${esc(o.id)}" data-status="${next}">${label} ${icon('arrow')}</button></div>`).join(''):`<div class="kitchen-empty"><div>✓</div>All clear for now</div>`}</div>`).join('')}</div>`;
}
export function renderMenu(ctx){
 const d=ctx.data,filter=ctx.menuFilter||'All';
 const cats=['All',...new Set(d.products.map(p=>p.category))];
 const products=d.products.filter(p=>filter==='All'||p.category===filter);
 return `<div class="toolbar"><div class="filter-tabs">${cats.map(c=>`<button class="${filter===c?'active':''}" data-action="filterMenu" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div><span class="small muted">${d.products.filter(p=>p.active).length} active dishes</span></div>
 <div class="product-grid">${products.map(p=>`<article class="product-card"><div class="product-visual">${esc(p.emoji)}${!p.active?'<span class="inactive-badge">Hidden</span>':''}</div><div class="product-info"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><div class="product-price">${money(p.price)}</div><div class="product-actions"><span>Est. cost ${money(p.cost)}</span><button data-action="editProduct" data-id="${esc(p.id)}">Edit item →</button></div></div></article>`).join('')}</div>${!products.length?blank('🍽️','No menu items','Add an item to start crafting your menu.'):''}`;
}
export function renderInventory(ctx){
 const d=ctx.data,low=d.inventory.filter(i=>Number(i.quantity)<=Number(i.threshold)).length;
 return `<div class="table-summary"><div class="summary-chip"><strong>${d.inventory.length}</strong><span>Tracked ingredients</span></div><div class="summary-chip"><strong style="color:${low?'var(--red)':'var(--green)'}">${low}</strong><span>Low-stock alerts</span></div><div class="summary-chip"><strong>${money(d.inventory.reduce((s,i)=>s+Number(i.quantity)*Number(i.cost_per_unit),0))}</strong><span>Estimated stock value</span></div></div>
 ${box('Ingredient inventory','Watch quantities and reorder thresholds',d.inventory.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>INGREDIENT</th><th>QUANTITY</th><th>THRESHOLD</th><th>LEVEL</th><th>UNIT COST</th><th>STATUS</th><th>MANAGE</th></tr></thead><tbody>
 ${d.inventory.map(i=>{const low=Number(i.quantity)<=Number(i.threshold),progress=Math.max(3,Math.min(100,Number(i.quantity)/(Number(i.threshold)*3||1)*100));return `<tr><td><strong>${esc(i.name)}</strong></td><td>${Number(i.quantity)} ${esc(i.unit)}</td><td class="secondary-cell">${Number(i.threshold)} ${esc(i.unit)}</td><td><div class="inventory-indicator"><span class="${low?'low':''}" style="width:${progress}%"></span></div></td><td>${money(i.cost_per_unit)}</td><td><span class="${low?'low-stock':'good-stock'}">${low?'⚠ Reorder':'✓ In stock'}</span></td><td><div class="inv-row-actions"><button data-action="editInventory" data-id="${esc(i.id)}">Edit</button><button data-action="deleteInventory" data-id="${esc(i.id)}" title="Delete ingredient">×</button></div></td></tr>`}).join('')}</tbody></table></div>`:blank('📦','No ingredients yet','Add ingredients to monitor stock and costs.'))}`;
}
export function renderReservations(ctx){
 const d=ctx.data,upcoming=d.reservations.filter(r=>['confirmed','seated'].includes(r.status)&&new Date(r.reserved_for)>new Date(Date.now()-86400000));
 return `<div class="table-summary"><div class="summary-chip"><strong>${upcoming.length}</strong><span>Upcoming bookings</span></div><div class="summary-chip"><strong>${upcoming.reduce((s,r)=>s+Number(r.party_size),0)}</strong><span>Expected guests</span></div><div class="summary-chip"><strong>${d.reservations.filter(r=>r.status==='completed').length}</strong><span>Completed visits</span></div></div>
 ${box('Reservation book','Guest details and dining schedule',d.reservations.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>GUEST</th><th>PARTY</th><th>DATE & TIME</th><th>TABLE</th><th>STATUS</th><th>UPDATE</th></tr></thead><tbody>${[...d.reservations].sort((a,b)=>new Date(b.reserved_for)-new Date(a.reserved_for)).map(r=>`<tr><td><strong>${esc(r.guest_name)}</strong><br><small class="muted">${esc(r.guest_phone||'No phone')}</small></td><td>${Number(r.party_size)} guests</td><td>${dateShort(r.reserved_for)}, ${timeShort(r.reserved_for)}</td><td>${esc(r.table_name||tableName(d,r.table_id))}</td><td>${statusPill(r.status)}</td><td><select class="field" style="padding:7px 9px;min-width:113px" data-action="reservationStatus" data-id="${esc(r.id)}">${['confirmed','seated','completed','cancelled'].map(s=>`<option value="${s}" ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`:blank('📆','Your reservation book is open','Add your first booking to see it here.'))}`;
}
export function renderInsights(ctx){
 const d=ctx.data,items=popularProducts(d),insights=smartInsights(d),paid=d.orders.filter(o=>['paid','served'].includes(o.status));
 const revenue=paid.reduce((s,o)=>s+orderTotal(o),0),totalOrders=d.orders.length;
 const top=items.slice(0,6),max=top[0]?.quantity||1;
 return `<div class="insight-hero"><div><div class="eyebrow">✦ SMART BUSINESS INSIGHTS</div><h2>Good food. Smarter decisions.</h2><p>Understand what is selling, keep an eye on stock, and spot opportunities to improve your service. Insights are calculated from your restaurant data.</p></div><div class="insight-orb">✳</div></div>
 <div class="metrics"><div class="panel metric"><div class="metric-title">Total recorded sales</div><div class="metric-value">${money(revenue)}</div><div class="metric-foot">Completed orders</div></div><div class="panel metric"><div class="metric-title">Orders recorded</div><div class="metric-value">${totalOrders}</div><div class="metric-foot">Across the saved history</div></div><div class="panel metric"><div class="metric-title">Average order</div><div class="metric-value">${money(paid.length?revenue/paid.length:0)}</div><div class="metric-foot">Completed orders only</div></div><div class="panel metric"><div class="metric-title">Menu offerings</div><div class="metric-value">${d.products.filter(p=>p.active).length}</div><div class="metric-foot">Active items</div></div></div>
 <div class="section-grid wide-left">
  ${box('Sales, last 7 days','Daily completed-order revenue',revenueSvg(d))}
  ${box('Smart recommendations','Automatic rules based on your data',`<div class="insight-list">${insights.map(i=>`<div class="insight-item"><span class="insight-icon">${i.emoji}</span><div><strong>${esc(i.title)}</strong><p>${esc(i.detail)}</p></div></div>`).join('')}</div>`)}
 </div>
 <div class="section-grid top-gap">
  ${box('Best sellers','Ranked by quantities ordered',top.length?top.map((p,i)=>`<div class="stat-row"><span>${i+1}. ${esc(p.name)}</span><strong>${p.quantity} units</strong></div><div class="progress-track"><div class="progress-fill" style="width:${p.quantity/max*100}%"></div></div>`).join(''):blank('📈','No data yet','Start processing orders to see analytics.'))}
  ${box('Inventory watch','Ingredients approaching threshold',d.inventory.filter(i=>Number(i.quantity)<=Number(i.threshold)).length?d.inventory.filter(i=>Number(i.quantity)<=Number(i.threshold)).map(i=>`<div class="insight-item" style="margin-bottom:10px"><span class="insight-icon">⚠</span><div><strong>${esc(i.name)}</strong><p>${Number(i.quantity)} ${esc(i.unit)} left · Reorder at ${Number(i.threshold)} ${esc(i.unit)}</p></div></div>`).join(''):blank('✅','Stock is healthy','No ingredient is below its threshold.'))}
 </div><p class="small muted" style="margin-top:16px">Insights are rules-based estimates, not AI-generated forecasts. Margins exclude labor, taxes, delivery fees and overhead.</p>`;
}
export function renderSettings(ctx){
 const d=ctx.data,home=new URL(location.pathname,location.origin).href,link=ctx.mode==='demo'?home+'?demoMenu=1&table='+encodeURIComponent(d.tables[0]?.id||'t1'):home+'?menu='+encodeURIComponent(d.user.slug)+'&table='+encodeURIComponent(d.tables[0]?.id||'');
 return `<div class="settings-grid">
 ${box('Restaurant workspace','Details about your current restaurant',`<div class="settings-info"><div class="detail-row"><span>Restaurant</span><strong>${esc(d.user.restaurant)}</strong></div><div class="detail-row"><span>Owner</span><strong>${esc(d.user.name)}</strong></div><div class="detail-row"><span>Email</span><strong>${esc(d.user.email)}</strong></div><div class="detail-row"><span>Role</span><strong>${esc(d.user.role||'owner')}</strong></div><div class="detail-row"><span>Storage</span><strong>${ctx.mode==='demo'?'This browser only':'Neon PostgreSQL'}</strong></div></div>`)}
 ${box('Digital guest menu','Share this public link with your guests',`<div class="settings-info"><p>Your guests can explore the menu and place orders by scanning their table’s QR code. Generate one in Floor & tables.</p><div class="settings-url">${esc(link)}</div><button class="btn btn-lime btn-sm" data-action="copyLink" data-link="${esc(link)}">${icon('link')} Copy sample link</button> <button class="btn btn-dark btn-sm" data-action="openLink" data-link="${esc(link)}">Open guest menu ↗</button>${ctx.mode==='demo'?'<p class="small muted">Demo guest orders share data only within this browser. Live QR ordering requires the connected database.</p>':''}</div>`)}
 ${box('Your data','Portable records and demo controls',`<div class="settings-info"><p>Export the current list of orders for your records.</p><button class="btn btn-dark btn-sm" data-action="exportCSV">${icon('download')} Export orders CSV</button>${ctx.mode==='demo'?`<p style="margin-top:24px">Want to start over with the original sample restaurant?</p><button class="btn btn-red btn-sm" data-action="resetDemo">Reset demo data</button>`:''}</div>`)}
 ${box('About RestoSphere','A better operating system for hospitality',`<div class="settings-info"><p><strong>RestoSphere v1.0</strong> is a modern restaurant operations workspace, built with HTML, CSS, Vanilla JavaScript and a Neon-powered serverless API.</p><p>Smart insights, floor management, ticket workflows and QR-based guest ordering are included. Payment processing, advanced team roles and automated recipe deductions are future integrations.</p></div>`)}
 </div>`;
}
export function renderPage(ctx){
 switch(ctx.page){
 case 'tables':return renderTables(ctx);
 case 'orders':return renderOrders(ctx);
 case 'kitchen':return renderKitchen(ctx);
 case 'menu':return renderMenu(ctx);
 case 'inventory':return renderInventory(ctx);
 case 'reservations':return renderReservations(ctx);
 case 'insights':return renderInsights(ctx);
 case 'settings':return renderSettings(ctx);
 default:return renderOverview(ctx);
 }
}
