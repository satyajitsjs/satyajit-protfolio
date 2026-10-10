import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'orbit-integration-'));
process.env.NODE_ENV='test';process.env.DATA_DIR=dataDir;delete process.env.DATABASE_URL;process.env.ADMIN_TOKEN='an-unpredictable-local-test-token';
const {server}=await import('../server/index.mjs');

test('complete contact + moderated guestbook + admin + SEO flow',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const headers={'content-type':'application/json'};
  const admin={authorization:`Bearer ${process.env.ADMIN_TOKEN}`};
  async function call(url,body,extra={}){const r=await fetch(base+url,{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
  try{
    assert.equal((await fetch(base+'/about')).status,200);
    let seo=await (await fetch(base+'/sitemap.xml')).text();assert.match(seo,/projects\/fabricflow/);assert.match(seo,/journal\/rag-beyond-vector-search/);
    const invalid=await call('/api/contact',{name:'X',email:'not-email',subject:'Hi',message:'short'});assert.equal(invalid.status,400);
    const contact=await call('/api/contact',{name:'Test Sender',email:'sender@example.org',subject:'A collaboration proposal',message:'I am testing the working contact form endpoint end to end.'});assert.equal(contact.status,201);assert.equal(contact.data.received,true);
    const inbox=JSON.parse(await readFile(path.join(dataDir,'inbox.json'),'utf8'));assert.equal(inbox.length,1);
    assert.equal((await fetch(base+'/data/inbox.json')).status,404);
    const comment=await call('/api/guestbook',{name:'Test Commenter',message:'Hello from the test guestbook.'});assert.equal(comment.status,201);assert.equal(comment.data.status,'pending');
    let visible=await(await fetch(base+'/api/guestbook')).json();assert.equal(visible.entries.length,0);
    assert.equal((await fetch(base+'/api/admin/guestbook')).status,401);
    const queue=await(await fetch(base+'/api/admin/guestbook',{headers:admin})).json();assert.equal(queue.entries.length,1);
    const id=queue.entries[0].id;
    const approve=await fetch(base+`/api/admin/guestbook/${id}/approve`,{method:'POST',headers:admin});assert.equal(approve.status,200);
    visible=await(await fetch(base+'/api/guestbook')).json();assert.equal(visible.entries.length,1);assert.equal(visible.entries[0].name,'Test Commenter');
    const adminInbox=await(await fetch(base+'/api/admin/inbox',{headers:admin})).json();assert.equal(adminInbox.entries.length,1);
    // Content Studio — secure draft/publication lifecycle and direct external image URL.
    assert.equal((await fetch(base+'/api/admin/posts')).status,401);
    assert.equal((await fetch(base+'/thoughts')).status,200);
    assert.equal((await fetch(base+'/admin/content')).status,200);
    const draftPayload={kind:'post',status:'draft',title:'Practical lessons from RAG',content:'A practical article about retrieval quality and software engineering.',category:'AI Engineering',excerpt:'Retrieval matters.',tags:['Python','RAG'],imageUrl:'https://media.licdn.com/test-image.jpg',linkedinUrl:'https://www.linkedin.com/posts/example'};
    const draftResp=await fetch(base+'/api/admin/posts',{method:'POST',headers:{...headers,...admin},body:JSON.stringify(draftPayload)});
    assert.equal(draftResp.status,201);
    const draft=(await draftResp.json()).entry;
    const before=await(await fetch(base+'/api/posts?kind=post')).json();assert.equal(before.entries.length,0);
    const forbidden=await fetch(base+'/api/admin/posts/'+draft.id,{method:'PUT',headers,body:JSON.stringify({...draftPayload,status:'published'})});
    assert.equal(forbidden.status,401);
    const pub=await fetch(base+'/api/admin/posts/'+draft.id,{method:'PUT',headers:{...headers,...admin},body:JSON.stringify({...draftPayload,status:'published'})});
    assert.equal(pub.status,200);
    const feed=await(await fetch(base+'/api/posts?kind=post')).json();assert.equal(feed.entries.length,1);
    assert.equal(feed.entries[0].imageUrl,'https://media.licdn.com/test-image.jpg');
    assert.equal(feed.entries[0].content,undefined); // public listing should be lightweight
    assert.equal((await fetch(base+'/api/posts/practical-lessons-from-rag')).status,200);
    const thought=await fetch(base+'/api/admin/posts',{method:'POST',headers:{...headers,...admin},body:JSON.stringify({...draftPayload,title:'Short observation',kind:'thought',slug:'short-observation',status:'published'})});
    assert.equal(thought.status,201);
    assert.equal((await(await fetch(base+'/api/posts?kind=thought')).json()).entries.length,1);
    const del=await fetch(base+'/api/admin/posts/'+draft.id,{method:'DELETE',headers:admin});assert.equal(del.status,200);
    assert.equal((await fetch(base+'/api/posts/practical-lessons-from-rag')).status,404);

  }finally{await new Promise(resolve=>server.close(resolve));await rm(dataDir,{recursive:true,force:true});}
});
