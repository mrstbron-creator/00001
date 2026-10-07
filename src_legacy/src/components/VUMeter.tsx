import { useEffect, useState } from 'react';

interface VUMeterProps {
  isPlaying: boolean;
}

export default function VUMeter({ isPlaying }: VUMeterProps) {
  const [levels, setLevels] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isPlaying) {
      setLevels([0, 0, 0, 0, 0, 0, 0, 0]);
      return;
    }
    const interval = setInterval(() => {
      setLevels(prev => prev.map(() => 
        Math.max(0, Math.min(100, 30 + Math.random() * 50 + Math.sin(Date.now() * 0.01) * 20))
      ));
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-end gap-px h-6">
      {levels.map((level, i) => {
        const color = level > 80 ? '#ff2d1a' : level > 50 ? '#f5c518' : '#3ecf8e';
        return (
          <div key={i} className="w-1 bg-[#1a1622] rounded-full h-full relative overflow-hidden">
            <div
              className="absolute bottom-0 w-full rounded-full transition-all duration-75"
              style={{ height: `${level}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}
