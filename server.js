// Local static demo server. Use "vercel dev" for database-backed API routes.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  res.writeHead(503,{'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify({error:'Run npx vercel dev to use the database API. The demo runs without it.'}));return;
 }
 const pathname=url.pathname==='/'?'/index.html':url.pathname;
 if(pathname!=='/index.html'&&!/^\/assets\/[a-zA-Z0-9._/-]+$/.test(pathname)){
  res.writeHead(404);res.end('Not found');return;
 }
 const target=path.resolve(root,'.'+pathname);
 if(!target.startsWith(root+path.sep)){
  res.writeHead(403);res.end('Forbidden');return;
 }
 fs.readFile(target,(err,data)=>{
  if(err){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});
  res.end(data);
 });
}).listen(process.env.PORT||3000,()=>console.log('RestoSphere preview: http://localhost:'+(process.env.PORT||3000)));
