"""目立たない版（ホーム画面で「ルーレット」と表示する版）のアイコンと、起動画面の画像を作る。
通常アイコンから「偏」の字を除いた、8 等分の普通のルーレット。
起動画面は端末のモードに関係なく 1 枚しか持てないので、どちらのモードでもこれを使う（目立たない版で「偏」が一瞬出ないように）。
  python3 assets/icon-plain/generate.py
"""
import math, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
PEACH = (246, 187, 148, 255)
S = 4  # 縁を滑らかにするため 4 倍で描いて縮める


def wheel(size, cx, cy, r, bg, fill, line, dot, mono=False):
    im = Image.new('RGBA', (size * S, size * S), bg)
    d = ImageDraw.Draw(im)
    cx, cy, r = cx * S, cy * S, r * S
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)
    if not mono:
        for k in range(8):
            a = math.pi / 4 * k
            d.line([cx, cy, cx + r * math.cos(a), cy + r * math.sin(a)], fill=line, width=3 * S)
    dr = r * 78 / 428
    d.ellipse([cx - dr - 3 * S, cy - dr - 3 * S, cx + dr + 3 * S, cy + dr + 3 * S], fill=line)
    d.ellipse([cx - dr, cy - dr, cx + dr, cy + dr], fill=dot)
    return im.resize((size, size), Image.LANCZOS)


white = (255, 255, 255, 255)
clear = (0, 0, 0, 0)
black = (0, 0, 0, 255)
wheel(1024, 513, 513, 428, white, PEACH, white, black).convert('RGB').save(os.path.join(HERE, 'icon.png'))
wheel(1024, 512, 512, 310, clear, PEACH, white, black).save(os.path.join(HERE, 'android-foreground.png'))
# モノクロ（Android 13 のテーマアイコン）: 円と中心の穴だけ
wheel(1024, 512, 512, 304, clear, black, clear, clear, mono=True).save(os.path.join(HERE, 'android-monochrome.png'))
# 起動画面（app.json の expo-splash-screen）。背景は透過
wheel(1024, 512, 512, 497, clear, PEACH, white, black).save(os.path.join(HERE, 'splash.png'))
