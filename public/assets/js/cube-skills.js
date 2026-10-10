/** Each outer cube face contains a 3×3 grid: one technology per sticker. */
export const cubeSkillFaces=[
 {key:'front',name:'Backend Engineering',side:'F',accent:'#70dcff',skills:[
  ['PY','Python'],['DJ','Django'],['DRF','Django REST Framework'],
  ['API','REST APIs'],['FAST','FastAPI'],['CEL','Celery'],
  ['WS','WebSockets'],['ORM','Django ORM'],['TEST','pytest']]},
 {key:'back',name:'System Design & Security',side:'B',accent:'#b69bff',skills:[
  ['SYS','System Design'],['RBAC','Role-Based Access'],['JWT','JWT'],
  ['O2','OAuth2'],['MT','Multi-tenancy'],['AUTH','Authentication'],
  ['EVT','Event Systems'],['MIC','Microservices'],['SEC','API Security']]},
 {key:'right',name:'AI & Agentic Systems',side:'R',accent:'#69f0e5',skills:[
  ['LLM','LLM Integration'],['RAG','RAG'],['MCP','Model Context Protocol'],
  ['LC','LangChain'],['LG','LangGraph'],['CLA','Claude API'],
  ['VEC','Vector Search'],['OAI','OpenAI API'],['OLL','Ollama / Qwen']]},
 {key:'left',name:'Databases & Caching',side:'L',accent:'#e5a0ff',skills:[
  ['PG','PostgreSQL'],['MY','MySQL'],['MG','MongoDB'],
  ['RED','Redis'],['SQL','SQLite'],['NEO','Neo4j'],
  ['IDX','Indexing'],['QRY','Query Optimization'],['FIRE','Firestore']]},
 {key:'top',name:'Cloud & DevOps',side:'U',accent:'#90a6ff',skills:[
  ['AWS','Amazon Web Services'],['GCP','Google Cloud'],['AZ','Azure'],
  ['DOC','Docker'],['K8S','Kubernetes'],['TF','Terraform'],
  ['CI','CI/CD'],['GRAF','Grafana'],['ANS','Ansible']]},
 {key:'bottom',name:'Frontend & UI',side:'D',accent:'#ffba93',skills:[
  ['RE','React'],['NXT','Next.js'],['TS','TypeScript'],
  ['JS','JavaScript'],['TW','Tailwind CSS'],['HTML','HTML5'],
  ['CSS','CSS3'],['UI','UI Design'],['SHAD','shadcn/ui']]}
];
const solved=[];
for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)if(x||y||z)solved.push([x,y,z]);
export function getSkillTile(faceIndex,pieceId){
 const face=cubeSkillFaces[faceIndex],pos=solved[pieceId];
 if(!face||!pos)return null;
 const [x,y,z]=pos;
 const row=(faceIndex===4?z===-1?0:z===0?1:2:faceIndex===5?z+1:1-y);
 const col=(faceIndex===0?x+1:faceIndex===1?1-x:faceIndex===2?1-z:faceIndex===3?z+1:x+1);
 const index=row*3+col;
 if(index<0||index>8)return null;
 const [short,name]=face.skills[index];
 return {short,name,index,faceIndex,accent:face.accent};
}
export function faceForMove(move){
 const lookup={F:0,B:1,R:2,L:3,U:4,D:5};
 return lookup[String(move||'').charAt(0).toUpperCase()]??null;
}
