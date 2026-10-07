import { ChordSegment } from '../types';

interface ChordDisplayProps {
  chord: ChordSegment | null;
  isPlaying: boolean;
}

export default function ChordDisplay({ chord, isPlaying }: ChordDisplayProps) {
  const confidenceClass = !chord ? 'confidence-mid' :
    chord.confidence >= 0.85 ? 'confidence-high' :
    chord.confidence >= 0.65 ? 'confidence-mid' : 'confidence-low';

  return (
    <div className="panel flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="w-2 h-2 rounded-full bg-[#ff2d1a] rec-blink" />
          )}
          <span className="text-xs text-[#8a8296] uppercase tracking-wider font-bold">Текущий аккорд</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5a5466]">Уверенность:</span>
          <span className={`text-[10px] font-bold ${
            !chord ? 'text-[#f5c518]' :
            chord.confidence >= 0.85 ? 'text-[#3ecf8e]' :
            chord.confidence >= 0.65 ? 'text-[#f5c518]' : 'text-[#ff2d1a]'
          }`}>
            {chord ? `${Math.round(chord.confidence * 100)}%` : '—'}
          </span>
        </div>
      </div>

      {/* Main chord display */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className={`font-chord text-6xl font-bold tracking-tight ${isPlaying ? 'glow-pulse rounded-lg' : ''}`}
            style={{ 
              color: '#ff7a1a',
              textShadow: '0 0 30px rgba(255,122,26,0.4), 0 0 60px rgba(255,45,26,0.2)',
              padding: isPlaying ? '8px 24px' : '0'
            }}
          >
            {chord?.chord || '—'}
          </div>
          {chord && (
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-[10px] text-[#5a5466] uppercase">Бас</div>
                <div className="font-chord text-lg text-[#4aa3ff] font-bold">{chord.bass}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[#5a5466] uppercase">Время</div>
                <div className="font-chord text-sm text-[#8a8296]">
                  {chord.start.toFixed(1)}s – {chord.end.toFixed(1)}s
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-[#1a1622] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${confidenceClass}`}
            style={{ width: `${chord ? chord.confidence * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Quick info */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-[#5a5466]">
        <span>Модель: BTC (ONNX)</span>
        <span>GPU: DirectML</span>
      </div>
    </div>
  );
}
