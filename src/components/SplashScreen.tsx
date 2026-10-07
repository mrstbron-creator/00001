import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Инициализация...');

  useEffect(() => {
    const steps = [
      { progress: 15, status: 'Загрузка моделей ML...' },
      { progress: 35, status: 'Инициализация ONNX Runtime (DirectML)...' },
      { progress: 55, status: 'Загрузка BTC модели...' },
      { progress: 70, status: 'Инициализация аудио подсистемы...' },
      { progress: 85, status: 'Подготовка интерфейса...' },
      { progress: 100, status: 'Готово!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        setStatus(steps[currentStep].status);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0b0a0e] flex flex-col items-center justify-center z-[10000]">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#ff2d1a] blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#ff7a1a] blur-[150px]" />
      </div>

      {/* Logo */}
      <div className="relative mb-8">
        <span className="text-7xl">🎸</span>
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#ff2d1a] rec-blink" />
      </div>

      {/* Title */}
      <h1 className="text-5xl font-black text-[#ff2d1a] splash-glow mb-2" style={{ fontFamily: 'Inter, sans-serif', transform: 'skewX(-3deg)' }}>
        Гитар КОР
      </h1>
      <p className="text-sm text-[#8a8296] mb-8">Профессиональный анализ аккордов и гитары</p>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-[#1a1622] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-[#ff2d1a] to-[#ff7a1a] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-[#5a5466] font-chord">{status}</p>

      {/* Version */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] text-[#3a3445]">v2.0 PRO • Windows x64</p>
        <p className="text-[10px] text-[#5a5466] italic mt-1">Разработано М. Корягиным</p>
      </div>
    </div>
  );
}
