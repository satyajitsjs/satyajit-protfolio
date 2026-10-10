/** Rubik-style 3x3x3 puzzle state. Every turn changes cubie positions AND sticker orientation. */
export const TURN_SPECS=Object.freeze({
 R:{axis:0,layer:1,sign:-1},L:{axis:0,layer:-1,sign:1},
 U:{axis:1,layer:1,sign:-1},D:{axis:1,layer:-1,sign:1},
 F:{axis:2,layer:1,sign:-1},B:{axis:2,layer:-1,sign:1},
 M:{axis:0,layer:0,sign:1},E:{axis:1,layer:0,sign:1},S:{axis:2,layer:0,sign:-1},
 X:{axis:0,layer:null,sign:-1},Y:{axis:1,layer:null,sign:-1},Z:{axis:2,layer:null,sign:-1}
});
const faceNormals=[[0,0,1],[0,0,-1],[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]];
const quarter=(v,axis,sign)=>{
 const [x,y,z]=v;
 if(axis===0)return [x,-sign*z,sign*y];
 if(axis===1)return [sign*z,y,-sign*x];
 return [-sign*y,sign*x,z];
};
export function rotateAxis(v,axis,angle){
 const c=Math.cos(angle),s=Math.sin(angle),[x,y,z]=v;
 if(axis===0)return [x,y*c-z*s,y*s+z*c];
 if(axis===1)return [x*c+z*s,y,-x*s+z*c];
 return [x*c-y*s,x*s+y*c,z];
}
export function parseMove(input){
 const match=/^([RLUDFBMESXYZ])([2']?)$/.exec(String(input||'').trim().toUpperCase());
 if(!match)return null;
 const spec=TURN_SPECS[match[1]],prime=match[2]==="'";
 return {notation:match[0],axis:spec.axis,layer:spec.layer,sign:spec.sign*(prime?-1:1),count:match[2]==='2'?2:1};
}
export class RubikState{
 constructor(){this.reset();}
 reset(){
  this.pieces=[];
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
   if(!(x||y||z))continue;
   const pos=[x,y,z];
   this.pieces.push({id:this.pieces.length,pos,stickers:faceNormals.map((n,index)=>({
    normal:[...n],index
   })).filter(({normal:n})=>n.every((v,i)=>v===0||pos[i]===v))});
  }
  this.queue=[];this.active=null;this.history=[];this.progress=0;
 }
 move(notation){
  const spec=parseMove(notation);
  if(!spec)return false;
  if(this.queue.length>120)return false;
  for(let i=0;i<spec.count;i++)this.queue.push({...spec,count:1});
  return true;
 }
 scramble(steps=18){
  const names=['R','L','U','D','F','B','M','E','S'];
  for(let i=0;i<Math.max(1,Math.min(steps,40));i++){
   const name=names[Math.floor(Math.random()*names.length)];
   this.move(name+(Math.random()<.5?"'":''));
  }
 }
 affects(piece,move=this.active){return !!move&&(move.layer===null||piece.pos[move.axis]===move.layer);}
 preview(piece){
  if(!this.affects(piece))return piece.pos;
  return rotateAxis(piece.pos,this.active.axis,this.angle);
 }
 get angle(){
  if(!this.active)return 0;
  const p=this.progress, eased=p*p*(3-2*p);
  return this.active.sign*Math.PI/2*eased;
 }
 update(dt){
  if(!this.active&&this.queue.length){this.active=this.queue.shift();this.progress=0;}
  if(!this.active)return;
  this.progress=Math.min(1,this.progress+Math.max(0,Math.min(dt,.1))/.34);
  if(this.progress>=1){
   const move=this.active;
   for(const piece of this.pieces)if(this.affects(piece,move)){
    piece.pos=quarter(piece.pos,move.axis,move.sign);
    for(const sticker of piece.stickers)sticker.normal=quarter(sticker.normal,move.axis,move.sign);
   }
   this.history.push(move.notation);
   this.active=null;this.progress=0;
  }
 }
 finishAll(){
  let guard=0;while((this.queue.length||this.active)&&guard++<300)this.update(.1);
 }
 get isSolved(){
  return this.pieces.every(piece=>piece.stickers.every(sticker=>
   faceNormals[sticker.index].every((v,i)=>v===sticker.normal[i])));
 }
}