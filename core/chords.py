"""Бэкенды распознавания аккордов.

Интерфейс `ChordBackend` единый для всех реализаций; UI/пайплайн не знают о
внутренностях. Реализовано:
  * HmmTemplateBackend — NNLS-хрома + эмиссионные вероятности шаблонов +
    Viterbi с bigram-переходами в диатонике. Baseline всегда доступен (CPU,
    без весов). Идея NNLS-хромa: F. Wierstorf et al., "Chordino" in Sonic
    Visualiser (GPL-приложение; здесь — независимая clean-room реализация по
    опубликованному описанию метода, код не заимствуется).
  * OnnxChordBackend — заглушка интерфейса под BTC-style модель (фаза 3);
    честно поднимает NotImplementedError, если веса не подключены.

BTC (non-causal, ~10 s сегменты) НЕ подходит для live-входа — см. causal-бэкенд
в фазе 6.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

import numpy as np

from core.features import DEFAULT_HOP, chroma_cqt
from core.vocab import PC_TO_NAME, QUALITY_PITCH_CLASSES


@dataclass
class ChordFrame:
    """Один кадр распознавания: время, имя (Harte), уверенность."""

    time: float
    chord: str
    confidence: float


@dataclass
class ChordResult:
    frames: list[ChordFrame]
    backend: str
    hop: int = DEFAULT_HOP
    sr: int = 22050
    meta: dict = field(default_factory=dict)

    def segments(self) -> list[tuple[float, float, str, float]]:
        """Схлопнуть кадры в сегменты [(start, end, chord, mean_conf)]."""
        if not self.frames:
            return []
        segs: list[list] = []
        cur = [self.frames[0].time, self.frames[0].chord, [self.frames[0].confidence]]
        for f in self.frames[1:]:
            if f.chord == cur[1]:
                cur[2].append(f.confidence)
            else:
                segs.append([cur[0], f.time, cur[1], float(np.mean(cur[2]))])
                cur = [f.time, f.chord, [f.confidence]]
        last_t = self.frames[-1].time + self.hop / self.sr
        segs.append([cur[0], last_t, cur[1], float(np.mean(cur[2]))])
        return [(float(s[0]), float(s[1]), str(s[2]), float(s[3])) for s in segs]


# --- словарь состояний baseline ---------------------------------------------
def majmin_vocabulary() -> list[str]:
    """25 классов maj/min (как BTC majmin) + N.C."""
    out = ["N:C"]
    for pc in range(12):
        out.append(PC_TO_NAME[pc])           # major
        out.append(f"{PC_TO_NAME[pc]}:m")    # minor
    return out


def _template(chord: str) -> np.ndarray:
    """Идеальный хроматический шаблон аккорда (по питч-классам quality)."""
    from core.vocab import parse_chord

    c = parse_chord(chord)
    t = np.full(12, 0.05, dtype=np.float64)
    for pc in c.pitch_classes():
        t[pc] = 1.0
    if c.bass is not None:
        t[c.bass] += 0.5
    return t / t.sum()


# Веса «нотных» базисов NNLS: рутка и квинта весят больше (октавные маски и
# гармонические искажения CQT приподнимают терцию/сексту — калибровано на
# синтетике tests/test_chords.py).
_PC_WEIGHTS = {0: 1.0, 3: 0.75, 4: 0.75, 7: 0.9}


def chord_basis(templates_or_vocab) -> np.ndarray:
    """Матрица [12, n_states]: нотные базисы аккордов для NNLS."""
    cols = []
    for item in templates_or_vocab:
        if isinstance(item, str):
            from core.vocab import parse_chord

            c = parse_chord(item)
            pcs = c.pitch_classes() or set(range(12))  # N.C. -> все ПК
            col = np.array([_PC_WEIGHTS.get((pc - c.root) % 12 if not c.is_no_chord else 0, 0.8)
                            if pc in pcs else 0.0 for pc in range(12)], dtype=np.float64)
        else:  # уже вектор
            col = np.asarray(item, dtype=np.float64)
        cols.append(col / (np.linalg.norm(col) + 1e-9))
    return np.stack(cols, axis=1)


def nnls_chroma(chroma: np.ndarray, basis: np.ndarray) -> np.ndarray:
    """NNLS-оценка профиля питч-классов из хромы (идея Chordino, clean-room).

    A = нотные базисы аккордов словаря; для каждого кадра решается
    min ||A x − b||, x >= 0; оценка чистого профиля = A @ x.
    """
    from scipy.optimize import nnls

    A = np.asarray(basis, dtype=np.float64)
    est = np.zeros((chroma.shape[0], chroma.shape[1]), dtype=np.float64)
    for i in range(chroma.shape[1]):
        x, _ = nnls(A, chroma[:, i].astype(np.float64))
        est[:, i] = A @ x
    norms = est.max(axis=0, keepdims=True)
    norms[norms <= 1e-9] = 1.0
    return est / norms


class ChordBackend(Protocol):
    name: str
    is_causal: bool

    def analyze(self, y: np.ndarray, sr: int) -> ChordResult: ...


class HmmTemplateBackend:
    """Baseline: NNLS-хрома + эмиссия шаблонов + Viterbi (bigram в тональности).

    Параметры подобраны на синтетике (tests/fixtures); на реальном материале
    ожидаемо уступает ONNX-модели (критерий приёмки фазы 3 это проверяет).
    """

    name = "hmm-template"
    is_causal = False

    def __init__(self, vocabulary: list[str] | None = None, emission_scale: float = 24.0,
                 self_stickiness: float = 1.5) -> None:
        self.vocabulary = vocabulary or majmin_vocabulary()
        self.templates = np.stack([_template(c) for c in self.vocabulary])
        self.emission_scale = emission_scale
        self.self_stickiness = self_stickiness

    # --- эмиссия -------------------------------------------------------------
    def emission_logprobs(self, chroma: np.ndarray) -> np.ndarray:
        est = nnls_chroma(chroma, self.templates)
        sim = self.templates @ est / (
            np.linalg.norm(self.templates, axis=1, keepdims=True)
            * np.linalg.norm(est, axis=0, keepdims=True) + 1e-9
        )  # [n_states, n_frames]
        # Softmax с температурой: похожие аккорды получают разделённые вероятности.
        logits = self.emission_scale * sim
        logits -= logits.max(axis=0, keepdims=True)
        p = np.exp(logits)
        p /= p.sum(axis=0, keepdims=True)
        return np.log(p + 1e-12)

    # --- переходы ------------------------------------------------------------
    def _transition_matrix(self) -> np.ndarray:
        n = len(self.vocabulary)
        A = np.full((n, n), -6.0, dtype=np.float64)      # редкая смена аккорда
        np.fill_diagonal(A, -self.self_stickiness)
        # Диатонические соседства: дешёвые переходы между аккордами,
        # имеющими общие питч-классы (считаем по шаблонам).
        common = self.templates @ self.templates.T
        common /= common.max()
        A += 3.0 * common
        # N.C. переходит куда угодно умеренно дёшево.
        A[0, :] = np.maximum(A[0, :], -1.0)
        A[:, 0] = np.maximum(A[:, 0], -1.0)
        A -= np.log(np.exp(A).sum(axis=1, keepdims=True) + 1e-12)
        return A

    # --- Viterbi ---------------------------------------------------------------
    def viterbi(self, log_emit: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        n_states, n_frames = log_emit.shape
        A = self._transition_matrix()
        delta = np.full((n_states, n_frames), -np.inf)
        psi = np.zeros((n_states, n_frames), dtype=np.int32)
        pi = np.full(n_states, -np.log(n_states))
        delta[:, 0] = pi + log_emit[:, 0]
        for t in range(1, n_frames):
            scores = delta[:, t - 1][None, :] + A  # [prev, cur]
            psi[:, t] = np.argmax(scores, axis=0)
            delta[:, t] = scores[psi[:, t], np.arange(n_states)] + log_emit[:, t]
        path = np.zeros(n_frames, dtype=np.int32)
        path[-1] = int(np.argmax(delta[:, -1]))
        post = np.exp(delta - delta.max(axis=0, keepdims=True))
        post /= post.sum(axis=0, keepdims=True)
        conf = post[path, np.arange(n_frames)]
        for t in range(n_frames - 2, -1, -1):
            path[t] = psi[path[t + 1], t + 1]
        return path, conf.astype(np.float32)

    def analyze(self, y: np.ndarray, sr: int) -> ChordResult:
        chroma = chroma_cqt(y, sr, hop=self.hop_length(sr))
        log_emit = self.emission_logprobs(chroma)
        path, conf = self.viterbi(log_emit)
        hop = self.hop_length(sr)
        frames = [
            ChordFrame(time=i * hop / sr, chord=self.vocabulary[s], confidence=float(c))
            for i, (s, c) in enumerate(zip(path, conf))
        ]
        return ChordResult(frames=frames, backend=self.name, hop=hop, sr=sr)

    @staticmethod
    def hop_length(sr: int) -> int:
        # Фиксируем временной шаг ~23 мс независимо от sr.
        return max(1, int(round(DEFAULT_HOP * sr / 22050)))


class OnnxChordBackend:
    """BTC-style ONNX бэкенд — ПЛАНИРУЕТСЯ (фаза 3).

    Честная заглушка: без файла весов и скрипта экспорта не работает.
    См. models/registry.py и tools/export_onnx_btc.py (фаза 3).
    """

    name = "onnx-btc"
    is_causal = False

    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = model_path

    def analyze(self, y: np.ndarray, sr: int) -> ChordResult:
        raise NotImplementedError(
            "ONNX-бэкенд появится в фазе 3 (экспорт BTC -> ONNX + словари). "
            "Используйте hmm-template baseline."
        )


BACKENDS: dict[str, type | object] = {
    "hmm-template": HmmTemplateBackend,
    "onnx-btc": OnnxChordBackend,
}
