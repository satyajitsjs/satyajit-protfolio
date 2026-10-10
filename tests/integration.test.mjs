import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const dataDir=await mkdtemp(path.join(os.tmpdir(),'orbit-integration-'));
process.env.NODE_ENV='test';process.env.DATA_DIR=dataDir;process.env.ADMIN_TOKEN='an-unpredictable-local-test-token';
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
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dataDir,{recursive:true,force:true});}
});
