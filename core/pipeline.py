"""Пайплайн анализа: загрузка → строй → хрома → бэкенд → тон/темп → документ.

Каждый этап можно заменить; UI вызывает `analyze_file()` из worker-потока и
получает готовый `AnalysisDoc`. Прогресс — через callback (safe для Qt-сигналов).
"""
from __future__ import annotations

from typing import Callable

import numpy as np

from core import dsp
from core.chords import BACKENDS, ChordResult, HmmTemplateBackend
from core.features import chroma_cqt
from core.keybeat import detect_key, estimate_tempo
from core.project import AnalysisDoc, ChordSegment

ProgressCb = Callable[[str, float], None]


def _harte_to_display(name: str) -> str:
    """'A:m' -> 'Am', 'N:C' -> '—' (для показа пользователю)."""
    from core.vocab import parse_chord, PC_TO_NAME

    c = parse_chord(name)
    if c.is_no_chord:
        return "—"
    root = PC_TO_NAME[c.root]
    q = {"": "", "m": "m"}.get(c.quality, c.quality)
    return f"{root}{q}"


def analyze_audio(y: np.ndarray, sr: int, *, backend_name: str = "hmm-template",
                  progress: ProgressCb | None = None,
                  estimate_tuning: bool = True) -> tuple[AnalysisDoc, ChordResult]:
    """Проанализировать сигнал; вернуть документ и сырой результат бэкенда."""

    def step(msg: str, frac: float) -> None:
        if progress:
            progress(msg, frac)

    step("Загрузка сигнала…", 0.05)
    tuning = 0.0
    if estimate_tuning:
        step("Оценка строя…", 0.15)
        tuning = dsp.estimate_tuning_offset(y, sr)

    step("Хроматические признаки…", 0.3)
    chroma = chroma_cqt(y, sr)

    step("Распознавание аккордов…", 0.45)
    backend = BACKENDS.get(backend_name, HmmTemplateBackend)
    if isinstance(backend, type):
        backend = backend()
    result = backend.analyze(y, sr)

    step("Темп и тональность…", 0.8)
    bpm, beat_times, _ = estimate_tempo(y, sr)
    key, key_corr = detect_key(chroma.mean(axis=1))

    step("Сборка документа…", 0.95)
    segs = [ChordSegment(start=s, end=e, chord=c, confidence=conf)
            for s, e, c, conf in result.segments()]
    doc = AnalysisDoc(
        sample_rate=sr,
        duration=len(y) / sr,
        bpm=bpm,
        key=key,
        tuning_offset_cents=tuning,
        backend=result.backend,
        segments=segs,
        beat_times=[float(t) for t in beat_times],
    )
    doc._key_corr = key_corr  # метрика для отладки (не часть схемы)
    step("Готово", 1.0)
    return doc, result


def analyze_file(path: str, **kw) -> tuple[AnalysisDoc, ChordResult]:
    """Полный офлайн-проход по файлу (wav/flac/ogg; mp3/m4a — VERIFY ffmpeg)."""
    y, sr = dsp.load_audio(path)
    return analyze_audio(y, sr, **kw)
