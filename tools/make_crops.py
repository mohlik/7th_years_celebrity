"""Нарезает оригиналы из assets/ в готовые кропы assets/img/*.webp.

Запуск из корня проекта:  python tools/make_crops.py
Нужен Pillow:             pip install pillow

Каждая запись в CROPS:
  name   — имя выходного файла (без расширения)
  src    — номер фото в assets/ (photo_<N>_...webp)
  aspect — соотношение сторон кропа (ширина / высота)
  focus  — точка, вокруг которой центрируется кадр (доли 0..1 по x и y)
  at     — (необязательно) где в кадре окажется focus, по умолчанию по центру;
           в веере боковые фото наполовину закрыты центральным, поэтому
           героиню сдвигаем к внешнему краю: левое фото ~0.38, правое ~0.62
  zoom   — 1 = максимально возможный кадр, >1 = приблизить
  width  — ширина результата в пикселях (меньше исходника — не увеличиваем)
  box    — (необязательно) сначала вырезать область (x0, y0, x1, y1) в пикселях
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets"
OUT_DIR = ROOT / "assets" / "img"

CARD = 4 / 5

CROPS = [
    # hero: панорама внутри цифры «7» + финальный кадр
    dict(name="hero-bay", src=2, aspect=None, width=1800),
    dict(name="finale", src=2, aspect=1, focus=(0.57, 0.5), width=1100),
    # 1 — улыбка
    dict(name="smile-1", src=16, aspect=CARD, focus=(0.5, 0.5), at=(0.4, 0.42), zoom=1.25, width=900),
    dict(name="smile-2", src=6, aspect=CARD, focus=(0.63, 0.5), width=900),
    dict(name="smile-3", src=9, aspect=CARD, focus=(0.76, 0.45), at=(0.62, 0.45), width=900),
    # 2 — путешествия
    dict(name="travel-1", src=1, aspect=CARD, focus=(0.39, 0.45), at=(0.38, 0.45), width=900),
    dict(name="travel-2", src=7, aspect=CARD, focus=(0.6, 0.6), width=900),
    dict(name="travel-3", src=8, aspect=CARD, focus=(0.385, 0.57), at=(0.62, 0.5), zoom=1.55, width=900),
    # 3 — дурачества
    dict(name="fun-1", src=12, aspect=CARD, focus=(0.5, 0.43), at=(0.4, 0.42), zoom=1.25, width=900),
    dict(name="fun-2", src=17, aspect=CARD, focus=(0.55, 0.37), width=900),
    dict(name="fun-3", src=4, aspect=CARD, focus=(0.55, 0.4), at=(0.62, 0.36), zoom=1.25, width=900),
    # 4 — лето и радость (pool-* — из сторис-коллажа, без интерфейса Instagram)
    dict(name="summer-3", src=14, aspect=CARD, focus=(0.4, 0.45), at=(0.4, 0.4), zoom=1.15, width=900),
    dict(name="summer-2", src=11, aspect=CARD, focus=(0.45, 0.53), width=900),
    dict(name="pool-1", src=5, box=(0, 320, 1182, 1170), aspect=CARD, focus=(0.46, 0.5), at=(0.62, 0.5), width=900),
    dict(name="pool-2", src=5, box=(0, 1265, 1182, 2265), aspect=CARD, focus=(0.54, 0.45), width=900),
    # 5 — открытость миру
    dict(name="open-1", src=15, aspect=3 / 4, focus=(0.5, 0.5), width=1000),
    dict(name="open-2", src=3, aspect=3 / 4, focus=(0.5, 0.54), width=1000),
    # 6 — нежность (арка)
    dict(name="tender", src=13, aspect=2 / 3, focus=(0.45, 0.39), width=1100),
    # 7 — вечер (во весь экран)
    dict(name="evening", src=10, aspect=None, width=1200),
]


def find_src(n):
    return next(SRC_DIR.glob(f"photo_{n}_*.webp"))


def crop(im, aspect, focus=(0.5, 0.5), zoom=1.0, at=(0.5, 0.5)):
    W, H = im.size
    if W / H > aspect:
        h = H
        w = H * aspect
    else:
        w = W
        h = W / aspect
    w, h = w / zoom, h / zoom
    cx, cy = focus[0] * W, focus[1] * H
    x0 = min(max(cx - w * at[0], 0), W - w)
    y0 = min(max(cy - h * at[1], 0), H - h)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for c in CROPS:
        im = Image.open(find_src(c["src"])).convert("RGB")
        if c.get("box"):
            im = im.crop(c["box"])
        if c.get("aspect"):
            im = crop(im, c["aspect"], c.get("focus", (0.5, 0.5)), c.get("zoom", 1.0), c.get("at", (0.5, 0.5)))
        if im.width > c["width"]:
            im = im.resize((c["width"], round(im.height * c["width"] / im.width)), Image.LANCZOS)
        out = OUT_DIR / f"{c['name']}.webp"
        im.save(out, "WEBP", quality=82, method=6)
        print(f"{out.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
