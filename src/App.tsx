import { useState, useCallback, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Timeline from './components/Timeline';
import GuitarNeck from './components/GuitarNeck';
import Player from './components/Player';
import ChordDisplay from './components/ChordDisplay';
import VUMeter from './components/VUMeter';
import ConcertMode from './components/ConcertMode';
import SettingsPanel from './components/SettingsPanel';
import Footer from './components/Footer';
import Chromagram from './components/Chromagram';
import TabView from './components/TabView';
import SplashScreen from './components/SplashScreen';
import LiveInput from './components/LiveInput';
import Metronome from './components/Metronome';
import ShortcutsModal from './components/ShortcutsModal';
import { ChordSegment, AppSettings } from './types';

const DEMO_CHORDS: ChordSegment[] = [
  { id: 1, start: 0, end: 2.5, chord: 'Am', confidence: 0.92, bass: 'A' },
  { id: 2, start: 2.5, end: 5.0, chord: 'F', confidence: 0.88, bass: 'F' },
  { id: 3, start: 5.0, end: 7.5, chord: 'C', confidence: 0.95, bass: 'C' },
  { id: 4, start: 7.5, end: 10.0, chord: 'G', confidence: 0.87, bass: 'G' },
  { id: 5, start: 10.0, end: 12.5, chord: 'Am', confidence: 0.91, bass: 'A' },
  { id: 6, start: 12.5, end: 15.0, chord: 'E7', confidence: 0.78, bass: 'E' },
  { id: 7, start: 15.0, end: 17.5, chord: 'Am', confidence: 0.94, bass: 'A' },
  { id: 8, start: 17.5, end: 20.0, chord: 'Dm7', confidence: 0.82, bass: 'D' },
  { id: 9, start: 20.0, end: 22.5, chord: 'F', confidence: 0.86, bass: 'F' },
  { id: 10, start: 22.5, end: 25.0, chord: 'G', confidence: 0.90, bass: 'G' },
  { id: 11, start: 25.0, end: 27.5, chord: 'C', confidence: 0.93, bass: 'C' },
  { id: 12, start: 27.5, end: 30.0, chord: 'E', confidence: 0.85, bass: 'E' },
  { id: 13, start: 30.0, end: 32.5, chord: 'Am', confidence: 0.96, bass: 'A' },
  { id: 14, start: 32.5, end: 35.0, chord: 'Dm', confidence: 0.84, bass: 'D' },
  { id: 15, start: 35.0, end: 37.5, chord: 'G7', confidence: 0.89, bass: 'G' },
  { id: 16, start: 37.5, end: 40.0, chord: 'C', confidence: 0.97, bass: 'C' },
];

function App() {
  const [activeTab, setActiveTab] = useState<string>('analysis');
  const [chords, setChords] = useState<ChordSegment[]>(DEMO_CHORDS);
  const [activeChordId, setActiveChordId] = useState<number | null>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration] = useState(40);
  const [showConcertMode, setShowConcertMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showDropZone, setShowDropZone] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showMetronome, setShowMetronome] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    fftSize: 8192,
    hopSize: 2048,
    confidenceThreshold: 0.6,
    chordVocabulary: 'full',
    gpuEnabled: true,
    modelType: 'btc',
    bufferSize: 512,
    audioDevice: 'default',
  });

  const foundChord = chords.find(c => c.id === activeChordId);
  const activeChord = foundChord ? foundChord : null;

  const handleFileLoad = useCallback(() => {
    setChords(DEMO_CHORDS);
    setShowDropZone(false);
  }, []);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    const chord = chords.find(c => time >= c.start && time < c.end);
    if (chord) setActiveChordId(chord.id);
  }, [chords]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayToggle();
      }
      if (e.code === 'Escape') {
        if (showConcertMode) setShowConcertMode(false);
        if (showSettings) setShowSettings(false);
        if (showShortcuts) setShowShortcuts(false);
      }
      if (e.code === 'F1') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
        if (!e.ctrlKey && !e.altKey) setShowMetronome(prev => !prev);
      }
      if (e.code === 'ArrowRight') {
        const nextId = (activeChordId || 0) + 1;
        const nextChord = chords.find(c => c.id === nextId);
        if (nextChord) {
          setActiveChordId(nextId);
          setCurrentTime(nextChord.start);
        }
      }
      if (e.code === 'ArrowLeft') {
        const prevId = (activeChordId || 2) - 1;
        const prevChord = chords.find(c => c.id === prevId);
        if (prevChord) {
          setActiveChordId(prevId);
          setCurrentTime(prevChord.start);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayToggle, showConcertMode, showSettings, activeChordId, chords]);

  // Drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setShowDropZone(true);
    };
    const handleDragLeave = () => setShowDropZone(false);
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setShowDropZone(false);
      handleFileLoad();
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleFileLoad]);

  if (showConcertMode) {
    const nextFound = chords.find(c => c.id === (activeChordId || 0) + 1);
    const nextChord = nextFound ? nextFound : null;
    return (
      <ConcertMode
        chord={activeChord}
        nextChord={nextChord}
        onClose={() => setShowConcertMode(false)}
        currentTime={currentTime}
        totalDuration={totalDuration}
      />
    );
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative fade-in">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      <div className="vignette" />
      
      {/* Drop zone overlay */}
      {showDropZone && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📂</div>
            <div className="text-2xl font-black text-[#ff7a1a]">Перетащите аудиофайл</div>
            <div className="text-sm text-[#8a8296] mt-2">MP3, WAV, FLAC, OGG, M4A, AIFF</div>
          </div>
        </div>
      )}

      {/* Title Bar */}
      <TitleBar 
        onSettingsClick={() => setShowSettings(true)}
        onConcertClick={() => setShowConcertMode(true)}
        onHelpClick={() => setShowShortcuts(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onFileLoad={handleFileLoad}
        />

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2433] bg-[#0f0e14]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#8a8296] text-xs">Тональность:</span>
                <span className="font-chord text-[#ff7a1a] font-bold text-sm">Am</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8a8296] text-xs">Темп:</span>
                <span className="font-chord text-[#4aa3ff] font-bold text-sm">124 BPM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8a8296] text-xs">Размер:</span>
                <span className="font-chord text-[#3ecf8e] font-bold text-sm">4/4</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8a8296] text-xs">Длительность:</span>
                <span className="font-chord text-[#f0ecf5] text-sm">{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <VUMeter isPlaying={isPlaying} />
              <div className="text-xs text-[#8a8296] font-chord">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
            </div>
          </div>

          {/* Content Area - varies by tab */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'analysis' && (
              <>
                {/* Chord Display + Guitar Neck + Chromagram */}
                <div className="flex gap-3 p-3 overflow-hidden" style={{ height: '48%' }}>
                  <ChordDisplay chord={activeChord} isPlaying={isPlaying} />
                  <GuitarNeck chord={activeChord?.chord || 'Am'} />
                  <div className="w-64 flex flex-col gap-2">
                    <Chromagram isPlaying={isPlaying} />
                    <ChordHistory chords={chords} activeChordId={activeChordId} onSelect={setActiveChordId} />
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 p-3 pt-0 overflow-hidden">
                  <Timeline
                    chords={chords}
                    activeChordId={activeChordId}
                    currentTime={currentTime}
                    totalDuration={totalDuration}
                    zoom={zoom}
                    onChordSelect={setActiveChordId}
                    onSeek={handleSeek}
                    onZoomChange={setZoom}
                    isPlaying={isPlaying}
                  />
                </div>
              </>
            )}

            {activeTab === 'chords' && (
              <div className="flex-1 p-3 overflow-auto">
                <ChordList chords={chords} activeChordId={activeChordId} onSelect={(id) => {
                  setActiveChordId(id);
                  const chord = chords.find(c => c.id === id);
                  if (chord) setCurrentTime(chord.start);
                }} />
              </div>
            )}

            {activeTab === 'neck' && (
              <div className="flex-1 p-3 overflow-auto flex flex-col gap-3">
                <div className="panel p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#f0ecf5]">🎸 Полный гриф</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#5a5466]">Аккорд:</span>
                      <span className="font-chord text-sm text-[#ff7a1a] font-bold">{activeChord?.chord || 'Am'}</span>
                    </div>
                  </div>
                  <GuitarNeck chord={activeChord?.chord || 'Am'} />
                </div>
              </div>
            )}

            {activeTab === 'tab' && (
              <div className="flex-1 p-3 overflow-hidden">
                <TabView chords={chords} />
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="flex-1 p-3 overflow-auto">
                <EffectsRack />
              </div>
            )}

            {activeTab === 'live' && (
              <LiveInput />
            )}

            {activeTab === 'export' && (
              <div className="flex-1 p-3 overflow-auto">
                <ExportPanel chords={chords} />
              </div>
            )}
          </div>

          {/* Player Bar */}
          <Player
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onPlayToggle={handlePlayToggle}
            onSeek={handleSeek}
            setCurrentTime={setCurrentTime}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Metronome */}
      <Metronome isOpen={showMetronome} onClose={() => setShowMetronome(false)} />

      {/* Metronome toggle button (floating) */}
      {!showMetronome && (
        <button
          onClick={() => setShowMetronome(true)}
          className="fixed bottom-20 right-4 w-10 h-10 rounded-full btn-metal flex items-center justify-center text-lg z-40 hover:border-[#ff7a1a] transition-smooth"
          title="Метроном"
        >
          ⏱
        </button>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Chord history mini-panel
function ChordHistory({ chords, activeChordId, onSelect }: { chords: ChordSegment[], activeChordId: number | null, onSelect: (id: number) => void }) {
  return (
    <div className="panel flex-1 p-2 overflow-auto">
      <div className="text-[10px] text-[#8a8296] uppercase tracking-wider font-bold mb-2">Последовательность</div>
      <div className="flex flex-wrap gap-1">
        {chords.map(chord => (
          <button
            key={chord.id}
            onClick={() => onSelect(chord.id)}
            className={`px-2 py-1 rounded text-xs font-chord font-bold transition-smooth ${
              chord.id === activeChordId
                ? 'bg-[#ff2d1a33] text-[#ff7a1a] border border-[#ff2d1a]'
                : 'bg-[#1a1622] text-[#8a8296] border border-[#2a2433] hover:border-[#3a3445]'
            }`}
          >
            {chord.chord}
          </button>
        ))}
      </div>
    </div>
  );
}

// Chord list view
function ChordList({ chords, activeChordId, onSelect }: { chords: ChordSegment[], activeChordId: number | null, onSelect: (id: number) => void }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f0ecf5]">🎹 Список аккордов</h3>
        <span className="text-xs text-[#5a5466]">{chords.length} аккордов</span>
      </div>
      <div className="space-y-1">
        {chords.map(chord => (
          <div
            key={chord.id}
            onClick={() => onSelect(chord.id)}
            className={`flex items-center gap-4 px-3 py-2 rounded cursor-pointer transition-smooth ${
              chord.id === activeChordId
                ? 'bg-[#ff2d1a15] border border-[#ff2d1a44]'
                : 'hover:bg-[#1a1622] border border-transparent'
            }`}
          >
            <span className="text-[10px] text-[#5a5466] font-chord w-8">#{chord.id}</span>
            <span className={`font-chord font-bold text-sm w-16 ${chord.id === activeChordId ? 'text-[#ff7a1a]' : 'text-[#f0ecf5]'}`}>
              {chord.chord}
            </span>
            <span className="text-xs text-[#4aa3ff] font-chord w-8">{chord.bass}</span>
            <span className="text-xs text-[#5a5466] font-chord w-24">
              {chord.start.toFixed(1)}s – {chord.end.toFixed(1)}s
            </span>
            <div className="flex-1 h-1.5 bg-[#1a1622] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  chord.confidence >= 0.85 ? 'confidence-high' :
                  chord.confidence >= 0.65 ? 'confidence-mid' : 'confidence-low'
                }`}
                style={{ width: `${chord.confidence * 100}%` }}
              />
            </div>
            <span className={`text-[10px] font-chord w-8 text-right ${
              chord.confidence >= 0.85 ? 'text-[#3ecf8e]' :
              chord.confidence >= 0.65 ? 'text-[#f5c518]' : 'text-[#ff2d1a]'
            }`}>
              {Math.round(chord.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Effects Rack
function EffectsRack() {
  const [activeEffects, setActiveEffects] = useState<string[]>(['amp', 'cab']);
  
  const effects = [
    { id: 'noise_gate', name: 'Шумодав', icon: '🔇', color: '#3ecf8e' },
    { id: 'compressor', name: 'Компрессор', icon: '📊', color: '#4aa3ff' },
    { id: 'overdrive', name: 'Овердрайв', icon: '🔥', color: '#ff7a1a' },
    { id: 'amp', name: 'Усилитель', icon: '🎛', color: '#ff2d1a' },
    { id: 'cab', name: 'Кабинет IR', icon: '📦', color: '#f5c518' },
    { id: 'delay', name: 'Дилей', icon: '🔁', color: '#4aa3ff' },
    { id: 'reverb', name: 'Реверб', icon: '🌊', color: '#3ecf8e' },
    { id: 'chorus', name: 'Хорус', icon: '🎵', color: '#ff7a1a' },
  ];

  const toggleEffect = (id: string) => {
    setActiveEffects(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#f0ecf5]">🎛 Rack эффектов (VST3)</h3>
        <div className="flex items-center gap-2">
          <button className="btn-metal px-3 py-1 rounded text-xs">Загрузить VST3</button>
          <button className="btn-metal px-3 py-1 rounded text-xs">Пресеты</button>
        </div>
      </div>

      {/* Signal chain */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <div className="px-3 py-2 rounded bg-[#1a1622] border border-[#2a2433] text-xs text-[#4aa3ff] font-bold whitespace-nowrap">
          🎸 ВХОД
        </div>
        <div className="text-[#3a3445]">→</div>
        {effects.filter(e => activeEffects.includes(e.id)).map(effect => (
          <div key={effect.id} className="flex items-center gap-2">
            <div
              className="px-3 py-2 rounded border text-xs font-bold whitespace-nowrap cursor-pointer"
              style={{ 
                borderColor: effect.color, 
                color: effect.color,
                background: `${effect.color}11`
              }}
              onClick={() => toggleEffect(effect.id)}
            >
              {effect.icon} {effect.name}
            </div>
            <div className="text-[#3a3445]">→</div>
          </div>
        ))}
        <div className="px-3 py-2 rounded bg-[#1a1622] border border-[#2a2433] text-xs text-[#3ecf8e] font-bold whitespace-nowrap">
          🔊 ВЫХОД
        </div>
      </div>

      {/* Effect pedals */}
      <div className="grid grid-cols-4 gap-3">
        {effects.map(effect => {
          const isActive = activeEffects.includes(effect.id);
          return (
            <div
              key={effect.id}
              onClick={() => toggleEffect(effect.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-smooth ${
                isActive
                  ? 'border-opacity-100 bg-opacity-10'
                  : 'border-[#2a2433] bg-[#1a1622] opacity-50'
              }`}
              style={{
                borderColor: isActive ? effect.color : undefined,
                background: isActive ? `${effect.color}11` : undefined,
              }}
            >
              <div className="text-2xl mb-2">{effect.icon}</div>
              <div className="text-xs font-bold" style={{ color: isActive ? effect.color : '#8a8296' }}>
                {effect.name}
              </div>
              <div className={`mt-2 w-3 h-3 rounded-full mx-auto ${isActive ? 'glow-pulse' : ''}`}
                style={{ backgroundColor: isActive ? effect.color : '#2a2433' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export Panel
function ExportPanel({ chords }: { chords: ChordSegment[] }) {
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-bold text-[#f0ecf5] mb-4">💾 Экспорт</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* MIDI Export */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">🎹</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">MIDI</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Полная аранжировка: аккорды, бас, лид, барабаны</div>
          <button className="btn-accent px-3 py-1.5 rounded text-xs w-full">Экспорт MIDI</button>
        </div>

        {/* PDF Export */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">📄</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">PDF</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Аккордовая карта + табулатура для печати</div>
          <button className="btn-accent px-3 py-1.5 rounded text-xs w-full">Экспорт PDF</button>
        </div>

        {/* Guitar Pro */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">🎸</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">Guitar Pro (.gp5)</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Для импорта в Guitar Pro / TuxGuitar</div>
          <button className="btn-accent px-3 py-1.5 rounded text-xs w-full">Экспорт GP5</button>
        </div>

        {/* MusicXML */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">🎼</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">MusicXML</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Универсальный формат для DAW и нотных редакторов</div>
          <button className="btn-accent px-3 py-1.5 rounded text-xs w-full">Экспорт XML</button>
        </div>

        {/* Text/JSON */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">📝</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">Текст / JSON / CSV</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Аккордовая карта с метаданными</div>
          <div className="flex gap-2">
            <button className="btn-metal px-2 py-1 rounded text-[10px] flex-1">TXT</button>
            <button className="btn-metal px-2 py-1 rounded text-[10px] flex-1">JSON</button>
            <button className="btn-metal px-2 py-1 rounded text-[10px] flex-1">CSV</button>
          </div>
        </div>

        {/* Audio Stems */}
        <div className="p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
          <div className="text-lg mb-2">🔀</div>
          <div className="text-sm font-bold text-[#f0ecf5] mb-1">Аудио стемы (Demucs)</div>
          <div className="text-[10px] text-[#5a5466] mb-3">Разделённые дорожки: вокал, бас, ударные, другое</div>
          <button className="btn-accent px-3 py-1.5 rounded text-xs w-full">Экспорт стемов</button>
        </div>
      </div>

      {/* Batch export */}
      <div className="mt-6 p-4 bg-[#1a1622] rounded-lg border border-[#2a2433]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#f0ecf5]">📁 Пакетный экспорт</div>
            <div className="text-[10px] text-[#5a5466] mt-1">Обработать целую папку файлов и экспортировать для каждого</div>
          </div>
          <button className="btn-accent px-4 py-2 rounded text-sm">Выбрать папку</button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-6 text-[10px] text-[#5a5466]">
        <span>Аккордов: {chords.length}</span>
        <span>Средняя уверенность: {Math.round(chords.reduce((a, c) => a + c.confidence, 0) / chords.length * 100)}%</span>
        <span>Уникальных: {new Set(chords.map(c => c.chord)).size}</span>
      </div>
    </div>
  );
}

export default App;
