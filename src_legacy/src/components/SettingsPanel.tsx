import { AppSettings } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onSettingsChange, onClose }: SettingsPanelProps) {
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="panel w-[560px] max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-[#f0ecf5]">⚙️ Настройки</h2>
          <button onClick={onClose} className="text-[#8a8296] hover:text-[#ff2d1a] transition-smooth">✕</button>
        </div>

        {/* DSP Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#ff7a1a] mb-3 uppercase tracking-wider">🧠 Обработка сигнала</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Размер FFT</label>
              <select
                value={settings.fftSize}
                onChange={e => updateSetting('fftSize', Number(e.target.value))}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5] font-chord"
              >
                <option value={2048}>2048</option>
                <option value={4096}>4096</option>
                <option value={8192}>8192</option>
                <option value={16384}>16384</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Размер шага (Hop Size)</label>
              <select
                value={settings.hopSize}
                onChange={e => updateSetting('hopSize', Number(e.target.value))}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5] font-chord"
              >
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
                <option value={4096}>4096</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">
                Порог уверенности: <span className="text-[#ff7a1a] font-bold">{settings.confidenceThreshold}</span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={settings.confidenceThreshold}
                onChange={e => updateSetting('confidenceThreshold', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Словарь аккордов</label>
              <select
                value={settings.chordVocabulary}
                onChange={e => updateSetting('chordVocabulary', e.target.value)}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5]"
              >
                <option value="basic">Базовый (maj, min, 7)</option>
                <option value="extended">Расширенный (+ maj7, m7, dim, aug, sus)</option>
                <option value="full">Полный (все расширения, альтерации)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ML Model Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#4aa3ff] mb-3 uppercase tracking-wider">🧠 ML Модель</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Модель</label>
              <select
                value={settings.modelType}
                onChange={e => updateSetting('modelType', e.target.value)}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5]"
              >
                <option value="btc">BTC (Bidirectional Transformer)</option>
                <option value="chordformer">ChordFormer</option>
                <option value="hmm">HMM + Шаблоны (фоллбэк)</option>
                <option value="chroma">Deep Chroma + HPCP</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8a8296]">GPU ускорение (DirectML / CUDA)</span>
              <button
                onClick={() => updateSetting('gpuEnabled', !settings.gpuEnabled)}
                className={`w-10 h-5 rounded-full transition-smooth ${
                  settings.gpuEnabled ? 'bg-[#ff2d1a]' : 'bg-[#2a2433]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-smooth ${
                  settings.gpuEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#3ecf8e] mb-3 uppercase tracking-wider">🎙 Аудио</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Устройство ввода</label>
              <select
                value={settings.audioDevice}
                onChange={e => updateSetting('audioDevice', e.target.value)}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5]"
              >
                <option value="default">По умолчанию (WASAPI)</option>
                <option value="asio">ASIO (низкая задержка)</option>
                <option value="wasapi-exc">WASAPI Exclusive</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8a8296] block mb-1">Размер буфера</label>
              <select
                value={settings.bufferSize}
                onChange={e => updateSetting('bufferSize', Number(e.target.value))}
                className="w-full bg-[#1a1622] border border-[#2a2433] rounded px-3 py-2 text-sm text-[#f0ecf5] font-chord"
              >
                <option value={128}>128 (2.9 мс)</option>
                <option value={256}>256 (5.8 мс)</option>
                <option value={512}>512 (11.6 мс)</option>
                <option value={1024}>1024 (23.2 мс)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Source Separation */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#f5c518] mb-3 uppercase tracking-wider">🔀 Разделение источников (Demucs v4)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#1a1622] rounded border border-[#2a2433]">
              <div>
                <div className="text-xs text-[#f0ecf5]">Анализировать только гармонический стем</div>
                <div className="text-[10px] text-[#5a5466] mt-0.5">Повышает точность на 20-30%</div>
              </div>
              <div className="w-10 h-5 rounded-full bg-[#3ecf8e] relative cursor-pointer">
                <div className="w-4 h-4 rounded-full bg-white absolute right-0.5 top-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2433]">
          <button onClick={onClose} className="btn-metal px-4 py-2 rounded text-sm">
            Отмена
          </button>
          <button onClick={onClose} className="btn-accent px-4 py-2 rounded text-sm">
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
