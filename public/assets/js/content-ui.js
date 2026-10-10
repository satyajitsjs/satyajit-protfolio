s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))

function safeURL(s){try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}

function dateLabel(s){if(!s)return '';try{return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(s))}catch{return ''}}

export function renderMarkdown(content){
 let parts=[],para=[],list=[];
 const flush=()=>{if(para.length){parts.push('<p>'+para.join('<br>')+'</p>');para=[]}if(list.length){parts.push('<ul>'+list.map(x=>'<li>'+x+'</li>').join('')+'</ul>');list=[]}};
 for(const raw of String(content||'').replace(/\r/g,'').split('\n')){
  const t=raw.trim();if(!t){flush();continue}
  let x=esc(t).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  const h=/^(#{1,3})\s+(.+)/.exec(x);
  if(h){flush();parts.push('<h'+(h[1].length+1)+'>'+h[2]+'</h'+(h[1].length+1)+'>');continue}
  if(/^[-*]\s+/.test(x)){if(para.length)flush();list.push(x.slice(2));continue}
  if(list.length)flush();para.push(x);
 }
 flush();return parts.join('')||'<p>No content available.</p>';
}

function cover(post,large=false){
 const u=safeURL(post.imageUrl);
 return u?`<div class="content-cover ${large?'large':''}"><img alt="${esc(post.imageAlt||post.title)}" src="${esc(u)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="content-img-fallback">Image unavailable · view original post ↗</span></div>`:`<div class="content-cover content-art ${large?'large':''}"><span class="content-art-mark">✧</span><span>${esc(post.category||'Engineering')}</span></div>`;
}

export function postCard(p){
 return `<a data-link href="/journal/${encodeURIComponent(p.slug)}" class="glass content-card">${cover(p)}<div class="content-card-copy"><div class="content-meta">${esc(p.category)} · ${dateLabel(p.publishedAt)}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt||'Read the full article.')}</p><span class="content-card-cta">READ ARTICLE ↗</span></div></a>`;
}

export function thoughtCard(p){
 const link=safeURL(p.linkedinUrl);
 return `<article class="glass thought-card"><div class="content-meta">✧ ${esc(p.category)} · ${dateLabel(p.publishedAt)}</div><h3>${esc(p.title)}</h3>${cover(p)}<div class="thought-copy">${renderMarkdown(p.content)}</div><div class="thought-tags">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}${link?`<a href="${esc(link)}" rel="noopener noreferrer" target="_blank">Open on LinkedIn ↗</a>`:''}</div></article>`;
}

export function thoughtsPage(){
 return `<main class="fade-route"><section class="page-hero"><div class="container"><div class="tagline">THOUGHTS / QUICK IDEAS</div><h1 class="display-lg">Ideas in motion.<br><span class="gradient-text">Shared with purpose.</span></h1><p class="intro">Short reflections, lessons, and things I am exploring across engineering, AI, and product design.</p></div></section><section class="section-compact"><div class="container"><div class="thought-feed" id="dynamic-thoughts"><p>Loading thoughts…</p></div></div></section></main>`;
}

export function detailShell(){
 return `<main class="fade-route"><section class="section content-detail-page"><div class="container"><div id="dynamic-post-detail" class="glass content-detail"><p>Loading article…</p></div></div></section></main>`;
}

export function renderDetail(p){
 const original=safeURL(p.linkedinUrl);
 return `<div class="content-meta">ENGINEERING JOURNAL / ${esc(p.category)} / ${dateLabel(p.publishedAt)}</div><h1 class="display-lg">${esc(p.title)}</h1><p class="content-intro">${esc(p.excerpt)}</p>${cover(p,true)}<div class="content-readable">${renderMarkdown(p.content)}</div><div class="content-detail-foot">${(p.tags||[]).map(t=>`<span class="content-pill">${esc(t)}</span>`).join('')}${original?`<a target="_blank" rel="noopener noreferrer" href="${esc(original)}">Original LinkedIn post ↗</a>`:''}<a data-link href="/journal">← Journal</a></div>`;
}

export async function hydrateContent(route){
 const dest=document.getElementById(route==='/journal'?'dynamic-blog-posts':route==='/thoughts'?'dynamic-thoughts':route==='/'?'homepage-posts':'dynamic-post-detail');
 if(!dest)return;
 try{
  const url=route.startsWith('/journal/')?'/api/posts/'+encodeURIComponent(route.split('/').pop()):'/api/posts?kind='+ (route==='/thoughts'?'thought':'post');
  const r=await fetch(url);const data=await r.json();if(!r.ok)throw Error(data.error||'Content temporarily unavailable');
  if(route.startsWith('/journal/')){dest.innerHTML=renderDetail(data.entry);document.title=data.entry.title+' | Satyajit Sahoo'}
  else{
   const items=route==='/'?data.entries.slice(0,3):data.entries;
   dest.innerHTML=items.length?items.map(route==='/thoughts'?thoughtCard:postCard).join(''):'<div class="glass content-empty"><h3>New writing is coming soon.</h3><p>Nothing published in this section yet.</p></div>';
  }
 }catch(e){dest.innerHTML='<div class="glass content-empty"><h3>Unable to load content.</h3><p>'+esc(e.message)+'</p></div>'}
 dest.querySelectorAll('.content-cover img').forEach(img=>img.addEventListener('error',()=>img.classList.add('content-img-broken'),{once:true}));
}