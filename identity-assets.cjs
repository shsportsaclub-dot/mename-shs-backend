/* Shared team identity resolver. Generated board-themed artwork is not an official logo. */
function createSHIdentityAssets(){
 const aliases={
 'india':'country-india','ind':'country-india','bcci':'country-india',
 'australia':'country-australia','aus':'country-australia','cricket australia':'country-australia',
 'england':'country-england','eng':'country-england','ecb':'country-england',
 'new zealand':'country-new-zealand','nz':'country-new-zealand','nzl':'country-new-zealand','blackcaps':'country-new-zealand','white ferns':'country-new-zealand',
 'pakistan':'country-pakistan','pak':'country-pakistan','pcb':'country-pakistan',
 'sri lanka':'country-sri-lanka','sl':'country-sri-lanka','slc':'country-sri-lanka',
 'south africa':'country-south-africa','rsa':'country-south-africa','sa':'country-south-africa','csa':'country-south-africa',
 'bangladesh':'country-bangladesh','ban':'country-bangladesh','bcb':'country-bangladesh',
 'west indies':'country-west-indies','wi':'country-west-indies','windies':'country-west-indies',
 'ireland':'country-ireland','ire':'country-ireland','scotland':'country-scotland','sco':'country-scotland',
 'netherlands':'country-netherlands','ned':'country-netherlands','canada':'country-canada','can':'country-canada',
 'oman':'country-oman','uae':'country-uae','united arab emirates':'country-uae',
 'namibia':'country-namibia','nam':'country-namibia','nepal':'country-nepal','nep':'country-nepal','zimbabwe':'country-zimbabwe','zim':'country-zimbabwe',
 'papua new guinea':'country-png','png':'country-png','hong kong':'country-hong-kong','hong kong china':'country-hong-kong','hk':'country-hong-kong',
 'malaysia':'country-malaysia','mal':'country-malaysia','singapore':'country-singapore','sin':'country-singapore','bermuda':'country-bermuda',
 'chennai super kings':'ipl-chennai-super-kings','csk':'ipl-chennai-super-kings',
 'mumbai indians':'ipl-mumbai-indians','mi':'ipl-mumbai-indians',
 'royal challengers bengaluru':'ipl-royal-challengers-bengaluru','royal challengers bangalore':'ipl-royal-challengers-bengaluru','rcb':'ipl-royal-challengers-bengaluru',
 'kolkata knight riders':'ipl-kolkata-knight-riders','kkr':'ipl-kolkata-knight-riders',
 'rajasthan royals':'ipl-rajasthan-royals','rr':'ipl-rajasthan-royals',
 'sunrisers hyderabad':'ipl-sunrisers-hyderabad','srh':'ipl-sunrisers-hyderabad',
 'delhi capitals':'ipl-delhi-capitals','dc':'ipl-delhi-capitals',
 'punjab kings':'ipl-punjab-kings','pbks':'ipl-punjab-kings','kings xi punjab':'ipl-punjab-kings',
 'gujarat titans':'ipl-gujarat-titans','gt':'ipl-gujarat-titans',
 'lucknow super giants':'ipl-lucknow-super-giants','lsg':'ipl-lucknow-super-giants'
 };
 function resolve(t){
  if(!t)return null;
  if(typeof t==='object'&&t.sport&&!/^cricket$/i.test(t.sport))return null;
  let n=String(typeof t==='string'?t:t.name||t.teamName||t.short||t.shortname||'').toLowerCase().replace(/[’']/g,'').replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();
  if(!aliases[n])n=n.replace(/\s+(?:(?:women|womens|men|mens)(?:\s+(?:a|xi|u\s?19|under\s?19))?|under\s?19|u\s?19|a|xi)$/,'').trim();
  const original=String(typeof t==='string'?t:t.name||t.teamName||t.short||t.shortname||'').toLowerCase().trim();if(aliases[n]?.startsWith('ipl-')&&!aliases[original])return null;
  const id=aliases[n];return id?{id,path:'/emblems/'+id+'.webp',kind:id.startsWith('country-')?'generated_country_board_ball_artwork':'official_franchise_logo'}:null;
 }
 return {resolve,aliases};
}
if(typeof module==='object')module.exports={createSHIdentityAssets};
