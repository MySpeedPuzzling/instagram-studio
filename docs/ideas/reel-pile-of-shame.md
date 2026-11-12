# Reel idea: "I'll solve it this weekend" (the pile of shame as a time-lapse)

Owner brief 2026-11-12 (night, autonomous run): a Reel on exactly the same topic and data as the pile-of-shame
carousel published that night, aimed at **non-followers** (Trial Reel). Free hand on the scenario and tools (ComfyUI,
HyperFrames), five quiet hours, no questions.

Rule it has to respect: a Reel on a carousel's topic is a different experience, not the slides animated
(standing feedback 2026-11-01). Non-followers don't know MSP, so the hook is the feeling, not the statistic.

## Data (same queries as the carousel, re-queried when the Reel is finalised)

`shelf-shame-totals`, `shelf-shame-puzzles`, `shelf-shame-pct`, `shelf-shame-sizes` via `buildShelfSpec`.
Used on screen: share of collected puzzles never solved by their owner (~36 %), the biggest pile (~929 puzzles,
~79 days of median solo times), the most avoided puzzle (Speed Puzzling, Ravensburger: ~86 of ~132 owners).
The rest (pile ladder, 4000+ giants, the second exhibit) stays in the carousel and the caption.
The day counter and the excuses are jokes, never statistics (same rule as the hiding places in the missing-piece Reel).

## Concepts considered

- **A "This weekend" time-lapse (built).** One shelf. Hook = the sentence every collector has said: "I'll solve it
  this weekend." A day counter runs (DAY 1 → 8 → 60 → 365 → 1460) with one excuse per stop ("Next weekend.",
  "After the holidays.", "When I have time.", "One day."), while days and nights flicker by, dust settles, the NEW
  sticker peels off, cobwebs grow and a spider moves in. Then the fact (36 %), the biggest pile as an endless wall of
  shelves with one box per unsolved puzzle (the counter runs to 929), and the punchline in an old museum: the picture
  light flickers on over the most avoided puzzle of them all, and it's called Speed Puzzling. Ends on a send ask
  ("Send this to someone who said 'this weekend'"); the loop rewinds time to day 1. Mechanic: humour + identity +
  send-a-friend.
- **B "Diary of a box".** The box's own point of view ("Day 1: she picked me!", "Day 400: a spider moved in"). Funnier
  on paper, but it is all reading; Reels are "visuals first, less text".
- **C "Nature documentary".** Deadpan captions over the dusty shelf ("undisturbed since 2022"). Needs a voice to land.
- **D "Museum tour".** The whole Reel in the old museum. The carousel already did the museum; kept as the finale only.

## Art

- Shelf: the carousel's approved dusty shelf plate (lab SH1, s4-natural-221) is the "years later" state. Lab **SH2**
  makes the same shelf brand new (image edit of the plate: dust, webs and spiders removed, geometry kept), so the two
  cross-fade as a time-lapse; boxes, sticker, dust on the boxes, front cobwebs, spider and dust motes are code.
- Optional upgrade tried in SH2: a generated time-lapse between the two states (first/last-frame video), used as an
  image sequence driven by the same "age" value, so the timing stays in code.
- Wall of shelves: baked from the plate and the real box pictures, exactly one box per unsolved puzzle of the biggest
  pile; the last shelf keeps its empty cubbies.
- Museum: the carousel's old museum wall (SH1, m1-museum-212) with its picture light.
- No AI model credits on screen; runs are logged in `content/labs/SH2/runs.jsonl`.

## Build

`node tools/motion.ts shelf <draft-id> [--fresh] [--qa-only] [--snap=<dir>]`: spec `src/posts/reel-shelf.ts`
(numbers + baked wall), motion `src/motion/reel-shelf.ts`. Plates live in the draft's `plates/` (clean.png, dusty.png,
optional old.png, museum.png, optional `timelapse/f0000.jpg…`).
