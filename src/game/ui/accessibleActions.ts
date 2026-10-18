import type Phaser from 'phaser';
import type { Rect } from './viewport.ts';

/** One canvas control mirrored by a real DOM button. */
export interface AccessibleAction extends Rect {
  label: string;
  action: () => void;
  disabled?: boolean;
}

export interface AccessibleActionLayer {
  /** Add a control created after mount (e.g. an async menu action). */
  add(action: AccessibleAction): void;
  /** Replace every mirrored control, e.g. after a layout change or a redraw. */
  set(actions: readonly AccessibleAction[]): void;
  destroy(): void;
}

const HOST_ID = 'game-root';

/**
 * Keyboard and assistive-technology layer for canvas menu actions. Each action
 * becomes a real `<button>` over its canvas control with a synchronized label.
 * Buttons are transparent and pointer-transparent, so mouse/touch keeps the
 * canvas press/release behaviour while keyboard focus and activation still work.
 * Removed on scene shutdown; no-op without a DOM.
 */
export function mountAccessibleActions(
  scene: Phaser.Scene,
  initial: readonly AccessibleAction[] = []
): AccessibleActionLayer | null {
  if (typeof document === 'undefined') return null;
  const host = document.getElementById(HOST_ID);
  if (!host) return null;

  const root = document.createElement('div');
  root.className = 'a11y-actions';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Main menu actions');
  const entries: Array<{ button: HTMLButtonElement; action: AccessibleAction }> = [];

  const position = (): void => {
    const canvas = scene.game.canvas.getBoundingClientRect();
    const hostBox = host.getBoundingClientRect();
    const sx = canvas.width / scene.scale.width;
    const sy = canvas.height / scene.scale.height;
    for (const { button, action } of entries) {
      Object.assign(button.style, {
        left: `${canvas.left - hostBox.left + action.x * sx}px`,
        top: `${canvas.top - hostBox.top + action.y * sy}px`,
        width: `${action.width * sx}px`,
        height: `${action.height * sy}px`
      });
    }
  };

  const add = (action: AccessibleAction): void => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'a11y-action';
    button.textContent = action.label;
    button.setAttribute('aria-label', action.label);
    button.disabled = action.disabled === true;
    button.addEventListener('click', () => { if (!button.disabled) action.action(); });
    entries.push({ button, action });
    root.appendChild(button);
    position();
  };

  for (const action of initial) add(action);
  host.appendChild(root);
  position();
  scene.scale.on('resize', position);

  const set = (actions: readonly AccessibleAction[]): void => {
    entries.length = 0;
    root.replaceChildren();
    for (const action of actions) add(action);
  };

  const destroy = (): void => {
    scene.scale.off('resize', position);
    root.remove();
  };
  scene.events.once('shutdown', destroy);
  return { add, set, destroy };
}
