import { useEffect, useRef, useState } from 'react';

interface ChromagramProps {
  isPlaying: boolean;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export default function Chromagram({ isPlaying }: ChromagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<number[][]>([]);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      setData([]);
      return;
    }
    const interval = setInterval(() => {
      frameRef.current++;
      const newFrame = NOTE_NAMES.map((_, i) => {
        // Simulate chroma values based on musical patterns
        const base = Math.sin(frameRef.current * 0.1 + i * 0.5) * 0.3 + 0.3;
        const noise = Math.random() * 0.2;
        return Math.max(0, Math.min(1, base + noise));
      });
      setData(prev => [...prev.slice(-60), newFrame]);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) {
      // Draw empty state
      ctx.fillStyle = '#1a1622';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a3445';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Хроматограмма (ожидание воспроизведения)', w / 2, h / 2);
      return;
    }

    const colWidth = w / 60;
    const rowHeight = h / 12;

    for (let col = 0; col < data.length; col++) {
      for (let row = 0; row < 12; row++) {
        const value = data[col][row];
        const r = Math.floor(value * 255);
        const g = Math.floor(value * 80);
        const b = Math.floor((1 - value) * 40);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          col * colWidth,
          (11 - row) * rowHeight,
          colWidth - 0.5,
          rowHeight - 0.5
        );
      }
    }
  }, [data]);

  return (
    <div className="panel p-2">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] text-[#8a8296] uppercase tracking-wider font-bold">Хроматограмма</span>
        <div className="flex items-center gap-2">
          {NOTE_NAMES.map((name, i) => (
            <span key={i} className="text-[7px] text-[#5a5466] font-chord">{name}</span>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={360}
        height={72}
        className="w-full rounded"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
