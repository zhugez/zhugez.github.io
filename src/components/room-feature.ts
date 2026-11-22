import type * as THREE from 'three';
import type { LedMode } from './room-lights';
import type { Gesture } from './room-character';

export type VinylState = { title: string; track: string; cur: number; dur: number; playing: boolean; muted: boolean; line?: string; words?: string[]; sung?: number; lyricKey?: string; lyricAt?: number; wordTimes?: number[]; lineEnd?: number };
export type DeckRemote = { toggle(): void; pause(): void; seek(seconds: number): void; restart(): void; mute(): void };

export type FeatureTarget = {
  object: THREE.Object3D;
  label: string;
  detail?: string;
  zone?: number;
  use?: () => string | void;
  hover?: () => string;
  action?: () => string;
  gesture?: () => Gesture | null;
};

export type FrameInfo = {
  now: number;
  dt: number;
  animate: boolean;
  playing: boolean;
  active: number;
  exploring: boolean;
  activity: string | null;
};

export type RoomContext = {
  readonly host: HTMLElement;
  readonly stage: HTMLElement;
  readonly screen: HTMLElement;
  readonly scene: THREE.Scene;
  readonly world: THREE.Group;
  readonly model: THREE.Group;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly base: URL;
  readonly accent: THREE.Color;
  readonly works: string[];
  readonly links: [string, string][];
  readonly shared: { ledMode: LedMode; vinyl: boolean; nowPlaying: string; lyric: string; deck?: DeckRemote };
  readonly player: THREE.Object3D;
  isLight(): boolean;
  still(): boolean;
  start(): void;
  walkTo(object: THREE.Object3D): void;
  carry(on: boolean): THREE.Object3D | undefined;
  gesture(name: Gesture): void;
  addTarget(target: FeatureTarget): void;
  keep(object: THREE.Object3D): void;
  showCard(label: string, note: string): void;
  reportVinyl(state: VinylState | null): void;
};

export type RoomFeature = {
  ready?(): void;
  frame?(info: FrameInfo): boolean;
  theme?(): void;
  activity?(name: string | null): void;
  dispose?(): void;
};

export type FeatureFactory = (ctx: RoomContext) => RoomFeature;
