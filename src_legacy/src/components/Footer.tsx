export default function Footer() {
  return (
    <div className="h-7 bg-[#080710] border-t border-[#1a1622] flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-[#5a5466]">
          🎸 Гитар КОР v2.0 PRO
        </span>
        <span className="text-[10px] text-[#3a3445]">|</span>
        <span className="text-[10px] text-[#5a5466]">
          GPU: DirectML ✓
        </span>
        <span className="text-[10px] text-[#3a3445]">|</span>
        <span className="text-[10px] text-[#5a5466]">
          Модель: BTC (ONNX Runtime)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-[#8a8296] italic">
          Разработано М. Корягиным
        </span>
      </div>
    </div>
  );
}
