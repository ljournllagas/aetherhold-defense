import type {PowerUpId,EnemyArchetype} from '../../shared/types.ts';
import type {SiegePhase} from './SiegeSystem.ts';
import type {RelicSelection,RelicVault} from './RunSimulation.ts';
import {POWERUP_EFFECTS} from '../config/powerUps.ts';

export interface AutoEnemy {id:number;x:number;y:number;alive:boolean;isBoss:boolean;archetype:EnemyArchetype;}
export interface AutoContext {
  phase:SiegePhase;wave:number;waveActive:boolean;blocked:boolean;nowMs:number;lives:number;maxLives:number;
  enemies:readonly AutoEnemy[];towers:readonly {overchargeUntil:number}[];
  freezeUntil:number;battleCryUntil:number;surgeUntil:number;doubleBountyUntil:number;
}
export interface AutoMeteorTarget {enemyId:number;x:number;y:number;count:number;hasBoss:boolean;centerBoss:boolean;}
export interface AutoRelicIntent extends RelicSelection {meteorTarget:AutoMeteorTarget|null;}
export class AutoSystem {
  enabled=false;revision=0;remainingMs:number|null=null;
  private wave:number|null=null;private eligiblePreviously=false;
  setEnabled(value:boolean):void {if(value===this.enabled)return;this.enabled=value;this.revision++;this.cancelCountdown();}
  cancelCountdown():void {this.wave=null;this.remainingMs=null;this.eligiblePreviously=false;}
  suspend():void {this.eligiblePreviously=false;}
  reset():void {this.enabled=false;this.revision++;this.cancelCountdown();}
  advance(realDeltaMs:number,s:Pick<AutoContext,'phase'|'wave'|'waveActive'|'blocked'>):boolean {
    if(!this.enabled || (s.phase!=='siege'&&s.phase!=='endless') || s.waveActive){this.cancelCountdown();return false;}
    if(s.blocked){this.suspend();return false;}
    const charge=this.eligiblePreviously;this.eligiblePreviously=true;
    if(this.wave!==s.wave || this.remainingMs===null){this.wave=s.wave;this.remainingMs=5000;return false;}
    if(charge && Number.isFinite(realDeltaMs) && realDeltaMs>0)this.remainingMs=Math.max(0,this.remainingMs-realDeltaMs);
    return this.remainingMs===0;
  }
}
export function chooseAutoMeteorTarget(enemies:readonly AutoEnemy[]):AutoMeteorTarget|null {
  // shortcut: aim at enemy centers; use a continuous optimizer only if cluster coverage becomes a gameplay problem.
  const alive=enemies.filter(e=>e.alive&&Number.isFinite(e.x)&&Number.isFinite(e.y));
  let best:AutoMeteorTarget|null=null;
  for(const center of alive){
    const victims=alive.filter(e=>Math.hypot(e.x-center.x,e.y-center.y)<=POWERUP_EFFECTS.meteor.radius);
    const candidate:AutoMeteorTarget={enemyId:center.id,x:center.x,y:center.y,count:victims.length,
      hasBoss:victims.some(e=>e.isBoss),centerBoss:center.isBoss};
    if(candidate.count<3&&!candidate.hasBoss)continue;
    if(!best || (candidate.count-best.count || Number(candidate.hasBoss)-Number(best.hasBoss) ||
      Number(candidate.centerBoss)-Number(best.centerBoss) || best.enemyId-candidate.enemyId)>0)best=candidate;
  }
  return best;
}
export function chooseAutoRelic(s:AutoContext,v:Pick<RelicVault,'stored'|'pending'|'revision'>):AutoRelicIntent|null {
  if(s.blocked||(s.phase!=='siege'&&s.phase!=='endless'))return null;
  const combat=s.waveActive&&s.enemies.some(e=>e.alive),hasTower=s.towers.length>0;
  let meteor:AutoMeteorTarget|null|undefined;
  const eligible=(id:PowerUpId):boolean=>{
    switch(id){
      case 'gold_rush':return true;
      case 'emergency_repair':return s.lives<s.maxLives;
      case 'meteor_strike':
        if(!combat)return false;
        if(meteor===undefined)meteor=chooseAutoMeteorTarget(s.enemies);
        return meteor!==null;
      case 'time_freeze':return combat&&s.freezeUntil<=s.nowMs;
      case 'battle_cry':return combat&&hasTower&&s.battleCryUntil<=s.nowMs;
      case 'arcane_surge':return combat&&hasTower&&s.surgeUntil<=s.nowMs;
      case 'double_bounty':return combat&&s.doubleBountyUntil<=s.nowMs;
      case 'tower_overcharge':return combat&&hasTower&&s.towers.every(t=>t.overchargeUntil<=s.nowMs);
      case 'treasure_goblin':return combat&&hasTower&&!s.enemies.some(e=>e.alive&&e.archetype==='pilferer');
      case 'ancient_blessing':return combat&&hasTower&&s.lives<s.maxLives&&s.surgeUntil<=s.nowMs;
    }
  };
  for(const source of ['stored','pending'] as const){
    const length=source==='stored'?v.stored.length:v.pending.length;
    for(let index=0;index<length;index++){
      const id=source==='stored'?v.stored[index]:v.pending[index].id;
      if(eligible(id))return {source,index,id,revision:v.revision,meteorTarget:id==='meteor_strike'?meteor??null:null};
    }
  }
  return null;
}
