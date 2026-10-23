#!/usr/bin/env python3
"""生成模板自带音效（仅用 Python 标准库）：python3 scripts/make_sfx.py
输出到 public/：click / thud / ding / shimmer / cash / ambient（60 秒低频氛围底）。
whoosh / coin / pop / rise 来自参考模板（其 make_sound.py 生成），不在此重新生成。"""
import math, os, random, struct, wave

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
random.seed(7)

def write(name, samples, sr=SR):
    peak = max(1e-9, max(abs(s) for s in samples))
    k = 0.89 / peak
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * k)) * 32767)) for s in samples))
    print('wrote', name, len(samples) / sr, 's')

def env(t, a, d):
    return (t / a if t < a else math.exp(-(t - a) / d))

def tone(dur, parts, a=0.002, d=0.1, noise=0.0):
    n = int(dur * SR); out = []
    for i in range(n):
        t = i / SR
        s = sum(amp * math.sin(2 * math.pi * f * t) for f, amp in parts)
        s += noise * (random.random() * 2 - 1)
        out.append(s * env(t, a, d))
    return out

def click():
    return tone(0.06, [(2400, .5), (4100, .3)], a=0.0005, d=0.008, noise=0.25)

def thud():
    n = int(0.45 * SR); out = []; ph = 0
    for i in range(n):
        t = i / SR; f = 45 + 110 * math.exp(-t / 0.05); ph += 2 * math.pi * f / SR
        out.append((math.sin(ph) + 0.15 * (random.random() * 2 - 1) * math.exp(-t / 0.02)) * env(t, 0.002, 0.11))
    return out

def ding():
    return tone(1.3, [(1318.5, .6), (2637, .25), (3955, .1), (1975.5, .15)], a=0.002, d=0.35)

def shimmer():
    n = int(1.4 * SR); out = [0.0] * n
    for k in range(18):
        start = int(k * 0.05 * SR); f = 1800 + k * 160 + random.random() * 80
        for i in range(int(0.5 * SR)):
            j = start + i
            if j >= n: break
            t = i / SR
            out[j] += 0.25 * math.sin(2 * math.pi * f * t) * env(t, 0.004, 0.12)
    return [s * min(1, (n - i) / (0.3 * SR)) for i, s in enumerate(out)]

def cash():
    out = click() + [0.0] * int(0.03 * SR) + click()
    out += [0.0] * int(0.05 * SR)
    drawer = [0.4 * (random.random() * 2 - 1) * env(i / SR, 0.01, 0.06) for i in range(int(0.2 * SR))]
    out += drawer
    bell = tone(1.1, [(2093, .55), (4186, .2), (3136, .2)], a=0.001, d=0.25)
    return out + bell

def ambient(dur=60.0, sr=22050):
    n = int(dur * sr); out = []; lp = 0.0
    for i in range(n):
        t = i / sr
        lp += 0.02 * ((random.random() * 2 - 1) - lp)  # 低通噪声，类似远处城市底噪
        s = 0.5 * lp + 0.18 * math.sin(2 * math.pi * 55 * t) * (0.6 + 0.4 * math.sin(2 * math.pi * 0.07 * t)) + 0.1 * math.sin(2 * math.pi * 82.4 * t) * (0.5 + 0.5 * math.sin(2 * math.pi * 0.05 * t + 1))
        fade = min(1, t / 2, (dur - t) / 2)
        out.append(s * fade)
    write('ambient.wav', out, sr)

if __name__ == '__main__':
    write('click.wav', click()); write('thud.wav', thud()); write('ding.wav', ding())
    write('shimmer.wav', shimmer()); write('cash.wav', cash()); ambient()
