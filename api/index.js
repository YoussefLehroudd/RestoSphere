import { neon } from '@neondatabase/serverless';
import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';

const client = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const q = (text, params=[]) => {
  if (!client) throw new Error('Database unavailable');
  return client.query(text, params);
};
const statuses = ['new','preparing','ready','served','paid','cancelled'];
const safeStr = (v,max=160)=>String(v??'').trim().slice(0,max);
const currency = v => Number(v)||0;
const hashToken = s => createHash('sha256').update(s).digest('hex');
const passwordHash = (pw) => {
  const salt=randomBytes(16).toString('hex');
  return salt+':'+scryptSync(pw,salt,64).toString('hex');
};
const verifyPassword = (pw,stored) => {
  try {const [salt,hex]=stored.split(':');return timingSafeEqual(Buffer.from(hex,'hex'),scryptSync(pw,salt,64));}catch{return false;}
};
const cookie = token => 'restosphere_session='+token+'; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=1209600';
const clearCookie = 'restosphere_session=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0';
const send = (res,status,data) => {res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
const error = (status,message) => {const err=new Error(message);err.status=status;throw err;};
function parseCookie(req) {const raw=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('restosphere_session='));return raw?.split('=')[1]||'';}
async function userOf(req) {
 const token=parseCookie(req);if(!/^[a-f0-9]{64}$/.test(token))return null;
 const rows=await q(`SELECT u.id,u.name,u.email,u.role,u.org_id,o.name AS restaurant,o.slug FROM sessions s JOIN users u ON u.id=s.user_id JOIN organizations o ON o.id=u.org_id WHERE s.token_hash=$1 AND s.expires_at>now() LIMIT 1`,[hashToken(token)]);
 return rows[0]||null;
}
async function sessionFor(res,id) {
 const token=randomBytes(32).toString('hex');
 await q('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'14 days\')',[hashToken(token),id]);
 res.setHeader('Set-Cookie',cookie(token));
}
async function jsonBody(req) {
 if(req.method==='GET')return {};
 const pieces=[];let len=0;
 for await(const chunk of req){len+=chunk.length;if(len>65536)error(413,'Payload too large');pieces.push(chunk);}
 try{return JSON.parse(Buffer.concat(pieces).toString('utf8')||'{}');}catch{error(400,'Invalid JSON');}
}
const idOk = s => /^[a-f0-9]{8}-[a-f0-9-]{27,36}$/i.test(String(s||''));
const requireId = v => {if(!idOk(v))error(400,'Invalid identifier');return v;};
const requireUser = u => {if(!u)error(401,'Please sign in');return u;};
async function starter(orgId) {
 await q("INSERT INTO dining_tables(org_id,name,seats) SELECT $1, 'T' || lpad(n::text,2,'0'), CASE WHEN n%3=0 THEN 6 ELSE 4 END FROM generate_series(1,12) AS n",[orgId]);
 const menu=[
 ['Margherita Pizza','Pizza','🍕',75,28],['Truffle Pasta','Main Course','🍝',110,44],
 ['Classic Burger','Burgers','🍔',95,36],['Caesar Salad','Salads','🥗',65,22],
 ['Grilled Salmon','Main Course','🐟',145,68],['Tiramisu','Desserts','🍰',55,17],
 ['Iced Matcha','Drinks','🍵',42,12],['Fresh Lemonade','Drinks','🍋',35,9]
 ].map(([name,category,emoji,price,cost])=>({name,category,emoji,price,cost}));
 await q("INSERT INTO products(org_id,name,category,emoji,price,cost) SELECT $1,p.name,p.category,p.emoji,p.price,p.cost FROM jsonb_to_recordset($2::jsonb) AS p(name text,category text,emoji text,price numeric,cost numeric)",[orgId,JSON.stringify(menu)]);
 const ingredients=[['Tomatoes','kg',14,5,14],['Mozzarella','kg',8,4,65],['Flour','kg',22,6,9],['Chicken','kg',4,5,52],['Coffee beans','kg',6,2,120]]
 .map(([name,unit,quantity,threshold,cost_per_unit])=>({name,unit,quantity,threshold,cost_per_unit}));
 await q("INSERT INTO inventory(org_id,name,unit,quantity,threshold,cost_per_unit) SELECT $1,i.name,i.unit,i.quantity,i.threshold,i.cost_per_unit FROM jsonb_to_recordset($2::jsonb) AS i(name text,unit text,quantity numeric,threshold numeric,cost_per_unit numeric)",[orgId,JSON.stringify(ingredients)]);
}
async function makeOrder({orgId,tableId,items,note,source}){
 if(!idOk(tableId))error(400,'Please select a table');
 const [table]=await q('SELECT id FROM dining_tables WHERE id=$1 AND org_id=$2',[tableId,orgId]);
 if(!table)error(404,'Table not found');
 if(!Array.isArray(items)||items.length<1||items.length>25)error(400,'Choose at least one item (max 25)');
 const normalized=[];
 for(const item of items){if(!idOk(item.id)||!Number.isInteger(Number(item.qty))||item.qty<1||item.qty>20)error(400,'Invalid cart'); normalized.push({id:item.id,qty:Number(item.qty)});}
 const ids=[...new Set(normalized.map(i=>i.id))];
 const rows=await q('SELECT id,name,price FROM products WHERE org_id=$1 AND active=true AND id=ANY($2::uuid[])',[orgId,ids]);
 if(rows.length!==ids.length)error(400,'One of the menu items is unavailable');
 const lookup=new Map(rows.map(p=>[p.id,p]));
 const total=Math.round(normalized.reduce((s,i)=>s+currency(lookup.get(i.id).price)*i.qty,0)*100)/100;
 const [order]=await q('INSERT INTO orders(org_id,table_id,total,note,source) VALUES($1,$2,$3,$4,$5) RETURNING id,status,created_at',[orgId,tableId,total,safeStr(note,350),source]);
 await q("INSERT INTO order_items(order_id,product_id,name,quantity,unit_price) SELECT $1,p.id,p.name,i.qty,p.price FROM jsonb_to_recordset($2::jsonb) AS i(id uuid,qty int) JOIN products p ON p.id=i.id WHERE p.org_id=$3",[order.id,JSON.stringify(normalized),orgId]);
 await q("UPDATE dining_tables SET status='occupied' WHERE id=$1 AND org_id=$2",[tableId,orgId]);
 return {id:order.id,total,status:order.status};
}
function isMutation(req){return ['POST','PUT','PATCH','DELETE'].includes(req.method);}
export default async function handler(req,res){
 try {
  if(!['GET','POST','PATCH','DELETE'].includes(req.method))error(405,'Method not allowed');
  const url=new URL(req.url,'https://restosphere.app');
  const action=url.searchParams.get('action')||'health';
  if(isMutation(req)&&req.headers.origin) {
   const origin=new URL(req.headers.origin);
   if(origin.host!==(req.headers['x-forwarded-host']||req.headers.host))error(403,'Invalid request origin');
  }
  if(action==='health')return send(res,200,{ok:true,service:'RestoSphere API',database:!!client});
  if(!client)error(503,'Database is not configured. Explore the interactive demo instead.');
  if(action==='public.menu'&&req.method==='GET') {
   const slug=safeStr(url.searchParams.get('slug'),80);
   const tableId=url.searchParams.get('table');
   const [org]=await q('SELECT id,name,slug FROM organizations WHERE slug=$1',[slug]);
   if(!org)error(404,'Restaurant not found');
   const tables=tableId&&idOk(tableId)?await q('SELECT id,name FROM dining_tables WHERE org_id=$1 AND id=$2',[org.id,tableId]):[];
   const products=await q('SELECT id,name,category,emoji,price,prep_minutes FROM products WHERE org_id=$1 AND active=true ORDER BY category,name',[org.id]);
   return send(res,200,{restaurant:org,table:tables[0]||null,products});
  }
  const body=await jsonBody(req);
  if(action==='auth.register'&&req.method==='POST'){
   const name=safeStr(body.name,90),restaurant=safeStr(body.restaurant,100),email=safeStr(body.email,200).toLowerCase(),pw=String(body.password||'');
   if(name.length<2||restaurant.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pw.length<10||pw.length>128)error(400,'Please provide valid details and a password of 10+ characters');
   if((await q('SELECT 1 FROM users WHERE email=$1',[email])).length)error(409,'This email is already registered');
   const slug=restaurant.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'restaurant';
   const suffix=randomBytes(3).toString('hex');
   const [org]=await q('INSERT INTO organizations(name,slug) VALUES($1,$2) RETURNING id',[restaurant,slug+'-'+suffix]);
   const [user]=await q('INSERT INTO users(org_id,name,email,pass_hash) VALUES($1,$2,$3,$4) RETURNING id',[org.id,name,email,passwordHash(pw)]);
   await starter(org.id);await sessionFor(res,user.id);
   return send(res,201,{ok:true});
  }
  if(action==='auth.login'&&req.method==='POST'){
   const email=safeStr(body.email,200).toLowerCase();
   const rows=await q('SELECT id,pass_hash FROM users WHERE email=$1',[email]);
   if(!rows[0]||!verifyPassword(String(body.password||''),rows[0].pass_hash))error(401,'Invalid email or password');
   await sessionFor(res,rows[0].id);return send(res,200,{ok:true});
  }
  if(action==='auth.logout'&&req.method==='POST'){
   const token=parseCookie(req);if(token)await q('DELETE FROM sessions WHERE token_hash=$1',[hashToken(token)]);
   res.setHeader('Set-Cookie',clearCookie);return send(res,200,{ok:true});
  }
  if(action==='public.order'&&req.method==='POST'){
   const slug=safeStr(body.slug,80),tableId=requireId(body.tableId);
   const [org]=await q('SELECT id FROM organizations WHERE slug=$1',[slug]);if(!org)error(404,'Restaurant not found');
   const [rate]=await q("SELECT count(*)::int AS n FROM orders WHERE org_id=$1 AND table_id=$2 AND source='qr' AND created_at>now()-interval '10 minutes'",[org.id,tableId]);
   if(rate.n>=12)error(429,'Too many orders for this table; please ask a waiter');
   const result=await makeOrder({orgId:org.id,tableId,items:body.items,note:body.note,source:'qr'});
   return send(res,201,{ok:true,order:result});
  }
  const user=requireUser(await userOf(req));
  if(action==='auth.me'&&req.method==='GET')return send(res,200,{user});
  if(action==='bootstrap'&&req.method==='GET'){
   const [tables,products,inventory,orders,items,reservations]=await Promise.all([
    q('SELECT * FROM dining_tables WHERE org_id=$1 ORDER BY name',[user.org_id]),
    q('SELECT * FROM products WHERE org_id=$1 ORDER BY category,name',[user.org_id]),
    q('SELECT * FROM inventory WHERE org_id=$1 ORDER BY name',[user.org_id]),
    q('SELECT o.*,t.name AS table_name FROM orders o LEFT JOIN dining_tables t ON t.id=o.table_id WHERE o.org_id=$1 ORDER BY o.created_at DESC LIMIT 250',[user.org_id]),
    q('SELECT oi.*,o.id AS order_reference FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.org_id=$1 AND o.created_at>now()-interval \'90 days\'',[user.org_id]),
    q('SELECT r.*,t.name AS table_name FROM reservations r LEFT JOIN dining_tables t ON t.id=r.table_id WHERE r.org_id=$1 ORDER BY r.reserved_for DESC LIMIT 100',[user.org_id])
   ]);
   return send(res,200,{user,tables,products,inventory,orders:orders.map(o=>({...o,items:items.filter(i=>i.order_id===o.id)})),reservations});
  }
  if(action==='table.create'&&req.method==='POST'){
   const name=safeStr(body.name,25).toUpperCase(),seats=Math.max(1,Math.min(20,Math.floor(Number(body.seats)||4)));
   if(!name)error(400,'Table name required');
   await q('INSERT INTO dining_tables(org_id,name,seats) VALUES($1,$2,$3)',[user.org_id,name,seats]);
   return send(res,201,{ok:true});
  }
  if(action==='table.update'&&req.method==='POST'){
   const id=requireId(body.id),status=safeStr(body.status,20);
   if(!['available','occupied','reserved','cleaning'].includes(status))error(400,'Invalid table status');
   await q('UPDATE dining_tables SET status=$1 WHERE org_id=$2 AND id=$3',[status,user.org_id,id]);return send(res,200,{ok:true});
  }
  if(action==='table.delete'&&req.method==='POST'){
   await q('DELETE FROM dining_tables WHERE org_id=$1 AND id=$2',[user.org_id,requireId(body.id)]);return send(res,200,{ok:true});
  }
  if(action==='product.save'&&req.method==='POST'){
   const name=safeStr(body.name,120),cat=safeStr(body.category,70)||'Main Course',emoji=safeStr(body.emoji,10)||'🍽️',price=Number(body.price),cost=Number(body.cost)||0,prep=Math.max(1,Math.min(180,Number(body.prep_minutes)||15));
   if(!name||!Number.isFinite(price)||price<0||price>100000||cost<0||cost>100000)error(400,'Invalid menu item');
   if(body.id){await q('UPDATE products SET name=$1,category=$2,emoji=$3,price=$4,cost=$5,prep_minutes=$6,active=$7 WHERE org_id=$8 AND id=$9',[name,cat,emoji,price,cost,prep,body.active!==false,user.org_id,requireId(body.id)]);}
   else await q('INSERT INTO products(org_id,name,category,emoji,price,cost,prep_minutes) VALUES($1,$2,$3,$4,$5,$6,$7)',[user.org_id,name,cat,emoji,price,cost,prep]);
   return send(res,200,{ok:true});
  }
  if(action==='product.delete'&&req.method==='POST'){
   await q('UPDATE products SET active=false WHERE org_id=$1 AND id=$2',[user.org_id,requireId(body.id)]);return send(res,200,{ok:true});
  }
  if(action==='inventory.save'&&req.method==='POST'){
   const name=safeStr(body.name,120),unit=safeStr(body.unit,24)||'kg',quantity=Number(body.quantity),threshold=Number(body.threshold),cost=Number(body.cost_per_unit)||0;
   if(!name||![quantity,threshold,cost].every(x=>Number.isFinite(x)&&x>=0&&x<=100000000))error(400,'Invalid inventory item');
   if(body.id)await q('UPDATE inventory SET name=$1,unit=$2,quantity=$3,threshold=$4,cost_per_unit=$5 WHERE org_id=$6 AND id=$7',[name,unit,quantity,threshold,cost,user.org_id,requireId(body.id)]);
   else await q('INSERT INTO inventory(org_id,name,unit,quantity,threshold,cost_per_unit) VALUES($1,$2,$3,$4,$5,$6)',[user.org_id,name,unit,quantity,threshold,cost]);
   return send(res,200,{ok:true});
  }
  if(action==='inventory.delete'&&req.method==='POST'){
   await q('DELETE FROM inventory WHERE org_id=$1 AND id=$2',[user.org_id,requireId(body.id)]);return send(res,200,{ok:true});
  }
  if(action==='order.create'&&req.method==='POST'){
   const order=await makeOrder({orgId:user.org_id,tableId:body.tableId,items:body.items,note:body.note,source:'staff'});
   return send(res,201,{ok:true,order});
  }
  if(action==='order.status'&&req.method==='POST'){
   const id=requireId(body.id),status=safeStr(body.status,25);
   if(!statuses.includes(status))error(400,'Invalid order status');
   await q('UPDATE orders SET status=$1,updated_at=now() WHERE id=$2 AND org_id=$3',[status,id,user.org_id]);
   return send(res,200,{ok:true});
  }
  if(action==='reservation.create'&&req.method==='POST'){
   const name=safeStr(body.guest_name,100),phone=safeStr(body.guest_phone,45),party=Math.floor(Number(body.party_size)||2),date=new Date(body.reserved_for);
   if(!name||!Number.isFinite(date.valueOf())||date.valueOf()<Date.now()-3600000||party<1||party>30)error(400,'Invalid reservation');
   const tableId=body.table_id?requireId(body.table_id):null;
   if(tableId){const r=await q('SELECT id FROM dining_tables WHERE org_id=$1 AND id=$2',[user.org_id,tableId]);if(!r.length)error(400,'Table not found');}
   await q('INSERT INTO reservations(org_id,table_id,guest_name,guest_phone,party_size,reserved_for) VALUES($1,$2,$3,$4,$5,$6)',[user.org_id,tableId,name,phone,party,date.toISOString()]);
   return send(res,201,{ok:true});
  }
  if(action==='reservation.status'&&req.method==='POST'){
   const status=safeStr(body.status,20);if(!['confirmed','seated','completed','cancelled'].includes(status))error(400,'Invalid status');
   await q('UPDATE reservations SET status=$1 WHERE id=$2 AND org_id=$3',[status,requireId(body.id),user.org_id]);return send(res,200,{ok:true});
  }
  error(404,'Unknown API action');
 }catch(e){
  if(e.code==='23505')return send(res,409,{error:'This record already exists'});
  console.error('[RestoSphere API]',e.message);
  return send(res,e.status||500,{error:e.status?e.message:'Unable to process this request. Please try again.'});
 }
}
