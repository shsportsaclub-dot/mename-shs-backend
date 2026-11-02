import test from 'node:test';
import assert from 'node:assert/strict';
import {cricketFaceExpression} from '../scripts/original-cricket/expressions.mjs';
test('limited stylized expressions follow cricket actions and outcomes',()=>{assert.equal(cricketFaceExpression({mode:'shot'}).state,'FOCUSED');assert.equal(cricketFaceExpression({celebrate:true}).state,'CELEBRATE');assert.equal(cricketFaceExpression({dismissed:true,celebrate:true}).state,'DISAPPOINTED');assert.ok(cricketFaceExpression({celebrate:true}).smile>0);assert.ok(cricketFaceExpression({mode:'out'}).smile<0);});
test('blink is deterministic and does not leave the eyes permanently shut',()=>{assert.ok(cricketFaceExpression({time:4.7}).eyeOpen<.2);assert.equal(cricketFaceExpression({time:5}).eyeOpen,1);assert.deepEqual(cricketFaceExpression({time:2,seed:7}),cricketFaceExpression({time:2,seed:7}));});
