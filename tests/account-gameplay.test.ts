import {afterEach,expect,it,vi} from 'vitest';
import {GameScene} from '../src/game/scenes/GameScene.ts';
import {accountSystem} from '../src/game/systems/AccountSystem.ts';
import {SoundManager} from '../src/game/systems/SoundManager.ts';
vi.mock('phaser',()=>({default:{Scene:class{},Math:{Vector2:class{constructor(public x:number,public y:number){}}},Scenes:{Events:{SHUTDOWN:'shutdown'}},Scale:{Events:{RESIZE:'resize'}}}}));
afterEach(()=>vi.restoreAllMocks());
function scene(){
  const run=new GameScene() as any;run.init({difficulty:'medium',playerName:'Test'});run.runAccount={playerId:'a',generation:'g'};
  const start=vi.fn();run.scene={start,restart:vi.fn()};vi.spyOn(SoundManager,'get').mockReturnValue({gameover:()=>{},stopMusic:()=>{}} as any);vi.spyOn(accountSystem,'settle').mockResolvedValue();return {run,start};
}
it.each(['defeat','siege-failed','victory'])('automatically queues Classic %s once',outcome=>{
  const {run}=scene();run.siege.highestWave=30;run.siege.progress=()=>({highestWave:30,wavesCompleted:30,outcome,siegeBossesDefeated:7});run.finishRun(outcome);run.finishRun(outcome);
  expect(accountSystem.settle).toHaveBeenCalledTimes(1);expect(accountSystem.settle).toHaveBeenCalledWith({playerId:'a',generation:'g'},expect.objectContaining({mode:'classic',payload:expect.objectContaining({outcome})}));
});
it('does not upload assisted results',()=>{const {run}=scene();run.siege.highestWave=1;run.debugAssisted=true;run.finishRun('defeat');expect(accountSystem.settle).not.toHaveBeenCalled();});
it.each(['defeat','siege-failed','victory'])('automatically queues Campaign %s once',outcome=>{
  const {run}=scene();run.init({mode:'campaign',campaignLevel:1});run.runAccount={playerId:'a',generation:'g'};run.campaign.readyToClear=()=>true;run.renderCampaignResult=()=>{};run.updateHUD=()=>{};run.closeModal=()=>{};run.hideGhost=()=>{};
  run.finishCampaign(outcome);run.finishCampaign(outcome);expect(accountSystem.settle).toHaveBeenCalledTimes(1);expect(accountSystem.settle).toHaveBeenCalledWith({playerId:'a',generation:'g'},expect.objectContaining({mode:'campaign',payload:expect.objectContaining({outcome,level:1})}));
});
it('rejects expired battle entry before constructing the battlefield',()=>{const {run,start}=scene();vi.spyOn(accountSystem,'canStartBattle').mockReturnValue(false);vi.spyOn(accountSystem,'view').mockReturnValue({...accountSystem.view(),config:{loginRequired:true}});run.create();expect(start).toHaveBeenCalledWith('Login');});
