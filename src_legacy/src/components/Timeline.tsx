import { ChordSegment } from '../types';

interface TimelineProps {
  chords: ChordSegment[];
  activeChordId: number | null;
  currentTime: number;
  totalDuration: number;
  zoom: number;
  onChordSelect: (id: number) => void;
  onSeek: (time: number) => void;
  onZoomChange: (zoom: number) => void;
  isPlaying: boolean;
}

export default function Timeline({
  chords,
  activeChordId,
  currentTime,
  totalDuration,
  zoom,
  onChordSelect,
  onSeek,
  onZoomChange,
  isPlaying,
}: TimelineProps) {
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const time = ratio * totalDuration;
    onSeek(time);
  };

  const playheadPosition = (currentTime / totalDuration) * 100;

  // Generate waveform-like visualization
  const waveformBars = Array.from({ length: 200 }).map((_, i) => {
    const height = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 25;
    return height;
  });

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Timeline header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2433]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8a8296] uppercase tracking-wider font-bold">Таймлайн</span>
          <span className="text-[10px] text-[#5a5466]">{chords.length} аккордов</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-metal px-2 py-0.5 rounded text-[10px]" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))}>−</button>
          <span className="text-[10px] text-[#8a8296] font-chord">{Math.round(zoom * 100)}%</span>
          <button className="btn-metal px-2 py-0.5 rounded text-[10px]" onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}>+</button>
          <div className="w-px h-4 bg-[#2a2433] mx-1" />
          <button className="btn-metal px-2 py-0.5 rounded text-[10px]" title="Привязка к сетке">
            ⊞ Сетка
          </button>
          <button className="btn-metal px-2 py-0.5 rounded text-[10px]" title="A-B цикл">
            🔁 A-B
          </button>
        </div>
      </div>

      {/* Waveform */}
      <div className="h-10 border-b border-[#2a2433] relative overflow-hidden cursor-pointer" onClick={handleTimelineClick}>
        <div className="flex items-end h-full px-1 gap-px">
          {waveformBars.map((h, i) => (
            <div
              key={i}
              className="waveform-bar flex-1 min-w-[1px]"
              style={{ height: `${h}%`, opacity: (i / 200) * totalDuration < currentTime ? 0.4 : 0.7 }}
            />
          ))}
        </div>
        {/* Playhead on waveform */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#ff2d1a]"
          style={{ left: `${playheadPosition}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#ff2d1a] rotate-45" />
        </div>
      </div>

      {/* Time ruler */}
      <div className="h-5 border-b border-[#2a2433] relative flex items-end">
        {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${(i / totalDuration) * 100}%` }}
          >
            <div className="w-px h-2 bg-[#3a3445]" />
            <span className="text-[8px] text-[#5a5466] font-chord -mt-0.5">{i}s</span>
          </div>
        ))}
      </div>

      {/* Chord tiles area */}
      <div className="flex-1 relative overflow-x-auto overflow-y-hidden">
        <div className="relative h-full min-w-full" style={{ minWidth: `${zoom * 100}%` }}>
          {/* Chord tiles */}
          <div className="flex h-16 mt-2 mx-1 gap-px">
            {chords.map(chord => {
              const width = ((chord.end - chord.start) / totalDuration) * 100;
              const isActive = chord.id === activeChordId;
              const confClass = chord.confidence >= 0.85 ? 'confidence-high' :
                chord.confidence >= 0.65 ? 'confidence-mid' : 'confidence-low';
              
              return (
                <div
                  key={chord.id}
                  onClick={() => onChordSelect(chord.id)}
                  className={`chord-tile flex flex-col items-center justify-center cursor-pointer transition-smooth ${isActive ? 'active' : 'hover:border-[#3a3445]'}`}
                  style={{ width: `${width}%`, minWidth: '40px' }}
                >
                  <span className={`font-chord font-bold text-sm ${isActive ? 'text-[#ff7a1a]' : 'text-[#f0ecf5]'}`}>
                    {chord.chord}
                  </span>
                  <span className="text-[8px] text-[#5a5466] font-chord mt-0.5">
                    {chord.start.toFixed(1)}s
                  </span>
                  {/* Confidence indicator */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5">
                    <div className={`h-full ${confClass}`} style={{ width: `${chord.confidence * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#ff2d1a] z-20 pointer-events-none"
            style={{ left: `${playheadPosition}%` }}
          >
            {isPlaying && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3">
                <div className="w-3 h-3 bg-[#ff2d1a] rotate-45 rec-blink" />
              </div>
            )}
          </div>

          {/* Bass line */}
          <div className="flex h-8 mt-1 mx-1 gap-px">
            {chords.map(chord => {
              const width = ((chord.end - chord.start) / totalDuration) * 100;
              return (
                <div
                  key={`bass-${chord.id}`}
                  className="flex items-center justify-center bg-[#0f0e14] border border-[#1a1622] rounded"
                  style={{ width: `${width}%`, minWidth: '40px' }}
                >
                  <span className="font-chord text-[10px] text-[#4aa3ff]">{chord.bass}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
