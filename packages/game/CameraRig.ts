import Phaser from "phaser";
import type { CameraMode } from "./bridge";
import type { CampusDefinition, CampusZoneId } from "../world/unified-campus";

/** Camera actions preserve player coordinates and the persistent world. */
export class CameraRig {
  mode: CameraMode = "overview";
  private pinchDistance = 0;
  private fitZoom = 0.1;
  constructor(
    private scene: Phaser.Scene,
    private player: Phaser.GameObjects.Sprite,
    private campus: CampusDefinition,
  ) {
    scene.input.addPointer(2);
    scene.input.on(
      "wheel",
      (_p: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) =>
        this.zoom(-dy * 0.001),
    );
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const touches = scene.input.manager.pointers.filter(
        (item) => item.isDown && item.wasTouch,
      );
      if (touches.length >= 2) {
        const distance = Phaser.Math.Distance.Between(
          touches[0].x,
          touches[0].y,
          touches[1].x,
          touches[1].y,
        );
        if (this.pinchDistance)
          this.zoom((distance / this.pinchDistance - 1) * this.camera.zoom);
        this.pinchDistance = distance;
      } else if (pointer.isDown && this.mode === "free") {
        this.pan(
          -(pointer.x - pointer.prevPosition.x) / this.camera.zoom,
          -(pointer.y - pointer.prevPosition.y) / this.camera.zoom,
        );
      }
    });
    scene.input.on("pointerup", () => {
      this.pinchDistance = 0;
    });
    this.resize();
  }
  get camera() {
    return this.scene.cameras.main;
  }
  resize() {
    const { width, height } = this.campus.bounds;
    if (this.mode === "overview") this.camera.removeBounds();
    else this.camera.setBounds(0, 0, width, height);
    this.fitZoom = Math.min(
      this.scene.scale.width / width,
      this.scene.scale.height / height,
    );
    if (this.mode === "overview") this.overview();
    else
      this.camera.setZoom(
        Math.max(this.fitZoom, Math.min(this.camera.zoom, 2.2)),
      );
  }
  overview() {
    this.mode = "overview";
    this.camera.stopFollow();
    this.camera.removeBounds();
    this.resizeFit();
    this.camera.centerOn(
      this.campus.bounds.width / 2,
      this.campus.bounds.height / 2,
    );
  }
  followPlayer() {
    this.mode = "player";
    this.setCampusBounds();
    this.camera.startFollow(this.player, false, 1, 1);
    this.camera.setZoom(
      Math.max(this.fitZoom, Math.min(this.camera.zoom, 2.2)),
    );
  }
  free() {
    this.mode = "free";
    this.camera.stopFollow();
    this.setCampusBounds();
  }
  followAgent(target?: Phaser.GameObjects.Sprite) {
    this.mode = "agent";
    this.setCampusBounds();
    if (target) this.camera.startFollow(target, false, 1, 1);
    else this.camera.stopFollow();
  }
  focusZone(zoneId: CampusZoneId) {
    const zone = this.campus.zones.find((candidate) => candidate.id === zoneId);
    if (!zone) return;
    this.mode = "free";
    this.camera.stopFollow();
    this.setCampusBounds();
    const b = zone.focusBounds;
    const zoom = Math.min(
      this.scene.scale.width / b.width,
      this.scene.scale.height / b.height,
      1.6,
    );
    this.camera.setZoom(Math.max(this.fitZoom, zoom));
    this.camera.centerOn(b.x + b.width / 2, b.y + b.height / 2);
  }
  zoom(amount: number) {
    this.camera.setZoom(
      Phaser.Math.Clamp(this.camera.zoom + amount, this.fitZoom, 2.2),
    );
  }
  pan(x: number, y: number) {
    this.free();
    this.camera.scrollX += x;
    this.camera.scrollY += y;
  }
  private resizeFit() {
    this.camera.setZoom(Math.max(0.0001, this.fitZoom));
  }
  private setCampusBounds() {
    const { width, height } = this.campus.bounds;
    this.camera.setBounds(0, 0, width, height);
  }
  state() {
    const camera = this.camera;
    return {
      mode: this.mode,
      zoom: camera.zoom,
      x: camera.scrollX,
      y: camera.scrollY,
      width: camera.width,
      height: camera.height,
    };
  }
}
