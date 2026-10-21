import { sceneCatalog, sceneIds, type SceneId } from "./scenes";
export type Place = SceneId | "gate" | "council" | "teacher";
export type Interaction = "teacher" | "board" | "welcome" | "fixture";
export const places = sceneIds.map((id) => ({
  id: (id === "entrance" ? "gate" : id) as Place,
  title:
    id === "entrance"
      ? "School gate"
      : id === "high_council"
        ? "High Council"
        : sceneCatalog[id].title,
  description:
    id === "entrance"
      ? "Courtyard · start your visit"
      : "Temporary navigation study · DEMO / OFFLINE",
}));
export const teacher = {
  id: "npc_cikgu",
  type: "Npc",
  name: "Ustazah Juliana",
  behavior: "stationary",
  agentId: null,
  workspace: null,
  canAcceptTask: false,
  dialogue: [
    "Awak dah makan belum?",
    "Jangan kerja sampai lupa rehat.",
    "Belajar sikit-sikit, lama-lama jadi pandai.",
    "Semangat! Jumpa lagi di Bilik Cikgu ♡",
  ],
} as const;
