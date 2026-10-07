import { useAudioAnalyzer } from '../hooks/useAudioAnalyzer';

export default function LiveInput() {
  const { isListening, detectedChord, confidence, volume, startListening, stopListening, currentChroma, noteNames } = useAudioAnalyzer();

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-auto p-3">
      {/* Status Panel */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#f0ecf5]">🎙 Прямой ввод с гитары / микрофона</h3>
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-4 py-2 rounded text-sm font-bold ${
              isListening ? 'btn-accent glow-pulse' : 'btn-metal'
            }`}
          >
            {isListening ? '⏹ Остановить' : '🎙 Начать'}
          </button>
        </div>

        {/* Detected chord */}
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div
              className={`font-chord font-black text-7xl ${isListening ? 'glow-pulse rounded-xl' : ''}`}
              style={{
                color: detectedChord ? '#ff7a1a' : '#3a3445',
                textShadow: detectedChord ? '0 0 30px rgba(255,122,26,0.5)' : 'none',
                padding: isListening ? '12px 32px' : '0',
              }}
            >
              {detectedChord || '—'}
            </div>
            {isListening && (
              <div className="mt-3 flex items-center justify-center gap-4">
                <span className="text-xs text-[#5a5466]">Уверенность:</span>
                <span className={`font-chord text-sm font-bold ${
                  confidence >= 0.7 ? 'text-[#3ecf8e]' :
                  confidence >= 0.4 ? 'text-[#f5c518]' : 'text-[#ff2d1a]'
                }`}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Volume meter */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-[#5a5466]">Уровень сигнала:</span>
            <span className="font-chord text-[10px] text-[#8a8296]">{Math.round(volume)}%</span>
          </div>
          <div className="h-3 bg-[#1a1622] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${Math.min(100, volume)}%`,
                background: volume > 80 ? 'linear-gradient(90deg, #3ecf8e, #f5c518, #ff2d1a)' :
                  volume > 40 ? 'linear-gradient(90deg, #3ecf8e, #f5c518)' :
                  'linear-gradient(90deg, #3ecf8e, #3ecf8e)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Chroma display */}
      <div className="panel p-4">
        <h4 className="text-xs text-[#8a8296] uppercase tracking-wider font-bold mb-3">Хроматический профиль (реальное время)</h4>
        <div className="flex items-end gap-1 h-24">
          {currentChroma.map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all duration-75"
                style={{
                  height: `${value * 100}%`,
                  background: value > 0.5 ? 'linear-gradient(180deg, #ff2d1a, #ff7a1a)' :
                    value > 0.25 ? 'linear-gradient(180deg, #ff7a1a, #f5c518)' :
                    'linear-gradient(180deg, #2a2433, #3a3445)',
                  minHeight: '2px',
                }}
              />
              <span className="text-[8px] text-[#5a5466] font-chord">{noteNames[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="panel p-4">
        <h4 className="text-xs text-[#8a8296] uppercase tracking-wider font-bold mb-2">Информация</h4>
        <div className="space-y-2 text-xs text-[#5a5466]">
          <p>• Подключите гитару через аудиоинтерфейс или используйте микрофон</p>
          <p>• Анализ в реальном времени с задержкой ~23 мс (буфер 512)</p>
          <p>• Используется FFT 8192 точек для высокого разрешения по частоте</p>
          <p>• Алгоритм: Хроматический профиль → Шаблоны аккордов (Harte)</p>
          <p>• Для лучшего результата: чистый сигнал без фона</p>
        </div>
      </div>

      {/* Device selection */}
      <div className="panel p-4">
        <h4 className="text-xs text-[#8a8296] uppercase tracking-wider font-bold mb-2">Устройство ввода</h4>
        <select className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5]">
          <option>По умолчанию (системный микрофон)</option>
          <option>ASIO: Focusrite USB ASIO</option>
          <option>WASAPI: Line In (Realtek)</option>
          <option>WASAPI: Microphone (USB Audio)</option>
        </select>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-[#5a5466]">
          <span>Задержка: 11.6 мс</span>
          <span>Частота: 48000 Гц</span>
          <span>Буфер: 512</span>
        </div>
      </div>
    </div>
  );
}
