import test from 'node:test';import assert from 'node:assert/strict';
const root={innerHTML:''};const nullElement={addEventListener(){},classList:{toggle(){},add(){}},setAttribute(){},textContent:''};
globalThis.window={addEventListener(){},scrollTo(){},innerHeight:900};
globalThis.document={getElementById(id){if(id==='app')return root;if(id==='world-canvas')return null;return nullElement;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}};
globalThis.location={pathname:'/',search:'',origin:'http://localhost:4173'};
globalThis.sessionStorage={getItem(){return null},setItem(){},removeItem(){}};globalThis.history={pushState(){}};globalThis.matchMedia=()=>({matches:true});globalThis.scrollY=0;
const routes={
 '/':['BUILDING','data-cube="hero"','Featured'],
 '/about':['Engineer by craft','MY STORY'],
 '/projects':['Ideas turned into','filter-button','FabricFlow'],
 '/projects/alphazero-hrms':['AlphaZero HRMS','THE CONTEXT'],
 '/experience':['Learning. Shipping.','Infosys'],
 '/skills':['The tools change.','TECHNICAL EXPERTISE'],
 '/journal':['Notes from','RAG is more'],
 '/journal/rag-beyond-vector-search':['RAG is more','A useful retrieval pipeline'],
 '/contact':['contact-form','name="website"'],
 '/guestbook':['guestbook-form','guestbook-list'],
 '/lab':['data-cube="lab"','data-move="R"','data-cube-action="reset"'],
 '/links':['Links','GitHub','FutureCoin'],
 '/projects/aptpath':['AptPath','THE CONTEXT'],
 '/admin':['admin-form','admin-dashboard'],
 '/privacy':['Respect for your','Data storage'],
};
test('all interactive pages render without JavaScript exceptions',async()=>{
 let index=0;
 for(const [route,parts] of Object.entries(routes)){
  location.pathname=route;
  await import(`../public/assets/js/app.js?route=${index++}`);
  for(const part of parts)assert.ok(root.innerHTML.includes(part),`${route} missing ${part}`);
  assert.ok(root.innerHTML.includes('<footer'),`${route} missing shared footer`);
 }
});
