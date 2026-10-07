export interface ChordSegment {
  id: number;
  start: number;
  end: number;
  chord: string;
  confidence: number;
  bass: string;
}

export interface AppSettings {
  fftSize: number;
  hopSize: number;
  confidenceThreshold: number;
  chordVocabulary: string;
  gpuEnabled: boolean;
  modelType: string;
  bufferSize: number;
  audioDevice: string;
}
