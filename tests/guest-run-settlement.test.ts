import {afterEach,expect,it,vi} from 'vitest';
import {GameScene} from '../src/game/scenes/GameScene.ts';
import {accountSystem} from '../src/game/systems/AccountSystem.ts';
import {SoundManager} from '../src/game/systems/SoundManager.ts';
import {campaignScoreMetadata} from '../src/shared/campaignScoring.ts';
vi.mock('phaser',()=>({default:{Scene:class{},Math:{Vector2:class{constructor(public x:number,public y:number){}}},Scenes:{Events:{SHUTDOWN:'shutdown'}},Scale:{Events:{RESIZE:'resize'}}}}));
afterEach(()=>vi.restoreAllMocks());
it('settles a captured guest once despite later account presentation',()=>{
 const run=new GameScene() as any;run.init({difficulty:'medium',playerName:'Aria'});run.runOwner={mode:'guest',name:'Aria'};run.runAccount=null;run.scene={start:vi.fn(),restart:vi.fn()};
 vi.spyOn(SoundManager,'get').mockReturnValue({gameover:()=>{},stopMusic:()=>{}} as any);
 const guest=vi.spyOn(accountSystem,'completeGuestRun').mockResolvedValue(),account=vi.spyOn(accountSystem,'settle').mockResolvedValue();
 vi.spyOn(accountSystem,'view').mockReturnValue({...accountSystem.view(),playMode:'account'});
 run.siege.highestWave=1;run.siege.progress=()=>({highestWave:1,wavesCompleted:0,outcome:'defeat',siegeBossesDefeated:0});run.finishRun('defeat');run.finishRun('defeat');
 expect(guest).toHaveBeenCalledTimes(1);expect(guest).toHaveBeenCalledWith({mode:'guest',name:'Aria'},expect.objectContaining({runId:run.runId}));expect(account).not.toHaveBeenCalled();
});
it('does not retain assisted guest results',()=>{
 const run=new GameScene() as any;run.init({difficulty:'medium',playerName:'Aria'});run.runOwner={mode:'guest',name:'Aria'};run.scene={start:vi.fn()};run.debugAssisted=true;
 vi.spyOn(SoundManager,'get').mockReturnValue({gameover:()=>{},stopMusic:()=>{}} as any);const guest=vi.spyOn(accountSystem,'completeGuestRun').mockResolvedValue();run.finishRun('defeat');expect(guest).not.toHaveBeenCalled();
});
it('settles a Campaign guest clear once without a public score',()=>{
 const run=new GameScene() as any;run.init({mode:'campaign',campaignLevel:1,playerName:'Aria'});run.runOwner={mode:'guest',name:'Aria'};run.runAccount=null;run.scene={start:vi.fn(),restart:vi.fn()};run.campaign.readyToClear=()=>true;
 const metadata=campaignScoreMetadata(1);run.wavesCompleted=metadata.waveCount;run.campaignScheduledKills=metadata.scheduledEnemyCount;
 const view=accountSystem.view();vi.spyOn(accountSystem,'view').mockReturnValue({...view,playMode:'account'});
 const settlement=vi.spyOn(run,'settleCapturedRun');
 run.renderCampaignResult=()=>{};run.updateHUD=()=>{};run.closeModal=()=>{};run.hideGhost=()=>{};
 vi.spyOn(SoundManager,'get').mockReturnValue({gameover:()=>{},stopMusic:()=>{}} as any);const guest=vi.spyOn(accountSystem,'completeGuestRun').mockResolvedValue();
 run.finishCampaign('victory');run.finishCampaign('victory');expect(guest).toHaveBeenCalledTimes(1);expect(guest.mock.calls[0][1].result).toBeNull();expect(guest.mock.calls[0][1].progress.levels[1]?.completed).toBe(true);
 expect(settlement).toHaveBeenCalledTimes(1);
 expect(settlement.mock.calls[0][0]).toMatchObject({mode:'campaign',payload:{campaignScoreVersion:1,scheduledEnemiesKilled:metadata.scheduledEnemyCount,wavesCompleted:metadata.waveCount,missionBossesKilled:0,finalScore:metadata.perfectScore}});
 expect(guest.mock.calls[0][1]).toMatchObject({runId:run.runId,result:null,progress:{levels:{1:{bestScore:0,bestRemainingLives:20,campaignScore:{version:1,bestScore:metadata.perfectScore}}}}});
});
