import {expect,it} from 'vitest';
import {classicRequirements,campaignRequirements,campaignNextStep} from '../src/game/ui/prerequisites.ts';
import {initialEvolution} from '../src/game/systems/EvolutionSystem.ts';
import {ALTERNATIVE_BRANCH} from '../src/game/config/evolutions.ts';
import {createEmptyCampaignProfile} from '../src/game/campaign/progress.ts';
import type {CombatTower} from '../src/shared/progression.ts';
import type {CampaignView} from '../src/game/campaign/types.ts';
it('lists all unmet evolution gates, not just the first failure',()=>{
 const t={towerId:'longbow',progression:initialEvolution('longbow')} as CombatTower;
 const r=classicRequirements(t,{kind:'evolve',branchId:ALTERNATIVE_BRANCH.longbow},{gold:0,evolutionOpen:false,endless:false,blocked:false,unlocked:new Set()},0,[t]);
 expect(r.filter(x=>!x.met).map(x=>x.id)).toEqual(['foundation','branch','boss','gold']);
});
it('earned account branch does not require another qualifying tower',()=>{
 const t={towerId:'longbow',progression:{...initialEvolution('longbow'),foundationLevel:4}} as CombatTower;
 const r=classicRequirements(t,{kind:'evolve',branchId:ALTERNATIVE_BRANCH.longbow},{gold:10000,evolutionOpen:true,endless:false,blocked:false,unlocked:new Set([ALTERNATIVE_BRANCH.longbow])},25,[t]);
 expect(r.every(x=>x.met)).toBe(true);
});
const empty=():CampaignView=>({profile:createEmptyCampaignProfile(),totalMasteryStars:0,highestUnlockedLevel:1,unlockedFeatures:[],unsaved:false,unsavedLevels:new Set(),warning:null});
it('empty Campaign points to first level with exact configured star thresholds',()=>{
 const v=empty();expect(campaignNextStep(v)).toEqual({level:1,text:'Complete Level 1 to continue.'});
 const r=campaignRequirements(v,1);expect(r.find(x=>x.id==='lives')?.nextStep).toContain('12');expect(r.find(x=>x.id==='score')?.nextStep).toContain('1950');
 expect(campaignRequirements(v,2).find(x=>x.id==='previous')?.met).toBe(false);
});
it('all-star profile has no invented next quest',()=>{
 const v=empty();for(let i=1;i<=30;i++)v.profile.levels[i]={completed:true,completionStar:true,livesStar:true,scoreStar:true,bestScore:999999,bestRemainingLives:20};
 v.highestUnlockedLevel=30;expect(campaignNextStep(v).level).toBeNull();
 v.profile.levels[3]!.scoreStar=false;expect(campaignNextStep(v).level).toBe(3);
});
