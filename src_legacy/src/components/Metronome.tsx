import { useState, useEffect, useRef, useCallback } from 'react';

interface MetronomeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Metronome({ isOpen, onClose }: MetronomeProps) {
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState(4);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

  const playClick = useCallback((accent: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = accent ? 1000 : 700;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    if (isRunning) {
      const interval = 60000 / bpm;
      let beat = 0;
      
      intervalRef.current = window.setInterval(() => {
        playClick(beat % timeSignature === 0);
        setCurrentBeat(beat % timeSignature);
        beat++;
      }, interval);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentBeat(0);
    }
  }, [isRunning, bpm, timeSignature, playClick]);

  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...tapTimes.filter(t => now - t < 3000), now];
    setTapTimes(newTaps);
    
    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const detectedBpm = Math.round(60000 / avgInterval);
      if (detectedBpm >= 30 && detectedBpm <= 300) {
        setBpm(detectedBpm);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-72 panel p-4 z-50 slide-in-right">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f0ecf5]">⏱ Метроном</h3>
        <button onClick={onClose} className="text-[#8a8296] hover:text-[#ff2d1a]">✕</button>
      </div>

      {/* BPM Display */}
      <div className="text-center mb-4">
        <div className="font-chord text-4xl font-bold text-[#ff7a1a]">{bpm}</div>
        <div className="text-[10px] text-[#5a5466]">BPM</div>
      </div>

      {/* Beat indicators */}
      <div className="flex justify-center gap-2 mb-4">
        {Array.from({ length: timeSignature }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-75 ${
              isRunning && currentBeat === i
                ? i === 0 ? 'bg-[#ff2d1a] text-white scale-110' : 'bg-[#ff7a1a] text-white scale-105'
                : 'bg-[#1a1622] text-[#5a5466] border border-[#2a2433]'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* BPM Slider */}
      <div className="mb-4">
        <input
          type="range"
          min="30"
          max="300"
          value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[9px] text-[#5a5466] mt-1">
          <span>30</span>
          <span>300</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex-1 py-2 rounded text-sm font-bold ${
            isRunning ? 'btn-accent' : 'btn-metal'
          }`}
        >
          {isRunning ? '⏸ Стоп' : '▶ Старт'}
        </button>
        <button
          onClick={handleTap}
          className="btn-metal px-3 py-2 rounded text-sm"
          title="Нажми в ритм"
        >
          TAP
        </button>
      </div>

      {/* Time signature */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#5a5466]">Размер:</span>
        {[3, 4, 5, 6, 7].map(ts => (
          <button
            key={ts}
            onClick={() => setTimeSignature(ts)}
            className={`px-2 py-0.5 rounded text-[10px] font-chord ${
              timeSignature === ts
                ? 'bg-[#ff2d1a33] text-[#ff7a1a] border border-[#ff2d1a]'
                : 'bg-[#1a1622] text-[#8a8296] border border-[#2a2433]'
            }`}
          >
            {ts}/4
          </button>
        ))}
      </div>

      {/* Quick BPM presets */}
      <div className="flex items-center gap-1 mt-3">
        <span className="text-[10px] text-[#5a5466]">Пресеты:</span>
        {[60, 80, 100, 120, 140, 160, 180].map(preset => (
          <button
            key={preset}
            onClick={() => setBpm(preset)}
            className="px-1.5 py-0.5 rounded text-[9px] font-chord bg-[#1a1622] text-[#8a8296] border border-[#2a2433] hover:border-[#3a3445]"
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
