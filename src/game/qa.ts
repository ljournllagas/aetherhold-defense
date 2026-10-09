import type Phaser from 'phaser';
import type { GameOverData } from './scenes/GameOverScene.ts';
import type { LoadingRequest } from './scenes/PreloadScene.ts';
import type { DifficultyId, PowerUpId } from '../shared/types.ts';

export const QA_STATES = [
  'menu',
  'difficulty',
  'normal',
  'heavy',
  'placement',
  'selected',
  'reward',
  'boss',
  'evolution',
  'victory',
  'mastery',
  'gameover',
  'leaderboard'
] as const;

export type QAState = (typeof QA_STATES)[number];
export type LeaderboardFixture = 'empty' | 'failure';
const GAME_QA_STATES = ['normal', 'heavy', 'placement', 'selected', 'reward', 'boss', 'evolution', 'victory', 'mastery'] as const;
type GameQAState = (typeof GAME_QA_STATES)[number];

export type QAAction =
  | { type: 'seed'; state: GameQAState }
  | { type: 'toggle-pause' }
  | { type: 'cycle-speed' }
  | { type: 'grant-powerup'; id: PowerUpId }
  | { type: 'start-wave' }
  | { type: 'restart' };

export interface QAStatus {
  wave: number;
  gold: number;
  lives: number;
  speed: number;
  paused: boolean;
  autoEnabled: boolean;
  autoRemainingMs: number | null;
  waveActive: boolean;
  towers: number;
  enemies: number;
  powerups: number;
  projectiles: number;
  pendingRewards: number;
  effects: number;
  spawnEvents: number;
  dying: number;
  boss: boolean;
  target: boolean;
  gameTimeMs: number;
  activeBuffs: number;
  inputListeners: number;
  timers: number;
  tweens: number;
  selected: boolean;
  placing: boolean;
  modal: boolean;
  runId: string;
  phase: string;
  wavesCompleted: number;
  fields: number;
  debugAssisted: boolean;
  unsavedUnlocks: string[];
  progression: Array<{ towerId: string; branchId: string | null; rank: number | null; masteryRank: number; invested: number }>;
}

export interface QARequest {
  state: QAState;
  leaderboardFixture?: LeaderboardFixture;
}

export function parseQARequest(search: string): QARequest | null {
  const params = new URLSearchParams(search);
  const state = params.get('qa');
  if (!isQAState(state)) return null;
  if (state === 'leaderboard') {
    return { state, leaderboardFixture: params.get('fixture') === 'failure' ? 'failure' : 'empty' };
  }
  return { state };
}

const GAME_SCENE_KEY = 'Game';

export function installQA(game: Phaser.Game): void {
  const request = parseQARequest(window.location.search);
  if (!request) return;

  const panel = createPanel(request);
  document.body.appendChild(panel.root);
  installFixtureNetwork(request);
  panel.onStateChange((state) => navigateToQAState(state));
  panel.onLeaderboardFixtureChange((fixture) => navigateToLeaderboardFixture(fixture));
  panel.onAction((action) => sendGameAction(game, action));

  const scene = game.scene.getScene(GAME_SCENE_KEY);
  const reportStatus = (status: QAStatus) => {
    panel.root.dataset.qaStatus = JSON.stringify(status);
    panel.setStatus(
      `Wave ${status.wave} · ${status.gold} gold · ${status.lives} lives · ${status.speed}x · ` +
      `${status.towers} towers · ${status.enemies} enemies · ${status.projectiles} shots · ${status.effects} effects · ${status.pendingRewards} pending · ${status.powerups}/3 relics · ` +
      `${status.paused ? 'paused' : status.waveActive ? 'wave active' : 'preparation'}`
    );
  };
  scene.events.on('qa:status', reportStatus);
  let lastGameActive: boolean | null = null;
  const refreshGameControls = () => {
    const active = game.scene.isActive(GAME_SCENE_KEY);
    if (active === lastGameActive) return;
    lastGameActive = active;
    panel.setGameActive(active);
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.dataset.qaScene = active ? GAME_SCENE_KEY : '';
  };
  game.events.on('step', refreshGameControls);
  refreshGameControls();
  window.addEventListener('beforeunload', () => {
    game.events.off('step', refreshGameControls);
    scene.events.off('qa:status', reportStatus);
    panel.root.remove();
  }, { once: true });

  const enterRequestedState = () => {
    if (!game.scene.isActive('MainMenu')) return;
    game.events.off('step', enterRequestedState);
    if (request.state === 'menu') return;
    if (request.state === 'difficulty') {
      game.scene.start('Difficulty');
      return;
    }
    if (request.state === 'leaderboard') {
      game.scene.start('Leaderboard', {});
      return;
    }
    if (request.state === 'gameover') {
      const data: GameOverData = {
        difficulty: 'medium' satisfies DifficultyId,
        playerName: 'QA Warden',
        highestWave: 25,
        wavesCompleted: 24,
        outcome: 'defeat',
        siegeBossesDefeated: 3,
        finalScore: 18900,
        enemiesKilled: 214,
        bossesKilled: 2,
        remainingLives: 0,
        gameDurationSeconds: 1320,
        runId: 'qa-fixture-gameover',
        gameVersion: 'qa-fixture',
        scoreVersion: 1,
        isPersonalBest: false,
        breakdown: {
          killScore: 3100,
          waveBonus: 8500,
          bossBonus: 1000,
          livesBonus: 0,
          baseScore: 12600,
          difficultyMultiplier: 1.5,
          finalScore: 18900
        }
      };
      game.scene.start('Preload', { stage: 'gameplay', destination: 'GameOver', data } satisfies LoadingRequest);
      return;
    }
    startGameFixture(game, request.state);
  };

  game.events.on('step', enterRequestedState);
}

function startGameFixture(game: Phaser.Game, state: QAState): void {
  const scene = game.scene.getScene(GAME_SCENE_KEY) as Phaser.Scene;
  if (!isGameQAState(state)) return;
  scene.events.once('create', () => {
    scene.events.emit('qa:action', { type: 'seed', state } satisfies QAAction);
  });
  game.scene.start('Preload', { stage: 'gameplay', destination: 'Game', data: { difficulty: 'medium', playerName: 'QA Warden' } } satisfies LoadingRequest);
}

function isQAState(value: string | null): value is QAState {
  return QA_STATES.some((state) => state === value);
}

function isGameQAState(value: QAState): value is GameQAState {
  return GAME_QA_STATES.some((state) => state === value);
}

function sendGameAction(game: Phaser.Game, action: QAAction): void {
  if (!game.scene.isActive(GAME_SCENE_KEY)) return;
  game.scene.getScene(GAME_SCENE_KEY).events.emit('qa:action', action);
}

function navigateToQAState(state: QAState): void {
  const params = new URLSearchParams({ qa: state });
  if (state === 'leaderboard') params.set('fixture', 'empty');
  window.location.search = params.toString();
}

function navigateToLeaderboardFixture(fixture: LeaderboardFixture): void {
  const params = new URLSearchParams({ qa: 'leaderboard', fixture });
  window.location.search = params.toString();
}

function installFixtureNetwork(request: QARequest): void {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input.toString() : input.url,
      window.location.origin
    );
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (url.pathname === '/api/leaderboard') {
      if (request.leaderboardFixture === 'failure') {
        return new Response(JSON.stringify({ error: { code: 'QA_OFFLINE', message: 'QA fixture forced API failure.' } }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ scores: [], scoreVersion: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (url.pathname === '/api/scores' && method === 'POST') {
      return new Response(JSON.stringify({ error: { code: 'QA_SUBMISSION_BLOCKED', message: 'QA fixtures are never submitted.' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return realFetch(input, init);
  };
}

interface QAPanel {
  root: HTMLElement;
  onStateChange(callback: (state: QAState) => void): void;
  onLeaderboardFixtureChange(callback: (fixture: LeaderboardFixture) => void): void;
  onAction(callback: (action: QAAction) => void): void;
  setStatus(text: string): void;
  setGameActive(active: boolean): void;
}

function createPanel(request: QARequest): QAPanel {
  const root = document.createElement('details');
  root.open = false;
  root.setAttribute('aria-label', 'Development QA controls');
  Object.assign(root.style, {
    position: 'fixed',
    right: '12px',
    bottom: '12px',
    zIndex: '1000',
    maxWidth: 'min(380px, calc(100vw - 24px))',
    color: '#f3ebdd',
    background: 'rgba(10, 14, 18, 0.97)',
    border: '1px solid #d7aa4e',
    borderRadius: '4px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
    font: '12px Inter, system-ui, sans-serif'
  });

  const summary = document.createElement('summary');
  summary.textContent = `DEV QA · ${fixtureLabel(request)}`;
  Object.assign(summary.style, { cursor: 'pointer', padding: '8px 10px', color: '#f0cd72', fontWeight: '700' });
  root.appendChild(summary);

  const content = document.createElement('div');
  Object.assign(content.style, { padding: '0 10px 10px', display: 'grid', gap: '8px', minWidth: '260px' });
  root.appendChild(content);

  const readout = document.createElement('output');
  readout.setAttribute('aria-live', 'polite');
  readout.textContent = request.state === 'leaderboard'
    ? request.leaderboardFixture === 'failure' ? 'Fixture: forced API failure; submissions are blocked.' : 'Fixture: empty leaderboard; submissions are blocked.'
    : request.state === 'gameover' ? 'Fixture: seeded Game Over; score submission is blocked.' : 'Waiting for the requested scene.';
  Object.assign(readout.style, { color: '#b7c0c7', lineHeight: '1.5' });
  content.appendChild(readout);

  const stateSelect = document.createElement('select');
  stateSelect.setAttribute('aria-label', 'QA fixture state');
  QA_STATES.forEach((state) => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    option.selected = state === request.state;
    stateSelect.appendChild(option);
  });
  styleControl(stateSelect);
  content.appendChild(stateSelect);

  const fixtureSelect = document.createElement('select');
  fixtureSelect.setAttribute('aria-label', 'Leaderboard QA fixture');
  for (const [value, label] of [['empty', 'Leaderboard: empty'], ['failure', 'Leaderboard: API failure']] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    option.selected = (request.leaderboardFixture ?? 'empty') === value;
    fixtureSelect.appendChild(option);
  }
  styleControl(fixtureSelect);
  fixtureSelect.hidden = request.state !== 'leaderboard';
  content.appendChild(fixtureSelect);

  const actions = document.createElement('div');
  Object.assign(actions.style, { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' });
  content.appendChild(actions);
  const actionButtons: HTMLButtonElement[] = [];
  const addAction = (label: string, action: QAAction) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.qaAction = action.type;
    styleControl(button);
    actions.appendChild(button);
    actionButtons.push(button);
    return button;
  };
  addAction('Pause / Resume', { type: 'toggle-pause' });
  addAction('Cycle Speed', { type: 'cycle-speed' });
  addAction('Start Wave', { type: 'start-wave' });
  const rewardButton = addAction('Grant Gold Cache', { type: 'grant-powerup', id: 'gold_rush' });
  rewardButton.dataset.qaPowerup = 'gold_rush';
  const meteorButton = addAction('Grant Meteor', { type: 'grant-powerup', id: 'meteor_strike' });
  meteorButton.dataset.qaPowerup = 'meteor_strike';
  addAction('Fresh Run', { type: 'restart' });

  let actionCallback: ((action: QAAction) => void) | null = null;
  for (const button of actionButtons) {
    button.addEventListener('click', () => {
      const action = actionForButton(button);
      if (action) actionCallback?.(action);
    });
  }

  return {
    root,
    onStateChange(callback) { stateSelect.addEventListener('change', () => callback(stateSelect.value as QAState)); },
    onLeaderboardFixtureChange(callback) { fixtureSelect.addEventListener('change', () => callback(fixtureSelect.value as LeaderboardFixture)); },
    onAction(callback) { actionCallback = callback; },
    setStatus(text) { readout.textContent = text; },
    setGameActive(active) {
      actionButtons.forEach((button) => { button.disabled = !active; });
      if (!active && !['leaderboard', 'gameover'].includes(request.state)) {
        readout.textContent = 'Game controls are available when the Game scene is active.';
      }
    }
  };
}

function actionForButton(button: HTMLButtonElement): QAAction | null {
  switch (button.dataset.qaAction) {
    case 'toggle-pause': return { type: 'toggle-pause' };
    case 'cycle-speed': return { type: 'cycle-speed' };
    case 'start-wave': return { type: 'start-wave' };
    case 'grant-powerup': return { type: 'grant-powerup', id: (button.dataset.qaPowerup ?? 'gold_rush') as PowerUpId };
    case 'restart': return { type: 'restart' };
    default: return null;
  }
}

function styleControl(control: HTMLButtonElement | HTMLSelectElement): void {
  Object.assign(control.style, {
    minHeight: '34px',
    padding: '6px 8px',
    color: '#f3ebdd',
    background: '#19232d',
    border: '1px solid #445564',
    borderRadius: '3px',
    font: '12px Inter, system-ui, sans-serif',
    textAlign: 'left'
  });
}

function fixtureLabel(request: QARequest): string {
  if (request.state === 'leaderboard') return `leaderboard / ${request.leaderboardFixture}`;
  return request.state;
}
