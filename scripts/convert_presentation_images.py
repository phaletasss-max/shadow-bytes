"""Convierte las diapositivas fuente a WebP optimizado para la Academia SOA.

Conserva los PNG originales en ``img/`` y escribe los assets publicados en
``frontend/public/presentacion/``. Se puede ejecutar de nuevo sin perder las
fuentes de la presentación.
"""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "img"
TARGET_DIR = ROOT / "frontend" / "public" / "presentacion"

SLIDES = {
    "caratula.png": "cover.webp",
    "queesoa.png": "what-is-soa.webp",
    "queesservicio.png": "service.webp",
    "tiposdeservicio.png": "service-types.webp",
    "ciberseguridadenelsoa.png": "security.webp",
    "sincronicoyasincronico.png": "sync-async.webp",
    "caracteristicas.png": "characteristics.webp",
    "buenaspracticasparaeldiseñodelsoa.png": "best-practices.webp",
}


def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    for source_name, target_name in SLIDES.items():
        source_path = SOURCE_DIR / source_name
        target_path = TARGET_DIR / target_name

        with Image.open(source_path) as image:
            width, height = image.size
            image.convert("RGB").save(target_path, "WEBP", quality=82, method=6)

        savings = 100 * (1 - target_path.stat().st_size / source_path.stat().st_size)
        print(
            f"{source_name} -> {target_name} | {width}x{height} | "
            f"{target_path.stat().st_size / 1024:.0f} KiB | ahorro {savings:.1f}%"
        )


if __name__ == "__main__":
    main()
