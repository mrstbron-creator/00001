interface TitleBarProps {
  onSettingsClick: () => void;
  onConcertClick: () => void;
  onHelpClick?: () => void;
}

export default function TitleBar({ onSettingsClick, onConcertClick, onHelpClick }: TitleBarProps) {
  return (
    <div className="flex items-center justify-between h-11 px-4 bg-[#0a0910] border-b border-[#1a1622] select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎸</span>
          <h1 className="title-skew font-black text-lg tracking-tight text-[#ff2d1a]">
            Гитар КОР
          </h1>
        </div>
        <span className="text-[10px] text-[#5a5466] ml-2 mt-1">v2.0 PRO</span>
      </div>

      {/* Center: Quick actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onConcertClick}
          className="btn-metal px-3 py-1 rounded text-xs flex items-center gap-1.5"
          title="Режим концерта"
        >
          <span>🎤</span>
          <span>Концерт</span>
        </button>
        <button
          onClick={onSettingsClick}
          className="btn-metal px-3 py-1 rounded text-xs flex items-center gap-1.5"
          title="Настройки"
        >
          <span>⚙️</span>
          <span>Настройки</span>
        </button>
        {onHelpClick && (
          <button
            onClick={onHelpClick}
            className="btn-metal px-3 py-1 rounded text-xs flex items-center gap-1.5"
            title="Горячие клавиши (F1)"
          >
            <span>⌨️</span>
            <span>F1</span>
          </button>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1">
        <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2a2433] transition-smooth text-[#8a8296]">
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#2a2433] transition-smooth text-[#8a8296]">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
        </button>
        <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-[#ff2d1a33] transition-smooth text-[#8a8296] hover:text-[#ff2d1a]">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
