import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
process.env.NODE_ENV='test';
process.env.DATA_DIR=await mkdtemp(path.join(os.tmpdir(),'orbit-content-'));
delete process.env.DATABASE_URL;
const {slugify,allowedUrl,validatePost,upsertPost,listPosts,getPublicPost,deletePost}=await import('../server/content-store.mjs');
const template={kind:'post',status:'draft',title:'My thoughts on RAG systems',content:'A test article describing retrieval augmented generation.',excerpt:'A short excerpt',category:'AI Engineering',tags:['Python','RAG'],imageUrl:'https://media.licdn.com/example.jpg',imageAlt:'A test cover',linkedinUrl:'https://www.linkedin.com/posts/example'};
test('title slugs and external image URL validation',()=>{
 assert.equal(slugify('Async APIs & RAG: What Works?'),'async-apis-rag-what-works');
 assert.match(allowedUrl('https://media.licdn.com/test.png'),/^https:/);
 assert.throws(()=>allowedUrl('javascript:alert(1)'),/http or https/);
 assert.throws(()=>validatePost({...template,imageUrl:'data:image/svg+xml,<svg>'}),/http or https/);
});
test('drafts remain private until published and content is persisted locally',async()=>{
 try{
  const draft=await upsertPost(template);assert.equal((await listPosts()).length,0);
  assert.equal(await getPublicPost(draft.slug),null);
  const published=await upsertPost({...draft,status:'published'},draft.id);
  assert.equal((await listPosts()).length,1);
  assert.equal((await getPublicPost(draft.slug)).imageUrl,'https://media.licdn.com/example.jpg');
  await upsertPost({...template,kind:'thought',title:'Quick thought',slug:'quick-thought',status:'published'});
  assert.equal((await listPosts({kind:'thought'})).length,1);
  await assert.rejects(()=>upsertPost({...template,status:'published'}),/Slug is already used/);
  assert.equal(await deletePost(published.id),true);
  assert.equal((await listPosts({kind:'post'})).length,0);
 }finally{await rm(process.env.DATA_DIR,{recursive:true,force:true})}
});