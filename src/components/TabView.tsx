import { ChordSegment } from '../types';

interface TabViewProps {
  chords: ChordSegment[];
}

export default function TabView({ chords }: TabViewProps) {
  // Generate a simple tab representation
  const tabLines = [
    'e|————————————————————————————————————————————————————————————————|',
    'B|————————————————————————————————————————————————————————————————|',
    'G|————————————————————————————————————————————————————————————————|',
    'D|————————————————————————————————————————————————————————————————|',
    'A|————————————————————————————————————————————————————————————————|',
    'E|————————————————————————————————————————————————————————————————|',
  ];

  // Chord shapes for tab
  const tabShapes: Record<string, string[]> = {
    'Am':  ['—0—', '—1—', '—2—', '—2—', '—0—', '—x—'],
    'F':   ['—1—', '—1—', '—2—', '—3—', '—3—', '—1—'],
    'C':   ['—0—', '—1—', '—0—', '—2—', '—3—', '—x—'],
    'G':   ['—3—', '—0—', '—0—', '—0—', '—2—', '—3—'],
    'E':   ['—0—', '—0—', '—1—', '—2—', '—2—', '—0—'],
    'E7':  ['—0—', '—0—', '—0—', '—1—', '—2—', '—0—'],
    'Dm':  ['—1—', '—3—', '—2—', '—x—', '—x—', '—x—'],
    'Dm7': ['—1—', '—1—', '—2—', '—x—', '—x—', '—x—'],
    'G7':  ['—1—', '—0—', '—0—', '—0—', '—2—', '—3—'],
  };

  return (
    <div className="panel p-4 overflow-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f0ecf5]">📝 Табулатура</h3>
        <div className="flex items-center gap-2">
          <button className="btn-metal px-2 py-1 rounded text-[10px]">Копировать ASCII</button>
          <button className="btn-metal px-2 py-1 rounded text-[10px]">Экспорт PDF</button>
          <button className="btn-metal px-2 py-1 rounded text-[10px]">Guitar Pro</button>
        </div>
      </div>

      {/* Tab notation */}
      <div className="font-chord text-xs text-[#8a8296] leading-relaxed overflow-x-auto">
        {/* Chord names above */}
        <div className="flex gap-1 mb-1">
          {chords.slice(0, 8).map(chord => (
            <span key={chord.id} className="text-[#ff7a1a] font-bold min-w-[50px] text-center">
              {chord.chord}
            </span>
          ))}
        </div>
        
        {/* Tab lines */}
        <div className="whitespace-pre">
          {['e|', 'B|', 'G|', 'D|', 'A|', 'E|'].map((stringLabel, sIdx) => (
            <div key={sIdx} className="flex">
              <span className="text-[#4aa3ff] w-4">{stringLabel[0]}</span>
              <span className="text-[#3a3445]">|</span>
              {chords.slice(0, 8).map(chord => {
                const shape = tabShapes[chord.chord];
                const note = shape ? shape[sIdx] : '———';
                return (
                  <span key={chord.id} className="min-w-[50px] text-center text-[#f0ecf5]">
                    {note}
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        {/* Timing markers */}
        <div className="flex gap-1 mt-1">
          {chords.slice(0, 8).map(chord => (
            <span key={chord.id} className="text-[#5a5466] min-w-[50px] text-center text-[9px]">
              {chord.start.toFixed(1)}s
            </span>
          ))}
        </div>
      </div>

      {/* Second line */}
      {chords.length > 8 && (
        <div className="mt-6 font-chord text-xs text-[#8a8296] leading-relaxed">
          <div className="flex gap-1 mb-1">
            {chords.slice(8, 16).map(chord => (
              <span key={chord.id} className="text-[#ff7a1a] font-bold min-w-[50px] text-center">
                {chord.chord}
              </span>
            ))}
          </div>
          <div className="whitespace-pre">
            {['e|', 'B|', 'G|', 'D|', 'A|', 'E|'].map((stringLabel, sIdx) => (
              <div key={sIdx} className="flex">
                <span className="text-[#4aa3ff] w-4">{stringLabel[0]}</span>
                <span className="text-[#3a3445]">|</span>
                {chords.slice(8, 16).map(chord => {
                  const shape = tabShapes[chord.chord];
                  const note = shape ? shape[sIdx] : '———';
                  return (
                    <span key={chord.id} className="min-w-[50px] text-center text-[#f0ecf5]">
                      {note}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-[#2a2433]">
        <div className="text-[10px] text-[#5a5466]">
          <span className="text-[#8a8296] font-bold">Обозначения:</span>
          {' '}x = глушая струна | 0 = открытая | числа = лады | h = hammer-on | p = pull-off | / = слайд вверх | \ = слайд вниз | ~ = вибрато | b = бенд
        </div>
      </div>
    </div>
  );
}
