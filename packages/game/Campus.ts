import Phaser from "phaser";
import type { Bridge } from "./bridge";
import {
  FOOT_BODY,
  resolvePlace,
  sceneIds,
  type SceneDefinition,
  type SceneId,
  type Point,
  type Anchor,
  type Portal,
} from "../world/scenes";
import { importScene } from "../world/tiled";
import { createDemoActors, reserveDemoWorkstations } from "../world/actors";
import { findRoute } from "../world/navigation";
import { CameraRig } from "./CameraRig";
import { RoomView } from "./RoomView";

type Target = {
  point: Point;
  label: string;
  anchor?: Anchor;
  portal?: Portal;
  distance: number;
};
export class Campus extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys = new Set<string>();
  private room!: RoomView;
  private catalog = {} as Record<SceneId, SceneDefinition>;
  private rig!: CameraRig;
  private nearest?: Target;
  private lastFixture = "";
  private demoRegistry = reserveDemoWorkstations(createDemoActors(0));
  private selectedActor = "";
  private debugVisible = false;
  private artVisible = true;
  private overlay!: Phaser.GameObjects.Graphics;
  private lastReport = 0;
  private lastRouteReport = 0;
  private debugRoute: Point[] | null = null;
  private reducedMotion = false;
  private transitioning = false;
  private transitionMs = 0;
  private frameDeltas: number[] = [];
  private facing: "left" | "right" = "right";
  private portalArmed = true;
  constructor(private bridge: Bridge) {
    super("Campus");
  }
  preload() {
    for (const id of sceneIds) this.load.json(id, `/maps/scenes/${id}.json`);
    this.load.image("campus", "/assets/campus.png");
    for (const name of ["sprinter", "medalist"])
      this.load.spritesheet(name, `/assets/${name}.webp`, {
        frameWidth: 192,
        frameHeight: 208,
      });
  }
  create() {
    for (const id of sceneIds)
      this.catalog[id] = importScene(this.cache.json.get(id));
    // Only the illustrated plate is filtered; sprite sheets retain crisp pixels.
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
    this.player = this.physics.add
      .sprite(836, 660, "sprinter")
      .setOrigin(FOOT_BODY.origin.x, FOOT_BODY.origin.y)
      .setScale(FOOT_BODY.scale)
      .play("sprinter-idle");
    this.player
      .setSize(FOOT_BODY.source.width, FOOT_BODY.source.height)
      .setOffset(FOOT_BODY.source.offsetX, FOOT_BODY.source.offsetY)
      .setCollideWorldBounds(true);
    this.overlay = this.add.graphics().setDepth(10000);
    this.rig = new CameraRig(this, this.player);
    this.loadRoom("entrance", "entry");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      this.reducedMotion = motion.matches;
      this.room.motion(this.reducedMotion);
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);
    const keydown = (event: KeyboardEvent) => {
      if (
        this.bridge.paused ||
        this.transitioning ||
        document.activeElement !== this.game.canvas
      )
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
        // A repeat after blur/pause/transfer belongs to the released old hold.
        // Require a fresh down edge before allowing it to move the visitor.
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
      const id = resolvePlace(alias);
      if (id) this.transition(id, "entry");
    };
    this.bridge.interact = () => {
      if (this.bridge.paused || this.transitioning) return;
      this.findNearest();
      if (this.nearest?.portal && this.portalArmed) {
        const p = this.nearest.portal;
        this.portalArmed = false;
        this.transition(p.targetScene, p.targetSpawn);
      } else if (this.nearest?.anchor) this.interactAnchor(this.nearest.anchor);
    };
    this.bridge.zoom = (amount) => this.rig.zoom(amount);
    this.bridge.pan = (x, y) => this.rig.pan(x, y);
    this.bridge.cameraMode = (mode) => {
      if (mode === "player") this.rig.followPlayer();
      else if (mode === "free") this.rig.free();
      else this.rig.followAgent(this.room.actors.get(this.selectedActor));
      this.report();
      this.bridge.focus();
    };
    this.bridge.selectActor = (id) => {
      this.selectedActor = this.demoRegistry.some((a) => a.id === id) ? id : "";
      this.rig.followAgent(this.room.actors.get(this.selectedActor));
      this.report();
    };
    this.bridge.demoActors = (count) => {
      // Explicitly selected mock populations only; demoRegistry survives room unloading.
      this.demoRegistry = reserveDemoWorkstations(createDemoActors(count));
      if (!this.demoRegistry.some((a) => a.id === this.selectedActor))
        this.selectedActor = this.demoRegistry[0]?.id ?? "";
      const p = { x: this.player.x, y: this.player.y };
      this.replaceRoom(this.room.definition.id);
      this.player.setPosition(p.x, p.y);
      (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
      if (this.rig.mode === "agent")
        this.rig.followAgent(this.room.actors.get(this.selectedActor));
      this.report();
    };
    this.bridge.debug = () => {
      this.debugVisible = !this.debugVisible;
      this.report();
    };
    this.bridge.art = () => {
      this.artVisible = !this.artVisible;
      this.room.art?.setVisible(this.artVisible);
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
      this.bridge.selectActor = () => {};
      this.bridge.demoActors = () => {};
      this.bridge.debug = () => {};
      this.bridge.art = () => {};
      this.bridge.focus = () => {};
    });
    this.report();
    this.bridge.focus();
  }
  private clearInput() {
    this.keys.clear();
    this.bridge.held.clear();
    this.player?.setVelocity(0);
  }
  private replaceRoom(id: SceneId) {
    this.room?.destroy();
    this.room = new RoomView(
      this,
      this.catalog[id],
      this.player,
      this.demoRegistry,
      (a) => this.interactAnchor(a),
    );
    this.room.art?.setVisible(this.artVisible);
    this.room.motion(this.reducedMotion);
    this.nearest = undefined;
    this.debugRoute = null;
    const b = this.room.definition.bounds;
    this.physics.world.setBounds(0, 0, b.width, b.height);
  }
  private loadRoom(id: SceneId, spawn: string) {
    this.replaceRoom(id);
    const p = this.room.definition.spawns[spawn];
    this.player.setPosition(p.x, p.y);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.reset(p.x, p.y);
    body.updateFromGameObject();
    this.rig.setRoom(this.room.definition);
    this.clearInput();
  }
  private transition(id: SceneId, spawn: string) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.clearInput();
    this.nearest = undefined;
    this.report();
    const start = performance.now(),
      duration = this.reducedMotion ? 1 : 140;
    this.cameras.main.fadeOut(duration, 0, 0, 0);
    this.time.delayedCall(duration, () => {
      this.loadRoom(id, spawn);
      this.portalArmed = false;
      this.cameras.main.fadeIn(duration, 0, 0, 0);
      this.time.delayedCall(duration, () => {
        this.transitioning = false;
        this.transitionMs = performance.now() - start;
        this.report();
        this.bridge.focus();
      });
    });
  }
  private interactAnchor(a: Anchor) {
    if (
      this.bridge.paused ||
      this.transitioning ||
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        a.point.x,
        a.point.y,
      ) > 76
    )
      return;
    this.nearest = { point: a.point, label: a.label, anchor: a, distance: 0 };
    // A shared approach can serve more than one fixture (council advisor /
    // supervisor); identify each authored station instead of hiding the alias.
    const labels = this.room.definition.anchors
      .filter(
        (other) => other.point.x === a.point.x && other.point.y === a.point.y,
      )
      .map((other) => other.label);
    this.lastFixture = labels.join(" / ");
    this.report();
    const npc = this.room.definition.npcs.find((n) => n.approach === a.id);
    this.bridge.onInteract(a.interaction ?? "fixture", {
      sceneId: this.room.definition.id,
      label: this.lastFixture,
      point: a.point,
      speaker: npc
        ? { x: npc.point.x, y: npc.point.y - 82 }
        : { x: a.point.x, y: a.point.y - 16 },
    });
    if (a.interaction !== "board") this.bridge.focus();
  }
  private findNearest() {
    const p = { x: this.player.x, y: this.player.y };
    const targets: Target[] = [
      ...this.room.definition.portals.map((portal) => ({
        point: portal.approach,
        label: `Transfer: ${portal.label}`,
        portal,
        distance: Phaser.Math.Distance.Between(
          p.x,
          p.y,
          portal.approach.x,
          portal.approach.y,
        ),
      })),
      ...this.room.definition.anchors
        .filter((a) => a.interaction)
        .map((anchor) => ({
          point: anchor.point,
          label: anchor.label,
          anchor,
          distance: Phaser.Math.Distance.Between(
            p.x,
            p.y,
            anchor.point.x,
            anchor.point.y,
          ),
        })),
    ];
    // Portals are activated at their marked approach, never by proximity alone.
    this.nearest = targets
      .filter((t) => t.distance <= (t.portal ? 64 : 76))
      .sort((a, b) => a.distance - b.distance)[0];
    if (
      !this.transitioning &&
      !this.keys.has("e") &&
      !this.room.definition.portals.some(
        (portal) =>
          Phaser.Math.Distance.Between(
            p.x,
            p.y,
            portal.x + portal.width / 2,
            portal.y + portal.height / 2,
          ) < 45,
      )
    )
      this.portalArmed = true;
  }
  private drawOverlay(time: number) {
    const g = this.overlay;
    g.clear();
    if (!this.debugVisible) return;
    const room = this.room.definition;
    for (const s of room.solids)
      g.lineStyle(2, 0xff5970).strokeRect(s.x, s.y, s.width, s.height);
    for (const lane of room.reservedLanes)
      g.lineStyle(2, 0x5ef0a7).strokeRect(
        lane.x,
        lane.y,
        lane.width,
        lane.height,
      );
    for (const a of room.anchors)
      g.lineStyle(2, 0x67d9ff).strokeCircle(a.point.x, a.point.y, 16);
    const goal = this.nearest?.point ?? room.portals[0]?.approach;
    if (goal && time - this.lastRouteReport > 250) {
      this.debugRoute = findRoute(
        room,
        { x: this.player.x, y: this.player.y },
        goal,
      );
      this.lastRouteReport = time;
    }
    const route = this.debugRoute;
    if (route) {
      g.lineStyle(3, 0xffdd6d).beginPath().moveTo(route[0].x, route[0].y);
      for (const p of route.slice(1)) g.lineTo(p.x, p.y);
      g.strokePath();
    }
    const b = this.player.body as Phaser.Physics.Arcade.Body;
    g.lineStyle(2, 0xffffff).strokeRect(b.x, b.y, b.width, b.height);
  }
  private report(fixture = this.lastFixture) {
    if (!this.player || !this.room) return;
    this.findNearest();
    const b = this.player.body as Phaser.Physics.Arcade.Body,
      npc = this.room.teacher;
    this.bridge.onState({
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
      sceneId: this.room.definition.id,
      area: this.room.definition.title,
      nearby: this.transitioning ? "" : (this.nearest?.label ?? ""),
      fixture,
      ready: !this.transitioning,
      transitioning: this.transitioning,
      camera: this.rig.state(),
      selectedActor: this.selectedActor,
      debug: this.debugVisible,
      art: this.artVisible,
      actors: this.demoRegistry,
      visibleActors: this.room.actors.size,
      body: this.debugVisible
        ? {
            width: b.width,
            height: b.height,
            left: b.x - this.player.x,
            top: b.y - this.player.y,
            right: b.right - this.player.x,
            bottom: b.bottom - this.player.y,
          }
        : undefined,
      teacher: npc
        ? { x: npc.x, y: npc.y, frame: Number(npc.frame.name), count: 1 }
        : undefined,
      performance: {
        frameMs:
          this.frameDeltas.reduce((a, b) => a + b, 0) /
          (this.frameDeltas.length || 1),
        transitionMs: this.transitionMs,
        textures: ["campus", "sprinter", "medalist"].map((key) => {
          const t = this.textures.get(key),
            s = t.getSourceImage() as HTMLImageElement;
          return {
            key,
            width: s.width,
            height: s.height,
            bytes: s.width * s.height * 4,
            filter:
              t.source[0].scaleMode === Phaser.Textures.FilterMode.LINEAR
                ? "linear"
                : "nearest",
          };
        }),
        objects: this.children.length,
        staticBodies: this.physics.world.staticBodies.size,
      },
    });
  }
  update(time: number, delta: number) {
    if (!this.player) return;
    this.frameDeltas.push(delta);
    if (this.frameDeltas.length > 120) this.frameDeltas.shift();
    const active =
      !this.bridge.paused &&
      !this.transitioning &&
      (document.activeElement === this.game.canvas ||
        this.bridge.held.size > 0);
    if (this.bridge.paused || this.transitioning) this.clearInput();
    const pressed = (key: string) => (this.keys.has(key) ? 1 : 0),
      held = (key: "left" | "right" | "up" | "down") =>
        this.bridge.held.has(key) ? 1 : 0;
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
    if (!x && !y && this.reducedMotion) this.player.stop().setFrame(0);
    else
      this.player.play(
        x || y ? `sprinter-${this.facing}` : "sprinter-idle",
        true,
      );
    this.drawOverlay(time);
    if (time - this.lastReport > 40) {
      this.report();
      this.lastReport = time;
    }
  }
}
