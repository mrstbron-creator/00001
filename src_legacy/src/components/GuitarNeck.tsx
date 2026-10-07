import { useMemo } from 'react';

interface GuitarNeckProps {
  chord: string;
}

// Chord shapes for common chords (fret positions per string: E A D G B e)
const CHORD_SHAPES: Record<string, number[]> = {
  'Am': [-1, 0, 2, 2, 1, 0],
  'A': [-1, 0, 2, 2, 2, 0],
  'C': [-1, 3, 2, 0, 1, 0],
  'D': [-1, -1, 0, 2, 3, 2],
  'Dm': [-1, -1, 0, 2, 3, 1],
  'E': [0, 2, 2, 1, 0, 0],
  'Em': [0, 2, 2, 0, 0, 0],
  'F': [1, 3, 3, 2, 1, 1],
  'G': [3, 2, 0, 0, 0, 3],
  'G7': [3, 2, 0, 0, 0, 1],
  'E7': [0, 2, 0, 1, 0, 0],
  'A7': [-1, 0, 2, 0, 2, 0],
  'Dm7': [-1, -1, 0, 2, 1, 1],
  'Bm': [-1, 2, 4, 4, 3, 2],
  'B7': [-1, 2, 1, 2, 0, 2],
  'C7': [-1, 3, 2, 3, 1, 0],
};

const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
const DOUBLE_INLAY = [12];
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const NUM_FRETS = 15;

export default function GuitarNeck({ chord }: GuitarNeckProps) {
  const shape = CHORD_SHAPES[chord] || CHORD_SHAPES['Am'];

  const fingerDots = useMemo(() => {
    return shape.map((fret, stringIdx) => {
      if (fret <= 0) return null;
      return { fret, string: stringIdx };
    }).filter(Boolean) as { fret: number; string: number }[];
  }, [chord]);

  const neckWidth = 100; // percentage
  const fretWidth = neckWidth / NUM_FRETS;

  return (
    <div className="panel flex-1 flex flex-col p-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#8a8296] uppercase tracking-wider font-bold">🎸 Гриф</span>
        <span className="font-chord text-sm text-[#ff7a1a] font-bold">{chord}</span>
      </div>

      {/* Neck visualization */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="guitar-neck relative w-full" style={{ height: '140px' }}>
          {/* Frets */}
          {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
            <div
              key={`fret-${i}`}
              className="fret absolute top-0 bottom-0"
              style={{ left: `${i * fretWidth}%` }}
            />
          ))}

          {/* Inlays */}
          {INLAY_FRETS.map(fret => {
            if (fret > NUM_FRETS) return null;
            const left = (fret - 0.5) * fretWidth;
            if (DOUBLE_INLAY.includes(fret)) {
              return (
                <div key={`inlay-${fret}`} className="absolute" style={{ left: `${left}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="inlay absolute" style={{ top: '-12px', left: '-4px' }} />
                  <div className="inlay absolute" style={{ top: '4px', left: '-4px' }} />
                </div>
              );
            }
            return (
              <div
                key={`inlay-${fret}`}
                className="inlay absolute"
                style={{ left: `${left}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              />
            );
          })}

          {/* Strings */}
          {Array.from({ length: 6 }).map((_, stringIdx) => (
            <div
              key={`string-${stringIdx}`}
              className="guitar-string absolute left-0 right-0"
              style={{ top: `${15 + stringIdx * 14}%` }}
            />
          ))}

          {/* Finger dots */}
          {fingerDots.map((dot, idx) => (
            <div
              key={`dot-${idx}`}
              className="absolute w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                left: `${(dot.fret - 0.5) * fretWidth}%`,
                top: `${15 + dot.string * 14}%`,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, #ff7a1a 0%, #ff2d1a 100%)',
                boxShadow: '0 0 8px rgba(255,45,26,0.6)',
                color: 'white',
                zIndex: 10,
              }}
            >
              {dot.fret}
            </div>
          ))}

          {/* Open/Muted string indicators */}
          {shape.map((fret, stringIdx) => {
            if (fret > 0) return null;
            return (
              <div
                key={`indicator-${stringIdx}`}
                className="absolute text-[10px] font-bold font-chord"
                style={{
                  left: '-12px',
                  top: `${15 + stringIdx * 14}%`,
                  transform: 'translateY(-50%)',
                  color: fret === 0 ? '#3ecf8e' : '#ff2d1a',
                }}
              >
                {fret === 0 ? '○' : '✕'}
              </div>
            );
          })}
        </div>

        {/* String labels */}
        <div className="flex justify-between mt-2 px-0">
          {STRING_NAMES.map((name, i) => (
            <span key={i} className="text-[9px] text-[#5a5466] font-chord w-6 text-center">{name}</span>
          ))}
        </div>
      </div>

      {/* Chord diagram mini */}
      <div className="mt-2 flex items-center justify-center gap-2">
        <div className="text-[10px] text-[#5a5466]">Аппликатура:</div>
        <div className="font-chord text-[10px] text-[#8a8296]">
          {shape.map(f => f === -1 ? '✕' : f === 0 ? '○' : f.toString()).join(' ')}
        </div>
      </div>
    </div>
  );
}
