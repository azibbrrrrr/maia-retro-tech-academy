import Phaser from "phaser";
import { places, teacher, type Interaction } from "../world/content";
import type { Bridge } from "./bridge";

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
  private facing: "left" | "right" = "right";
  constructor(private bridge: Bridge) {
    super("Campus");
  }

  preload() {
    this.load.tilemapTiledJSON("academy", "/maps/academy.json");
    this.load.image("campus", "/assets/campus.png");
    for (const name of ["sprinter", "medalist"]) {
      this.load.spritesheet(name, `/assets/${name}.webp`, {
        frameWidth: 192,
        frameHeight: 208,
      });
    }
  }
  create() {
    const map = this.make.tilemap({ key: "academy" });
    const worldWidth = 1672,
      worldHeight = 941;
    this.add.image(0, 0, "campus").setOrigin(0).setDepth(-1);
    for (const name of ["sprinter", "medalist"]) {
      this.anims.create({
        key: `${name}-idle`,
        frames: this.anims.generateFrameNumbers(name, { start: 0, end: 5 }),
        frameRate: 5,
        repeat: -1,
      });
      for (const [direction, start] of [
        ["right", 8],
        ["left", 16],
      ] as const) {
        this.anims.create({
          key: `${name}-${direction}`,
          frames: this.anims.generateFrameNumbers(name, {
            start,
            end: start + 7,
          }),
          frameRate: 9,
          repeat: -1,
        });
      }
    }
    const collision = this.physics.add.staticGroup();
    for (const o of map.getObjectLayer("collision")!.objects) {
      const solid = this.add.zone(o.x!, o.y!, o.width!, o.height!).setOrigin(0);
      this.physics.add.existing(solid, true);
      collision.add(solid);
    }
    const spawns = map.getObjectLayer("spawn_points")!.objects;
    const spawn = spawns.find((o) => o.name === "spawn_gate")!;
    this.player = this.physics.add
      .sprite(spawn.x!, spawn.y!, "sprinter")
      .setOrigin(0.5, 0.94)
      .setScale(0.44)
      .play("sprinter-idle");
    // Frame-space foot rectangle scales to 14 × 8 world pixels.
    this.player.setSize(32, 18).setOffset(80, 184).setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.add.collider(this.player, collision);
    const anchor = map
      .getObjectLayer("npc_spawns")!
      .objects.find((o) => o.name === teacher.id)!;
    const npc = this.add
      .sprite(anchor.x!, anchor.y!, "medalist")
      .setOrigin(0.5, 0.94)
      .setScale(0.44)
      .setDepth(anchor.y!)
      .play("medalist-idle");
    // A separate foot zone avoids static-body origin/scale drift during idle animation.
    const npcFeet = this.add.zone(anchor.x!, anchor.y! - 1, 16, 9);
    this.physics.add.existing(npcFeet, true);
    this.physics.add.collider(this.player, npcFeet);
    npc.setName("Ustazah Juliana");
    this.add
      .text(anchor.x!, anchor.y! - 103, "Ustazah Juliana", {
        fontFamily: "monospace",
        fontSize: 13,
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
    camera.setBounds(0, 0, worldWidth, worldHeight);
    const resize = () => {
      const desktop = this.scale.width >= 1000;
      const zoom = desktop
        ? Math.max(
            this.scale.width / worldWidth,
            this.scale.height / worldHeight,
          )
        : Math.max(
            this.scale.width < 700 ? 1.15 : 0.9,
            this.scale.height / worldHeight,
          );
      camera.setZoom(zoom);
      // Bounds keep the complete 16:9 composition fixed when it fits.
      // On other aspect ratios follow the explorer into the cropped edges.
      camera.startFollow(this.player, true, 1, 1);
    };
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
    this.bridge.focus();
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
      this.player.y < 325
        ? this.player.x < 790
          ? "High Council"
          : this.player.x > 880
            ? "Bilik Cikgu"
            : "Covered corridor"
        : this.player.y < 490
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
    if (x) this.facing = x < 0 ? "left" : "right";
    this.player.play(
      x || y ? `sprinter-${this.facing}` : "sprinter-idle",
      true,
    );
    if (time - this.lastReport > 80) {
      this.report();
      this.lastReport = time;
    }
  }
}
