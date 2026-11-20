import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultDemo, demoMutation, weeklyRevenue, popularProducts, smartInsights } from '../assets/data.js';
import {renderOverview,renderTables,renderOrders,renderKitchen,renderMenu,renderInventory,renderReservations,renderInsights} from '../assets/views.js';

const base=()=>defaultDemo();
test('demo seeds realistic isolated restaurant data',()=>{
 const d=base();
 assert.equal(d.tables.length,12);assert.ok(d.products.length>=8);
 assert.ok(d.orders.length>0);assert.ok(d.inventory.length>0);
});
test('adding a table and updating status',()=>{
 const d=base();demoMutation(d,'table.create',{name:'T13',seats:6});
 const t=d.tables.find(x=>x.name==='T13');assert.ok(t);assert.equal(t.status,'available');
 demoMutation(d,'table.update',{id:t.id,status:'reserved'});assert.equal(t.status,'reserved');
});
test('order lifecycle updates availability and analytics',()=>{
 const d=base();const count=d.orders.length;
 demoMutation(d,'order.create',{tableId:'t1',items:[{id:'p1',qty:2},{id:'p2',qty:1}],note:'no nuts'});
 assert.equal(d.orders.length,count+1);assert.equal(d.orders[0].total,260);
 assert.equal(d.tables[0].status,'occupied');
 demoMutation(d,'order.status',{id:d.orders[0].id,status:'ready'});
 assert.equal(d.orders[0].status,'ready');
 assert.equal(weeklyRevenue(d).length,7);
 assert.ok(popularProducts(d).length>0);assert.equal(smartInsights(d).length,4);
});
test('inventory alerts are based on quantities and thresholds',()=>{
 const d=base();demoMutation(d,'inventory.save',{name:'Butter',unit:'kg',quantity:1,threshold:4,cost_per_unit:50});
 assert.ok(d.inventory.some(x=>x.name==='Butter'&&x.quantity<x.threshold));
});
test('all main views render without throwing',()=>{
 const d=base();const state={data:d,mode:'demo',selectedTableId:'t1',orderFilter:'all',menuFilter:'All',search:''};
 for(const fn of [renderOverview,renderTables,renderOrders,renderKitchen,renderMenu,renderInventory,renderReservations,renderInsights]){
  const html=fn(state);assert.ok(html.length>100,fn.name);
 }
});
