import { campusDefinition, type CampusZoneId } from "./unified-campus";
export type Place = CampusZoneId | "gate" | "council" | "teacher" | "noc";
export type Interaction = "teacher" | "board" | "welcome" | "fixture";
const placeAliases: Partial<Record<CampusZoneId, Place>> = {
  entrance: "gate",
  high_council: "council",
  cikgu_room: "teacher",
};
const placeDescriptions: Record<CampusZoneId, string> = {
  entrance: "Open courtyard and academy welcome sign.",
  high_council: "Council table, seats, and PR board.",
  engineering_lab: "Sixteen workstations and the task board.",
  library: "Library shelves, reading table, and research board.",
  watchtower: "NOC racks, console, and status board.",
  qa_lab: "QA benches, cabinets, and test board.",
  kantin: "Serving counter and two dining tables.",
  cikgu_room: "Ustazah Juliana’s desk and visitor seat.",
};
export const places = campusDefinition.zones.map(({ id, title }) => ({
  id: placeAliases[id] ?? id,
  title: id === "entrance" ? "School gate" : title,
  description: placeDescriptions[id],
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
