import test from 'node:test';
import assert from 'node:assert/strict';
import {projects} from '../public/assets/js/content.js';
import {knownProjectArtSlugs,renderProjectArtwork} from '../public/assets/js/project-art.js';

test('every listed project has purpose-built artwork, never the generic fallback',()=>{
 const slugs=projects.map(project=>project.slug);
 assert.equal(slugs.length,11);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const slug of slugs){
  assert.ok(knownProjectArtSlugs.includes(slug),`Missing art: ${slug}`);
  const visual=renderProjectArtwork(slug);
  assert.ok(visual.includes('pa-scene'),slug);
  assert.ok(!visual.includes('pa-generic'),slug);
  assert.ok(!visual.includes('astro-orb'),slug);
 }
});
test('all project illustrations are different DOM compositions',()=>{
 const visuals=projects.map(project=>renderProjectArtwork(project.slug));
 assert.equal(new Set(visuals).size,projects.length);
});
test('new unconfigured projects have a graceful fallback',()=>{
 assert.match(renderProjectArtwork('unknown-future-project'),/pa-generic/);
});
