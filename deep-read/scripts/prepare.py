#!/usr/bin/env python3
"""Turn a long source into a reading copy that can be read chunk by chunk, plus a chunk plan.

Usage:
  prepare.py <input file> [--out DIR] [--width 200] [--chunk-tokens 15000]

- .srt / .vtt: strips cue numbers and timestamps, merges the repeated lines of rolling
  captions, writes transcript.txt as paragraphs each starting with [HH:MM:SS], then
  builds read.txt from it.
- Other plain text (.txt / .md etc.): builds read.txt directly.
- Every line of read.txt is at most --width characters; existing blank lines are kept.
- Finally prints the longest original line, line count, estimated tokens, and the Read
  parameters (offset / limit) for each chunk.

Where the defaults come from:
- width=200: Read can only split by line. Transcripts often put a whole paragraph on one
  line, and a file with no line breaks is a single line; a line that is too long cannot be
  chunked. Wrapping to 200 characters makes any source splittable, and one line holds
  only a sentence or two, so notes can cite the source by line number precisely.
- chunk-tokens=15000: a single Read errors above ~25k tokens (Claude Code). 15k leaves
  margin because the token estimate below is approximate. If Read still reports the
  limit, lower this value and rerun.
"""
import argparse
import os
import re
import sys
import textwrap

TIME = re.compile(r'(\d{1,2}):(\d{2}):(\d{2})[,.]\d{3}\s*-->')
TAG = re.compile(r'<[^>]+>')


def est_tokens(s):
    """Rough token estimate: ~4 ASCII characters per token, ~1 CJK (non-ASCII) character per token."""
    ascii_n = sum(1 for c in s if ord(c) < 128)
    return ascii_n / 4 + (len(s) - ascii_n)


def parse_subtitles(raw):
    """Return [(start HH:MM:SS, text)], dropping consecutive duplicate lines (rolling captions repeat the previous line)."""
    cues, start, buf, last = [], None, [], None
    for line in raw.splitlines() + ['']:
        line = line.strip()
        m = TIME.match(line)
        if m:
            start = '%02d:%s:%s' % (int(m.group(1)), m.group(2), m.group(3))
            continue
        if not line:
            if start and buf:
                cues.append((start, ' '.join(buf)))
            start, buf = None, []
            continue
        if start is None:  # cue numbers, WEBVTT header, NOTE, style blocks
            continue
        text = TAG.sub('', line).strip()
        if text and text != last:
            buf.append(text)
            last = text
    return cues


def paragraphs(cues, min_chars=600):
    """Break a paragraph once it is long enough (~100 English words) and the last cue ends a sentence."""
    out, cur, start = [], [], None
    for ts, text in cues:
        if start is None:
            start = ts
        if cur and len(' '.join(cur)) >= min_chars and cur[-1].rstrip().endswith(('.', '?', '!', '。', '？', '！')):
            out.append('[%s] %s' % (start, ' '.join(cur)))
            cur, start = [], ts
        cur.append(text)
    if cur:
        out.append('[%s] %s' % (start, ' '.join(cur)))
    return '\n\n'.join(out) + '\n'


def fold(text, width):
    lines = []
    for line in text.splitlines():
        if len(line) <= width:
            lines.append(line)
        else:
            lines.extend(textwrap.wrap(line, width, break_on_hyphens=False) or [''])
    return lines


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--out', default='.')
    ap.add_argument('--width', type=int, default=200)
    ap.add_argument('--chunk-tokens', type=int, default=15000)
    a = ap.parse_args()

    if not os.path.isfile(a.src):
        sys.exit('File not found: %s' % a.src)
    raw = open(a.src, encoding='utf-8-sig', errors='replace').read()
    if not raw.strip():
        sys.exit('File is empty: %s' % a.src)
    os.makedirs(a.out, exist_ok=True)
    print('Source: %s' % a.src)
    print('Longest original line: %d characters' % max(len(l) for l in raw.splitlines()))

    if a.src.lower().endswith(('.srt', '.vtt')):
        cues = parse_subtitles(raw)
        if not cues:
            sys.exit('No subtitle cues parsed; check that the file is standard SRT/VTT')
        text = paragraphs(cues)
        tp = os.path.join(a.out, 'transcript.txt')
        open(tp, 'w', encoding='utf-8').write(text)
        print('%d cues, last one starts at %s -> %s' % (len(cues), cues[-1][0], tp))
    else:
        text = raw

    lines = fold(text, a.width)
    rp = os.path.join(a.out, 'read.txt')
    open(rp, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('Reading copy: %s, %d lines, ~%d tokens, each line <= %d characters'
          % (rp, len(lines), est_tokens('\n'.join(lines)), a.width))

    print('Chunk plan (Read offset starts at 1; read every chunk in order):')
    n, start, size = 0, 1, 0.0
    for i, l in enumerate(lines, 1):
        size += est_tokens(l) + 1  # +1: Read also prefixes each line with its number
        if size >= a.chunk_tokens or i == len(lines):
            n += 1
            print('  chunk %d: offset=%d limit=%d (lines %d-%d, ~%d tokens)'
                  % (n, start, i - start + 1, start, i, size))
            start, size = i + 1, 0.0


if __name__ == '__main__':
    main()
