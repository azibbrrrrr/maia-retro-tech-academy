import Phaser from "phaser";
import { places, teacher, type Interaction } from "../world/content";
import type { Bridge } from "./bridge";
import { characterTextures, decorate } from "./art";

export class Campus extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys = new Set<string>();
  private targets: {
    x: number;
    y: number;
    kind: Interaction;
    label: string;
  }[] = [];
  private nearest?: (typeof this.targets)[number];
  private lastReport = 0;
  constructor(private bridge: Bridge) {
    super("Campus");
  }

  preload() {
    this.load.tilemapTiledJSON("academy", "/maps/academy.json");
    this.load.image("tiles", "/assets/tiles.svg");
  }
  create() {
    const map = this.make.tilemap({ key: "academy" });
    const tiles = map.addTilesetImage("academy", "tiles")!;
    for (const name of ["ground", "floors", "walls"])
      map.createLayer(name, tiles, 0, 0)!;
    const collision = map.createLayer("collision", tiles, 0, 0)!;
    collision.setVisible(false).setCollisionByExclusion([-1]);
    characterTextures(this);
    decorate(this);
    const spawns = map.getObjectLayer("spawn_points")!.objects;
    const spawn = spawns.find((o) => o.name === "spawn_gate")!;
    this.player = this.physics.add
      .sprite(spawn.x!, spawn.y!, "explorer")
      .setOrigin(0.5, 0.8);
    this.player.setSize(18, 14).setOffset(15, 30).setCollideWorldBounds(true);
    this.player.setTint(
      [0xffffff, 0xe3f1e4, 0xe6e7ff][Math.floor(Math.random() * 3)],
    );
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.add.collider(this.player, collision);
    const anchor = map
      .getObjectLayer("npc_spawns")!
      .objects.find((o) => o.name === teacher.id)!;
    const npc = this.physics.add
      .staticSprite(anchor.x!, anchor.y!, "teacher")
      .setOrigin(0.5, 0.8);
    npc.setSize(22, 18).setOffset(13, 28).setDepth(anchor.y!);
    this.physics.add.collider(this.player, npc);
    this.add
      .text(anchor.x!, anchor.y! - 55, "Ustazah Juliana", {
        fontFamily: "monospace",
        fontSize: 12,
        color: "#fff4df",
        backgroundColor: "#67434e",
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(2000);
    this.targets.push({
      x: anchor.x!,
      y: anchor.y!,
      kind: "teacher",
      label: "Say hello to Ustazah Juliana",
    });
    for (const o of map.getObjectLayer("interaction_zones")!.objects) {
      this.targets.push({
        x: o.x!,
        y: o.y!,
        kind: o.type === "board" ? "board" : "welcome",
        label:
          o.type === "board"
            ? "Read the PR whiteboard"
            : "Read the welcome sign",
      });
    }
    for (const target of this.targets) {
      this.add
        .zone(target.x, target.y, 120, 100)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          if (
            !this.bridge.paused &&
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              target.x,
              target.y,
            ) < 150
          )
            this.bridge.onInteract(target.kind);
          this.bridge.focus();
        });
    }
    const keydown = (event: KeyboardEvent) => {
      if (this.bridge.paused || document.activeElement !== this.game.canvas)
        return;
      const key = event.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          "e",
        ].includes(key)
      ) {
        event.preventDefault();
        this.keys.add(key);
        if (key === "e" && !event.repeat) this.bridge.interact();
      }
    };
    const keyup = (event: KeyboardEvent) =>
      this.keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    const camera = this.cameras.main;
    camera
      .setBounds(0, 0, map.widthInPixels, map.heightInPixels)
      .startFollow(this.player, true, 1, 1);
    const resize = () => camera.setZoom(this.scale.width > 700 ? 0.85 : 0.72);
    resize();
    this.scale.on("resize", resize);
    this.bridge.visit = (id) => {
      const location = spawns.find(
        (o) => o.name === places.find((p) => p.id === id)!.spawn,
      )!;
      this.player.body!.reset(location.x!, location.y!);
      this.bridge.held.clear();
      this.keys.clear();
      this.report();
      this.bridge.focus();
    };
    this.bridge.zoom = (amount) =>
      camera.setZoom(Phaser.Math.Clamp(camera.zoom + amount, 0.5, 1.5));
    this.bridge.interact = () => {
      if (!this.bridge.paused && this.nearest)
        this.bridge.onInteract(this.nearest.kind);
    };
    this.bridge.focus = () => this.game.canvas.focus({ preventScroll: true });
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute(
      "aria-label",
      "Walkable academy. Use arrow keys or WASD to move, E to interact.",
    );
    const blur = () => {
      this.bridge.held.clear();
      this.keys.clear();
    };
    window.addEventListener("blur", blur);
    this.events.once("shutdown", () => {
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      this.scale.off("resize", resize);
      this.bridge.interact = () => {};
      this.bridge.visit = () => {};
      this.bridge.zoom = () => {};
    });
    this.report();
  }
  private report() {
    this.nearest = this.targets
      .filter(
        (t) =>
          Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y) <
          150,
      )
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) -
          Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y),
      )[0];
    const area =
      this.player.y < 510
        ? this.player.x < 760
          ? "High Council"
          : "Bilik Cikgu"
        : this.player.y < 640
          ? "Covered corridor"
          : "Dataran Akademi";
    this.bridge.onState({
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      area,
      nearby: this.nearest?.label ?? "",
      ready: true,
    });
  }
  update(time: number) {
    if (!this.player) return;
    const active =
      !this.bridge.paused &&
      (document.activeElement === this.game.canvas ||
        this.bridge.held.size > 0);
    if (this.bridge.paused) this.keys.clear();
    const pressed = (name: string) => (this.keys.has(name) ? 1 : 0);
    const held = (name: "left" | "right" | "up" | "down") =>
      this.bridge.held.has(name) ? 1 : 0;
    const x = active
      ? Math.max(pressed("d"), pressed("arrowright"), held("right")) -
        Math.max(pressed("a"), pressed("arrowleft"), held("left"))
      : 0;
    const y = active
      ? Math.max(pressed("s"), pressed("arrowdown"), held("down")) -
        Math.max(pressed("w"), pressed("arrowup"), held("up"))
      : 0;
    const direction = new Phaser.Math.Vector2(x, y).normalize().scale(190);
    this.player.setVelocity(direction.x, direction.y).setDepth(this.player.y);
    this.player
      .setTexture(
        (x || y) && Math.floor(time / 140) % 2 ? "explorer-step" : "explorer",
      )
      .setFlipX(x < 0);
    if (time - this.lastReport > 80) {
      this.report();
      this.lastReport = time;
    }
  }
}
