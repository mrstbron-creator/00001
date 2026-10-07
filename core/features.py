"""Хрома-признаки: CQT-хрома, HPCP (облегчённая), CRP.

Источники идей (см. также docs/CREDITS.md):
  * CQT — T. Fujishima, "Realtime Chord Recognition of Musical Sound" (KDD 1999);
    в коде — обёртка над librosa.feature.chroma_cqt (ISC).
  * HPCP — G. Humansky, C. Fiebrink, "HPCP: A New Feature for Music Recognition
    and Annotation Tasks" (ISMIR 2013). Реализация ниже — независимая
    (clean-room) ОБЛЕГЧЁННАЯ версия: без явной гармонической развёртки и
    median-filtering; статус — experimental, зафиксирован в README.
  * CRP — упрощённый относительный хроматический профиль (log-энергия по ПК).

Все функции возвращают массив [12, n_frames] float32 в диапазоне [0, 1].
"""
from __future__ import annotations

import numpy as np

# --- константы ---------------------------------------------------------------
DEFAULT_HOP = 512      # кадр ~23 мс @22050 Гц — разрешение для смены аккордов
DEFAULT_N_FFT = 4096


def _bin_pitch_classes(freqs: np.ndarray) -> np.ndarray:
    """Индекс питч-класса (0..11) ближайшего полутона для каждой частоты."""
    midi = 69.0 + 12.0 * np.log2(np.maximum(freqs, 1e-6) / 440.0)
    return np.rint(midi).astype(int) % 12


def stft_mag(y: np.ndarray, sr: int, *, n_fft: int = DEFAULT_N_FFT,
             hop: int = DEFAULT_HOP) -> tuple[np.ndarray, np.ndarray]:
    """Магнитудный STFT [freq, frame] и сетка частот бинов."""
    import librosa

    S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop, center=True))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=n_fft)
    return S.astype(np.float32), freqs


def chroma_cqt(y: np.ndarray, sr: int, *, hop: int = DEFAULT_HOP, fmin: float = 65.41) -> np.ndarray:
    """Классическая CQT-хрома (librosa.feature.chroma_cqt, norm=max)."""
    import librosa

    c = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop, fmin=fmin, norm=None)
    return c.astype(np.float32)


def hpcp(y: np.ndarray, sr: int, *, hop: int = DEFAULT_HOP,
         n_fft: int = DEFAULT_N_FFT, lowpass_hz: float = 5000.0) -> np.ndarray:
    """Облегчённая HPCP (experimental): октавные веса + folding по ПК.

    Энергия STFT-бинов складывается в 12 питч-классов с экспоненциальным
    затуханием верхних октав (маскирование низшими октавами — идея статьи).
    Явная гармоническая развёртка и median filter опущены — см. docstring модуля.
    """
    S, freqs = stft_mag(y, sr, n_fft=n_fft, hop=hop)
    power = S.astype(np.float64) ** 2
    keep = freqs <= lowpass_hz
    power, freqs = power[keep], freqs[keep]
    pc = _bin_pitch_classes(freqs)
    oct_idx = np.floor((69.0 + 12.0 * np.log2(np.maximum(freqs, 1e-6) / 440.0)) / 12.0)
    weights = np.exp(-0.35 * np.clip(oct_idx - 2.0, 0.0, None))
    out = np.zeros((12, power.shape[1]), dtype=np.float64)
    np.add.at(out, pc, power * weights[:, None])
    peak = out.max(axis=0, keepdims=True)
    peak[peak <= 1e-12] = 1.0
    return (out / peak).astype(np.float32)


def crp(y: np.ndarray, sr: int, *, hop: int = DEFAULT_HOP, n_fft: int = DEFAULT_N_FFT) -> np.ndarray:
    """CRP — лог-профиль энергии по питч-классам, z-нормировка по кадру.

    Дешёвый признак; используется causal-бэкендом live-входа (фаза 6).
    """
    S, freqs = stft_mag(y, sr, n_fft=n_fft, hop=hop)
    power = S.astype(np.float64) ** 2
    pc = _bin_pitch_classes(freqs)
    out = np.zeros((12, power.shape[1]), dtype=np.float64)
    np.add.at(out, pc, power)
    out = np.log1p(out / (out.max(axis=0, keepdims=True) + 1e-9))
    mu = out.mean(axis=0, keepdims=True)
    sd = out.std(axis=0, keepdims=True) + 1e-9
    z = (out - mu) / sd
    return np.clip(z / 4.0 + 0.5, 0.0, 1.0).astype(np.float32)


def frame_times(n_frames: int, sr: int, hop: int = DEFAULT_HOP) -> np.ndarray:
    """Время центра каждого кадра в секундах (STFT center=True)."""
    return np.arange(n_frames, dtype=np.float64) * hop / sr
