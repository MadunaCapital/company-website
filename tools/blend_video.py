"""Re-renders the logo-reveal video so its background IS the page colour.

The source is dark ink on grey paper with a vignette. The first frame is blank
paper, so it serves as a lighting reference: each frame is divided by a blurred
copy of it (flattening the vignette), then everything that is still paper is
set to exactly the page colour and only the strokes keep their tone. The result
blends into the page with no visible frame.

    python tools/blend_video.py <source.mp4> assets/logo-reveal.mp4 assets/logo-reveal-poster.jpg
"""
import subprocess
import sys

import cv2
import numpy as np

PAGE_BGR = np.array([239, 244, 246], np.float32)  # #F6F4EF
# H.264 (BT.709, limited range) decodes this shade ~3 levels darker, so the
# paper is encoded slightly lighter to land exactly on the page colour.
ENCODE_OFFSET = np.array([3, 2, 2], np.float32)
W, H, FPS = 1280, 720, 30


def main(src, out_mp4, out_poster):
    cap = cv2.VideoCapture(src)
    src_fps = cap.get(cv2.CAP_PROP_FPS)
    step = max(1, round(src_fps / FPS))
    ok, first = cap.read()
    if not ok:
        sys.exit("cannot read source")
    plate = cv2.GaussianBlur(cv2.resize(first, (W, H)).astype(np.float32), (0, 0), 40)

    enc = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-tune", "animation",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-movflags", "+faststart", "-an", out_mp4,
    ], stdin=subprocess.PIPE)

    def process(frame):
        f = cv2.resize(frame, (W, H)).astype(np.float32)
        corr = f / plate                      # 1.0 where it's paper, lower where ink
        dark = 1.0 - corr.mean(axis=2, keepdims=True)
        a = np.clip((dark - 0.05) / (0.14 - 0.05), 0, 1)
        a = a * a * (3 - 2 * a)               # smoothstep: paper -> exactly 0
        ink = np.clip(corr, 0, 1.2) * PAGE_BGR
        out = (PAGE_BGR + ENCODE_OFFSET) * (1 - a) + ink * a
        return np.clip(out + 0.5, 0, 255).astype(np.uint8)

    i, last = 0, None
    frame = first
    while True:
        if i % step == 0:
            last = process(frame)
            enc.stdin.write(last.tobytes())
        ok, frame = cap.read()
        if not ok:
            break
        i += 1
    enc.stdin.close()
    enc.wait()
    cv2.imwrite(out_poster, last, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print("frames written:", i // step + 1)


if __name__ == "__main__":
    main(*sys.argv[1:4])
