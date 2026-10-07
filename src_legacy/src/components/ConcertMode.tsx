import { ChordSegment } from '../types';

interface ConcertModeProps {
  chord: ChordSegment | null;
  nextChord: ChordSegment | null;
  onClose: () => void;
  currentTime: number;
  totalDuration: number;
}

export default function ConcertMode({ chord, nextChord, onClose, currentTime, totalDuration }: ConcertModeProps) {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#16141c] border border-[#2a2433] flex items-center justify-center text-[#8a8296] hover:text-[#ff2d1a] hover:border-[#ff2d1a] transition-smooth"
      >
        ✕
      </button>

      {/* Timer */}
      <div className="absolute top-4 left-4 font-chord text-2xl text-[#5a5466]">
        {formatTime(currentTime)} / {formatTime(totalDuration)}
      </div>

      {/* Main chord */}
      <div className="text-center">
        <div
          className="font-chord font-black glow-pulse rounded-2xl"
          style={{
            fontSize: '12rem',
            color: '#ff7a1a',
            textShadow: '0 0 60px rgba(255,122,26,0.5), 0 0 120px rgba(255,45,26,0.3)',
            padding: '20px 60px',
            lineHeight: 1,
          }}
        >
          {chord?.chord || '—'}
        </div>

        {/* Bass note */}
        {chord && (
          <div className="mt-6 font-chord text-3xl text-[#4aa3ff]">
            Бас: {chord.bass}
          </div>
        )}
      </div>

      {/* Next chord */}
      {nextChord && (
        <div className="absolute bottom-20 text-center">
          <div className="text-xs text-[#5a5466] uppercase tracking-wider mb-2">Следующий</div>
          <div className="font-chord text-5xl text-[#3a3445] font-bold">
            {nextChord.chord}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-8 left-8 right-8 h-1 bg-[#1a1622] rounded-full">
        <div
          className="h-full bg-gradient-to-r from-[#ff2d1a] to-[#ff7a1a] rounded-full transition-all duration-200"
          style={{ width: `${(currentTime / totalDuration) * 100}%` }}
        />
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-[#3a3445]">
        Нажмите ESC или ✕ для выхода • Пробел — пауза
      </div>
    </div>
  );
}
