export type Place = "gate" | "council" | "teacher";
export type Interaction = "teacher" | "board" | "welcome";
export const places: {
  id: Place;
  title: string;
  description: string;
  spawn: string;
}[] = [
  {
    id: "gate",
    title: "School gate",
    description: "Courtyard · start your visit",
    spawn: "spawn_gate",
  },
  {
    id: "council",
    title: "High Council",
    description: "Whiteboard · learn about pull requests",
    spawn: "door_council",
  },
  {
    id: "teacher",
    title: "Bilik Cikgu",
    description: "Ustazah Juliana · say hello",
    spawn: "door_teacher",
  },
];
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
