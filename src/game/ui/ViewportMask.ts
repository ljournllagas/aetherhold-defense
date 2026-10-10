import Phaser from 'phaser';
import type { Point, Rect } from './viewport.ts';

type FilterLists = NonNullable<Phaser.GameObjects.Container['filters']>;
type ExternalMaskController = ReturnType<FilterLists['external']['addMask']>;

/** Fixed screen-space clip for a world-root container, with Phaser 4 WebGL filtering and Canvas masking. */
export class ViewportMaskController {
  readonly source: Phaser.GameObjects.Graphics;
  private filterList: FilterLists['external'] | null = null;
  private filter: ExternalMaskController | null = null;
  private canvasMask: Phaser.Display.Masks.GeometryMask | null = null;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene, private readonly target: Phaser.GameObjects.Container, bounds: Rect) {
    this.source = scene.make.graphics({ x: 0, y: 0 }, false);
    this.refresh(bounds);
    target.enableFilters();
    const external = target.filters?.external;
    if (external) {
      this.filterList = external;
      this.filter = external.addMask(this.source, false, scene.cameras.main, 'world');
      this.filter.autoUpdate = false;
      this.filter.setGameObject(this.source);
    } else {
      this.canvasMask = new Phaser.Display.Masks.GeometryMask(scene, this.source);
      target.setMask(this.canvasMask);
    }
  }

  /** Redraws and refreshes the dynamic WebGL mask after a viewport change. */
  refresh(bounds: Rect): void {
    if (this.destroyed) return;
    this.source.clear().fillStyle(0xffffff, 1).fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.filter?.setGameObject(this.source);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.filter) this.filterList?.remove(this.filter, true);
    else if (this.canvasMask) this.target.clearMask(true);
    this.filter = null;
    this.filterList = null;
    this.canvasMask = null;
    this.source.destroy();
  }
}

/** Stops visually masked node hit areas from acting outside their fixed viewport. */
export function handleViewportPointerUp(
  bounds: Rect,
  point: Point,
  event: Pick<Phaser.Types.Input.EventData, 'stopPropagation'>,
  action: () => void
): boolean {
  event.stopPropagation();
  if (point.x < bounds.x || point.y < bounds.y || point.x >= bounds.x + bounds.width || point.y >= bounds.y + bounds.height) return false;
  action();
  return true;
}
