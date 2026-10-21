import Phaser from "phaser";
import type { CameraMode } from "./bridge";
import type { SceneDefinition } from "../world/scenes";

/** Camera controls own no world bodies and never move the visitor. */
export class CameraRig {
  mode: CameraMode = "player";
  private pinchDistance = 0;
  private room!: SceneDefinition;
  constructor(
    private scene: Phaser.Scene,
    private player: Phaser.GameObjects.Sprite,
  ) {
    scene.input.addPointer(2);
    scene.input.on(
      "wheel",
      (_p: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) =>
        this.zoom(-dy * 0.001),
    );
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const touches = scene.input.manager.pointers.filter(
        (p) => p.isDown && p.wasTouch,
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
  }
  get camera() {
    return this.scene.cameras.main;
  }
  setRoom(room: SceneDefinition) {
    this.room = room;
    this.camera.setBounds(0, 0, room.bounds.width, room.bounds.height);
    this.resize();
    this.followPlayer();
  }
  resize() {
    if (!this.room) return;
    const { width, height } = this.room.bounds;
    this.camera.setZoom(
      Phaser.Math.Clamp(
        this.scene.scale.width >= 1000
          ? Math.max(
              this.scene.scale.width / width,
              this.scene.scale.height / height,
            )
          : 1.05,
        0.4,
        1.8,
      ),
    );
  }
  followPlayer() {
    this.mode = "player";
    this.camera.startFollow(this.player, false, 1, 1);
  }
  free() {
    this.mode = "free";
    this.camera.stopFollow();
  }
  followAgent(target?: Phaser.GameObjects.Sprite) {
    this.mode = "agent";
    if (target) this.camera.startFollow(target, false, 1, 1);
    else this.camera.stopFollow();
  }
  zoom(amount: number) {
    this.camera.setZoom(Phaser.Math.Clamp(this.camera.zoom + amount, 0.4, 1.8));
  }
  pan(x: number, y: number) {
    this.free();
    this.camera.scrollX += x;
    this.camera.scrollY += y;
  }
  state() {
    const c = this.camera;
    return {
      mode: this.mode,
      zoom: c.zoom,
      x: c.scrollX,
      y: c.scrollY,
      width: c.width,
      height: c.height,
    };
  }
}
