import { useEffect, useRef, useCallback } from 'react';

interface PlayerProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onPlayToggle: () => void;
  onSeek: (time: number) => void;
  setCurrentTime: (time: number) => void;
}

export default function Player({
  isPlaying,
  currentTime,
  totalDuration,
  onPlayToggle,
  onSeek,
  setCurrentTime,
}: PlayerProps) {
  const intervalRef = useRef<number | null>(null);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  const tick = useCallback(() => {
    const next = currentTimeRef.current + 0.1;
    if (next >= totalDuration) {
      setCurrentTime(0);
    } else {
      setCurrentTime(next);
    }
  }, [totalDuration, setCurrentTime]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(tick, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, tick]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    onSeek(ratio * totalDuration);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-16 bg-[#0a0910] border-t border-[#1a1622] flex items-center px-4 gap-4">
      {/* Transport controls */}
      <div className="flex items-center gap-2">
        {/* Stop */}
        <button className="btn-metal w-8 h-8 rounded-full flex items-center justify-center" title="Стоп">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="1" y="1" width="8" height="8" fill="currentColor" rx="1"/>
          </svg>
        </button>
        
        {/* Play/Pause - Main button */}
        <button
          onClick={onPlayToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPlaying ? 'btn-accent glow-pulse' : 'btn-accent'
          }`}
          title={isPlaying ? 'Пауза' : 'Воспроизвести'}
        >
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 12 14">
              <rect x="1" y="1" width="3" height="12" fill="white" rx="1"/>
              <rect x="8" y="1" width="3" height="12" fill="white" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14">
              <path d="M2 1 L11 7 L2 13 Z" fill="white"/>
            </svg>
          )}
        </button>

        {/* Skip */}
        <button className="btn-metal w-8 h-8 rounded-full flex items-center justify-center" title="Следующий аккорд">
          <svg width="12" height="10" viewBox="0 0 12 10">
            <path d="M1 1 L7 5 L1 9 Z" fill="currentColor"/>
            <rect x="8" y="1" width="2" height="8" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Time display */}
      <div className="font-chord text-sm text-[#f0ecf5] min-w-[90px]">
        <span className="text-[#ff7a1a]">{formatTime(currentTime)}</span>
        <span className="text-[#5a5466]"> / {formatTime(totalDuration)}</span>
      </div>

      {/* Seek bar */}
      <div className="flex-1 h-2 bg-[#1a1622] rounded-full cursor-pointer relative group" onClick={handleSeek}>
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#ff2d1a] to-[#ff7a1a]"
          style={{ width: `${(currentTime / totalDuration) * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#ff7a1a] border-2 border-[#ff2d1a] opacity-0 group-hover:opacity-100 transition-smooth"
          style={{ left: `${(currentTime / totalDuration) * 100}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Speed */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#5a5466]">Скорость:</span>
          <span className="font-chord text-[10px] text-[#4aa3ff]">100%</span>
        </div>
        
        {/* Transpose */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[#5a5466]">Трансп.:</span>
          <span className="font-chord text-[10px] text-[#3ecf8e]">0</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 14 14" className="text-[#8a8296]">
            <path d="M2 5h2l3-3v10l-3-3H2V5z" fill="currentColor"/>
            <path d="M10 4c1 1 1 5 0 6" stroke="currentColor" fill="none" strokeWidth="1"/>
          </svg>
          <input type="range" min="0" max="100" defaultValue="80" className="w-16" />
        </div>
      </div>
    </div>
  );
}
