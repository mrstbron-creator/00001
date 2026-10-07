interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Пробел', action: 'Воспроизведение / Пауза' },
    { key: '←', action: 'Предыдущий аккорд' },
    { key: '→', action: 'Следующий аккорд' },
    { key: 'Esc', action: 'Закрыть модальное окно / Выйти из концерта' },
    { key: 'Ctrl+Z', action: 'Отменить' },
    { key: 'Ctrl+Y', action: 'Повторить' },
    { key: 'Ctrl+S', action: 'Сохранить проект' },
    { key: 'Ctrl+O', action: 'Открыть файл' },
    { key: 'Ctrl+E', action: 'Экспорт' },
    { key: 'F11', action: 'Полный экран' },
    { key: 'M', action: 'Метроном вкл/выкл' },
    { key: 'L', action: 'Прямой ввод (микрофон)' },
    { key: '+/−', action: 'Приближение таймлайна' },
    { key: 'Delete', action: 'Удалить выбранный аккорд' },
    { key: 'D', action: 'Разделить аккорд' },
    { key: '1-9', action: 'Быстрый переход к аккорду' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="panel w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#f0ecf5]">⌨️ Горячие клавиши</h2>
          <button onClick={onClose} className="text-[#8a8296] hover:text-[#ff2d1a]">✕</button>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#1a1622]">
              <span className="text-xs text-[#8a8296]">{shortcut.action}</span>
              <kbd className="px-2 py-0.5 bg-[#1a1622] border border-[#2a2433] rounded text-[10px] font-chord text-[#ff7a1a]">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#2a2433] text-[10px] text-[#5a5466]">
          Горячие клавиши работают даже когда приложение свёрнуто (глобальные сочетания настраиваются в настройках).
        </div>
      </div>
    </div>
  );
}
