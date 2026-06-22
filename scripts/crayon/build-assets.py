import os
from PIL import Image

SRC = "/Users/harvester/Library/Mobile Documents/com~apple~CloudDocs/1. 프로젝트/0. 클로드코드/input/야구서비스"
DST = "/Users/harvester/Library/Mobile Documents/com~apple~CloudDocs/1. 프로젝트/0. 클로드코드/야구서비스/public/assets/players-crayon"
GEN = os.path.join(DST, "_generic")
os.makedirs(GEN, exist_ok=True)

MAX = 1000  # max long edge for web

# input-hash -> (playerId, slot)
MATCHES = {
    "5BJf1kQN": ("78603", "hero"),   # 김선빈  KIM SUN-BIN
    "GrPoaqG2": ("52628", "hero"),   # 한승연  HAN SEUNG-YEON #31
    "I8UAXwtl": ("56613", "hero"),   # 아데를린 ADERLIN #24
    "izMUcvwB": ("55633", "hero"),   # 올러    OLLER
    "sepaJz6X": ("78122", "hero"),   # 김태군  KIM TAE-GUN #42 (catcher)
    "u9m8qHYF": ("78122", "back"),   # 김태군  #42 back
    "Yv0qwajt": ("65653", "hero"),   # 김호령  #27 + 호령
}

# input-hash -> (role, slot)
GENERIC = {
    # batter
    "ojCDYCV8": ("batter", "hero"),    # front, bat, T cap, no number
    "SmZZS8Ud": ("batter", "side"),    # standing, bat over shoulder
    "UJfx3CSb": ("batter", "action"),  # SUPER BATTER swing
    "HjTl91dN": ("batter", "back"),    # back view
    "h6v9GVAD": ("batter", "face"),    # tiger-cap close-up grin
    # pitcher
    "MfQEg2I2": ("pitcher", "hero"),   # front standing, ball
    "O2xnHt8B": ("pitcher", "side"),   # throwing side profile
    "ZLQq8GyY": ("pitcher", "action"), # throwing, ball motion
    "06BGRQ8Z": ("pitcher", "back"),   # back view on mound
    "cxE6S0U7": ("pitcher", "face"),   # tiger-cap fierce close-up
}

def conv(src_hash, dst_path):
    sp = os.path.join(SRC, src_hash + ".jpeg")
    if not os.path.exists(sp):
        sp = os.path.join(SRC, src_hash + ".jpg")
    im = Image.open(sp).convert("RGB")
    w, h = im.size
    s = min(1.0, MAX / max(w, h))
    if s < 1.0:
        im = im.resize((round(w*s), round(h*s)), Image.LANCZOS)
    im.save(dst_path, "PNG")
    return os.path.getsize(dst_path), im.size

print("== matched players ==")
for hsh, (pid, slot) in MATCHES.items():
    out = os.path.join(DST, f"{pid}_{slot}.png")
    sz, dim = conv(hsh, out)
    print(f"{hsh} -> {pid}_{slot}.png  {dim}  {sz//1024}KB")

print("== generic fallbacks ==")
for hsh, (role, slot) in GENERIC.items():
    out = os.path.join(GEN, f"{role}_{slot}.png")
    sz, dim = conv(hsh, out)
    print(f"{hsh} -> _generic/{role}_{slot}.png  {dim}  {sz//1024}KB")

print("DONE")
