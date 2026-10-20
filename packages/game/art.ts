import Phaser from "phaser";

// Original editable pixel primitives. No external sprites or reference images.
export function characterTextures(scene: Phaser.Scene) {
  const draw = (key: string, teacher: boolean, step: number) => {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const r = (x: number, y: number, w: number, h: number, color: number) =>
      g.fillStyle(color).fillRect(x, y, w, h);
    r(12, 39, 25, 5, 0x465345);
    r(16, 32, 7, 9 + step, 0x2a3538);
    r(27, 32, 7, 9 - step, 0x2a3538);
    r(14, 19, 22, teacher ? 20 : 15, teacher ? 0xcb8294 : 0x253c53);
    if (teacher) {
      r(12, 32, 26, 7, 0xae697f);
      r(16, 24, 18, 2, 0xe7b1b6);
      r(12, 5, 26, 17, 0xddd8c1);
      r(15, 19, 20, 6, 0xe9e2d2);
    } else {
      r(14, 8, 22, 13, 0x332b28);
      r(29, 23, 6, 8, 0x57c2d0);
    }
    r(18, 11, 14, 13, 0xc89b73);
    r(20, 16, 2, 2, 0x332b28);
    r(28, 16, 2, 2, 0x332b28);
    r(23, 21, 4, 1, 0x9b604f);
    r(10, 25, 5, 9, 0xc89b73);
    r(36, 25, 4, 9, 0xc89b73);
    if (teacher) {
      r(33, 27, 8, 10, 0x274d3d);
      r(34, 28, 6, 2, 0xf5edd9);
    } else {
      r(13, 6, 24, 7, 0xdaa24d);
      r(10, 12, 28, 3, 0xdaa24d);
    }
    g.generateTexture(key, 48, 48);
    g.destroy();
  };
  draw("explorer", false, 0);
  draw("explorer-step", false, 2);
  draw("teacher", true, 0);
}

export function decorate(scene: Phaser.Scene) {
  const g = scene.add.graphics();
  const r = (x: number, y: number, w: number, h: number, c: number) =>
    g.fillStyle(c).fillRect(x, y, w, h);
  const text = (
    x: number,
    y: number,
    copy: string,
    size = 15,
    color = "#f5edd9",
  ) =>
    scene.add
      .text(x, y, copy, {
        fontFamily: "monospace",
        fontSize: size,
        color,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(2);
  // Clerestory windows and warm timber skirting.
  for (const x of [168, 552, 888, 1272]) {
    r(x, 150, 72, 40, 0x654d35);
    r(x + 5, 153, 62, 29, 0x8eb4ad);
    r(x + 33, 153, 4, 29, 0xe9d9b7);
    r(x + 5, 166, 62, 4, 0xe9d9b7);
  }
  for (const [x, y] of [
    [240, 288],
    [480, 288],
    [912, 288],
    [1248, 336],
  ]) {
    r(x + 4, y + 8, 92, 44, 0x544735);
    r(x, y, 96, 40, 0x765438);
    r(x + 4, y + 4, 88, 28, 0xa57b4e);
    r(x + 12, y + 8, 24, 16, 0xe9d9b7);
    r(x + 15, y + 11, 16, 2, 0x788875);
    r(x + 64, y + 6, 20, 20, x < 800 ? 0x253c53 : 0xcb8294);
    if (x < 800) r(x + 67, y + 9, 14, 11, 0x57c2d0);
    r(x + 18, y + 48, 24, 20, 0x765438);
    r(x + 64, y + 48, 24, 20, 0x765438);
  }
  // Council whiteboard and teacher chalkboard.
  r(312, 160, 144, 72, 0x765438);
  r(318, 166, 132, 58, 0xf0e7ce);
  for (let i = 0; i < 3; i++) {
    r(328 + i * 40, 182, 31, 24, [0xdaa24d, 0x8eb4ad, 0xcb8294][i]);
    r(332 + i * 40, 188, 23, 2, 0x765438);
  }
  text(384, 172, "PR WHITEBOARD", 10, "#274d3d");
  r(1032, 155, 144, 72, 0x765438);
  r(1038, 161, 132, 58, 0x274d3d);
  text(1104, 182, "Selamat datang!", 13);
  text(1104, 204, "Belajar bersama ♡", 10);
  for (const [i, color] of [0xcb8294, 0xdaa24d, 0x57c2d0].entries()) {
    r(1280 + i * 24, 175, 20, 28, 0xe9d9b7);
    r(1284 + i * 24, 181, 12, 12, color);
  }
  // Corridor posts, planters and brick edges.
  for (const x of [112, 688, 784, 1392]) {
    r(x + 5, 500, 20, 106, 0x8b805f);
    r(x, 490, 24, 106, 0xe9d9b7);
    r(x - 4, 588, 32, 10, 0x765438);
  }
  r(96, 624, 1344, 8, 0x765438);
  for (const [x, y] of [
    [230, 785],
    [1230, 785],
    [470, 905],
  ]) {
    r(x + 5, y + 28, 104, 16, 0x4c5a42);
    r(x + 40, y - 5, 24, 65, 0x765438);
    r(x + 14, y - 60, 80, 68, 0x354f3c);
    r(x, y - 40, 110, 45, 0x354f3c);
    r(x + 18, y - 65, 65, 40, 0x81925a);
    r(x + 5, y - 35, 90, 22, 0x72864f);
    r(x + 30, y - 54, 16, 8, 0x9ba66a);
  }
  for (const x of [400, 1000]) {
    r(x, 740, 110, 16, 0x765438);
    r(x, 765, 110, 19, 0xa57b4e);
    r(x + 7, 781, 10, 16, 0x544735);
    r(x + 92, 781, 10, 16, 0x544735);
  }
  r(698, 830, 140, 64, 0x765438);
  r(704, 836, 128, 48, 0x274d3d);
  r(710, 894, 8, 28, 0x765438);
  r(820, 894, 8, 28, 0x765438);
  text(768, 851, "AKADEMI MAIA", 13);
  text(768, 870, "Selamat datang", 10);
  text(384, 123, "01   HIGH COUNCIL", 17, "#274d3d");
  text(1104, 123, "02   BILIK CIKGU", 17, "#274d3d");
  text(768, 562, "S E R A M B I   A K A D E M I", 15, "#5c5038");
  text(768, 696, "DATARAN AKADEMI", 17, "#f5edd9");
  text(1260, 955, "More classrooms, soon.", 12, "#e9d9b7");
  g.setDepth(1);
}
