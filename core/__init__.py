"""Гитар КОР (GuitarKOR) — пакет ядра анализа (без Qt-импортов).

Слои:
    core.dsp         — загрузка/декодирование аудио, тюнинг, синты для тестов;
    core.features    — хрома-признаки (CQT/HPCP/CRP);
    core.chords      — бэкенды распознавания (HMM/шаблонный baseline, интерфейс ONNX);
    core.keybeat     — тональность (Krumhansl-Schmuckler) и темп;
    core.vocab       — словарь аккордов / нотация Харте;
    core.fingering   — подбор аппликатуры (Viterbi) — фаза 5 (planned);
    core.project     — модель документа и файл проекта .gkor.

Пакет не должен импортировать Qt: это гарантирует переиспользование в
worker-потоках, батче и тестах.
"""

__version__ = "0.1.0"
TECHNICAL_ID = "GuitarKOR"
DISPLAY_NAME = "Гитар КОР"
FOOTER = "Разработано М. Корягиным"
