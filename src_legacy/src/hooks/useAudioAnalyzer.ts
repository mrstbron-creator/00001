import { useRef, useCallback, useState } from 'react';

interface AudioAnalyzerState {
  isListening: boolean;
  currentChroma: number[];
  detectedChord: string | null;
  confidence: number;
  volume: number;
}

// Note names for chroma
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Chord templates (simplified Harte notation)
const CHORD_TEMPLATES: Record<string, number[]> = {
  'C':    [1,0,0,0,1,0,0,1,0,0,0,0],
  'Cm':   [1,0,0,1,0,0,0,1,0,0,0,0],
  'D':    [0,1,0,0,0,1,0,0,1,0,0,0],
  'Dm':   [0,1,0,0,1,0,0,0,1,0,0,0],
  'E':    [0,0,1,0,0,0,1,0,0,0,1,0],
  'Em':   [0,0,1,0,0,1,0,0,0,0,1,0],
  'F':    [0,0,0,1,0,0,0,1,0,0,0,1],
  'Fm':   [0,0,0,1,0,0,1,0,0,0,0,1],
  'G':    [1,0,0,0,0,1,0,0,0,1,0,0],
  'Gm':   [0,0,0,0,0,1,0,0,0,1,0,0],
  'A':    [0,0,0,1,0,0,0,0,1,0,0,1],
  'Am':   [1,0,0,0,1,0,0,0,0,1,0,0],
  'B':    [0,1,0,0,0,1,0,0,0,0,1,0],
  'Bm':   [0,0,1,0,0,0,1,0,0,0,0,1],
  'C7':   [1,0,0,0,1,0,0,1,0,0,1,0],
  'D7':   [0,1,0,0,0,1,0,0,1,0,0,1],
  'E7':   [0,0,1,0,0,0,1,0,0,1,1,0],
  'F7':   [1,0,0,1,0,0,0,1,0,0,0,1],
  'G7':   [1,0,0,0,0,1,0,0,1,1,0,0],
  'A7':   [0,0,0,1,0,0,1,0,1,0,0,1],
  'B7':   [0,1,0,0,1,1,0,0,0,0,1,0],
};

export function useAudioAnalyzer() {
  const [state, setState] = useState<AudioAnalyzerState>({
    isListening: false,
    currentChroma: new Array(12).fill(0),
    detectedChord: null,
    confidence: 0,
    volume: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const computeChroma = useCallback((frequencyData: Uint8Array, sampleRate: number): number[] => {
    const chroma = new Array(12).fill(0);
    const binSize = sampleRate / analyserRef.current!.fftSize;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const freq = i * binSize;
      if (freq < 60 || freq > 2000) continue; // Focus on guitar range
      
      const magnitude = frequencyData[i] / 255;
      if (magnitude < 0.1) continue;
      
      // Map frequency to pitch class
      const midi = 69 + 12 * Math.log2(freq / 440);
      const pitchClass = Math.round(midi) % 12;
      if (pitchClass >= 0 && pitchClass < 12) {
        chroma[pitchClass] += magnitude * magnitude; // Square for emphasis
      }
    }
    
    // Normalize
    const max = Math.max(...chroma);
    if (max > 0) {
      for (let i = 0; i < 12; i++) {
        chroma[i] /= max;
      }
    }
    
    return chroma;
  }, []);

  const matchChord = useCallback((chroma: number[]): { chord: string; confidence: number } => {
    let bestChord = 'Am';
    let bestScore = -Infinity;
    
    for (const [chordName, template] of Object.entries(CHORD_TEMPLATES)) {
      let score = 0;
      for (let i = 0; i < 12; i++) {
        score += chroma[i] * template[i];
      }
      // Penalize non-chord tones
      for (let i = 0; i < 12; i++) {
        if (template[i] === 0) {
          score -= chroma[i] * 0.3;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestChord = chordName;
      }
    }
    
    // Normalize confidence to 0-1
    const confidence = Math.min(1, Math.max(0, bestScore / 3));
    return { chord: bestChord, confidence };
  }, []);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(frequencyData);
    analyserRef.current.getByteTimeDomainData(timeData);
    
    // Compute volume (RMS)
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const val = (timeData[i] - 128) / 128;
      sum += val * val;
    }
    const volume = Math.sqrt(sum / timeData.length);
    
    // Compute chroma
    const chroma = computeChroma(frequencyData, audioContextRef.current.sampleRate);
    
    // Match chord
    const { chord, confidence } = matchChord(chroma);
    
    setState({
      isListening: true,
      currentChroma: chroma,
      detectedChord: volume > 0.02 ? chord : null,
      confidence: volume > 0.02 ? confidence : 0,
      volume: volume * 100,
    });
    
    rafRef.current = requestAnimationFrame(analyze);
  }, [computeChroma, matchChord]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);
      
      setState(prev => ({ ...prev, isListening: true }));
      analyze();
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    
    setState({
      isListening: false,
      currentChroma: new Array(12).fill(0),
      detectedChord: null,
      confidence: 0,
      volume: 0,
    });
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    noteNames: NOTE_NAMES,
  };
}
