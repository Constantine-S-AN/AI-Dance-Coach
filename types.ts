export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks: Landmark[];
  poseWorldLandmarks: Landmark[];
}

export enum GameState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface GeminiConfig {
  model: string;
  systemInstruction: string;
  voiceName: string;
}

export interface AudioVisualizerData {
  volume: number;
}