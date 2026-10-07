"""Модель документа и файл проекта `.gkor`.

Формат: zip-архив (JSON манифест + сегменты), `schema_version` с функциями
миграции. Пути к медиа храним относительными к проекту; абсолютные — только
как fallback с явной пометкой (переносимость). Автосейв/восстановление после
краша добавляются в этом же модуле (60 с интервал задаёт UI).
"""
from __future__ import annotations

import json
import zipfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1


@dataclass
class ChordSegment:
    start: float
    end: float
    chord: str          # имя в нотации Харте ("A:m", "C", "N:C")
    confidence: float = 1.0
    bass: str | None = None
    voicing: list[int] | None = None  # аппликатура (фаза 5)


@dataclass
class AnalysisDoc:
    """Единственный источник правды для timeline/шеи/tab/экспорта."""

    media_path: str | None = None
    sample_rate: int = 22050
    duration: float = 0.0
    bpm: float | None = None
    key: str | None = None
    tuning_offset_cents: float = 0.0
    backend: str = ""
    segments: list[ChordSegment] = field(default_factory=list)
    beat_times: list[float] = field(default_factory=list)
    schema_version: int = SCHEMA_VERSION

    # --- сериализация ------------------------------------------------------
    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["schema_version"] = self.schema_version
        return d

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "AnalysisDoc":
        d = migrate(d)
        segs = [ChordSegment(**s) for s in d.get("segments", [])]
        return cls(
            media_path=d.get("media_path"),
            sample_rate=int(d.get("sample_rate", 22050)),
            duration=float(d.get("duration", 0.0)),
            bpm=d.get("bpm"),
            key=d.get("key"),
            tuning_offset_cents=float(d.get("tuning_offset_cents", 0.0)),
            backend=str(d.get("backend", "")),
            segments=segs,
            beat_times=list(d.get("beat_times", [])),
            schema_version=int(d.get("schema_version", SCHEMA_VERSION)),
        )


def migrate(d: dict[str, Any]) -> dict[str, Any]:
    """Повышать версию схемы словаря до текущей (честные миграции).

    v0 -> v1: старые проекты без `schema_version`, ключ `chords` вместо
    `segments`, времена в мс -> секунды.
    """
    d = dict(d)
    ver = int(d.get("schema_version", 0))
    if ver == 0:
        if "chords" in d and "segments" not in d:
            d["segments"] = [
                {"start": c["start_ms"] / 1000.0, "end": c["end_ms"] / 1000.0,
                 "chord": c["name"], "confidence": float(c.get("conf", 1.0))}
                for c in d["chords"]
            ]
        d.setdefault("beat_times", [])
        ver = 1
    if ver > SCHEMA_VERSION:
        raise ValueError(f"Проект создан более новой версией приложения (schema {ver})")
    d["schema_version"] = SCHEMA_VERSION
    return d


# --- файл проекта ------------------------------------------------------------
MANIFEST_NAME = "project.json"
MEDIA_NAME_IN_ZIP = "media.bin"  # не кладём аудио в проект по умолчанию (размер)


def save_project(doc: AnalysisDoc, path: str | Path) -> None:
    p = Path(path)
    with zipfile.ZipFile(p, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(MANIFEST_NAME, json.dumps(doc.to_dict(), ensure_ascii=False, indent=2))


def load_project(path: str | Path) -> AnalysisDoc:
    p = Path(path)
    with zipfile.ZipFile(p) as z:
        raw = json.loads(z.read(MANIFEST_NAME).decode("utf-8"))
    return AnalysisDoc.from_dict(raw)
