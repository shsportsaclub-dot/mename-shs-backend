import test from 'node:test';
import assert from 'node:assert/strict';
import {originalStadiumLayout,originalCrowdPosition} from '../scripts/original-cricket/stadium.mjs';
test('original three-tier stadium has finite geometry, roof trusses and four light banks',()=>{const items=originalStadiumLayout();assert.ok(items.length>1500);assert.equal(items.filter(o=>o.kind===4).length,72);for(const o of items){assert.ok((o.p||[...o.a,...o.b]).every(Number.isFinite));if(o.s)assert.ok(o.s.every(n=>n>0));}assert.ok(items.some(o=>o.p&&o.p[1]>28&&o.s[2]===11));assert.ok(items.some(o=>o.a&&o.a[1]>27));});
test('crowd positions occupy all three actual seating tiers',()=>{const heights=[0,1,2].map(i=>originalCrowdPosition(i,()=>.5)[1]);assert.equal(heights[1]-heights[0],9);assert.equal(heights[2]-heights[1],9);});
