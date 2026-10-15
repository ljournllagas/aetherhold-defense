#!/usr/bin/env python3
"""Encode PNG game art as lossy WebP beside the source (additive only).

Usage: python3 tools/optimize-art.py <file-or-dir>...
Pixel dimensions are unchanged so spritesheet frame maths keep working.
Existing .webp outputs are never overwritten and sources are never removed.
"""
import os, sys
from PIL import Image

def encode(src, dst):
    im = Image.open(src)
    has_alpha = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
    im = im.convert('RGBA' if has_alpha else 'RGB')
    im.save(dst, 'WEBP', quality=90 if has_alpha else 86, method=5, alpha_quality=100)

def main(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for r, _, fs in os.walk(p):
                files += [os.path.join(r, f) for f in fs if f.endswith('.png')]
        elif p.endswith('.png'):
            files.append(p)
    before = after = 0
    for f in sorted(files):
        dst = os.path.splitext(f)[0] + '.webp'
        if os.path.exists(dst): continue
        encode(f, dst)
        before += os.path.getsize(f); after += os.path.getsize(dst)
    print(f'{len(files)} png inputs, {before/1e6:.1f}MB -> {after/1e6:.1f}MB')

if __name__ == '__main__':
    main(sys.argv[1:])
