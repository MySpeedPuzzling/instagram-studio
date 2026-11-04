# Reel idea: "WHERE IS IT?" (the missing piece)

Owner pick 2026-11-04 for Thu 5 Nov 19:00: a humour Reel on the feeling every puzzler knows, the last piece is gone.
Owner direction: "everyone knows the feeling, WHERE IS IT, is it under the table? did the dog eat it?", funny first,
backed by MSP data where possible; ComfyUI / local models allowed if they make sense.

## What the data can and can't say (queried 2026-11-04, aggregates only, private profiles and suspicious results out)

Query `queries/reel-missing-piece.sql` (result notes; counts only, no note text leaves the database).

| Fact | Number | Use |
|---|---|---|
| Notes that say a piece was missing (English wording) | 646 of 12 033 notes (674 matches minus 28 "no missing pieces") | hero number |
| Of those, the piece was found later ("found") | 15 | hope beat / caption |
| The same in Czech/Slovak, German, Spanish/Portuguese, French/Italian, Dutch | ~84 more (unverified negations) | caption colour only ("and in Czech, German…") |
| All notes mentioning cats vs dogs (`bs-comment-words`) | 41 vs 11 | "prime suspect" joke, framed as mentions |
| Dog / cat / kids / vacuum / under the sofa named *in missing-piece notes* | 2 / 3 / 0 / 0 / 0 | **too thin: the hiding places are jokes, never stats** |
| `pieces_placed` (finished with a hole) | never filled in | dead end |

Claims stay exactly as measured: "646 of your notes say a piece was missing", "your notes mention cats 41 times,
dogs 11". Never "the cat did it in N cases".

## Concepts

- **A "The search"** (recommended): splash = an almost finished generator-piece puzzle on a box picture with one
  hole, hook "WHERE IS IT?". A search montage, one short line per beat (~2 s each): torch beam under the table, the box
  turned upside down (empty), the floor, then the line-up of suspects with the only real number: "Your notes mention
  cats 41 times. Dogs 11." → "Prime suspect." Then the fact: "646 of your notes say a piece was missing", and the
  hope: "15 found it later". Ending: the board lifts and the piece was under it all along; it snaps in, then pops out
  again for the loop. Send ask: "Send this to someone who's been there." Mechanic: humour + send-a-friend.
- **B "Suspect line-up"**: a police line-up of flat silhouettes (cat, dog, vacuum, toddler's sock, the box), height
  chart behind; each steps forward with a one-word alibi; the cat steps forward with "41 mentions". Funny and
  sendable but one joke; less data.
- **C "The hole that follows"**: minimal loop; the hole moves from puzzle to puzzle (different boxes), never filled,
  counter to 646. Easiest; least laugh.

## Visual options

- **Code only** (house style): flat poster shapes for the table, box, floor and silhouettes; generator pieces; box
  picture via `pickUnused()`. Safe for tomorrow.
- **AI stage plates** (ComfyUI, local; owner's idea): photoreal stills of the hiding places (dark under the sofa,
  dusty floor, vacuum bag, a cat bed) with *no puzzle in them*; our generator piece is composited in code and the
  camera move (torch sweep, push-in) is code. Rules: no AI pieces or puzzles, no people or hands, no slop look;
  must pass "could anyone mistake this for a puzzle?". Needs a calm machine and the owner's go-ahead (quiet hours).
  AI *video* (Wan-class models) is possible but slow on the M3 Max and hit-or-miss: not for a next-day post.
