"""Generate the weather x time palettes in assets/ambient/site.css.

Model: the time-of-day PHASE (dawn, day, dusk, night) owns the neutrals (lightness and warmth of
bg, surface, text); the WEATHER class owns the accent hue and how saturated everything is. Each of
4 phases x 7 weather classes x 2 modes (light, dark) = 56 states gets 11 colour tokens.

Every colour is built in OKLCH (perceptual lightness L in 0..1, chroma C, hue h in degrees) and
rounded to sRGB hex, reducing chroma at fixed L and h when a colour falls outside sRGB. Foreground
lightness is found by bisection so that the WCAG 2.x contrast ratio against the state's background
reaches a target; after rounding to hex the ratio is re-measured and nudged until it holds.

borderStrong (outlines of inputs and buttons, WCAG 1.4.11 needs >= 3:1) is first solved against bg
alone, then mixed toward the text colour in sRGB steps of 0.01 until it is >= 3:1 against bg,
surface AND codeBg (a control can sit on any of the three).

Usage (from the repo root):
  python3 -I bin/build_palette.py                          check only; prints states=56 failures=N
  python3 -I bin/build_palette.py --write assets/ambient/site.css
                                                           also replace the block between the
                                                           BEGIN/END GENERATED markers in that file
  python3 -I bin/build_palette.py --json                   print the 56-state table as JSON
Exit status 1 if any contrast check fails or any bg/surface/codeBg is pure #ffffff or #000000.
"""

import json
import math
import sys

# ----------------------------------------------------------------------------- colour maths


def srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def linear_to_srgb(c: float) -> float:
    return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055


def oklch_to_linear_rgb(L: float, C: float, h: float):
    """OKLCH -> linear sRGB (Bjorn Ottosson's OKLab matrices)."""
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    return (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )


def in_gamut(rgb) -> bool:
    return all(-1e-6 <= c <= 1 + 1e-6 for c in rgb)


def oklch_to_hex(L: float, C: float, h: float) -> str:
    """Gamut-map by reducing chroma at fixed L and h (keeps lightness, so contrast is predictable)."""
    lo, hi = 0.0, C
    rgb = oklch_to_linear_rgb(L, C, h)
    if not in_gamut(rgb):
        for _ in range(30):
            mid = (lo + hi) / 2
            if in_gamut(oklch_to_linear_rgb(L, mid, h)):
                lo = mid
            else:
                hi = mid
        rgb = oklch_to_linear_rgb(L, lo, h)
    return "#" + "".join(f"{round(max(0, min(1, linear_to_srgb(max(0.0, c)))) * 255):02x}" for c in rgb)


def hex_to_rgb(hx: str):
    return [int(hx[i : i + 2], 16) for i in (1, 3, 5)]


def luminance(hx: str) -> float:
    """WCAG 2.x relative luminance."""
    r, g, b = (srgb_to_linear(v / 255) for v in hex_to_rgb(hx))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    """WCAG 2.x contrast ratio, 1..21."""
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def mix(a: str, b: str, t: float) -> str:
    """sRGB mix like CSS color-mix(in srgb, a (1-t), b t)."""
    A, B = hex_to_rgb(a), hex_to_rgb(b)
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(A, B))


def mix_toward(target: str, base: str, t: float) -> str:
    """t of target plus (1 - t) of base, in sRGB (the borderStrong fix)."""
    A, B = hex_to_rgb(target), hex_to_rgb(base)
    return "#" + "".join(f"{round(A[i] * t + B[i] * (1 - t)):02x}" for i in range(3))


def solve(bg: str, target: float, C: float, h: float, darker: bool) -> str:
    """Closest-to-bg colour at (C, h) whose contrast against bg is >= target.

    darker=True searches below the background (light mode), False above it (dark mode).
    Invariant of the bisection: ok(good) is True, ok(bad) is False.
    """
    ok = lambda L: contrast(oklch_to_hex(L, C, h), bg) >= target  # noqa: E731
    good, bad = (0.0, 1.0) if darker else (1.0, 0.0)
    for _ in range(40):
        mid = (good + bad) / 2
        if ok(mid):
            good = mid
        else:
            bad = mid
    step = -0.001 if darker else 0.001
    while not ok(good):  # guard against hex rounding
        good += step
    return oklch_to_hex(good, C, h)


# ------------------------------------------------------------------------------- design data

PHASES = ["dawn", "day", "dusk", "night"]
WEATHERS = ["clear", "partly", "overcast", "rain", "snow", "fog", "storm"]

PHASE_TINT = {"dawn": 35, "day": 95, "dusk": 65, "night": 70}  # OKLCH hue of the neutrals

# Accent hue per (weather, phase); None = the phase's own accent hue.
PHASE_ACCENT = {"dawn": 10, "day": 245, "dusk": 45, "night": 75}  # rose, sky blue, terracotta, amber
WEATHER_ACCENT = {
    "clear": None,
    "partly": None,
    "overcast": None,
    "fog": None,
    "rain": {"dawn": 250, "day": 230, "dusk": 250, "night": 220},  # blue / teal-blue
    "snow": {"dawn": 350, "day": 235, "dusk": 300, "night": 235},  # alpenglow pink, ice, lavender, ice
    "storm": {"dawn": 295, "day": 285, "dusk": 310, "night": 290},  # indigo / plum
}

# tint_c and acc_c multiply chroma; dL shifts page lightness (light mode; half of it in dark mode).
WEATHER = {
    "clear": {"tint_c": 1.00, "acc_c": 1.00, "dL": 0.000},
    "partly": {"tint_c": 0.80, "acc_c": 0.80, "dL": -0.003},
    "overcast": {"tint_c": 0.45, "acc_c": 0.45, "dL": -0.008},
    "rain": {"tint_c": 0.60, "acc_c": 0.85, "dL": -0.010},
    "snow": {"tint_c": 0.50, "acc_c": 0.65, "dL": +0.004},
    "fog": {"tint_c": 0.30, "acc_c": 0.35, "dL": -0.004},
    "storm": {"tint_c": 0.60, "acc_c": 0.85, "dL": -0.014},
}

# Mode x phase base numbers. bgL = OKLCH lightness of the page; tintC = its chroma;
# text/muted/accent/link = WCAG contrast targets against bg.
MODE = {
    "light": {
        "dawn": {"bgL": 0.968, "tintC": 0.010, "text": 11.0},
        "day": {"bgL": 0.975, "tintC": 0.008, "text": 12.0},
        "dusk": {"bgL": 0.958, "tintC": 0.016, "text": 10.5},
        "night": {"bgL": 0.935, "tintC": 0.014, "text": 10.0},  # only when the visitor forces light
        "muted": 6.0,
        "accent": 5.7,
        "link": 6.5,
        "accC": 0.12,
        "surfaceDL": +0.012,  # hover fills, menus: slightly lighter than the page
        "codeDL": -0.028,  # code: slightly darker
        "borderDL": -0.095,
    },
    "dark": {
        "dawn": {"bgL": 0.225, "tintC": 0.012, "text": 10.5},
        "day": {"bgL": 0.235, "tintC": 0.010, "text": 11.0},  # only when the visitor forces dark
        "dusk": {"bgL": 0.220, "tintC": 0.011, "text": 10.5},
        "night": {"bgL": 0.205, "tintC": 0.009, "text": 9.5},
        "muted": 5.8,
        "accent": 6.0,
        "link": 7.0,
        "accC": 0.095,
        "surfaceDL": +0.035,
        "codeDL": +0.055,
        "borderDL": +0.115,
    },
}

# The SKY: a fixed gradient behind the page (site.css "sky"), from `sky` at the top of the viewport
# down to bg. Unlike bg, it is meant to be SEEN, so its hue and lightness swing with the phase:
# rose dawn, blue day, apricot dusk, indigo night. Text can scroll over it, so every foreground token
# must still pass against sky, glow and cloud (checks()); fit() walks a colour toward bg until it does.
SKY = {  # (L, C, h) in OKLCH
    "light": {"dawn": (0.905, 0.040, 15), "day": (0.900, 0.042, 235), "dusk": (0.895, 0.055, 60), "night": (0.875, 0.035, 275)},
    "dark": {"dawn": (0.300, 0.045, 330), "day": (0.310, 0.040, 240), "dusk": (0.290, 0.050, 40), "night": (0.258, 0.052, 268)},
}
# Sun or moon glow in the top corner; only visible in clear and partly cloudy weather.
GLOW = {
    "light": {"dawn": (0.955, 0.050, 60), "day": (0.972, 0.035, 95), "dusk": (0.930, 0.085, 50), "night": (0.925, 0.020, 270)},
    "dark": {"dawn": (0.315, 0.060, 40), "day": (0.320, 0.035, 90), "dusk": (0.315, 0.075, 45), "night": (0.300, 0.030, 255)},
}
# Weather pulls the sky: dL (light; dark uses dL_dark), chroma factor, and a hue to blend toward.
SKY_WEATHER = {
    "clear": {"dL": 0.000, "dL_dark": 0.000, "c": 1.00, "h": None, "hw": 0.0, "glow": 1.0},
    "partly": {"dL": -0.005, "dL_dark": 0.005, "c": 0.85, "h": None, "hw": 0.0, "glow": 0.5},
    "overcast": {"dL": -0.020, "dL_dark": 0.020, "c": 0.30, "h": None, "hw": 0.0, "glow": 0.0},
    "rain": {"dL": -0.035, "dL_dark": 0.010, "c": 0.55, "h": 240, "hw": 0.6, "glow": 0.0},
    "snow": {"dL": 0.020, "dL_dark": 0.030, "c": 0.45, "h": 230, "hw": 0.7, "glow": 0.0},
    "fog": {"dL": 0.000, "dL_dark": 0.030, "c": 0.20, "h": None, "hw": 0.0, "glow": 0.0},
    "storm": {"dL": -0.050, "dL_dark": 0.000, "c": 0.65, "h": 285, "hw": 0.7, "glow": 0.0},
}

TOKENS = [
    "bg",
    "surface",
    "text",
    "muted",
    "accent",
    "link",
    "border",
    "borderStrong",
    "codeBg",
    "accentSoft",
    "onAccent",
    "sky",
    "glow",
    "cloud",
]
CSS_NAME = {
    "bg": "bg",
    "surface": "surface",
    "text": "text",
    "muted": "muted",
    "accent": "accent",
    "link": "link",
    "border": "border",
    "borderStrong": "border-strong",
    "codeBg": "code-bg",
    "accentSoft": "accent-soft",
    "onAccent": "on-accent",
    "sky": "sky",
    "glow": "glow",
    "cloud": "cloud",
}

# Minimum contrast of each foreground token against the sky colours (text scrolls over them).
# accent gets 0.2 of headroom: blending the gradient in the browser lands a little off these exact hexes.
SKY_MIN = {"text": 7.0, "muted": 4.5, "accent": 4.7, "link": 4.5}


def blend_hue(h0: float, h1: float, t: float) -> float:
    """Hue t of the way from h0 to h1 along the shorter arc (degrees)."""
    d = ((h1 - h0 + 180) % 360) - 180
    return (h0 + d * t) % 360


def fit(L: float, C: float, h: float, bg_L: float, fg: dict) -> str:
    """The colour at (L, C, h), moved toward the page lightness bg_L in OKLCH steps of 0.004 until
    every foreground in fg meets its SKY_MIN contrast against it."""
    step = 0.004 if bg_L > L else -0.004
    for _ in range(200):
        hx = oklch_to_hex(L, C, h)
        if all(contrast(fg[k], hx) >= SKY_MIN[k] for k in SKY_MIN):
            return hx
        L += step
    raise SystemExit(f"fit: no sky lightness passes at C={C} h={h}")


def build_state(mode: str, phase: str, weather: str) -> dict:
    M, W = MODE[mode], WEATHER[weather]
    base = M[phase]
    tint_h = PHASE_TINT[phase]
    acc_h = (WEATHER_ACCENT[weather] or PHASE_ACCENT)[phase]
    tint_c = base["tintC"] * W["tint_c"]
    bgL = base["bgL"] + (W["dL"] if mode == "light" else W["dL"] * 0.5)

    bg = oklch_to_hex(bgL, tint_c, tint_h)
    surface = oklch_to_hex(bgL + M["surfaceDL"], tint_c * 0.8, tint_h)
    code = oklch_to_hex(bgL + M["codeDL"], tint_c * 1.2, tint_h)
    border = oklch_to_hex(bgL + M["borderDL"], tint_c * 1.5, tint_h)

    darker = mode == "light"

    def worst_bg(t, C, h):
        """Solve against each of bg, surface, codeBg; keep the one that passes on all three."""
        cands = [solve(b, t, C, h, darker) for b in (bg, surface, code)]
        key = (lambda hx: -luminance(hx)) if darker else luminance
        return max(cands, key=key)

    text = solve(bg, base["text"], tint_c * 1.4, tint_h, darker)
    muted = worst_bg(M["muted"] - (0.4 if mode == "light" else 0.3), tint_c * 2.0, tint_h)
    if contrast(muted, bg) < M["muted"]:
        muted = solve(bg, M["muted"], tint_c * 2.0, tint_h, darker)
    acc_c = M["accC"] * W["acc_c"] * (0.85 if phase == "night" and mode == "dark" else 1.0)
    acc_c = max(acc_c, 0.045 if mode == "light" else 0.04)  # keep the accent visibly coloured in fog
    accent = worst_bg(4.6, acc_c, acc_h)
    if contrast(accent, bg) < M["accent"]:
        accent = solve(bg, M["accent"], acc_c, acc_h, darker)
    link = worst_bg(4.6, acc_c * 0.95, acc_h)
    if contrast(link, bg) < M["link"]:
        link = solve(bg, M["link"], acc_c * 0.95, acc_h, darker)

    # borderStrong: >= 3:1 against bg first, then toward text until >= 3:1 on surface and codeBg too.
    bs0 = solve(bg, 3.0, tint_c * 2, tint_h, darker)
    border_strong, t = bs0, 0.0
    while min(contrast(border_strong, x) for x in (bg, surface, code)) < 3.0:
        t += 0.01
        border_strong = mix_toward(text, bs0, t)

    accent_soft = mix(bg, accent, 0.14)  # ::selection fill (text on it stays the text colour)

    # Sky, glow and cloud: see SKY. The page lightness is the direction fit() retreats toward.
    fg = {"text": text, "muted": muted, "accent": accent, "link": link}
    S = SKY_WEATHER[weather]
    sL, sC, sh = SKY[mode][phase]
    sL += S["dL"] if mode == "light" else S["dL_dark"]
    sC *= S["c"]
    if S["h"] is not None:
        sh = blend_hue(sh, S["h"], S["hw"])
    sky = fit(sL, sC, sh, bgL, fg)
    gL, gC, gh = GLOW[mode][phase]
    # 1 = full glow, 0 = the glow is the sky itself (hidden behind cloud). Partial glow mixes in sRGB:
    # going round the hue circle from blue sky to yellow sun would pass through green.
    g = S["glow"]
    glow = mix(sky, fit(gL, gC, gh, bgL, fg), g) if g else sky
    # Clouds sit a little lighter than the sky (darker in storms, light mode), and greyer.
    cdL = (-0.035 if weather == "storm" else 0.035) if mode == "light" else 0.040
    cloud = fit(sL + cdL, sC * 0.4, sh, bgL, fg)
    return {
        "bg": bg,
        "surface": surface,
        "text": text,
        "muted": muted,
        "accent": accent,
        "border": border,
        "link": link,
        "codeBg": code,
        "borderStrong": border_strong,
        "accentSoft": accent_soft,
        "onAccent": bg,  # text on an accent fill: the page colour
        "sky": sky,
        "glow": glow,
        "cloud": cloud,
    }


def checks(p: dict):
    """(label, ratio, minimum, maximum) for every pairing the stylesheet uses."""
    out = [
        ("text/bg", contrast(p["text"], p["bg"]), 8.0, 14.0),
        ("text/surface", contrast(p["text"], p["surface"]), 8.0, 15.0),
        ("text/codeBg", contrast(p["text"], p["codeBg"]), 7.0, 15.0),
        ("text/accentSoft", contrast(p["text"], p["accentSoft"]), 7.0, 15.0),
    ]
    for name in ("muted", "accent", "link"):
        for b in ("bg", "surface", "codeBg"):
            out.append((f"{name}/{b}", contrast(p[name], p[b]), 4.5, 99))
    out.append(("accent/accentSoft", contrast(p["accent"], p["accentSoft"]), 4.5, 99))
    out.append(("onAccent/accent", contrast(p["onAccent"], p["accent"]), 4.5, 99))
    for b in ("bg", "surface", "codeBg"):
        out.append((f"borderStrong/{b}", contrast(p["borderStrong"], p[b]), 3.0, 99))
    out.append(("border/bg (decorative)", contrast(p["border"], p["bg"]), 1.15, 2.2))
    for name, lo in SKY_MIN.items():
        for b in ("sky", "glow", "cloud"):
            out.append((f"{name}/{b}", contrast(p[name], p[b]), lo, 99))
    return out


def oklab_distance(a: str, b: str) -> float:
    """Euclidean distance in OKLab (about 0.02 is a just-visible difference between flat areas)."""

    def lab(hx):
        r, g, b_ = (srgb_to_linear(v / 255) for v in hex_to_rgb(hx))
        l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b_) ** (1 / 3)
        m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b_) ** (1 / 3)
        s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b_) ** (1 / 3)
        return (
            0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
        )

    return math.dist(lab(a), lab(b))


def build_table():
    table, failures = {}, []
    for mode in ("light", "dark"):
        for phase in PHASES:
            for weather in WEATHERS:
                key = f"{mode}.{phase}.{weather}"
                p = build_state(mode, phase, weather)
                table[key] = p
                for lab, v, lo, hi in checks(p):
                    if not (lo <= v <= hi):
                        failures.append(f"{key} {lab} = {v:.2f} not in [{lo}, {hi}]")
                for tok in ("bg", "surface", "codeBg"):
                    if p[tok].lower() in ("#ffffff", "#000000"):
                        failures.append(f"{key} {tok} is pure {p[tok]}")
    return table, failures


BEGIN = "/* BEGIN GENERATED by bin/build_palette.py: do not edit by hand */"
END = "/* END GENERATED */"


def css_block(table: dict) -> str:
    """One rule per state. The phase-only rule carries the CLEAR values; each of the 6 other
    weather classes overrides it with one more attribute (0,3,1 beats 0,2,1). Light rules require
    [data-theme="light"]: if theme.js never set data-theme (blocked localStorage), the static
    :root / OS-dark palette applies instead of a light phase palette."""
    lines = [
        BEGIN,
        "/* 4 phases x 7 weather classes x 2 modes = 56 states; html[data-amb-phase] and html[data-amb-wx] are set by",
        "   the inline boot in _config.yml footer_text and by ambient.js, html[data-theme] by the gem's theme.js. */",
    ]
    for key, p in table.items():
        mode, phase, weather = key.split(".")
        wx = "" if weather == "clear" else f'[data-amb-wx="{weather}"]'
        lines.append(f'html[data-amb-phase="{phase}"]{wx}[data-theme="{mode}"] {{')
        for k in TOKENS:
            lines.append(f"  --amb-{CSS_NAME[k]}: {p[k]};")
        lines.append("}")
    lines.append(END)
    return "\n".join(lines)


def splice(path: str, block: str) -> None:
    src = open(path, encoding="utf-8").read()
    i, j = src.find(BEGIN), src.find(END)
    if i < 0 or j < i:
        raise SystemExit(f"{path}: markers not found:\n  {BEGIN}\n  {END}")
    out = src[:i] + block + src[j + len(END) :]
    with open(path, "w", encoding="utf-8") as f:
        f.write(out)


def main(argv) -> int:
    table, failures = build_table()
    if "--json" in argv:
        print(json.dumps(table, indent=1))
    else:
        print(f"states={len(table)} failures={len(failures)}")
        for x in failures[:40]:
            print("  FAIL", x)
    if "--write" in argv:
        path = argv[argv.index("--write") + 1]
        if failures:
            print("not writing: fix the failures first", file=sys.stderr)
        else:
            splice(path, css_block(table))
            print(f"wrote {len(table)} rules into {path}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
