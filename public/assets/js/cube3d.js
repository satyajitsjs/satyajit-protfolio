/** Real perspective-projected 3D cubies, illuminated stickers and orbit particles.
 * Dependency-free 3D scene, rendered into a Canvas2D compositor for compatibility.
 * It uses actual 3D vertices/normals, view transforms, depth ordering and perspective;
 * it is NOT a video or a static image. */
import {RubikState,rotateAxis} from './rubik.js';
import {getSkillTile} from './cube-skills.js';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const faces=[
 {n:[0,0,1],v:[[ -1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],shade:'#101e40',tint:'#318fff'},
 {n:[0,0,-1],v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],shade:'#15132e',tint:'#ad65ff'},
 {n:[1,0,0],v:[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],shade:'#11273c',tint:'#12e6e8'},
 {n:[-1,0,0],v:[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],shade:'#1a1637',tint:'#d063f9'},
 {n:[0,1,0],v:[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],shade:'#1b2149',tint:'#8b78ff'},
 {n:[0,-1,0],v:[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]],shade:'#121b36',tint:'#28bcff'}
];
const cubies=[];
for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)if(x||y||z)cubies.push({x,y,z,phase:(x+2*y+3*z)*.65});
const satellites=Array.from({length:12},(_,i)=>({a:i*2.399,r:3.2+(i%4)*.38,s:.11+(i%3)*.06,y:Math.sin(i*2.4)*2.2}));
const stars=Array.from({length:75},(_,i)=>({x:(Math.sin(i*84.19)*43758.5453)%1,y:(Math.sin(i*43.61)*18751.226)%1,s:i%6?0.65:1.5,p:i*.71}));
function rotate(v,ax,ay,az){let[x,y,z]=v;let c=Math.cos(ay),s=Math.sin(ay);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(ax);s=Math.sin(ax);[y,z]=[y*c-z*s,y*s+z*c];c=Math.cos(az);s=Math.sin(az);[x,y]=[x*c-y*s,x*s+y*c];return [x,y,z];}
function point(v,ox,oy,scale,cam=9.7){let p=cam/(cam-v[2]);return [ox+v[0]*scale*p,oy-v[1]*scale*p,v[2]];}
function poly(ctx,points,fill,stroke,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function inset(q,factor){const cx=q.reduce((a,v)=>a+v[0],0)/q.length,cy=q.reduce((a,v)=>a+v[1],0)/q.length;return q.map(v=>[mix(v[0],cx,factor),mix(v[1],cy,factor)]);}
function drawOrbit(ctx,origin,scale,ax,ay,az,radius,phase,color,width){
 ctx.beginPath();for(let k=0;k<=170;k++){let a=k/170*Math.PI*2;let vec=[Math.cos(a)*radius,Math.sin(a)*radius*.39,Math.sin(a*2+phase)*.25];let v=rotate(vec,ax+.12,ay,az+.62);let p=point(v,origin[0],origin[1],scale);if(!k)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);}
 ctx.lineWidth=width;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;
}
const axisForPiece=cube=>cube.active?.axis??1;
export class CubeScene{
 constructor(canvas,{compact=false}={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.compact=compact;
  this.running=true;this.frame=0;this.last=0;this.scroll=0;this.targetX=0;this.targetY=0;this.mouseX=0;this.mouseY=0;this.cube=new RubikState();this.skillFace=0;this.visible=true;this.mobile=matchMedia('(max-width: 700px)').matches;this.dragging=false;this.orbitX=0;this.orbitY=0;this.motion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.resize=()=>{const rect=this.canvas.getBoundingClientRect();this.w=rect.width;this.h=rect.height;this.dpr=Math.min(window.devicePixelRatio||1,this.mobile?1.15:1.6);canvas.width=Math.max(1,Math.round(rect.width*this.dpr));canvas.height=Math.max(1,Math.round(rect.height*this.dpr));};
  this.move=e=>{const r=canvas.getBoundingClientRect();if(this.dragging){this.orbitX+=(e.clientX-this.dragX)*.009;this.orbitY=clamp(this.orbitY+(e.clientY-this.dragY)*.008,-1.2,1.2);this.dragX=e.clientX;this.dragY=e.clientY;}this.targetX=((e.clientX-r.left)/r.width-.5)*1.1;this.targetY=((e.clientY-r.top)/r.height-.5)*.7;};
  this.down=e=>{this.dragging=true;this.dragX=e.clientX;this.dragY=e.clientY;canvas.setPointerCapture?.(e.pointerId);};
  this.up=()=>{this.dragging=false;};
  this.scrollListener=()=>{this.scroll=window.scrollY/Math.max(1,window.innerHeight);};
  this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);
  this.visibilityObserver=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{this.visible=entries.some(e=>e.isIntersecting);},{rootMargin:'140px'}):null;this.visibilityObserver?.observe(canvas);
  canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointercancel',this.up);window.addEventListener('scroll',this.scrollListener,{passive:true});this.resize();this.scrollListener();this.tick=ts=>this.draw(ts);this.raf=requestAnimationFrame(this.tick);
 }
 setSkillFace(index){if(Number.isInteger(index)&&index>=0&&index<6)this.skillFace=index;}
 shuffle(){this.turn('U');}
 turn(move){return this.cube.move(move);}
 scramble(){this.cube.scramble();}
 reset(){this.cube.reset();}
 destroy(){this.running=false;cancelAnimationFrame(this.raf);this.observer.disconnect();this.visibilityObserver?.disconnect();this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointerdown',this.down);this.canvas.removeEventListener('pointerup',this.up);this.canvas.removeEventListener('pointercancel',this.up);window.removeEventListener('scroll',this.scrollListener);}
 draw(ts){if(!this.running||!this.ctx)return;this.raf=requestAnimationFrame(this.tick);if(!this.visible||document.visibilityState==='hidden')return;if(ts-this.last<(this.mobile?42:this.compact?32:16))return;const dt=this.last?(ts-this.last)/1000:1/60;this.last=ts;this.cube.update(dt);
  const ctx=this.ctx,w=this.w,h=this.h;if(w<1||h<1)return;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
  const t=this.motion?0:ts*.001;
  const cx=w*.51,cy=h*(this.compact?.49:.49),size=Math.min(w,h)*(this.compact?.136:.125);
  this.mouseX=mix(this.mouseX,this.targetX,.05);this.mouseY=mix(this.mouseY,this.targetY,.05);
  
  const scroll=clamp(this.scroll,0,1.75), yaw=.69+t*.115+this.mouseX*.34+scroll*.7+this.orbitX;
  const pitch=-.49+Math.sin(t*.22)*.085-this.mouseY*.25+scroll*.19+this.orbitY;
  const roll=Math.sin(t*.17)*.048;
  const explode=clamp((scroll-.32)*.46,0,.45);
  // Dimensional atmosphere and soft sci-fi grid.
  let bloom=ctx.createRadialGradient(cx,cy,12,cx,cy,Math.min(w,h)*.53);
  bloom.addColorStop(0,'rgba(79,63,180,.17)');bloom.addColorStop(.5,'rgba(29,77,167,.055)');bloom.addColorStop(1,'rgba(11,16,47,0)');ctx.fillStyle=bloom;ctx.fillRect(0,0,w,h);
  for(const [i,star] of stars.entries()){
   if(this.mobile&&i%2)continue;
   let sx=((star.x+1)%1)*w,sy=((star.y+1)%1)*h;
   let alpha=.14+.22*Math.abs(Math.sin(t*.43+star.p));if(this.motion)alpha=.25;
   ctx.fillStyle=`rgba(133,180,255,${alpha})`;ctx.beginPath();ctx.arc(sx,sy,star.s,0,7);ctx.fill();
  }
  // Ground plane, plotted with real 3D projection.
  ctx.save();ctx.globalAlpha=.37;ctx.strokeStyle='rgba(58,105,222,.26)';ctx.lineWidth=.65;
  for(let i=-8;i<=8;i++){
   let a=point(rotate([i*.8,-3.05,-5],.05,0,0),cx,cy,size),b=point(rotate([i*.8,-3.05,5],.05,0,0),cx,cy,size);
   ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
   a=point([-6,-3.05,i*.7],cx,cy,size);b=point([6,-3.05,i*.7],cx,cy,size);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  }ctx.restore();
  // Lower energy platform and orbit structure.
  let py=cy+size*2.65;ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#3269ff';ctx.strokeStyle='rgba(62,156,255,.52)';ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(cx,py+i*7,size*(2.4-i*.2),size*(.39-i*.055),0,0,7);ctx.stroke();}ctx.restore();
  drawOrbit(ctx,[cx,cy],size,yaw*.32+.3,Math.sin(t*.1)*.3,0,3.16,t,'rgba(64,171,255,.66)',1.3);
  drawOrbit(ctx,[cx,cy],size,yaw*.17-.6,.5,0,3.45,t,'rgba(165,103,255,.5)',.9);
  // Actual 3D geometry: 26 cubies, faces and surface stickers.
  const drawables=[];
  for(const c of this.cube.pieces){
    const base=c.pos.map(v=>v*(.997+explode));
    const twist=this.cube.affects(c)?this.cube.angle:0;
    const axis=this.cube.active?.axis??1;
    const body=faces.map(face=>{
      const verts=face.v.map(v=>rotate(rotateAxis(v.map((n,i)=>base[i]+n*.475),axis,twist),pitch,yaw,roll));
      const normal=rotate(rotateAxis(face.n,axis,twist),pitch,yaw,roll);
      const avgZ=verts.reduce((s,v)=>s+v[2],0)/4;
      const sticker=c.stickers.find(s=>s.normal.every((n,i)=>n===face.n[i]));
      return {face:sticker?faces[sticker.index]:{...face,shade:'#080e20',tint:'#35466a'},stickerIndex:sticker?.index??null,verts,normal,avgZ,c};
    });
    for(const f of body)if(f.normal[2]>.02)drawables.push(f);
  }
  drawables.sort((a,b)=>a.avgZ-b.avgZ);
  for(let i=0;i<drawables.length;i++){
    const f=drawables[i],q=f.verts.map(v=>point(v,cx,cy,size));
    const visibility=clamp(.35+f.normal[2]*.8,.2,1);
    const outline=f.face.tint;
    poly(ctx,q, f.face.shade, `rgba(116,158,255,${(.24+visibility*.25).toFixed(3)})`,1.2);
    const tile=inset(q,.115);
    let grad=ctx.createLinearGradient(tile[0][0],tile[0][1],tile[2][0],tile[2][1]);grad.addColorStop(0,'rgba(41,57,101,.98)');grad.addColorStop(.51,f.face.shade);grad.addColorStop(1,'rgba(8,11,29,.98)');
    ctx.shadowColor=outline;ctx.shadowBlur=6;poly(ctx,tile,grad,outline,1.5);ctx.shadowBlur=0;
    const core=inset(q,.29);poly(ctx,core,`rgba(17,30,72,${.6+visibility*.22})`,`rgba(160,204,255,.22)`,.8);
    // Moving reflective highlight clipped into each glass sticker.
    ctx.save();ctx.beginPath();ctx.moveTo(...tile[0]);for(let k=1;k<4;k++)ctx.lineTo(...tile[k]);ctx.closePath();ctx.clip();
    const sh=ctx.createLinearGradient(tile[0][0]+Math.sin(t*.3)*15,tile[0][1],tile[2][0]+25,tile[2][1]);
    sh.addColorStop(0,'rgba(195,228,255,.20)');sh.addColorStop(.24,'rgba(132,195,255,.04)');sh.addColorStop(.45,'rgba(8,20,59,0)');sh.addColorStop(1,'rgba(46,78,161,.03)');
    poly(ctx,tile,sh,null);
    ctx.strokeStyle='rgba(206,228,255,.33)';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(...tile[3]);ctx.lineTo(...tile[0]);ctx.lineTo(...tile[1]);ctx.stroke();
    ctx.restore();
    // Each visible sticker retains its original skill even after multi-axis twists.
    const skill=f.stickerIndex===null?null:getSkillTile(f.stickerIndex,f.c.id);
    if(skill){
      const centerX=(core[0][0]+core[2][0])/2,centerY=(core[0][1]+core[2][1])/2;
      const tileWidth=Math.hypot(core[1][0]-core[0][0],core[1][1]-core[0][1]);
      const fontSize=clamp(Math.min(size*.15,tileWidth/Math.max(skill.short.length*.68,2.5)),this.mobile?7:8,this.mobile?13:17);
      const selected=skill.faceIndex===this.skillFace;
      ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font=`700 ${fontSize.toFixed(1)}px Space Grotesk,sans-serif`;
      ctx.fillStyle=selected?'#e9faff':outline;ctx.globalAlpha=clamp(.50+visibility*.22+(selected?.15:0),.45,1);
      ctx.shadowColor=selected?skill.accent:outline;ctx.shadowBlur=selected?11:4;
      ctx.fillText(skill.short,centerX,centerY,Math.max(8,tileWidth*.84));ctx.restore();
    }
    // Tiny luminous tech lines in each cubie, deliberately subtle.
    ctx.strokeStyle='rgba(189,219,255,.3)';ctx.lineWidth=.65;const d=inset(q,.39);ctx.beginPath();ctx.moveTo(...d[0]);ctx.lineTo(...d[1]);ctx.stroke();
    
  }
  // Secondary floating mini cubes (also 3D, not flat sprites).
  for(const [i,s] of satellites.entries()){
    const a=s.a+t*(i%2?-.08:.08), v=[Math.cos(a)*s.r, s.y+Math.sin(t*.8+i)*.18, Math.sin(a)*s.r];
    const r=rotate(v,pitch*.4,yaw*.28,0), p=point(r,cx,cy,size);
    const edge=s.s*size*9/(9-r[2]);ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(a*.4);ctx.shadowColor=i%2?'#aa76ff':'#38cbff';ctx.shadowBlur=13;ctx.strokeStyle=i%2?'rgba(189,136,255,.72)':'rgba(93,215,255,.62)';ctx.fillStyle='rgba(20,30,65,.75)';ctx.lineWidth=.95;ctx.fillRect(-edge/2,-edge/2,edge,edge);ctx.strokeRect(-edge/2,-edge/2,edge,edge);ctx.beginPath();ctx.moveTo(-edge/2,-edge/2);ctx.lineTo(edge/2,edge/2);ctx.stroke();ctx.restore();
  }
  // Scan-line highlight makes it feel like a holo-engine without distracting text.
  const sweep=((t*.08)%1)*h;ctx.fillStyle='rgba(84,139,255,.025)';ctx.fillRect(0,sweep,w,1);
 }
}

/** Background-only low-cost wireframe scene: real 3D vertices, depth motion and parallax. */
export class BackdropField{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.last=0;this.running=true;this.scroll=0;this.pointerX=0;this.pointerY=0;
  this.size=()=>{this.dpr=Math.min(devicePixelRatio||1,1.5);this.w=innerWidth;this.h=innerHeight;canvas.width=Math.floor(this.w*this.dpr);canvas.height=Math.floor(this.h*this.dpr);};
  this.move=e=>{this.pointerX=(e.clientX/innerWidth-.5);this.pointerY=(e.clientY/innerHeight-.5)};
  this.onScroll=()=>{this.scroll=scrollY/Math.max(innerHeight,1)};
  addEventListener('resize',this.size);addEventListener('pointermove',this.move,{passive:true});addEventListener('scroll',this.onScroll,{passive:true});this.size();this.onScroll();this.tick=ts=>this.render(ts);this.raf=requestAnimationFrame(this.tick);
 }
 render(ts){if(!this.running)return;this.raf=requestAnimationFrame(this.tick);if(ts-this.last<32)return;this.last=ts;
  const ctx=this.ctx,w=this.w,h=this.h,t=ts*.00013,s=Math.min(w,h)*.115;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
  const placements=[[-3.8,2.1,-1.4,.42],[4.0,2.3,-1.8,.32],[-4.7,-1.8,-2.2,.35],[4.7,-1.8,-1.1,.45],[-1.6,-3,-2.5,.2],[2.9,-3.2,-2.5,.25],[0,3,-2.5,.21]];
  for(let i=0;i<placements.length;i++){
    let [x,y,z,scale]=placements[i],phase=t*(i%2?-.58:.7)+this.scroll*.1;
    x+=Math.sin(phase+i)*.24-this.pointerX*.14;y+=Math.cos(phase*1.4+i)*.23-this.scroll*.13;
    const pts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>point(rotate(v.map((k,j)=>k*scale+[x,y,z][j]),phase*.8,phase*.6,phase*.14),w*.5,h*.5,s));
    ctx.lineWidth=.75;ctx.strokeStyle=i%2?'rgba(167,108,255,.25)':'rgba(65,166,255,.25)';ctx.shadowColor=i%2?'#a178fb':'#5fb5ff';ctx.shadowBlur=7;
    for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]){ctx.beginPath();ctx.moveTo(pts[a][0],pts[a][1]);ctx.lineTo(pts[b][0],pts[b][1]);ctx.stroke();}
  }ctx.shadowBlur=0;
 }
 destroy(){this.running=false;cancelAnimationFrame(this.raf);removeEventListener('resize',this.size);removeEventListener('pointermove',this.move);removeEventListener('scroll',this.onScroll);}
}
