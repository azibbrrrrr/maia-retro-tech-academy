import type { Interaction, Place } from "../world/content";

export type Direction = "up" | "down" | "left" | "right";
export type WorldState = {
  x: number;
  y: number;
  area: string;
  nearby: string;
  ready: boolean;
};
export type Bridge = {
  held: Set<Direction>;
  paused: boolean;
  onState: (state: WorldState) => void;
  onInteract: (interaction: Interaction) => void;
  interact: () => void;
  visit: (place: Place) => void;
  zoom: (amount: number) => void;
  focus: () => void;
};
