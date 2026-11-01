# Reel: "<Month> in 1000 puzzles" (monthly colour-mosaic Reel)

First run: October 2026 (owner 2026-11-01). Companion to the monthly report carousel; a regular Reel (not Trial:
followers must not miss it), a different experience from the carousel: visual first.

Lab MR1 (four concepts as key frames) → owner picked **A "The Shuffle"** ("C is clunky, too sharp") and wrote the
script; Claude refined it (3 slow + 7 fast, owner approved):

1. Splash, complete from frame 0: logo, myspeedpuzzling.com, "<Month> in 1000 puzzles", the collage piece.
2. Clear the board: logo exit, hook lifts away, tiles drop out in a ripple; the piece's dashed outline stays.
3. No. 1–3, slow (~2.9 s each): the box flies in big with "No. N", name, "brand · N puzzlers"; it shrinks into its
   tile on the board and leaves a coral ring (the colour sort decides where it lands).
4. No. 4–10, fast and accelerating (~0.4–0.6 s each): "No. N" + brand only.
5. Burst: the other 990 tiles explode out of the centre over the whole screen.
6. The one fact on a solid backing ("N puzzles logged in <Month>"), held ~2.7 s.
7. Edges first (every puzzler's ritual), then colour waves fill the inside, reds to purples.
8. Done: a small pop; then the hook and logo return, identical to frame 0 (seamless loop).

Text budget (standing rule 2026-11-01, Reels lighter on text): the hook, three slow labels, seven rank tags, one fact.
Ranking by distinct puzzlers ("N puzzlers" on screen), counted like the report (results logged in the month).
Builder `src/motion/reel-month.ts`, `node tools/motion.ts month <draft-id> [--fresh] [--qa-only] [--snap=<dir>]`.
Brand tags: the top 10's brands (October: Ravensburger ×9, speedpuzzle.eu).
