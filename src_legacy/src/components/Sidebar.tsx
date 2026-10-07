interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onFileLoad: () => void;
}

const tabs = [
  { id: 'analysis', icon: '🧠', label: 'Анализ' },
  { id: 'chords', icon: '🎹', label: 'Аккорды' },
  { id: 'neck', icon: '🎸', label: 'Гриф' },
  { id: 'tab', icon: '📝', label: 'Табулатура' },
  { id: 'live', icon: '🎙', label: 'Прямой ввод' },
  { id: 'effects', icon: '🎛', label: 'Эффекты' },
  { id: 'export', icon: '💾', label: 'Экспорт' },
];

export default function Sidebar({ activeTab, onTabChange, onFileLoad }: SidebarProps) {
  return (
    <div className="w-16 bg-[#0a0910] border-r border-[#1a1622] flex flex-col items-center py-3 gap-1">
      {/* File button */}
      <button
        onClick={onFileLoad}
        className="w-12 h-12 rounded-lg btn-accent flex items-center justify-center text-lg mb-3"
        title="Загрузить файл"
      >
        📂
      </button>

      {/* Tabs */}
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-smooth ${
            activeTab === tab.id
              ? 'bg-[#ff2d1a15] text-[#ff7a1a] border border-[#ff2d1a44]'
              : 'text-[#8a8296] hover:bg-[#16141c] hover:text-[#f0ecf5]'
          }`}
          title={tab.label}
        >
          <span className="text-base">{tab.icon}</span>
          <span className="text-[8px] font-medium">{tab.label}</span>
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <button
        className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[#8a8296] hover:bg-[#16141c] hover:text-[#f0ecf5] transition-smooth"
        title="Метроном"
      >
        <span className="text-base">⏱</span>
        <span className="text-[8px] font-medium">Метр.</span>
      </button>
      <button
        className="w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[#8a8296] hover:bg-[#16141c] hover:text-[#f0ecf5] transition-smooth"
        title="Полный экран"
      >
        <span className="text-base">⛶</span>
        <span className="text-[8px] font-medium">Экран</span>
      </button>
    </div>
  );
}
