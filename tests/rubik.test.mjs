import test from 'node:test';
import assert from 'node:assert/strict';
import {RubikState,parseMove,TURN_SPECS} from '../public/assets/js/rubik.js';

function completed(cube,...moves){for(const move of moves)assert.equal(cube.move(move),true);cube.finishAll();return cube;}
test('all outer, middle and whole-cube moves parse',()=>{
 for(const move of Object.keys(TURN_SPECS)){
  assert.ok(parseMove(move));
  assert.ok(parseMove(move+"'"));
  assert.ok(parseMove(move+'2'));
 }
 assert.equal(parseMove('INVALID'),null);
});
test('each turn and its inverse return to solved state',()=>{
 for(const move of Object.keys(TURN_SPECS)){
  const cube=completed(new RubikState(),move,move+"'");
  assert.equal(cube.isSolved,true,move);
  assert.equal(cube.pieces.length,26);
 }
});
test('four turns on any axis restore the solved cube',()=>{
 for(const move of Object.keys(TURN_SPECS)){
  const cube=completed(new RubikState(),move,move,move,move);
  assert.equal(cube.isSolved,true,move);
 }
});
test('turns persist real positions and orientations through subsequent turns',()=>{
 const cube=new RubikState();
 completed(cube,'R','U','F','M','X');
 assert.equal(cube.isSolved,false);
 const normals=new Set(cube.pieces.flatMap(p=>p.stickers.map(s=>s.normal.join(','))));
 assert.ok(normals.size>=6);
 completed(cube,"X'","M'","F'","U'","R'");
 assert.equal(cube.isSolved,true);
});
test('reset clears a scrambled queue and restores all stickers',()=>{
 const cube=new RubikState();cube.scramble(15);cube.finishAll();
 cube.reset();assert.equal(cube.isSolved,true);assert.equal(cube.queue.length,0);
});