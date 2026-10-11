import { describe, expect, it, vi } from 'vitest';
vi.mock('../src/game/art/artkit.ts', () => ({ P2: (points: unknown) => points }));
import { CAMPAIGN_LEVELS } from '../src/game/campaign/config.ts';
import { resolveCampaignMap } from '../src/game/campaign/maps.ts';
import { ensureCampaignBattleBackground } from '../src/game/art/campaignArt.ts';
import { MAP1 } from '../src/game/maps/map1.ts';
import { paintBattlefield, refreshStronghold } from '../src/game/art/terrain.ts';

function fakeScene(loaded: readonly string[] = []) {
  const keys = new Set(loaded);
  const drawings: unknown[][] = [];
  const rendered: string[] = [];
  const graphics: Array<{ calls: Array<[string, ...unknown[]]>; gameObject: Record<string, unknown> }> = [];
  const textures = {
    exists: (key: string) => keys.has(key),
    addDynamicTexture: vi.fn((key: string, width: number, height: number) => {
      const texture = {
        key,
        width,
        height,
        draw(entries: unknown[]) { drawings.push(entries); keys.add(key); return texture; },
        render() { rendered.push(key); return texture; }
      };
      keys.add(key);
      return texture;
    })
  };
  const scene = {
    textures,
    drawings,
    rendered,
    graphics,
    make: {
      image: vi.fn(() => ({
        key: '',
        setTexture(key: string) { this.key = key; return this; },
        setOrigin() { return this; },
        setDisplaySize() { return this; },
        destroy() {}
      })),
      graphics: vi.fn(() => {
        const calls: Array<[string, ...unknown[]]> = [];
        const gameObject: Record<string, unknown> = {};
        for (const method of [
          'fillStyle', 'fillRect', 'fillEllipse', 'fillTriangle', 'fillPoints', 'fillCircle',
          'lineStyle', 'lineBetween', 'beginPath', 'moveTo', 'lineTo', 'strokePath', 'generateTexture', 'destroy'
        ]) {
          gameObject[method] = (...args: unknown[]) => { calls.push([method, ...args]); return gameObject; };
        }
        graphics.push({ calls, gameObject });
        return gameObject;
      })
    }
  };
  return scene;
}

function hasCircleAt(calls: Array<[string, ...unknown[]]>, x: number, y: number, radius: number): boolean {
  return calls.some(([name, circleX, circleY, circleRadius]) => name === 'fillCircle'
    && circleX === x && circleY === y && circleRadius === radius);
}

function fakeBattlefieldScene(existingTextures: readonly string[]) {
  const keys = new Set(existingTextures);
  const calls: Array<{ kind: string; args: unknown[]; object: Record<string, unknown> }> = [];
  const makeObject = (kind: string, args: unknown[] = []) => {
    const object: Record<string, unknown> = { kind, args };
    for (const method of [
      'setOrigin', 'setDisplaySize', 'setDepth', 'setScale', 'setFrame', 'setVisible', 'setFillStyle',
      'lineStyle', 'lineBetween', 'fillStyle', 'fillCircle'
    ]) object[method] = (...methodArgs: unknown[]) => {
      calls.push({ kind: `${kind}.${method}`, args: methodArgs, object });
      if (method === 'setScale') object.scale = methodArgs[0];
      if (method === 'setFrame') object.frame = methodArgs[0];
      if (method === 'setVisible') object.visible = methodArgs[0];
      return object;
    };
    object.add = (children: unknown) => { calls.push({ kind: `${kind}.add`, args: [children], object }); return object; };
    calls.push({ kind, args, object });
    return object;
  };
  const scene = {
    textures: {
      exists: (key: string) => keys.has(key),
      get: () => ({ has: () => true, add: vi.fn() })
    },
    make: {},
    add: {
      image: (...args: unknown[]) => makeObject('image', args),
      container: (...args: unknown[]) => makeObject('container', args),
      sprite: (...args: unknown[]) => makeObject('sprite', args),
      circle: (...args: unknown[]) => makeObject('circle', args),
      graphics: (...args: unknown[]) => makeObject('graphics', args)
    },
    tweens: { add: vi.fn() }
  };
  return { scene, calls };
}

describe('campaign terrain plate composition', () => {
  it('paints a ground clearing at every relocated Classic plot without replacing its road', () => {
    const fixture = fakeBattlefieldScene(['map_ancient_border_keep']);
    paintBattlefield(fixture.scene as never, MAP1);
    for (const point of MAP1.buildable) {
      expect(fixture.calls.some(call => call.kind === 'graphics.fillCircle' && call.args[0] === point.x && call.args[1] === point.y && call.args[2] === 24)).toBe(true);
    }
    expect(fixture.calls.filter(call => call.kind === 'image').map(call => call.args[2])).toEqual(['map_ancient_border_keep']);
  });
  it('composites the loaded plate with the actual route and clearings, then caches per variant map id', () => {
    const base = resolveCampaignMap(CAMPAIGN_LEVELS[0]);
    const variant = resolveCampaignMap(CAMPAIGN_LEVELS[1]);
    const scene = fakeScene([base.backgroundKey]);

    expect(ensureCampaignBattleBackground(scene as never, base, 'borderkeep')).toBe('campaign_temp_borderkeep_a');
    expect(ensureCampaignBattleBackground(scene as never, base, 'borderkeep')).toBe('campaign_temp_borderkeep_a');
    expect(ensureCampaignBattleBackground(scene as never, variant, 'borderkeep')).toBe('campaign_temp_borderkeep_a2');
    expect(scene.textures.addDynamicTexture).toHaveBeenCalledTimes(2);
    expect(scene.drawings).toHaveLength(2);
    expect(scene.rendered).toEqual(['campaign_temp_borderkeep_a', 'campaign_temp_borderkeep_a2']);
    expect(scene.drawings[0][0]).toMatchObject({ key: base.backgroundKey });

    const baseCalls = scene.graphics[0].calls;
    const variantCalls = scene.graphics[1].calls;
    expect(hasCircleAt(baseCalls, 0, 74, 25)).toBe(true);
    expect(hasCircleAt(baseCalls, 230, 74, 25)).toBe(true);
    expect(hasCircleAt(baseCalls, 230, 264, 25)).toBe(true);
    expect(hasCircleAt(variantCalls, 230, 84, 25)).toBe(true);
    expect(hasCircleAt(variantCalls, 230, 274, 25)).toBe(true);
    expect(base.buildable.every(point => hasCircleAt(baseCalls, point.x - base.field.x, point.y - base.field.y, 26))).toBe(true);
    expect(baseCalls.filter(([name]) => name === 'fillPoints').length).toBeGreaterThan(300);
    expect(variantCalls.filter(([name]) => name === 'fillPoints').length).toBeGreaterThan(250);
    expect(baseCalls.filter(([name]) => name === 'fillRect')).toHaveLength(0);
    expect(baseCalls.some(([name, width]) => name === 'lineStyle' && width === 1.5)).toBe(false);
  });

  it('keeps the deterministic procedural fallback when no approved family texture is loaded', () => {
    const map = resolveCampaignMap(CAMPAIGN_LEVELS[0]);
    const scene = fakeScene();

    expect(ensureCampaignBattleBackground(scene as never, map, 'borderkeep')).toBe('campaign_temp_borderkeep_a');
    expect(scene.textures.addDynamicTexture).not.toHaveBeenCalled();
    expect(scene.make.image).not.toHaveBeenCalled();
    const calls = scene.graphics[0].calls;
    expect(calls.filter(([name]) => name === 'fillEllipse')).toHaveLength(190);
    expect(calls.filter(([name]) => name === 'fillRect')).toHaveLength(1);
    expect(calls.filter(([name]) => name === 'strokePath')).toHaveLength(2);
    expect(calls.filter(([name]) => name === 'fillCircle').length).toBeGreaterThan(map.buildable.length + 1);
    expect(calls.filter(([name]) => name === 'fillPoints').length).toBeGreaterThan(300);
    expect(calls.find(([name]) => name === 'generateTexture')).toEqual(['generateTexture', 'campaign_temp_borderkeep_a', map.field.width, map.field.height]);
  });

  it('uses the reviewed full-size spire at campaign strongholds while retaining classic beacon placement and health frames', () => {
    const campaignMap = resolveCampaignMap(CAMPAIGN_LEVELS[0]);
    const campaignScene = fakeBattlefieldScene(['campaign_temp_borderkeep_a', 'stronghold_beacon_atlas']);
    const campaignArt = paintBattlefield(campaignScene.scene as never, campaignMap, 'borderkeep');
    const campaignSprite = campaignScene.calls.find(({ kind }) => kind === 'sprite')!;
    expect(campaignSprite.args).toEqual([campaignMap.stronghold.x, campaignMap.stronghold.y - 15, 'stronghold_beacon_atlas', 'healthy']);
    expect(campaignSprite.object.scale).toBeCloseTo(70 / 622);

    refreshStronghold(campaignArt.stronghold, 0.5);
    expect(campaignSprite.object.frame).toBe('damaged');
    refreshStronghold(campaignArt.stronghold, 0.2);
    expect(campaignSprite.object.frame).toBe('critical');

    const emberLevel = CAMPAIGN_LEVELS.find(level => level.worldId === 'emberfall')!;
    const emberMap = resolveCampaignMap(emberLevel);
    const emberScene = fakeBattlefieldScene([`campaign_temp_${emberMap.id}`, 'stronghold_beacon_atlas']);
    paintBattlefield(emberScene.scene as never, emberMap, 'emberfall');
    const emberSprite = emberScene.calls.find(({ kind }) => kind === 'sprite')!;
    expect(emberSprite.args).toEqual([emberMap.stronghold.x, emberMap.stronghold.y - 15, 'stronghold_beacon_atlas', 'healthy']);
    expect(emberSprite.object.scale).toBeCloseTo(70 / 622);

    const classicScene = fakeBattlefieldScene(['stronghold_beacon_atlas']);
    paintBattlefield(classicScene.scene as never, MAP1);
    const classicSprite = classicScene.calls.find(({ kind }) => kind === 'sprite')!;
    expect(classicSprite.args).toEqual([MAP1.beacon.x, MAP1.beacon.y, 'stronghold_beacon_atlas', 'healthy']);
    expect(classicSprite.object.scale).toBeCloseTo(34 / 622);
  });
});
