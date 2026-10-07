"""Тональность (Krumhansl-Schmuckler) и темп/биты.

* KS-профили — Krumhansl & Kessler (1982), вербализация через
  mir_eval.key / librosa.feature.percussion… (см. CREDITS). Профили ниже —
  стандартные значения Krumhansl-Kessler (major/minor), публично известные.
* Темп: librosa.beat.beat_track (DP-трекер, Simon Brown 1992 / Schroeder
  2010 — через librosa, ISC). BeatNet/madmom — опционально, madmom CC BY-NC-SA
  остаётся выключенным плагином (решение из раздела 1 мастер-промпта).
"""
from __future__ import annotations

import numpy as np

# Krumhansl-Kessler profiles (1982), нормированные.
KS_MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
KS_MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

MAJOR_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MODE_SUFFIX = {"major": "", "minor": "m"}


def detect_key(chroma_mean: np.ndarray) -> tuple[str, float]:
    """Вернуть (имя тональности, корреляцию r) по среднему хроматическому профилю.

    Метод: максимальная циклическая корреляция профиля с KS-major/KS-minor.
    """
    prof = np.asarray(chroma_mean, dtype=np.float64).flatten()
    if prof.size != 12 or float(np.max(prof)) <= 1e-9:
        return ("—", 0.0)
    prof = prof - prof.mean()
    best = (-2.0, "C", "major")
    for mode, ref in (("major", KS_MAJOR), ("minor", KS_MINOR)):
        r_ref = ref - ref.mean()
        # shift == pc тоника; профиль сдвигаем ВПЕРЁД (np.roll(ref, tonic)),
        # чтобы вес тоники совпал с индексом тоники в наблюдаемом профиле.
        for shift in range(12):
            rot = np.roll(r_ref, shift)
            r = float(np.dot(rot, prof) / (np.linalg.norm(rot) * np.linalg.norm(prof) + 1e-12))
            if r > best[0]:
                best = (r, MAJOR_NAMES[shift], mode)
    corr, tonic, mode = best
    return (f"{tonic}{MODE_SUFFIX[mode]}", corr)


def estimate_tempo(y: np.ndarray, sr: int) -> tuple[float, np.ndarray, np.ndarray]:
    """(BPM, beat_times, beat_frames) через librosa DP-трекер.

    Честное замечание: трекер не различает дольный бит; даунбиты — фаза 3+.
    """
    import librosa

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, trim=False)
    beat_times = librosa.frames_to_time(beats, sr=sr)
    bpm = float(np.atleast_1d(tempo)[0])
    return bpm, beat_times.astype(np.float64), np.asarray(beats)


def snap_times(times: np.ndarray, beat_times: np.ndarray, tolerance_s: float = 0.12) -> np.ndarray:
    """Примагнитить времена к ближайшему биту в пределах допуска (для UI-снапа)."""
    if len(beat_times) == 0 or len(times) == 0:
        return times
    idx = np.searchsorted(beat_times, times)
    out = times.copy()
    for i, t in enumerate(times):
        cand = [j for j in (idx[i] - 1, idx[i]) if 0 <= j < len(beat_times)]
        if cand:
            b = min(cand, key=lambda j: abs(beat_times[j] - t))
            if abs(beat_times[b] - t) <= tolerance_s:
                out[i] = beat_times[b]
    return out
