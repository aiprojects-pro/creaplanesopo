#!/usr/bin/env python3
# make_icons.py — genera los iconos de línea (PNG) en cian y navy para los planes.
# Requiere cairosvg: pip install cairosvg --break-system-packages
import os, cairosvg

CYAN = "#16A6D9"
NAVY = "#0E3A4F"

os.makedirs("icons", exist_ok=True)

icons = {
 "doc":      '<rect x="16" y="10" width="24" height="36" rx="2"/><line x1="21" y1="20" x2="35" y2="20"/><line x1="21" y1="27" x2="35" y2="27"/><line x1="21" y1="34" x2="30" y2="34"/>',
 "audio":    '<path d="M14 23 H20 L28 16 V40 L20 33 H14 Z"/><path d="M33 22 C37 26 37 30 33 34"/><path d="M37 18 C44 25 44 31 37 38"/>',
 "test":     '<rect x="14" y="12" width="28" height="32" rx="2"/><path d="M19 22 l3 3 l5 -6"/><line x1="30" y1="22" x2="37" y2="22"/><path d="M19 33 l3 3 l5 -6"/><line x1="30" y1="33" x2="37" y2="33"/>',
 "chat":     '<rect x="12" y="14" width="32" height="22" rx="3"/><path d="M20 36 L20 43 L28 36"/><circle cx="22" cy="25" r="1.6"/><circle cx="28" cy="25" r="1.6"/><circle cx="34" cy="25" r="1.6"/>',
 "tool":     '<path d="M30 14 a8 8 0 1 0 8 8 l-6 6 -4 -4 6 -6 a8 8 0 0 0 -4 -4 Z"/><line x1="26" y1="26" x2="16" y2="36"/>',
 "calendar": '<rect x="13" y="16" width="30" height="26" rx="2"/><line x1="13" y1="24" x2="43" y2="24"/><line x1="21" y1="12" x2="21" y2="18"/><line x1="35" y1="12" x2="35" y2="18"/><circle cx="22" cy="32" r="1.6"/><circle cx="28" cy="32" r="1.6"/><circle cx="34" cy="32" r="1.6"/>',
 "euro":     '<circle cx="28" cy="28" r="17"/><path d="M34 21 a9 9 0 1 0 0 14"/><line x1="18" y1="26" x2="31" y2="26"/><line x1="18" y1="31" x2="31" y2="31"/>',
 "check":    '<circle cx="28" cy="28" r="17"/><path d="M20 28 l5 6 l11 -13"/>',
 "stack":    '<path d="M28 14 L44 22 L28 30 L12 22 Z"/><path d="M12 30 L28 38 L44 30"/>',
 "target":   '<circle cx="28" cy="28" r="16"/><circle cx="28" cy="28" r="9"/><circle cx="28" cy="28" r="2.5"/>',
 "scale":    '<line x1="28" y1="12" x2="28" y2="44"/><line x1="16" y1="16" x2="40" y2="16"/><path d="M16 16 L11 28 H21 Z"/><path d="M40 16 L35 28 H45 Z"/><line x1="22" y1="44" x2="34" y2="44"/>',
 "info":     '<circle cx="28" cy="28" r="17"/><line x1="28" y1="25" x2="28" y2="37"/><circle cx="28" cy="19" r="1.8"/>',
 "user":     '<circle cx="28" cy="20" r="8"/><path d="M14 44 C14 34 42 34 42 44"/>',
}

def svg(body, color, sw=2.4):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
<g fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>'''

for name, body in icons.items():
    for tag, color in [("cyan", CYAN), ("navy", NAVY)]:
        cairosvg.svg2png(bytestring=svg(body, color).encode(),
                         write_to=f"icons/{name}_{tag}.png",
                         output_width=140, output_height=140)
print("done -", len(icons)*2, "iconos")
