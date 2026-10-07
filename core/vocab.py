"""Словарь аккордов и нотация Харте (Harte et al., 2005).

Идея: "Toward Constituent-Base Evaluation for Automatic Chord Transcription",
A. Harte, M. Sandler, A. Chris, J. Ching (ISMIR 2005) — синтаксис обозначений
аккордов и метрики majmin / sevenths. Реализация независимая (clean-room),
перевод/адаптация концепций;mir_eval (ISC) использует ту же нотацию.

Здесь живут: разбор/канонизация имён аккордов, PCA-векторы (для маппинга
словарей моделей -> словарь приложения) и таблица quality->PC для расширенного
слоя (фаза 3).
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Питч-классы с общепринятыми алиасами (русский UI показывает латинские имена).
NOTE_TO_PC = {
    "C": 0, "B#": 0,
    "C#": 1, "DB": 1,
    "D": 2,
    "D#": 3, "EB": 3,
    "E": 4, "FB": 4,
    "F": 5, "ES": 5,
    "F#": 6, "GB": 6,
    "G": 7,
    "G#": 8, "AB": 8,
    "A": 9,
    "A#": 10, "BB": 10,
    "B": 11, "CB": 11,
}
PC_TO_NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

_N_RE = r"(?:[A-Ga-g](?:#|b|s)?)"

# quality -> список интервалов (в полутонах от рутки) и PCA-паттерн.
# Паттерны PC/MajMin/Sevenths соответствуют метрикам mir_eval.chord (VERIFY по
# документации mir_eval при изменении словаря).
QUALITY_PITCH_CLASSES: dict[str, tuple[int, ...]] = {
    "": (0, 4, 7),                    # major triad
    "m": (0, 3, 7),
    "aug": (0, 4, 8),                 # = "+"
    "dim": (0, 3, 6),                 # = "o"
    "7": (0, 4, 7, 10),
    "maj7": (0, 4, 7, 11),            # = "M7"
    "m7": (0, 3, 7, 10),
    "m7b5": (0, 3, 6, 10),            # half-dim = "o7" c перечёркнутой 7
    "dim7": (0, 3, 6, 9),
    "sus2": (0, 2, 7),
    "sus4": (0, 5, 7),
    "6": (0, 4, 7, 9),
    "m6": (0, 3, 7, 9),
    "add9": (0, 4, 7, 14 % 12),       # триада + 9 (без септими)
    "9": (0, 4, 7, 10, 2),
    "m9": (0, 3, 7, 10, 2),
    "11": (0, 4, 7, 10, 2, 5),
    "13": (0, 4, 7, 10, 2, 9),
}

# Синонимы в записи quality.
_QUALITY_ALIASES = {
    "maj": "", "major": "", "M": "",
    "min": "m", "minor": "m", "-": "m",
    "+": "aug", "augmented": "aug",
    "o": "dim", "°": "dim", "diminished": "dim",
    "ø": "m7b5", "m7-5": "m7b5", "halfdim": "m7b5",
    "M7": "maj7", "ma7": "maj7", "Δ": "maj7",
    "sus": "sus4",
    "o7": "dim7",
}

# Полное имя: "C", "C:m7b5", "C:maj/G", "Cm", "N.C." — двоеточие опционально.
_CHORD_RE = re.compile(
    rf"^(?P<root>{_N_RE}):?(?P<quality>[^/]*)(?:/\*?(?P<bass>{_N_RE}))?$"
)


@dataclass(frozen=True)
class Chord:
    """Канонический аккорд: root (0..11), quality ('', 'm', '7', ...), bass."""

    root: int
    quality: str
    bass: int | None = None

    @property
    def is_no_chord(self) -> bool:
        return self.root < 0

    def pitch_classes(self) -> set[int]:
        if self.is_no_chord:
            return set()
        return {(self.root + iv) % 12 for iv in QUALITY_PITCH_CLASSES.get(self.quality, (0, 4, 7))}

    def to_harte(self) -> str:
        """Строка в нотации Харте (как ожидает mir_eval.chord.encode)."""
        if self.is_no_chord:
            return "N:C"  # mir_eval canonical no-chord
        q = self.quality
        name = f"{PC_TO_NAME[self.root]}:{q}" if q else PC_TO_NAME[self.root]
        if self.bass is not None:
            name += f"/{PC_TO_NAME[self.bass]}"
        return name


NO_CHORD = Chord(-1, "")
_SPLIT_RE = re.compile(r"^([A-Ga-g][#bs]?):(.*)$")


def parse_chord(symbol: str) -> Chord:
    """Разобрать строку аккорда ('Am7b5', 'C:maj7/G', 'N.C.') в Chord.

    Бросает ValueError на нераспознанном вводе.
    """
    s = symbol.strip()
    if not s:
        raise ValueError("Пустое имя аккорда")
    low = s.upper().replace("N.C.", "N:C")
    if low == "N:C":
        return NO_CHORD
    m = _CHORD_RE.match(s)
    if not m:
        raise ValueError(f"Не удалось разобрать аккорд: {symbol!r}")
    root = NOTE_TO_PC[m.group("root").upper().replace("S", "#")]
    qual_raw = m.group("quality") or ""
    quality = _QUALITY_ALIASES.get(qual_raw, qual_raw)
    if quality and quality not in QUALITY_PITCH_CLASSES:
        raise ValueError(f"Неизвестный тип аккорда: {qual_raw!r} (в {symbol!r})")
    bass_s = m.group("bass")
    bass = NOTE_TO_PC[bass_s.upper()] if bass_s else None
    return Chord(root, quality, bass)


def pca_vector(symbol: str) -> list[float]:
    """PCA-вектор аккорда по нотации mir_eval.chord.pca_representation.

    Используется для маппинга словаря модели (напр. 25 классов BTC) к
    словарю приложения и для обратного маппинга. Возвращаем формат
    [bass_pc?, root, third(maj/min), fifth(P), seventh(S)] в терминах
    mir_eval: см. mir_eval.chord.PCAS.
    """
    from mir_eval.chord import pca_representation  # локальный импорт: mir_eval опционален в рантайме

    return list(pca_representation(parse_chord(symbol).to_harte()))


def encode(symbol: str) -> tuple[int, frozenset[int]]:
    """Кортеж (root, pitch classes) в стиле mir_eval.chord.encode."""
    c = parse_chord(symbol)
    return (c.root if not c.is_no_chord else -1, frozenset(c.pitch_classes()))
