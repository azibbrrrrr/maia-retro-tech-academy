import Phaser from "phaser";
import type { SceneDefinition, Anchor } from "../world/scenes";
import type { DemoActor } from "../world/actors";

/** Disposable room graphics/static bodies; textures and visitor belong to Campus. */
export class RoomView {
  readonly objects: Phaser.GameObjects.GameObject[] = [];
  readonly solids: Phaser.Physics.Arcade.StaticGroup;
  readonly actors = new Map<string, Phaser.GameObjects.Sprite>();
  readonly colliders: Phaser.Physics.Arcade.Collider[] = [];
  teacher?: Phaser.GameObjects.Sprite;
  art?: Phaser.GameObjects.Image;
  constructor(
    private scene: Phaser.Scene,
    readonly definition: SceneDefinition,
    player: Phaser.Physics.Arcade.Sprite,
    registry: DemoActor[],
    interact: (anchor: Anchor) => void,
  ) {
    this.solids = scene.physics.add.staticGroup();
    const keep = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.objects.push(object);
      return object;
    };
    const { width, height } = definition.bounds;
    if (definition.id === "entrance")
      this.art = keep(
        scene.add.image(0, 0, "campus").setOrigin(0).setDepth(-10),
      );
    else {
      const g = keep(scene.add.graphics().setDepth(-10));
      g.fillStyle(0x303f44).fillRect(0, 0, width, height);
      g.lineStyle(1, 0x516267, 0.4);
      for (let x = 0; x < width; x += 48) g.lineBetween(x, 0, x, height);
      for (let y = 0; y < height; y += 48) g.lineBetween(0, y, width, y);
      for (const lane of definition.reservedLanes)
        g.fillStyle(0x52735f, 0.3).fillRect(
          lane.x,
          lane.y,
          lane.width,
          lane.height,
        );
      for (const solid of definition.solids) {
        g.fillStyle(0x7e8988).fillRect(
          solid.x,
          solid.y,
          solid.width,
          solid.height,
        );
        g.lineStyle(2, 0xc3cdcb).strokeRect(
          solid.x,
          solid.y,
          solid.width,
          solid.height,
        );
      }
      keep(
        scene.add
          .text(
            width / 2,
            55,
            `${definition.title}\nTEMPORARY NAVIGATION STUDY · DEMO / OFFLINE`,
            {
              fontFamily: "monospace",
              fontSize: 19,
              color: "#e8dcb8",
              align: "center",
            },
          )
          .setOrigin(0.5),
      );
    }
    for (const solid of definition.solids) {
      const zone = keep(
        scene.add
          .zone(solid.x, solid.y, solid.width, solid.height)
          .setOrigin(0),
      );
      scene.physics.add.existing(zone, true);
      this.solids.add(zone);
    }
    this.colliders.push(scene.physics.add.collider(player, this.solids));
    for (const portal of definition.portals) {
      const g = keep(scene.add.graphics().setDepth(1));
      g.fillStyle(0xe2ba57, 0.7).fillRect(
        portal.x,
        portal.y,
        portal.width,
        portal.height,
      );
      g.lineStyle(2, 0xffe9a4).strokeRect(
        portal.x,
        portal.y,
        portal.width,
        portal.height,
      );
      keep(
        scene.add
          .text(
            portal.x + portal.width / 2,
            portal.y + portal.height / 2,
            `↗ ${portal.label}\nE / TAP TRANSFER`,
            {
              fontFamily: "monospace",
              fontSize: definition.id === "entrance" ? 10 : 13,
              color: "#172b2a",
              align: "center",
              backgroundColor: "#e4c675",
            },
          )
          .setOrigin(0.5)
          .setDepth(2),
      );
    }
    for (const a of definition.anchors) {
      if (a.interaction === "teacher" || a.interaction === "welcome") continue;
      keep(
        scene.add.circle(a.point.x, a.point.y, 9, 0xf8d67f, 0.9).setDepth(1),
      );
      keep(
        scene.add
          .text(a.point.x, a.point.y + 13, a.label, {
            fontFamily: "monospace",
            fontSize: 12,
            color: "#fff3d3",
            backgroundColor: "#233735",
          })
          .setOrigin(0.5, 0)
          .setDepth(2),
      );
    }
    for (const npc of definition.npcs) {
      this.teacher = keep(
        scene.add
          .sprite(npc.point.x, npc.point.y, "medalist")
          .setOrigin(0.5, 0.94)
          .setScale(0.44)
          .setDepth(npc.point.y)
          .setName("Ustazah Juliana"),
      );
      const feet = keep(scene.add.zone(npc.point.x, npc.point.y - 1, 16, 9));
      scene.physics.add.existing(feet, true);
      this.colliders.push(scene.physics.add.collider(player, feet));
      keep(
        scene.add
          .text(npc.point.x, npc.point.y - 103, "Ustazah Juliana", {
            fontFamily: "monospace",
            fontSize: 13,
            color: "#fff4df",
            backgroundColor: "#67434e",
            padding: { x: 8, y: 5 },
          })
          .setOrigin(0.5)
          .setDepth(npc.point.y + 1),
      );
      const a = definition.anchors.find((a) => a.id === npc.approach)!;
      keep(
        scene.add
          .zone(npc.point.x, npc.point.y - 42, 100, 110)
          .setInteractive({ useHandCursor: true }),
      ).on("pointerdown", () => interact(a));
    }
    for (const actor of registry.filter(
      (a) => a.sceneId === definition.id && a.position,
    )) {
      const p = actor.position!;
      const sprite = keep(
        scene.add
          .sprite(p.x, p.y, "sprinter", 0)
          .setOrigin(0.5, 0.94)
          .setScale(0.36)
          .setTint(0xe2c271)
          .setDepth(p.y),
      );
      this.actors.set(actor.id, sprite);
      keep(
        scene.add
          .text(p.x, p.y - 78, actor.id.replace("demo-worker-", "DEMO "), {
            fontFamily: "monospace",
            fontSize: 10,
            color: "#fff0c4",
            backgroundColor: "#453e32",
          })
          .setOrigin(0.5)
          .setDepth(p.y + 1),
      );
      const feet = keep(scene.add.zone(p.x, p.y - 1, 16, 10));
      scene.physics.add.existing(feet, true);
      this.colliders.push(scene.physics.add.collider(player, feet));
    }
  }
  motion(reduced: boolean) {
    if (this.teacher) {
      if (reduced) this.teacher.stop().setFrame(0);
      else this.teacher.play("medalist-idle", true);
    }
  }
  destroy() {
    for (const collider of this.colliders) collider.destroy();
    this.solids.clear(false, false);
    this.solids.destroy();
    for (const object of this.objects) object.destroy();
  }
}
