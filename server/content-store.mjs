import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

/**
 * Content persistence: PostgreSQL when DATABASE_URL exists.
 * Local JSON only for local development. Never write ephemeral production content.
 */
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const file=path.join(dir,'posts.json');
let poolPromise=null,writeQueue=Promise.resolve();
const unavailable=()=>Object.assign(new Error('Configure DATABASE_URL for durable production content.'),{status:503});
function checkStorage(){
 if(!process.env.DATABASE_URL&&(process.env.NODE_ENV==='production'||process.env.VERCEL||process.env.RAILWAY_ENVIRONMENT))throw unavailable();
}
async function database(){
 if(!process.env.DATABASE_URL)return null;
 if(!poolPromise)poolPromise=(async()=>{
  const {Pool}=await import('pg');
  const db=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:15000,connectionTimeoutMillis:8000});
  await db.query(`CREATE TABLE IF NOT EXISTS portfolio_posts (
    id UUID PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('post','thought')),
    status TEXT NOT NULL CHECK (status IN ('draft','published')),
    published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), data JSONB NOT NULL
  )`);
  await db.query('CREATE INDEX IF NOT EXISTS portfolio_posts_public_idx ON portfolio_posts (kind,status,published_at DESC)');
  return db;
 })().catch(error=>{poolPromise=null;throw error});
 return poolPromise;
}
async function readLocal(){
 try{const value=JSON.parse(await readFile(file,'utf8'));return Array.isArray(value)?value:[];}
 catch(e){if(e.code==='ENOENT')return [];throw e}
}
async function saveLocal(value){
 await mkdir(dir,{recursive:true});
 const tmp=file+'.'+crypto.randomUUID()+'.tmp';
 await writeFile(tmp,JSON.stringify(value,null,2),{mode:0o600});
 await rename(tmp,file);
}
function withLock(fn){
 const next=writeQueue.then(fn);writeQueue=next.catch(()=>{});return next;
}
const sort=(a,b)=>(b.publishedAt||b.updatedAt||'').localeCompare(a.publishedAt||a.updatedAt||'');
function fromRow(r){return {...r.data,id:r.id,slug:r.slug,kind:r.kind,status:r.status,createdAt:r.created_at?.toISOString?.()||r.created_at,updatedAt:r.updated_at?.toISOString?.()||r.updated_at,publishedAt:r.published_at?.toISOString?.()||null};}
async function all(){
 checkStorage();
 const db=await database();
 if(!db)return readLocal();
 const result=await db.query('SELECT * FROM portfolio_posts ORDER BY updated_at DESC LIMIT 1000');
 return result.rows.map(fromRow);
}
export const slugify=value=>String(value||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9 -]/g,'').trim().replace(/[ -]+/g,'-').slice(0,90);
export function allowedUrl(value){
 if(!value)return '';
 if(typeof value!=='string'||value.length>2000)throw Object.assign(new Error('External URL is too long.'),{status:400});
 try{const u=new URL(value.trim());if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('protocol');return u.href;}
 catch{throw Object.assign(new Error('Use a valid http or https image/LinkedIn URL.'),{status:400});}
}
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validatePost(data,existing=null){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Object.assign(new Error('Invalid content.'),{status:400});
 const kind=data.kind==='thought'?'thought':data.kind==='post'?'post':null;
 const status=data.status==='published'?'published':data.status==='draft'?'draft':null;
 const title=clean(data.title,160),content=clean(data.content,20000);
 const slug=slugify(data.slug||title);
 if(!kind||!status||title.length<3||content.length<4||!slug||slug.length<3)throw Object.assign(new Error('Title, content, type, status and valid slug are required.'),{status:400});
 if((data.content||'').length>20000||(data.title||'').length>160)throw Object.assign(new Error('Content exceeds the maximum length.'),{status:400});
 const tags=Array.isArray(data.tags)?data.tags:typeof data.tags==='string'?data.tags.split(','):[];
 if(tags.length>12)throw Object.assign(new Error('A maximum of 12 tags is supported.'),{status:400});
 const now=new Date().toISOString();
 return {
  id:existing?.id||crypto.randomUUID(),slug,title,kind,status,content,
  excerpt:clean(data.excerpt,400),category:clean(data.category,60)||'Engineering',
  tags:[...new Set(tags.map(x=>clean(x,36)).filter(Boolean))],
  imageUrl:allowedUrl(data.imageUrl||''),imageAlt:clean(data.imageAlt,180),
  linkedinUrl:allowedUrl(data.linkedinUrl||''),featured:data.featured===true,
  createdAt:existing?.createdAt||now,updatedAt:now,
  publishedAt:status==='published'?(existing?.publishedAt||now):null
 };
}
export async function listPosts({kind=null,includeDrafts=false,limit=100}={}){
 const entries=await all();
 return entries.filter(x=>(includeDrafts||x.status==='published')&&(!kind||x.kind===kind))
 .sort(sort).slice(0,Math.min(Math.max(Number(limit)||100,1),500));
}
export async function getPublicPost(slug){
 const p=(await all()).find(p=>p.slug===slug&&p.status==='published');return p||null;
}
export async function upsertPost(input,id=null){
 checkStorage();
 const db=await database();
 if(!db)return withLock(async()=>{
  const posts=await readLocal(),existing=id?posts.find(x=>x.id===id):null;
  if(id&&!existing)throw Object.assign(new Error('Post not found.'),{status:404});
  const item=validatePost(input,existing);
  if(posts.some(x=>x.slug===item.slug&&x.id!==item.id))throw Object.assign(new Error('Slug is already used.'),{status:409});
  if(existing)posts.splice(posts.indexOf(existing),1,item);else posts.push(item);
  await saveLocal(posts);return item;
 });
 // The database handles duplicate slugs and concurrent writes with its unique index.
 const existing=id?(await db.query('SELECT * FROM portfolio_posts WHERE id=$1',[id])).rows[0]:null;
 if(id&&!existing)throw Object.assign(new Error('Post not found.'),{status:404});
 const item=validatePost(input,existing?fromRow(existing):null);
 try{
  const r=await db.query(`INSERT INTO portfolio_posts(id,slug,kind,status,published_at,created_at,updated_at,data)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
   ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,kind=excluded.kind,status=excluded.status,
   published_at=excluded.published_at,updated_at=excluded.updated_at,data=excluded.data
   RETURNING id`,
   [item.id,item.slug,item.kind,item.status,item.publishedAt,item.createdAt,item.updatedAt,JSON.stringify(item)]);
  return item;
 }catch(e){
  if(e.code==='23505')throw Object.assign(new Error('Slug is already used.'),{status:409});
  throw e;
 }
}
export async function deletePost(id){
 checkStorage();const db=await database();
 if(!db)return withLock(async()=>{
  const posts=await readLocal();const index=posts.findIndex(x=>x.id===id);
  if(index<0)return false;
  posts.splice(index,1);await saveLocal(posts);return true;
 });
 const r=await db.query('DELETE FROM portfolio_posts WHERE id=$1 RETURNING id',[id]);return r.rowCount>0;
}
export function publicListItem({content,...post}){return post;}
