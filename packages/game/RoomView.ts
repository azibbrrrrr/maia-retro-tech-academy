import Phaser from "phaser";
import type { CampusAnchor, CampusDefinition } from "../world/unified-campus";
import type { DemoActor } from "../world/unified-actors";

/** One persistent render and collision layer for the full academy. */
export class RoomView {
  readonly objects: Phaser.GameObjects.GameObject[] = [];
  readonly solids: Phaser.Physics.Arcade.StaticGroup;
  readonly actors = new Map<string, Phaser.GameObjects.Sprite>();
  readonly colliders: Phaser.Physics.Arcade.Collider[] = [];
  teacher?: Phaser.GameObjects.Sprite;
  art: Phaser.GameObjects.Image;
  constructor(
    private scene: Phaser.Scene,
    readonly definition: CampusDefinition,
    player: Phaser.Physics.Arcade.Sprite,
    registry: DemoActor[],
    interact: (anchor: CampusAnchor) => void,
  ) {
    const keep = <T extends Phaser.GameObjects.GameObject>(object: T): T => {
      this.objects.push(object);
      return object;
    };
    this.art = keep(
      scene.add
        .image(
          definition.background.imageToWorld.offsetX,
          definition.background.imageToWorld.offsetY,
          "campus",
        )
        .setOrigin(0)
        .setDisplaySize(definition.bounds.width, definition.bounds.height)
        .setDepth(-100),
    );
    this.solids = scene.physics.add.staticGroup();
    for (const solid of definition.solids) {
      const bodyZone = keep(
        scene.add
          .zone(solid.x, solid.y, solid.width, solid.height)
          .setOrigin(0),
      );
      scene.physics.add.existing(bodyZone, true);
      this.solids.add(bodyZone);
    }
    this.colliders.push(scene.physics.add.collider(player, this.solids));

    for (const anchor of definition.anchors) {
      if (anchor.kind === "workstation" || anchor.interaction === "board") {
        keep(
          scene.add
            .circle(anchor.point.x, anchor.point.y, 10, 0xf8d67f, 0.92)
            .setDepth(anchor.point.y + 1),
        );
        keep(
          scene.add
            .text(anchor.point.x, anchor.point.y + 13, anchor.label, {
              fontFamily: "monospace",
              fontSize: 12,
              color: "#fff3d3",
              backgroundColor: "#233735",
              padding: { x: 3, y: 1 },
            })
            .setOrigin(0.5, 0)
            .setDepth(anchor.point.y + 2),
        );
      }
      if (anchor.interaction && anchor.interaction !== "teacher") {
        const target = keep(
          scene.add
            .zone(anchor.point.x, anchor.point.y, 44, 44)
            .setInteractive({ useHandCursor: true }),
        );
        target.on("pointerdown", () => interact(anchor));
      }
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
      const anchor = definition.anchors.find((a) => a.id === npc.approach);
      if (anchor) {
        const hit = keep(
          scene.add
            .zone(npc.point.x, npc.point.y - 42, 100, 110)
            .setInteractive({ useHandCursor: true }),
        );
        hit.on("pointerdown", () => interact(anchor));
      }
    }

    for (const actor of registry.filter((a) => a.position)) {
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
    if (!this.teacher) return;
    if (reduced) this.teacher.stop().setFrame(0);
    else this.teacher.play("medalist-idle", true);
  }
  destroy() {
    for (const collider of this.colliders) collider.destroy();
    this.solids.clear(false, false);
    this.solids.destroy();
    for (const object of this.objects) object.destroy();
  }
}
