import test from 'node:test';
import assert from 'node:assert/strict';
import {RubikState} from '../public/assets/js/rubik.js';
import {cubeSkillFaces,getSkillTile,faceForMove} from '../public/assets/js/cube-skills.js';

test('all six cube faces have exactly nine named tiles',()=>{
 assert.equal(cubeSkillFaces.length,6);
 for(const face of cubeSkillFaces){
  assert.equal(face.skills.length,9,face.name);
  assert.equal(new Set(face.skills.map(([short])=>short)).size,9,face.name);
  assert.ok(face.skills.every(([short,name])=>short.length<=5&&name.length>2));
 }
});
test('all 54 individual original stickers map uniquely to a 3×3 face',()=>{
 const cube=new RubikState();
 for(let index=0;index<6;index++){
  const stickers=cube.pieces.filter(piece=>piece.stickers.some(sticker=>sticker.index===index));
  assert.equal(stickers.length,9,'Face '+index);
  const tiles=stickers.map(piece=>getSkillTile(index,piece.id));
  assert.ok(tiles.every(Boolean));
  assert.equal(new Set(tiles.map(tile=>tile.index)).size,9,'Face '+index);
  assert.equal(tiles.map(tile=>tile.index).sort((a,b)=>a-b).join(','),'0,1,2,3,4,5,6,7,8');
 }
});
test('skill tiles remain attached to original stickers through twists',()=>{
 const cube=new RubikState();
 const initial=new Map(cube.pieces.flatMap(piece=>piece.stickers.map(sticker=>[
  piece.id+':'+sticker.index,getSkillTile(sticker.index,piece.id).name
 ])));
 cube.move('R');cube.move('U');cube.move('F');cube.move("L'");cube.finishAll();
 for(const piece of cube.pieces)for(const sticker of piece.stickers){
  assert.equal(getSkillTile(sticker.index,piece.id).name,initial.get(piece.id+':'+sticker.index));
 }
});
test('outer face notation opens the correct skill group',()=>{
 assert.deepEqual(['F','B','R','L','U','D'].map(faceForMove),[0,1,2,3,4,5]);
 assert.equal(faceForMove('M'),null);
});
