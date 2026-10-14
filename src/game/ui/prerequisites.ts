import {formatCount} from '../../shared/displayNumbers.ts';
import type {CombatTower} from '../../shared/progression.ts';
import type {PurchaseContext,PurchaseIntent} from '../systems/EvolutionSystem.ts';
import {nextPurchaseCost} from '../systems/EvolutionSystem.ts';
import {STARTER_BRANCH,EVOLUTIONS} from '../config/evolutions.ts';
import {CAMPAIGN_LEVELS,getCampaignLevel} from '../campaign/config.ts';
import type {CampaignView} from '../campaign/types.ts';
import {campaignScoreMetadata} from '../../shared/campaignScoring.ts';
export interface Requirement {id:string;label:string;met:boolean;progress:string;nextStep:string}
export function classicRequirements(tower:CombatTower,intent:PurchaseIntent,context:PurchaseContext,wavesCompleted:number,towers:readonly CombatTower[]):Requirement[]{
 const p=tower.progression,id=tower.towerId,r:Requirement[]=[];
 const add=(id:string,label:string,met:boolean,progress:string,nextStep:string)=>r.push({id,label,met,progress,nextStep});
 if(intent.kind==='evolve'){
  add('foundation','Tower foundation',p.foundationLevel===4,`Level ${p.foundationLevel}/4`,'Upgrade this tower to level 4.');
  if(intent.branchId!==STARTER_BRANCH[id]){
   const earned=context.unlocked.has(intent.branchId);
   const qualifying=towers.some(t=>t.towerId===id&&t.progression.branchId===STARTER_BRANCH[id]&&(t.progression.rank??0)>=2);
   add('branch','Permanent branch achievement',earned,earned?'Earned':qualifying&&wavesCompleted<20?`On track · Wave ${wavesCompleted}/20`:'Not earned',
    earned?'Available in future Classic runs.':wavesCompleted>=20?'Try in a new Classic run.':`Keep a ${EVOLUTIONS[STARTER_BRANCH[id]].name} at rank 2 or higher when wave 20 completes.`);
  }
  add('boss','This run: wave-10 boss',context.evolutionOpen,context.evolutionOpen?'Defeated':'Not defeated','Defeat the wave-10 boss in this run.');
 }
 if(intent.kind==='mastery'){
  add('evolution','Completed evolution',p.rank===3,`Rank ${p.rank??'none'}/3`,'Upgrade the evolution to rank 3.');
  add('endless','This run: Endless',context.endless,context.endless?'Endless active':'Siege','Win the siege and choose Continue Endless.');
 }
 const cost=nextPurchaseCost(id,p,intent);
 if(cost!==null){const missing=Math.max(0,cost-context.gold);
  add('gold','Gold',missing===0,`${formatCount(context.gold)}/${formatCount(cost)} gold`,missing?`Earn ${formatCount(missing)} more gold.`:'Cost covered.');
 }else add('limit','Available upgrade',false,'Maximum stage or numeric limit','This action is unavailable at the current stage.');
 return r;
}
export function campaignRequirements(view:CampaignView,level:number):Requirement[]{
 const def=getCampaignLevel(level);if(!def)return [];
 const p=view.profile.levels[level],target=campaignScoreMetadata(level).scoreTarget;const previous=level===1||level<=view.highestUnlockedLevel;
 return [
  {id:'previous',label:'Level access',met:previous,progress:previous?'Unlocked':`Level ${level-1} required`,nextStep:previous?'Ready to play.':`Complete Level ${level-1} to unlock this level.`},
  {id:'completion',label:'Completion star',met:!!p?.completionStar,progress:p?.completed?'Earned':'Not earned',nextStep:'Win this level.'},
  {id:'lives',label:'Lives star',met:!!p?.livesStar,progress:`${p?.bestRemainingLives??0}/${def.mastery.minimumLivesForStar} lives`,nextStep:`Win with at least ${def.mastery.minimumLivesForStar} lives.`},
  {id:'score',label:'Score star',met:!!p?.scoreStar,progress:`${formatCount(p?.campaignScore?.bestScore??0)}/${formatCount(target)} points`,nextStep:`Win with at least ${formatCount(target)} points.`}
 ];
}
export function campaignNextStep(view:CampaignView):{level:number|null;text:string}{
 const unfinished=CAMPAIGN_LEVELS.find(d=>d.level<=view.highestUnlockedLevel&&!view.profile.levels[d.level]?.completed);
 if(unfinished)return {level:unfinished.level,text:`Complete Level ${unfinished.level} to continue.`};
 for(const def of CAMPAIGN_LEVELS){
  const missing=campaignRequirements(view,def.level).find(r=>r.id!=='previous'&&!r.met);
  if(missing)return {level:def.level,text:`Replay Level ${def.level}: ${missing.nextStep}`};
 }
 return {level:null,text:'All Campaign stars earned.'};
}
