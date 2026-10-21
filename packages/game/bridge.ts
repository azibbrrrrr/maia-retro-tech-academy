import type { Interaction, Place } from "../world/content";
import type { DemoActor } from "../world/actors";
import type { SceneId } from "../world/scenes";

export type Direction = "up" | "down" | "left" | "right";
export type CameraMode = "player" | "free" | "agent";
export type WorldState = {
  x: number;
  y: number;
  sceneId: SceneId;
  area: string;
  nearby: string;
  fixture: string;
  ready: boolean;
  transitioning: boolean;
  camera: {
    mode: CameraMode;
    zoom: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selectedActor: string;
  debug: boolean;
  art: boolean;
  actors: DemoActor[];
  visibleActors: number;
  body?: {
    width: number;
    height: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  teacher?: { x: number; y: number; frame: number; count: number };
  performance: {
    frameMs: number;
    transitionMs: number;
    textures: {
      key: string;
      width: number;
      height: number;
      bytes: number;
      filter: string;
    }[];
    objects: number;
    staticBodies: number;
  };
};
export type SpeechAnchor = {
  sceneId: SceneId;
  label: string;
  point: { x: number; y: number };
  speaker: { x: number; y: number };
};
export type Bridge = {
  held: Set<Direction>;
  paused: boolean;
  onState: (state: WorldState) => void;
  onInteract: (interaction: Interaction, anchor?: SpeechAnchor) => void;
  interact: () => void;
  visit: (place: Place) => void;
  zoom: (amount: number) => void;
  cameraMode: (mode: CameraMode) => void;
  pan: (x: number, y: number) => void;
  selectActor: (id: string) => void;
  demoActors: (count: number) => void;
  debug: () => void;
  art: () => void;
  focus: () => void;
};
