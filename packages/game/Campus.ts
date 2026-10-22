import Phaser from "phaser";
import type { Bridge } from "./bridge";
import { FOOT_BODY } from "../world/scenes";
import {
  CAMPUS_ID,
  campusDefinition as fallbackCampus,
  pointToZone,
  type CampusAnchor,
  type CampusDefinition,
  type CampusZoneId,
} from "../world/unified-campus";
import {
  importCampus,
  type CampusTiledMap,
} from "../world/unified-campus-tiled";
import {
  createDemoActors,
  reserveUnifiedDemoActors,
} from "../world/unified-actors";
import { CameraRig } from "./CameraRig";
import { RoomView } from "./RoomView";

type Target = { anchor: CampusAnchor; distance: number };

export class Campus extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys = new Set<string>();
  private room!: RoomView;
  private definition: CampusDefinition = fallbackCampus;
  private rig!: CameraRig;
  private nearest?: Target;
  private lastFixture = "";
  private demoRegistry = reserveUnifiedDemoActors(createDemoActors(20));
  private selectedActor = "";
  private debugVisible = false;
  private artVisible = true;
  private overlay!: Phaser.GameObjects.Graphics;
  private lastReport = 0;
  private reducedMotion = false;
  private frameDeltas: number[] = [];
  private facing: "left" | "right" = "right";
  constructor(private bridge: Bridge) {
    super("Campus");
  }
  preload() {
    this.load.json("campus-map", "/maps/campus-unified.json");
    this.load.image("campus", "/assets/campus-unified.png");
    for (const name of ["sprinter", "medalist"])
      this.load.spritesheet(name, `/assets/${name}.webp`, {
        frameWidth: 192,
        frameHeight: 208,
      });
  }
  create() {
    const map = this.cache.json.get("campus-map") as CampusTiledMap | undefined;
    this.definition = map ? importCampus(map) : fallbackCampus;
    this.textures.get("campus").setFilter(Phaser.Textures.FilterMode.LINEAR);
    for (const name of ["sprinter", "medalist"]) {
      this.textures.get(name).setFilter(Phaser.Textures.FilterMode.NEAREST);
      if (!this.anims.exists(`${name}-idle`))
        this.anims.create({
          key: `${name}-idle`,
          frames: this.anims.generateFrameNumbers(name, { start: 0, end: 5 }),
          frameRate: 5,
          repeat: -1,
        });
      for (const [direction, start] of [
        ["right", 8],
        ["left", 16],
      ] as const)
        if (!this.anims.exists(`${name}-${direction}`))
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
    const spawn = this.definition.spawns.entry;
    this.player = this.physics.add
      .sprite(spawn.x, spawn.y, "sprinter")
      .setOrigin(FOOT_BODY.origin.x, FOOT_BODY.origin.y)
      .setScale(FOOT_BODY.scale)
      .play("sprinter-idle");
    this.player
      .setSize(FOOT_BODY.source.width, FOOT_BODY.source.height)
      .setOffset(FOOT_BODY.source.offsetX, FOOT_BODY.source.offsetY)
      .setCollideWorldBounds(true);
    this.physics.world.setBounds(
      0,
      0,
      this.definition.bounds.width,
      this.definition.bounds.height,
    );
    this.room = new RoomView(
      this,
      this.definition,
      this.player,
      this.demoRegistry,
      (anchor) => this.interactAnchor(anchor),
    );
    this.overlay = this.add.graphics().setDepth(10000);
    this.rig = new CameraRig(this, this.player, this.definition);
    this.rig.overview();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      this.reducedMotion = motion.matches;
      this.room.motion(this.reducedMotion);
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);
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
        if (event.repeat && !this.keys.has(key)) return;
        this.keys.add(key);
        if (key === "e" && !event.repeat) this.bridge.interact();
      }
    };
    const keyup = (event: KeyboardEvent) =>
      this.keys.delete(event.key.toLowerCase());
    const blur = () => this.clearInput();
    const visibility = () => {
      if (document.hidden) this.clearInput();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    const resize = () => this.rig.resize();
    this.scale.on("resize", resize);
    this.bridge.focus = () => this.game.canvas.focus({ preventScroll: true });
    this.bridge.visit = (alias) => {
      const zone = this.resolveZone(alias);
      if (zone) this.rig.focusZone(zone);
    };
    this.bridge.interact = () => {
      if (this.bridge.paused) return;
      this.findNearest();
      if (this.nearest) this.interactAnchor(this.nearest.anchor);
    };
    this.bridge.zoom = (amount) => this.rig.zoom(amount);
    this.bridge.pan = (x, y) => this.rig.pan(x, y);
    this.bridge.cameraMode = (mode) => {
      if (mode === "overview") this.rig.overview();
      else if (mode === "player") this.rig.followPlayer();
      else if (mode === "free") this.rig.free();
      else this.rig.followAgent(this.room.actors.get(this.selectedActor));
      this.report();
      this.bridge.focus();
    };
    this.bridge.focusZone = (zone) => {
      this.rig.focusZone(zone);
      this.report();
    };
    this.bridge.selectActor = (id) => {
      const actor = this.demoRegistry.find((candidate) => candidate.id === id);
      this.selectedActor = actor?.id ?? "";
      this.rig.followAgent(
        actor?.position ? this.room.actors.get(actor.id) : undefined,
      );
      this.report();
    };
    this.bridge.demoActors = (count) => {
      this.demoRegistry = reserveUnifiedDemoActors(createDemoActors(count));
      if (!this.demoRegistry.some((actor) => actor.id === this.selectedActor))
        this.selectedActor = this.demoRegistry[0]?.id ?? "";
      this.rebuildActors();
      this.report();
    };
    this.bridge.debug = () => {
      this.debugVisible = !this.debugVisible;
      this.report();
    };
    this.bridge.art = () => {
      this.artVisible = !this.artVisible;
      this.room.art.setVisible(this.artVisible);
      this.report();
    };
    this.game.canvas.tabIndex = 0;
    this.game.canvas.setAttribute(
      "aria-label",
      "Walkable academy. Use arrow keys or WASD to move, E to interact.",
    );
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", syncMotion);
      this.scale.off("resize", resize);
      this.room.destroy();
      this.bridge.interact = () => {};
      this.bridge.visit = () => {};
      this.bridge.zoom = () => {};
      this.bridge.pan = () => {};
      this.bridge.cameraMode = () => {};
      this.bridge.focusZone = () => {};
      this.bridge.selectActor = () => {};
      this.bridge.demoActors = () => {};
      this.bridge.debug = () => {};
      this.bridge.art = () => {};
      this.bridge.focus = () => {};
    });
    this.report();
  }
  private resolveZone(alias: string): CampusZoneId | undefined {
    if (this.definition.zones.some((zone) => zone.id === alias))
      return alias as CampusZoneId;
    if (alias === "gate") return "entrance";
    if (alias === "council") return "high_council";
    if (alias === "teacher") return "cikgu_room";
    if (alias === "noc") return "watchtower";
  }
  private clearInput() {
    this.keys.clear();
    this.bridge.held.clear();
    this.player?.setVelocity(0);
  }
  private rebuildActors() {
    this.room.destroy();
    this.room = new RoomView(
      this,
      this.definition,
      this.player,
      this.demoRegistry,
      (anchor) => this.interactAnchor(anchor),
    );
    this.room.art.setVisible(this.artVisible);
    this.room.motion(this.reducedMotion);
    if (this.rig.mode === "agent")
      this.rig.followAgent(this.room.actors.get(this.selectedActor));
  }
  private interactAnchor(anchor: CampusAnchor) {
    if (
      this.bridge.paused ||
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        anchor.point.x,
        anchor.point.y,
      ) > 76
    )
      return;
    this.nearest = { anchor, distance: 0 };
    this.lastFixture = anchor.label;
    this.report();
    const npc = this.definition.npcs.find(
      (candidate) => candidate.approach === anchor.id,
    );
    const zoneId = anchor.zoneId;
    this.bridge.onInteract(anchor.interaction ?? "fixture", {
      campusId: CAMPUS_ID,
      zoneId,
      sceneId: zoneId,
      label: anchor.label,
      point: anchor.point,
      speaker: npc
        ? { x: npc.point.x, y: npc.point.y - 82 }
        : { x: anchor.point.x, y: anchor.point.y - 16 },
    });
    if (anchor.interaction !== "board") this.bridge.focus();
  }
  private findNearest() {
    const p = { x: this.player.x, y: this.player.y };
    this.nearest = this.definition.anchors
      .filter((anchor) => anchor.interaction)
      .map((anchor) => ({
        anchor,
        distance: Phaser.Math.Distance.Between(
          p.x,
          p.y,
          anchor.point.x,
          anchor.point.y,
        ),
      }))
      .filter((target) => target.distance <= 76)
      .sort((a, b) => a.distance - b.distance)[0];
  }
  private drawOverlay() {
    const g = this.overlay;
    g.clear();
    if (!this.debugVisible) return;
    for (const solid of this.definition.solids)
      g.lineStyle(2, 0xff5970).strokeRect(
        solid.x,
        solid.y,
        solid.width,
        solid.height,
      );
    for (const anchor of this.definition.anchors)
      g.lineStyle(2, 0x67d9ff).strokeCircle(anchor.point.x, anchor.point.y, 16);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    g.lineStyle(2, 0xffffff).strokeRect(
      body.x,
      body.y,
      body.width,
      body.height,
    );
  }
  private report() {
    if (!this.player || !this.room || !this.rig) return;
    this.findNearest();
    const zoneId =
      pointToZone(this.definition, { x: this.player.x, y: this.player.y }) ??
      "entrance";
    const zone = this.definition.zones.find(
      (candidate) => candidate.id === zoneId,
    )!;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const teacher = this.room.teacher;
    this.bridge.onState({
      campusId: CAMPUS_ID,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      sceneId: zoneId,
      zoneId,
      area: zone.title,
      nearby: this.nearest?.anchor.label ?? "",
      fixture: this.lastFixture,
      ready: true,
      transitioning: false,
      camera: this.rig.state(),
      selectedActor: this.selectedActor,
      debug: this.debugVisible,
      art: this.artVisible,
      actors: this.demoRegistry,
      visibleActors: this.room.actors.size,
      body: this.debugVisible
        ? {
            width: body.width,
            height: body.height,
            left: body.x - this.player.x,
            top: body.y - this.player.y,
            right: body.right - this.player.x,
            bottom: body.bottom - this.player.y,
          }
        : undefined,
      teacher: teacher
        ? {
            x: teacher.x,
            y: teacher.y,
            frame: Number(teacher.frame.name),
            count: 1,
          }
        : undefined,
      performance: {
        frameMs:
          this.frameDeltas.reduce((sum, value) => sum + value, 0) /
          (this.frameDeltas.length || 1),
        transitionMs: 0,
        textures: ["campus", "sprinter", "medalist"].map((key) => {
          const texture = this.textures.get(key),
            source = texture.getSourceImage() as HTMLImageElement;
          return {
            key,
            width: source.width,
            height: source.height,
            bytes: source.width * source.height * 4,
            filter:
              texture.source[0].scaleMode === Phaser.Textures.FilterMode.LINEAR
                ? "linear"
                : "nearest",
          };
        }),
        objects: this.children.length,
        staticBodies: this.physics.world.staticBodies.size,
      },
    });
  }
  update(_time: number, delta: number) {
    if (!this.player) return;
    this.frameDeltas.push(delta);
    if (this.frameDeltas.length > 120) this.frameDeltas.shift();
    const active =
      !this.bridge.paused &&
      (document.activeElement === this.game.canvas ||
        this.bridge.held.size > 0);
    if (this.bridge.paused) this.clearInput();
    const pressed = (key: string) => (this.keys.has(key) ? 1 : 0);
    const held = (key: "left" | "right" | "up" | "down") =>
      this.bridge.held.has(key) ? 1 : 0;
    const x = active
      ? Math.max(pressed("d"), pressed("arrowright"), held("right")) -
        Math.max(pressed("a"), pressed("arrowleft"), held("left"))
      : 0;
    const y = active
      ? Math.max(pressed("s"), pressed("arrowdown"), held("down")) -
        Math.max(pressed("w"), pressed("arrowup"), held("up"))
      : 0;
    const velocity = new Phaser.Math.Vector2(x, y).normalize().scale(190);
    this.player.setVelocity(velocity.x, velocity.y).setDepth(this.player.y);
    if (x) this.facing = x < 0 ? "left" : "right";
    if (!x && !y && this.reducedMotion) this.player.stop().setFrame(0);
    else
      this.player.play(
        x || y ? `sprinter-${this.facing}` : "sprinter-idle",
        true,
      );
    this.drawOverlay();
    if (_time - this.lastReport > 40) {
      this.report();
      this.lastReport = _time;
    }
  }
}
