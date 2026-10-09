import { TOWERS, isTowerId } from '../config/towers.ts';
import { effectiveStats, initialEvolution } from '../systems/EvolutionSystem.ts';
import type { TargetingMode } from '../../shared/types.ts';
import type { EffectiveTowerStats, EvolutionState, HitCounter, TowerId } from '../../shared/progression.ts';
import type { CampaignSpecializationId } from '../campaign/types.ts';
import { campaignTowerStats } from '../campaign/battle.ts';

let NEXT_ID = 1;

export class Tower {
  id = NEXT_ID++;
  towerId: TowerId;
  progression: EvolutionState;
  counter: HitCounter = { successes: 0 };
  x: number;
  y: number;
  targeting: TargetingMode = 'first';
  cooldown = 0;
  frozenUntil = 0;
  specialization: CampaignSpecializationId | null = null;
  overchargeUntil = 0;
  recoilUntil = 0; // attack-recoil window (game-time ms, cosmetic)
  plotIndex: number;
  view: Phaser.GameObjects.Container | null = null;
  crown: Phaser.GameObjects.Container | null = null;
  shadow: Phaser.GameObjects.Ellipse | null = null;

  constructor(towerId: string, x: number, y: number, plotIndex: number) {
    if (!isTowerId(towerId)) throw new Error(`Unknown tower id: ${towerId}`);
    this.towerId = towerId;
    this.progression = initialEvolution(towerId);
    this.x = x;
    this.y = y;
    this.plotIndex = plotIndex;
  }

  get cfg() {
    return TOWERS[this.towerId];
  }

  get level(): number {
    return this.progression.foundationLevel;
  }

  get stats(): EffectiveTowerStats {
    return campaignTowerStats(effectiveStats(this.towerId, this.progression), this.specialization);
  }

  get maxLevel(): boolean {
    return this.level >= this.cfg.levels.length;
  }

  upgradeCost(): number | null {
    if (this.maxLevel) return null;
    return this.cfg.levels[this.level].cost; // next level cost
  }
}
