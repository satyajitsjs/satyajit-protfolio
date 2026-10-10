import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const filename=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data/guestbook.json');
const [action,id]=process.argv.slice(2);
let messages=[];try{messages=JSON.parse(await readFile(filename,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
if(action==='list'){if(!messages.length)console.log('No messages yet.');for(const m of messages)console.log(`${m.id} [${m.status}] ${m.name}: ${m.message.slice(0,80)}`);}
else if(['approve','reject'].includes(action)&&id){const entry=messages.find(m=>m.id===id||m.id.startsWith(id));if(!entry){console.error('Unknown ID');process.exitCode=1;}else {entry.status=action==='approve'?'approved':'rejected';await writeFile(filename,JSON.stringify(messages,null,2));console.log(`${entry.status}: ${entry.id}`);}}
else console.log('Usage: npm run moderate -- list | approve <id> | reject <id>');
