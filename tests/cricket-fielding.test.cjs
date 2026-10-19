const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSHCricketFielding}=require('../cricket-fielding.cjs'),model=createSHCricketFielding();
test('T20 uses two outside during PP and five after exactly 36 legal balls',()=>{
 assert.equal(model.plan({profile:'icc-men-t20',balls:35}).outside,2);
 assert.equal(model.plan({profile:'icc-men-t20',balls:36}).outside,5);
 assert.equal(model.plan({profile:'icc-men-t20',balls:36,slowOverRate:true}).outside,4);
});
test('reduced T20 uses official whole-ball table',()=>{for(const [overs,pp]of [[5,9],[6,11],[8,14],[13,23],[19,34]])assert.equal(model.plan({profile:'icc-men-t20',overs}).powerplayBalls,pp)});
test('ODI phases and interrupted 50-to-32-over example',()=>{
 for(const [balls,outside]of [[59,2],[60,4],[239,4],[240,5]])assert.equal(model.plan({profile:'icc-men-odi',overs:50,balls}).outside,outside);
 const reduced=model.plan({profile:'icc-men-odi',overs:32,balls:51});assert.equal(reduced.phase,'Powerplay 2');assert.equal(reduced.phases[1].end,26*6);
 assert.equal(model.plan({profile:'icc-men-odi',overs:22,balls:113}).phase,'Powerplay 3');
});
test('unknown rules, multi-day and Hundred do not receive an invented ICC profile',()=>{for(const options of [{},{profile:'icc-men-t20',overs:100},{profile:'icc-men-odi',overs:10},{profile:'hundred',overs:20}])assert.equal(model.plan(options).supported,false)});
