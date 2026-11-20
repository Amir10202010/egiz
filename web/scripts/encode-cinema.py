"""Derive web renditions of the landing film from the 4K masters.

Masters live in web/media-src/cinematic/<group>/<name>.mp4 (not committed). For each clip this writes
into web/public/media/cinematic/<group>/:
  <name>-1080.mp4  1920x1080, CRF 24 capped at 4 Mbit/s (~4 MB per 8 s clip)   desktop
  <name>-720.mp4   1280x720,  CRF 25 capped at 2 Mbit/s (~2 MB per 8 s clip)   phones
The cap matters: the page downloads every clip up front, and the film sits behind text, so
24 Mbit/s 'visually lossless' renditions only made the site stall (Vercel serves ~0.4 MB/s per file).
  <name>.jpg       first frame, 1920 px     (poster while the video loads)
  <name>-end.jpg   last frame,  1920 px     (held when the film hands off)
Scroll-scrubbed clips get a keyframe every 12 frames (0.5 s) so seeking to any scroll position is instant;
played clips keep normal GOPs and their audio (it plays only when the visitor turns sound on).

Usage:  python web/scripts/encode-cinema.py [name ...]
AI-assisted implementation; human review pending.
"""
import pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
import os
SRC = pathlib.Path(os.environ['EGIZ_MASTERS']) if os.environ.get('EGIZ_MASTERS') else ROOT / 'media-src' / 'cinematic'
# without the 4K masters, re-derive from the committed 1440p renditions (EGIZ_MASTERS=1440)
OUT = ROOT / 'public' / 'media' / 'cinematic'
CLIPS = {  # name: (group, scrubbed)
    's1-arrival': ('hero', True), 's2-twin': ('earth', True), 's3-return': ('moon', True),
    's4-passage': ('transitions', True), 's5-jezero': ('mars', True), 's6-answer': ('missions', True),
    's7-home': ('orbital', True),
}


def ffmpeg_exe():
    exe = shutil.which('ffmpeg')
    if exe: return exe
    import imageio_ffmpeg  # bundled binary fallback
    return imageio_ffmpeg.get_ffmpeg_exe()


def run(*args):
    subprocess.run([ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], check=True)


def encode(name):
    group, scrub = CLIPS[name]
    src = OUT / group / f'{name}-1440.mp4' if os.environ.get('EGIZ_MASTERS') == '1440' else SRC / group / f'{name}.mp4'
    if not src.exists():
        print(f'skip {name}: no master at {src}'); return
    dst = OUT / group; dst.mkdir(parents=True, exist_ok=True)
    gop = ['-g', '12', '-keyint_min', '12', '-sc_threshold', '0'] if scrub else ['-g', '48']
    audio = ['-an'] if scrub else ['-c:a', 'aac', '-b:a', '160k']
    for height, width, crf, cap in ((1080, 1920, 24, 4), (720, 1280, 25, 2)):
        run('-i', src, '-vf', f'scale={width}:{height}:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', crf,
            '-maxrate', f'{cap}M', '-bufsize', f'{cap * 2}M',
            '-profile:v', 'high', '-pix_fmt', 'yuv420p', *gop, *audio, '-movflags', '+faststart', dst / f'{name}-{height}.mp4')
    if src.name.endswith('-1440.mp4'): return print(f'{name}: re-encoded from 1440p', flush=True)
    run('-i', src, '-vf', 'select=eq(n\\,0),scale=1920:-2:flags=lanczos', '-frames:v', '1', '-q:v', '2', dst / f'{name}.jpg')
    run('-sseof', '-0.2', '-i', src, '-update', '1', '-vf', 'scale=1920:-2:flags=lanczos', '-q:v', '2', dst / f'{name}-end.jpg')
    sizes = ', '.join(f'{p.name} {p.stat().st_size / 1e6:.1f} MB' for p in sorted(dst.glob(f'{name}*')))
    print(f'{name}: {sizes}', flush=True)


if __name__ == '__main__':
    for n in (sys.argv[1:] or CLIPS):
        encode(n)
