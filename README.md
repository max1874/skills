# skills

Agent skills I use daily and have hardened on real work. Each one is a folder with a `SKILL.md`, usable from Claude Code as `/name`.

[中文说明](#中文说明)

## deep-read

**Makes an agent actually read a long source to the end, and prove it.**

Hand an agent a 3-hour transcript and it will usually read part of it — a single read tops out at ~25k tokens, a paragraph-per-line transcript can't be chunked, the first 2000 lines are the default cap, or it just greps and summarizes — and then hand you a summary that *looks* complete. `deep-read` fixes the workflow:

1. A script turns the source (SRT/VTT subtitles, text, extracted PDF) into a reading copy with short lines and a chunk plan that fits the read limit, estimated per language (CJK text costs ~4x the tokens of English per character).
2. The agent reads every chunk in order, itself — no subagent summaries, no sampling.
3. Notes are written after each chunk, so progress survives context compaction.
4. The notes open with a **coverage statement** (file, line count, each chunk's range), and flag speech-to-text errors, contradictions, and promises the source never kept.

On a 3-hour YouTube course (~41k words), this surfaced what a skim would miss: `$6.41` transcribed as `$641`, a community size stated two different ways, and two "I'll explain later"s that never came.

**How it differs from similar skills**

- [full-output-enforcement](https://skills.sh/leonxlnx/taste-skill/full-output-enforcement) stops agents from *writing* less than asked. `deep-read` stops them from *reading* less than given.
- [dsh-deepread](https://github.com/xiehuan123/dsh-deepread) and the "deep reading" framework skills focus on *analysis* (claims, evidence, mental models). `deep-read` focuses on *completeness*: every line read, with proof.
- Research skills that delegate reading to a background agent trade completeness for speed. `deep-read` makes the opposite trade on purpose.

### Install

```bash
npx skills add max1874/skills --skill deep-read
```

Or copy the `deep-read/` folder into `~/.claude/skills/` (all projects) or `.claude/skills/` (one project). Then use `/deep-read`, or just ask the agent to read something thoroughly.

Requirements: Python 3 (standard library only). For PDFs, `pdftotext` from poppler.

---

## 中文说明

我日常在用、在真实任务里打磨过的 agent skill。每个 skill 是一个带 `SKILL.md` 的文件夹，在 Claude Code 里用 `/名字` 调用。

### deep-read：让 agent 真的把长材料读完，并证明读完了

把一份 3 小时的转写稿交给 agent，它通常只读了一部分就给出一份看起来完整的总结。原因有几种：单次读取超过约 2.5 万 token 会报错；一段一行的转写稿没法按行切块；默认只读前 2000 行；或者干脆 grep 几下就开始总结。`deep-read` 把读的流程固定下来：

1. 用脚本把原文（SRT/VTT 字幕、纯文本、从 PDF 抽出的文字）折成短行，并按估算的 token 数给出分块计划。中文每个字的 token 成本约是英文字符的 4 倍，脚本会分语言估算。
2. agent 自己按顺序读完每一块，不交给子 agent 总结，也不抽样。
3. 每读完一块就写笔记，上下文被压缩也不丢进度。
4. 笔记开头写**覆盖声明**（哪个文件、多少行、每块的行号范围），并标出转写错字、前后矛盾、以及原文承诺了却没兑现的内容。

实测一门 3 小时的 YouTube 课程（约 4.1 万词），读出了略读发现不了的问题：字幕把 `$6.41` 识别成 `$641`，社群规模前后说法不一，两处「后面再解释」最后都没解释。

**和同类的区别**：[full-output-enforcement](https://skills.sh/leonxlnx/taste-skill/full-output-enforcement) 防止 AI 写得比要求的少，`deep-read` 防止 AI 读得比给的少；[dsh-deepread](https://github.com/xiehuan123/dsh-deepread) 等「深度阅读」类 skill 重在分析框架，`deep-read` 重在读全，并留下证据。

**安装**：`npx skills add max1874/skills --skill deep-read`，或者把 `deep-read/` 文件夹复制到 `~/.claude/skills/`。需要 Python 3；处理 PDF 需要 poppler 里的 `pdftotext`。
