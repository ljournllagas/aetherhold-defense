import {expect,it,vi} from 'vitest';
vi.mock('phaser',()=>({default:{Scene:class{}}}));
import {campaignProgressionLines} from '../src/game/scenes/ProgressionScene.ts';
import {createEmptyCampaignProfile} from '../src/game/campaign/progress.ts';
it('Campaign overview names thresholds and next level for empty progress',()=>{
 const lines=campaignProgressionLines({profile:createEmptyCampaignProfile(),totalMasteryStars:0,highestUnlockedLevel:1,unlockedFeatures:[],unsaved:false,unsavedLevels:new Set(),warning:null});
 expect(lines.join('\n')).toContain('Complete Level 1');
 expect(lines.join('\n')).toContain('20 stars');expect(lines.join('\n')).toContain('30 stars');expect(lines.join('\n')).toContain('Level 10');
});
