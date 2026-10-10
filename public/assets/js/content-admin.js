import {renderDetail} from './content-ui.js';
export function studioPage(){
 return `<main class="fade-route"><section class="page-hero"><div class="container"><div class="tagline">PRIVATE / CONTENT CONTROL</div><h1 class="display-lg">Content <span class="gradient-text">Studio.</span></h1><p class="intro">Write blog posts and quick thoughts, paste LinkedIn text and image URLs, and choose exactly what goes public.</p><div class="studio-links"><a data-link href="/admin">← Messages & moderation</a><a data-link href="/journal">Read journal ↗</a><a data-link href="/thoughts">View thoughts ↗</a></div></div></section>
 <section class="section-compact"><div class="container"><div id="studio-login" class="glass studio-login"><div class="eyebrow">PRIVATE EDITOR ACCESS</div><h2>Unlock your workspace.</h2><form id="studio-login-form"><input id="studio-token" type="password" placeholder="ADMIN_TOKEN" autocomplete="off" required aria-label="Admin token"><button class="btn btn-primary" type="submit">Unlock studio ↗</button></form><p id="studio-login-error" class="form-response" role="status"></p></div>
 <div id="studio-main" hidden><div class="studio-dashboard-head"><div><div class="eyebrow">CONTENT / DASHBOARD</div><h2>Publish stories, not storage bills.</h2></div><div><button id="studio-new" type="button" class="btn btn-primary">+ New content</button> <button id="studio-lock" type="button" class="btn btn-ghost">Lock</button></div></div>
 <div class="studio-layout"><aside class="glass studio-sidebar"><input id="studio-search" type="search" placeholder="Search posts, drafts, tags..." aria-label="Search posts"><div id="studio-stats" class="studio-stats"></div><div id="studio-list" class="studio-list"></div></aside>
 <div class="glass studio-editor"><div class="studio-editor-head"><div><div class="eyebrow">EDITOR / DYNAMIC PUBLISHING</div><h3 id="studio-title">New content</h3></div><span id="studio-state" class="studio-state">DRAFT</span></div><form id="studio-form">
 <div class="studio-two"><label>Type<select name="kind"><option value="post">Blog post</option><option value="thought">Quick thought</option></select></label><label>Visibility<select name="status"><option value="draft">Draft / Private</option><option value="published">Published / Public</option></select></label></div>
 <label>Title<input name="title" required maxlength="160" placeholder="A useful engineering insight"></label>
 <div class="studio-two"><label>URL slug<input name="slug" placeholder="generated-from-title" pattern="[a-z0-9-]+"></label><label>Category<input name="category" maxlength="60" placeholder="AI Engineering"></label></div>
 <label>Excerpt / introduction<textarea name="excerpt" maxlength="400" rows="2" placeholder="A short description for the post card"></textarea></label>
 <label>Post content <small>Paste LinkedIn text. Basic Markdown headings, bullets and bold text supported.</small><textarea name="content" required maxlength="20000" rows="12" placeholder="Write your post here…"></textarea></label>
 <div class="studio-two"><label>External image URL <small>No uploads, storage buckets or R2</small><input name="imageUrl" maxlength="2000" type="url" placeholder="https://media.licdn.com/..."></label><label>Image alt text<input name="imageAlt" maxlength="180" placeholder="Describe the image"></label></div>
 <div id="studio-image-preview" class="studio-image-preview">✧ Paste an image URL to preview it</div>
 <label>LinkedIn source link<input type="url" name="linkedinUrl" maxlength="2000" placeholder="https://www.linkedin.com/posts/..."></label>
 <label>Tags <small>Comma separated, up to 12</small><input name="tags" placeholder="Python, LLMs, Architecture"></label>
 <label class="studio-checkbox"><input type="checkbox" name="featured"> Feature this content</label>
 <div id="studio-preview" class="studio-preview" hidden></div><p id="studio-message" class="form-response" role="status"></p>
 <div class="studio-editor-actions"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-ghost" id="studio-publish" type="button">Publish now</button><button class="btn btn-ghost" id="studio-preview-btn" type="button">Preview</button><button class="btn studio-danger" id="studio-delete" type="button" hidden>Delete</button></div>
 </form><p class="studio-footnote">Images stay on the original external host. Some LinkedIn CDN links expire or block embedding; permanent public image URLs work best.</p></div></div></div></div></section></main>`;
}

export function initStudio(){
 const form=document.querySelector('#studio-form');if(!form)return;
 const elements=form.elements,login=document.getElementById('studio-login'),main=document.getElementById('studio-main'),
 list=document.getElementById('studio-list'),message=document.getElementById('studio-message'),search=document.getElementById('studio-search');
 let entries=[],selected=null;
 const field=name=>elements.namedItem(name);
 async function request(url,method='GET',data){
  const resp=await fetch(url,{method,headers:{authorization:'Bearer '+(sessionStorage.getItem('orbit_admin_token')||''),'content-type':'application/json'},body:data?JSON.stringify(data):undefined});
  const payload=await resp.json();if(!resp.ok)throw Error(payload.error||'Request failed');return payload;
 }
 function read(){return {title:field('title').value,slug:field('slug').value,kind:field('kind').value,status:field('status').value,excerpt:field('excerpt').value,content:field('content').value,category:field('category').value,imageUrl:field('imageUrl').value,imageAlt:field('imageAlt').value,linkedinUrl:field('linkedinUrl').value,tags:field('tags').value.split(',').map(s=>s.trim()).filter(Boolean),featured:field('featured').checked}}
 const e=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function imagePreview(){
  let raw=field('imageUrl').value,container=document.getElementById('studio-image-preview');try{const u=new URL(raw);if(!['http:','https:'].includes(u.protocol))throw Error('invalid');
   container.innerHTML='<img alt="External image preview" referrerpolicy="no-referrer" src="'+e(u.href)+'"><small>Live external image URL · not uploaded</small>';
   container.querySelector('img').addEventListener('error',()=>container.textContent='This image URL cannot be embedded. Try a public, permanent image URL.',{once:true});
  }catch{container.textContent='✧ Paste an image URL to preview it';}
 }
 function clear(){selected=null;form.reset();document.getElementById('studio-title').textContent='New content';document.getElementById('studio-state').textContent='DRAFT';document.getElementById('studio-delete').hidden=true;document.getElementById('studio-preview').hidden=true;message.textContent='';imagePreview();}
 function fill(item){
  selected=item.id;
  for(const k of ['title','slug','kind','status','excerpt','content','category','imageUrl','imageAlt','linkedinUrl'])field(k).value=item[k]||'';
  field('tags').value=(item.tags||[]).join(', ');field('featured').checked=Boolean(item.featured);
  document.getElementById('studio-title').textContent='Editing: '+item.title;
  document.getElementById('studio-state').textContent=item.status.toUpperCase();
  document.getElementById('studio-delete').hidden=false;document.getElementById('studio-preview').hidden=true;message.textContent='';imagePreview();
 }
 function showList(){
  const query=search.value.toLowerCase().trim(),filtered=entries.filter(x=>[x.title,x.kind,x.status,x.category,(x.tags||[]).join(',')].join(' ').toLowerCase().includes(query));
  document.getElementById('studio-stats').innerHTML='<span>'+entries.length+' TOTAL</span><span>'+entries.filter(x=>x.status==='published').length+' LIVE</span><span>'+entries.filter(x=>x.status==='draft').length+' DRAFTS</span>';
  list.innerHTML=filtered.length?filtered.map(x=>'<button type="button" class="studio-list-item '+(x.id===selected?'selected':'')+'" data-entry="'+e(x.id)+'"><small>'+e(x.kind.toUpperCase())+' / '+e(x.status.toUpperCase())+'</small><b>'+e(x.title)+'</b><span>'+e(x.category)+'</span></button>').join(''):'<p class="studio-empty">No entries yet. Start with your first article.</p>';
 }
 async function reload(){const response=await request('/api/admin/posts');entries=response.entries||[];showList()}
 async function unlock(){await reload();login.hidden=true;main.hidden=false;}
 document.getElementById('studio-login-form').addEventListener('submit',async ev=>{ev.preventDefault();sessionStorage.setItem('orbit_admin_token',document.getElementById('studio-token').value);try{await unlock()}catch(err){document.getElementById('studio-login-error').textContent=err.message;sessionStorage.removeItem('orbit_admin_token')}});
 if(sessionStorage.getItem('orbit_admin_token'))unlock().catch(err=>{login.hidden=false;main.hidden=true;document.getElementById('studio-login-error').textContent=err.message});
 list.addEventListener('click',ev=>{const item=entries.find(x=>x.id===ev.target.closest('[data-entry]')?.dataset.entry);if(item){fill(item);showList()}});
 search.addEventListener('input',showList);
 document.getElementById('studio-new').addEventListener('click',()=>{clear();showList()});
 document.getElementById('studio-lock').addEventListener('click',()=>{sessionStorage.removeItem('orbit_admin_token');login.hidden=false;main.hidden=true;clear()});
 field('imageUrl').addEventListener('change',imagePreview);
 field('title').addEventListener('change',()=>{if(!selected&&!field('slug').value)field('slug').value=field('title').value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9 -]/g,'').trim().replace(/[ -]+/g,'-').slice(0,90)});
 async function save(publish=false){
  const data=read();if(publish)data.status='published';message.textContent='Saving…';
  try{const d=await request(selected?'/api/admin/posts/'+selected:'/api/admin/posts',selected?'PUT':'POST',data);selected=d.entry.id;await reload();fill(d.entry);message.textContent=publish?'Published successfully.':'Saved successfully.';showList();}
  catch(err){message.textContent='Save failed: '+err.message}
 }
 form.addEventListener('submit',ev=>{ev.preventDefault();save(false)});
 document.getElementById('studio-publish').addEventListener('click',()=>save(true));
 document.getElementById('studio-preview-btn').addEventListener('click',()=>{
  const data=read();const box=document.getElementById('studio-preview');box.hidden=false;
  box.innerHTML='<div class="eyebrow">PRIVATE PREVIEW</div>'+renderDetail({...data,publishedAt:new Date().toISOString()});
 });
 document.getElementById('studio-delete').addEventListener('click',async()=>{if(!selected||!confirm('Permanently delete this post?'))return;try{await request('/api/admin/posts/'+selected,'DELETE');clear();await reload();message.textContent='Deleted.'}catch(err){message.textContent=err.message}});
 clear();
}