"""Загрузка аудио, оценка строя и синтез тестовых сигналов.

Декодирование: soundfile (wav/flac/ogg); mp3/m4a — откат на librosa/audioread
с ffmpeg-бэкендом (наличие ffmpeg в сборке — VERIFY). Пути с кириллицей
обрабатываются напрямую (libsndfile принимает UTF-8); сквозная проверка —
tests/test_cyrillic_path.py.
"""
from __future__ import annotations

import numpy as np
import soundfile as sf

DEFAULT_SR = 22050


def load_audio(path: str, sr: int = DEFAULT_SR, mono: bool = True) -> tuple[np.ndarray, int]:
    """Прочитать аудиофайл; вернуть (samples float32, sr).

    При несовпадении частоты дискретизации выполняется polyphase-резамп
    (scipy.signal.resample_poly) — достаточно для офлайн-анализа; для
    live-входа используется отдельный путь (audio/, фаза 6).
    """
    try:
        data, file_sr = sf.read(str(path), dtype="float32", always_2d=True)
    except Exception:
        # Форматы без поддержки libsndfile (mp3/m4a): откат на audioread/librosa.
        import librosa

        data1d, file_sr = librosa.load(str(path), sr=None, mono=True)
        data = data1d[:, None].astype(np.float32)
    y = data.mean(axis=1) if mono else data.T.copy()
    if int(file_sr) != int(sr):
        from math import gcd

        from scipy.signal import resample_poly

        g = gcd(int(file_sr), int(sr))
        up, down = int(sr) // g, int(file_sr) // g
        if y.ndim == 1:
            y = resample_poly(y, up, down).astype(np.float32)
        else:
            y = np.apply_along_axis(lambda x: resample_poly(x, up, down), 1, y).astype(np.float32)
    return np.ascontiguousarray(y, dtype=np.float32), int(sr)


def estimate_tuning_offset(y: np.ndarray, sr: int) -> float:
    """Оценка смещения строя в центах (диапазон ±50) по CQT-энергии.

    Метод: плотная CQT-сетка (3 бага на полутон); по топ-энергетическим бинам
    считаем медиану отклонения частоты от ближайшей ноты равного строя
    (A4 = 440 Гц). Корректность проверяется на синтетике (tests/test_dsp.py).
    Возвращает 0.0 на тишине.
    """
    import librosa

    bins_per_semitone = 3
    n_bins = 12 * bins_per_semitone * 4  # ~4 октавы
    fmin = 55.0  # A1
    cqt_mag = np.abs(
        librosa.cqt(y, sr=sr, fmin=fmin, n_bins=n_bins,
                    bins_per_octave=12 * bins_per_semitone, hop_length=512)
    )
    energy = cqt_mag.mean(axis=1)
    if energy.size == 0 or float(energy.max()) <= 1e-9:
        return 0.0
    freqs = librosa.cqt_frequencies(n_bins, fmin=fmin, bins_per_octave=12 * bins_per_semitone)
    top = np.argsort(energy)[-24:]
    cents: list[float] = []
    for idx in top:
        f = float(freqs[idx])
        if f <= 0:
            continue
        midi = 69.0 + 12.0 * np.log2(f / 440.0)
        cents.append(100.0 * (midi - round(midi)))
    if not cents:
        return 0.0
    off = float(np.median(cents))
    return float(np.clip(off, -50.0, 50.0))


def synth_chord(root_midi: int, seconds: float, sr: int = DEFAULT_SR,
                quality_intervals: tuple[int, ...] = (0, 4, 7),
                vib_cents: float = 4.0, amp: float = 0.5,
                noise: float = 0.0, detune_cents: float = 0.0) -> np.ndarray:
    """Синтезировать учебный аккорд: аддитивные гармоники + вибрато.

    Только для тестов и демо-песни (раздел 3: self-synthesized song). Это НЕ
    правдоподобный гитарный тембр, а сигнал с известным ground truth.
    `detune_cents` — искусственная расстройка для проверки тюнинг-оценщика.

    Важно: фаза считается от мгновенной ЧАСТОТЫ (интеграл), иначе вибрато
    даёт боковые полосы ±виб-частоты вокруг каждой ноты и «размазывает» хрому.
    """
    t = np.arange(int(seconds * sr)) / sr
    y = np.zeros_like(t, dtype=np.float64)
    base = 440.0 * 2 ** ((root_midi - 69) / 12.0) * 2 ** (detune_cents / 1200.0)
    rng = np.random.default_rng(1234)
    for k, iv in enumerate(quality_intervals):
        f0 = base * 2 ** (iv / 12.0)
        # вибрато как модуляция частоты: phase = ∫ f(t) dt
        vib_inst = 1.0 + (vib_cents / 1e2) * np.sin(2 * np.pi * 5.2 * t + k)
        phase = 2 * np.pi * f0 * np.cumsum(vib_inst) / sr
        for h in range(1, 7):
            gain = 0.6 ** h
            y += gain * np.sin(h * phase)
    env = np.minimum(1.0, t / 0.02) * np.exp(-t / max(seconds, 1e-6) * 1.2)
    y *= env * amp / max(len(quality_intervals), 1)
    if noise > 0:
        y += noise * rng.standard_normal(y.shape)
    peak = float(np.max(np.abs(y))) + 1e-9
    return (y / peak).astype(np.float32)


def write_wav(path: str, y: np.ndarray, sr: int) -> None:
    """Сохранить моно/стерео float-сигнал в WAV (для демо и фикстур)."""
    sf.write(str(path), y, sr)
