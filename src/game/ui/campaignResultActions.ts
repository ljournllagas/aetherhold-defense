import type {RunOutcome} from '../../shared/progression.ts';
export function campaignResultActions(outcome:RunOutcome,level:number,highestUnlocked:number,totalLevels:number):Array<'next'|'restart'|'map'>{return outcome==='victory'&&level<totalLevels&&highestUnlocked>level?['next','restart','map']:['restart','map'];}
