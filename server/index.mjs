import http from 'node:http';
import {readFile, mkdir, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {projects,articles} from '../public/assets/js/content.js';
import {listPosts,getPublicPost,upsertPost,deletePost,publicListItem} from './content-store.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const PORT = Number(process.env.PORT || 4173);
const MAX_BODY = 55_000;
const rate = new Map();
function adminAuthorized(req){const expected=process.env.ADMIN_TOKEN || ''; const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(expected.length<16||token.length!==expected.length)return false;return crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(token));}
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.pdf':'application/pdf','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};

export const validEmail = (s) => typeof s === 'string' && s.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const clean = (value,max) => typeof value === 'string' ? value.trim().slice(0,max) : '';
export const validContact = (v) => v && clean(v.name,80).length >= 2 && validEmail(v.email) && clean(v.subject,120).length >= 3 && clean(v.message,4000).length >= 20 && (v.message?.length || 0) <= 4000;
export const validGuest = (v) => v && clean(v.name,65).length >= 2 && clean(v.message,700).length >= 8 && (v.message?.length || 0) <= 700;
async function dbRead(name){ try {return JSON.parse(await readFile(path.join(DATA,name),'utf8'));} catch (e){if(e.code==='ENOENT')return []; throw e;} }
async function dbWrite(name,value){ await mkdir(DATA,{recursive:true}); const dest=path.join(DATA,name), tmp=dest+'.tmp'; await writeFile(tmp,JSON.stringify(value,null,2));await rename(tmp,dest); }
let queue = Promise.resolve();
function mutate(name,fn){ const run=queue.then(async()=>{const data=await dbRead(name);const result=fn(data);await dbWrite(name,data);return result;});queue=run.catch(()=>{});return run; }
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
function throttled(req,type,limit,windowMs){ const ip=req.socket.remoteAddress || 'unknown';const key=`${ip}:${type}`;const now=Date.now();const history=(rate.get(key)||[]).filter(t=>now-t<windowMs);if(history.length>=limit)return true;history.push(now);rate.set(key,history);return false; }
async function body(req){const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('Payload too large'),{status:413});parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});}}
function escapeXml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
const safeRoutes=new Set(['/','/about','/projects','/experience','/skills','/journal','/thoughts','/guestbook','/contact','/lab','/links','/admin','/admin/content','/privacy']);
async function handler(req,res){
 try {
  const u = new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(u.pathname).replace(/\/+$/,'')||'/';
  if(pathname==='/api/health')return json(res,200,{ok:true,contentStorage:process.env.DATABASE_URL?'postgresql':'local-development-only',guestbook:'moderated'});
  // Public readers can only access published content. Admin writes use the existing private bearer token.
  if(pathname==='/api/posts'&&req.method==='GET'){
   const kind=u.searchParams.get('kind');
   if(kind&&!['post','thought'].includes(kind))return json(res,400,{error:'Unknown content type.'});
   const entries=await listPosts({kind,limit:150});
   return json(res,200,{entries:entries.map(publicListItem)});
  }
  if(/^\/api\/posts\/[a-z0-9-]{3,90}$/.test(pathname)&&req.method==='GET'){
   const slug=pathname.split('/').pop();
   const entry=await getPublicPost(slug);
   return json(res,entry?200:404,entry?{entry}:{error:'Post not found.'});
  }
  if(pathname==='/api/admin/posts'||/^\/api\/admin\/posts\/[a-f0-9-]{36}$/.test(pathname)){
   if(!process.env.ADMIN_TOKEN||process.env.ADMIN_TOKEN.length<16)return json(res,503,{error:'Configure ADMIN_TOKEN to manage content.'});
   if(throttled(req,'content-admin',150,60*60*1000))return json(res,429,{error:'Too many admin requests.'});
   if(!adminAuthorized(req))return json(res,401,{error:'Unauthorized.'});
   if(pathname==='/api/admin/posts'&&req.method==='GET'){
    return json(res,200,{entries:await listPosts({includeDrafts:true,limit:500})});
   }
   if(pathname==='/api/admin/posts'&&req.method==='POST'){
    const entry=await upsertPost(await body(req));return json(res,201,{entry});
   }
   const id=pathname.split('/').pop();
   if(!/^[a-f0-9-]{36}$/.test(id))return json(res,400,{error:'Invalid ID.'});
   if(req.method==='PUT'){
    const entry=await upsertPost(await body(req),id);return json(res,200,{entry});
   }
   if(req.method==='DELETE'){
    const removed=await deletePost(id);
    return json(res,removed?200:404,removed?{ok:true}:{error:'Post not found.'});
   }
   return json(res,405,{error:'Method not allowed'});
  }
  if(pathname.startsWith('/api/admin/')){
    if(!process.env.ADMIN_TOKEN||process.env.ADMIN_TOKEN.length<16)return json(res,503,{error:'Set ADMIN_TOKEN (at least 16 characters) to enable administration.'});
    if(throttled(req,'admin',60,60*60*1000))return json(res,429,{error:'Too many requests.'});
    if(!adminAuthorized(req))return json(res,401,{error:'Invalid admin token.'});
    if(pathname==='/api/admin/guestbook'&&req.method==='GET')return json(res,200,{entries:(await dbRead('guestbook.json')).slice().reverse()});
    if(pathname==='/api/admin/inbox'&&req.method==='GET')return json(res,200,{entries:(await dbRead('inbox.json')).slice().reverse()});
    const match=pathname.match(/^\/api\/admin\/guestbook\/([a-f0-9-]{36})\/(approve|reject)$/);
    if(match&&req.method==='POST'){
      let found=false;
      await mutate('guestbook.json',items=>{const entry=items.find(m=>m.id===match[1]);if(entry){found=true;entry.status=match[2]==='approve'?'approved':'rejected';}});
      return json(res,found?200:404,found?{ok:true,status:match[2]}:{error:'Message not found'});
    }
    return json(res,404,{error:'Admin route not found'});
  }
  if(pathname==='/api/guestbook' && req.method==='GET'){
   const list=await dbRead('guestbook.json');return json(res,200,{entries:list.filter(v=>v.status==='approved').slice().reverse().map(({id,name,message,createdAt})=>({id,name,message,createdAt}))});
  }
  if(pathname==='/api/guestbook' && req.method==='POST'){
   if(throttled(req,'guestbook',3,60*60*1000))return json(res,429,{error:'Too many messages. Please try later.'});
   const b=await body(req); if(b.website)return json(res,200,{ok:true,status:'pending'});
   if(!validGuest(b))return json(res,400,{error:'Please enter your name and a message between 8 and 700 characters.'});
   await mutate('guestbook.json',v=>v.push({id:crypto.randomUUID(),name:clean(b.name,65),message:clean(b.message,700),createdAt:new Date().toISOString(),status:'pending'}));
   return json(res,201,{ok:true,status:'pending',message:'Thanks! Your note will appear once reviewed.'});
  }
  if(pathname==='/api/contact' && req.method==='POST'){
   if(throttled(req,'contact',5,60*60*1000))return json(res,429,{error:'Too many requests. Please try later.'});
   const b=await body(req);if(b.website)return json(res,200,{ok:true});
   if(!validContact(b))return json(res,400,{error:'Please provide your name, a valid email, a subject, and a message of at least 20 characters.'});
   const item={id:crypto.randomUUID(),name:clean(b.name,80),email:clean(b.email,200),subject:clean(b.subject,120),message:clean(b.message,4000),createdAt:new Date().toISOString()};
   await mutate('inbox.json',v=>v.push(item));
   let notified=false;
   if(process.env.CONTACT_WEBHOOK_URL){
    try{ const webhook=new URL(process.env.CONTACT_WEBHOOK_URL);if(webhook.protocol==='https:'){ const r=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:`New portfolio inquiry from ${item.name} <${item.email}>: ${item.subject}\n${item.message}`, ...item}),signal:AbortSignal.timeout(5000)});notified=r.ok; }}catch(e){console.warn('Webhook not delivered',e.message);}
   }
   return json(res,201,{ok:true,received:true,notified,message:'Message received. Thank you for reaching out!'});
  }
  if(pathname.startsWith('/api/'))return json(res,404,{error:'Not found'});
  if(pathname==='/robots.txt'){
    const base=(process.env.SITE_URL||`http://localhost:${PORT}`).replace(/\/$/,'');
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8'});
    return res.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
  }
  if(pathname==='/sitemap.xml'){
    const base=(process.env.SITE_URL||`http://localhost:${PORT}`).replace(/\/$/,'');
    const routes=[...safeRoutes].filter(x=>!x.startsWith('/admin')&&x!=='/lab'&&x!=='/guestbook');
    for(const p of projects)routes.push('/projects/'+p.slug);
    for(const a of articles)routes.push('/journal/'+a.slug);
    try{for(const p of await listPosts({kind:'post'}))routes.push('/journal/'+p.slug);}catch(err){console.warn('Dynamic sitemap entries unavailable:',err.message);}
    const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(x=>`<url><loc>${escapeXml(base+x)}</loc></url>`).join('')}</urlset>`;
    res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});return res.end(xml);
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
  if(pathname.startsWith('/assets/') || pathname==='/resume.pdf'){
   const target=path.resolve(PUBLIC,'.'+pathname);
   if(!target.startsWith(PUBLIC+path.sep)){res.writeHead(403);return res.end();}
   try{const file=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:file);}catch{res.writeHead(404);return res.end('Not found');}
  }
  if(safeRoutes.has(pathname)||/^\/projects\/[a-z0-9-]+$/.test(pathname)||/^\/journal\/[a-z0-9-]+$/.test(pathname)){
   let html=await readFile(path.join(PUBLIC,'index.html'),'utf8');
   const slugs={'/':'Backend & AI Engineer','/about':'About','/projects':'Projects','/experience':'Experience','/skills':'Skills','/journal':'Engineering Journal','/thoughts':'Thoughts & Updates','/admin/content':'Content Studio','/guestbook':'Guestbook','/contact':'Contact','/lab':'3D Lab','/links':'Links & Demos','/admin':'Admin','/privacy':'Privacy'};
   const project=projects.find(x=>pathname==='/projects/'+x.slug), article=articles.find(x=>pathname==='/journal/'+x.slug);
   let dynamicPost=null;
   if(pathname.startsWith('/journal/')&&!article){try{dynamicPost=await getPublicPost(pathname.split('/').pop());}catch{}}
   const title=project?.name||article?.title||dynamicPost?.title||slugs[pathname]||'Portfolio';
   html=html.replace(/<title>[^<]*<\/title>/,`<title>${escapeXml(title)} | Satyajit Sahoo</title>`);
   if(pathname.startsWith('/admin'))html=html.replace('</head>','<meta name="robots" content="noindex,nofollow" /></head>');
   if(dynamicPost){
    const summary=dynamicPost.excerpt||dynamicPost.content.slice(0,150);
    html=html.replace(/<meta name="description"[^>]*>/,'<meta name="description" content="'+escapeXml(summary.slice(0,240))+'" />');
    if(dynamicPost.imageUrl)html=html.replace('</head>','<meta property="og:image" content="'+escapeXml(dynamicPost.imageUrl)+'" /></head>');
   }
   if(process.env.SITE_URL)html=html.replace('</head>',`<link rel="canonical" href="${escapeXml(process.env.SITE_URL.replace(/\/$/,'')+pathname)}" /></head>`);
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'});return res.end(req.method==='HEAD'?undefined:html);
  }
  res.writeHead(404,{'Content-Type':'text/plain'});res.end('Page not found');
 }catch(err){console.error('Request error:',err.message);json(res,err.status||500,{error:err.status?err.message:'Server error'});}
}
export const server=http.createServer(handler);
if(process.env.NODE_ENV!=='test')server.listen(PORT,'0.0.0.0',()=>console.log(`Orbit Portfolio → http://localhost:${PORT}`));
