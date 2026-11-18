# Scoring craft: from a short visual story to a music brief (research, 2026-11-18)

Scope: how composers and music supervisors turn a storyboard into music, rewritten as a brief-writing method Claude
can apply to every MSP Reel and Story. The steps are storyboard → spotting → emotional arc → genre, instruments and
tempo → structure aligned to picture → ACE-Step caption, tags and BPM. Research only; nothing generated.
Builds on `research_notes/Local audio models and practice/house_sound_and_ace_prompting.md`, which covers ACE-Step
prompting rules and the three house directions A Data, B Cozy and C Playful, and on `docs/ideas/sound-pipeline.md`.
Labels: **Evidence** means a cited practitioner or academic source. **Opinion** means a practitioner's or forum view.
**Inference** means my own reasoning, applied to MSP. Cue times in the worked examples come from the builders' own
cue files (`content/labs/FX1/src/{shelf,unlucky}.cues.json` and
`content/drafts/2026-11-16-weekly-rc1/stories/story-1-video.cues.json`). The tempo arithmetic is mine.

## 1. Film, TV, trailer and ad practice: spotting, temp tracks, briefs, hitting vs underscoring, counterpoint, structure

### Takeaway
Professionals begin with **where** music plays and **what job it does** at each moment, before any genre. That is
spotting: a cue list with in and out points, hit points, shift points and the function of each cue. Genre comes
after. A good brief describes the music's **function** with "like this, because of that" references and states
**what it must not be**. Short-form structure is always the same in outline: an instant start, a build, a drop or
stop, and a **button**, a short final sting on the brand moment.

### Cited Findings
**Spotting**
- **Evidence.** A spotting session is the meeting where the composer, director and editor watch the cut and decide where music will and will not play. It produces a cue list: each cue with its start and end timecode and a note on what it must do. "The output is a cue list, and that list is the document the rest of the project runs on." Spotting decides the shape of the score, not the orchestration. — [Modwheel: Spotting sessions](https://modwheel.net/guides/scoring-to-picture-spotting)
- **Evidence.** Out points matter more than in points: "An agreed out point prevents more rewrites than an agreed in point." Also, "Silence is a scoring decision." When the cut isn't locked, keep cues modular and avoid tight hits that may move. — [Modwheel](https://modwheel.net/guides/scoring-to-picture-spotting)
- **Evidence.** A **hit point** is a moment where a beat or hit in the music is meant to sync with a specific frame, for example a brass stab on a door slam or a glockenspiel strike on a comic wink. A **shift point** (also called a turning or pivot point) is where the emotional job of the cue changes. Composers use hit markers to choose the tempo. Animation tends to hit many things, while drama shouldn't "hit everything you see". — [Forte Composer Academy lesson "Mickey Mousing, Hit Points, and Shift Points"](https://store.fortecomposeracademy.com/p/courses/film-scoring-for-beginners/72373-scoring-to-picture/206849-24-micky-mousing-hit-points-and-shift-points), summarised via search snippets; [Art of Composing: How to spot a film](https://www.artofcomposing.com/how-to-spot-a-film)
- **Evidence (method, as summarised).** Karlin & Wright, *On the Track* (1990, 2nd ed. 2004), has chapters on "Timings and Clicks", "Requirements on Extremely Accurate Hits", ritards and accelerandos, and "Tempo and Mood Changes within Cues". The Auricle software it describes plots the proposed hit points against a click grid, so trial tempos show "which tempos provide the best 'hit' opportunities". It can also add subtle, undetectable tempo changes so the hits land in natural places in the music. — [Google Books TOC](https://books.google.com/books/about/On_the_Track.html?id=4Dj42oNleXIC); [Scribd excerpt on Auricle](https://www.scribd.com/document/246248419/On-the-Track) (book text itself not read)

**Temp track and brief**
- **Evidence.** For a temp track, ask "what the temp is doing for the scene", not whether it is good. The answer is a brief describing the music's function. "That function is portable; the temp's chord progression is not." — [Modwheel](https://modwheel.net/guides/scoring-to-picture-spotting)
- **Evidence.** Studio ZK's ad music brief has 10 fields. Brand and campaign, with the idea in one sentence. Material (rough cut or animatic: "a rough cut is enough"). Lengths (every cut-down written in the same session). Media and countries. Duration of use. References: 2–3 tracks "with what you like about each (tempo, instruments, energy)", for example "this, because of the dry drums and the way it stops before the chorus". What it must not be ("often clearer than what it should be"). Voice-over, which decides how much room the music leaves. Existing sound: "new music should not fight what the brand already owns" (sonic logo). Deadline and approvals, with "one decision maker". — [Studio ZK ad music briefing template](https://studiozk.nl/blog/ad-music-briefing-template)
- **Evidence.** Atomica: state the role of the music in the edit before genre. Give tone, references and what to avoid: "A strong music brief doesn't just describe what you want, it prevents you from getting what you don't want." — [Atomica Music](https://atomicamusic.com/the-best-music-brief-template-for-ad-agencies). LBB lists vocal type, including "no vocals", as a brief field. — [LBB Online](https://lbbonline.com/news/the-no-bs-guide-to-custom-music-as-branded-content-part-1-strategy) (older, about 2016). Studio ZK also warns that a brief which prescribes too much leaves no room for a better idea. — [Studio ZK](https://studiozk.nl/blog/ad-music-briefing-template)

**Hitting vs underscoring, mickey-mousing vs counterpoint**
- **Evidence.** Mickey-mousing (parallel scoring) syncs the music to the physical action moment by moment. The name comes from 1930s Disney animation. The effect "is usually comedic, whether this was intentional or not", which is why film scorers often use the term as an insult. — [Wikipedia: Mickey Mousing](https://en.wikipedia.org/wiki/Mickey_Mousing)
- **Opinion.** Mickey-mousing "tells the audience explicitly what to look for … when to laugh". Its opposite, underscoring, sets a general mood. Mood scoring of a car chase still follows the picture, "only the beats are longer". — [Directorama (Peet Gelderblom, 2007)](https://www.directorama.net/2007/06/22/film-music-blog-a-thon-in-defense-of-mickey-mousing/)
- **Evidence (theory).** Chion, *Audio-Vision* (1994, pp. 8–9) describes two kinds of film music. **Empathetic** music takes on "the scene's rhythm, tone, and phrasing". **Anempathetic** music shows "conspicuous indifference … progressing in a steady, undaunted, and ineluctable manner, like … a machine that's running". This does not freeze emotion; it **intensifies** it. Typical anempathetic sources are "player pianos, celestas, music boxes, and dance bands, whose studied frivolity and naivete" reinforce the emotion "even as the music pretends not to notice". — [Wikipedia: Anempathetic sound](https://en.wikipedia.org/wiki/Anempathetic_sound), quoting Chion; [Perlego listing of Audio-Vision](https://www.perlego.com/book/862432/audiovision-sound-on-screen-pdf)
- **Evidence (teaching notes).** Empathetic music expresses the same emotion as the image. Anempathetic music is "cold, neutral and without emotion in relation to the image". — [Stockholm Univ. notes on filmsound.org](https://filmsound.org/bibliography/stylepara.pdf)

**Short-ad and trailer structure**
- **Opinion (practitioners, forum and blogs).** In a 30 s spot, the last ~5 s (0:25–0:30) is "the tag", the brand moment, "often accompanied by a musical 'button'". Keep the intro very short, "just a drum pickup … a measure or two at the longest". The tail should ring out naturally, usually no more than 1 s. One composer writes the body to 26.5–28.5 s and stretches the sting to 30 s. — [ScreenWeaver: 30-second A/V format](https://www.screenweaver.ai/blog/writing-30-second-commercial-av-format); [Gearspace thread "Edits?"](https://gearspace.com/threads/edits.988145/)
- **Opinion.** A 30 s cut is "a mini-song": start with an instant hook, build to the chorus, and end with a resolution that "feels complete, not just lopped off". Have at least 2 edit points (a stop, a fill, a break) and "a big stomp on the one to finish". — [That Pitch: structuring songs for editing](https://thatpitch.com/blog/structuring-songs-for-easy-editing-2/)
- **Opinion (trailer composer Mark Petrie, quoted).** Act 1 is mysterious and brooding, with occasional hits. Then a SUDDEN BREAK or ramp. Act 2 builds bigger with every repeat of the 8-bar phrase. Then a SUDDEN BREAK and a HUGE RISE into Act 3, with massive energy to the finale. Pieces need "at least 2-3 strong stop downs that go to complete silence", which editors reuse. A button or stinger closes. — [VI-Control: trailer structure thread](https://vi-control.net/community/threads/trailer-music-structure-is-there-truly-a-consensus.60754/); [Sound On Sound: library music part 7](https://www.soundonsound.com/music-business/all-about-library-music-part-7); [Nathan Fields: three-act trailer music](https://www.nathanfieldsmusic.com/blog/three-act-structure-trailer-music). **Dissent:** Mike Verta: "There is no such thing as trailer track structure." — same VI-Control thread.
- **Opinion.** In edited trailers, the cut runs to the climax, then the title card, then "a button: one last short beat — a joke, a scare, a line". — [Flashboards: how to make a movie trailer](https://flashboards.yaroflasher.com/learn/editing/movie-trailer/)

### Inferences
- **The MSP equivalent of a spotting session is the builder's header comment plus `cues.json`.** Every builder already logs the hits: `key`, `reveal`, `outro`, `snap`, `fail` and the comic beats. The brief should list them as a spotting table: time, event, music job (hit, shift, stop, silence, button), and out point.
- **Write the function before the genre.** Each cue line answers "what is the music doing here?" Examples: "establish the cozy shelf", "carry the passing of time", "stop and let the punchline land", "resolve under the CTA". This is the portable part, per Modwheel. Genre and instruments come afterwards.
- **Short-form MSP shape = a compressed trailer or ad:** hook with music already running (no intro: Reel frame 0 is a finished card), build, **stop-down**, drop or reveal on `key`, and a **button** on the CTA, the falling MSP signature. That fits the existing tag arc `[Intro] [Build] [Drop] [Outro - calm, descending]`.
- **Always include a "must not be" line** (e.g. "no vocals, no celebratory pop, no ticking outside the countdown, no recognisable carol"). The owner's MU1 dislikes belong here permanently.
- **Hit few things with music and many with SFX.** Mickey-mousing reads as comic, so hit every beat with **SFX** only in comic clips, and keep the music on a few structural points: `key`, the punchline, `outro`. That is also what ACE-Step can deliver, since one drop can be aligned and fine hits can't.

### Gaps
- I did not read Karlin & Wright's actual chapters, only the table of contents and an excerpt. I found no primary agency document on a 3-act structure for **15 s** spots; the 30 s guidance is from forum and blog practitioners.
- I found no sourced rule for **when music should lead the picture versus follow it**, i.e. anticipate a cut versus react to it. The closest material is the comedy "enter after the punchline" advice in section 3. Treat it as an open question.

## 2. Choosing instruments and tempo from the visual "aura"; leitmotif for recurring objects

### Takeaway
Timbre is the composer's main tool for setting and aura. Tuned percussion such as celesta, glockenspiel and marimba
reads as magical, childlike or uncanny. Pizzicato reads as light, comic or secretive. Bassoon reads as comic or
awkward. Low brass reads as menace. Sparse piano reads as memory. Single instruments can mark a place, as the
accordion marks France. Tempo is chosen from the hit points, so the key frames land on beats. A leitmotif is a short
recurring figure tied to a character or object, and its timbre changes to show change.

### Cited Findings
- **Evidence (teaching resource, A-level music for media).** Bassoon is "comic, awkward or grotesque". Pizzicato strings are "light, comic, secretive or mechanical". Celesta, glockenspiel, vibraphone, marimba and piano give "magical, childlike, uncanny or delicate atmospheres". Low trombone and tuba suggest "menace". Muted trumpet is "nasal, comic, tense or jazzy". Trombone glissando is "comic, grotesque or mocking". Harp glissandi suggest "magic, dreams, water or transformation". Soft vibraphone tremolo is "dreamlike". Col legno is "dry or skeletal". Sul ponticello is "glassy or tense". A filtered synth pulse suggests "technology, time pressure or pursuit". A low synth drone suggests dread. Newman's sparse piano and tuned percussion suggest "memory, vulnerability or emotional distance". High register reads as "anxiety, brightness, fragility"; low register as "darkness, weight, distance". Setting: "accordion timbre helps establish a French setting" (*Ratatouille*). — [PastPaperHero: Music for media, sonority and timbre](https://www.pastpaperhero.com/resources/aqa-a-level-music-7272-music-for-media-sonority-and-timbre)
- **Evidence.** The celesta has been used in film since the silent era for "wonder, mystery, and fantasy" ("Pure Imagination", "Hedwig's Theme"). It can also sound eerie (Bartók → *The Shining*). In orchestration its main job is colour, not melody. — [Classical Music: the celesta](https://www.classical-music.com/features/instruments/celesta); [Wikipedia: Celesta](https://en.wikipedia.org/wiki/Celesta)
- **Evidence.** Chion's anempathetic list (music boxes, player pianos, celestas, dance bands) doubles as a palette for the "old, mechanical, indifferent" aura. — [Wikipedia: Anempathetic sound](https://en.wikipedia.org/wiki/Anempathetic_sound)
- **Evidence.** A leitmotif is "a short, constantly recurring musical phrase, that is associated with a particular person, place, or idea". Wagner used motifs for objects too, such as Wotan's spear and the Ring. Composers "fragment it, invert it, or pass it between instruments" to show change. — [Britannica: Leitmotif](https://www.britannica.com/art/leitmotif); [Wikipedia: Leitmotif](https://en.wikipedia.org/wiki/Leitmotif); [Hello Music Theory](https://hellomusictheory.com/learn/leitmotif/)
- **Evidence.** The same motif changes meaning with timbre: a villain motif on low brass and contrabassoon versus the same notes on celesta. A theme may start on a small solo instrument and return in full orchestra "when the character gains power". — [PastPaperHero](https://www.pastpaperhero.com/resources/aqa-a-level-music-7272-music-for-media-sonority-and-timbre)
- **Evidence.** Tempo is chosen by trying candidate tempos against the hit points and keeping the one where the most hits fall on beats. — [Scribd excerpt on Auricle / *On the Track*](https://www.scribd.com/document/246248419/On-the-Track); [Forte lesson](https://store.fortecomposeracademy.com/p/courses/film-scoring-for-beginners/72373-scoring-to-picture/206849-24-micky-mousing-hit-points-and-shift-points)
- **Evidence (existing note).** Mini Metro: faster tempo needs tighter attacks; slow passages use longer attacks. — [Disasterpeace postmortem](https://disasterpeace.com/blog/mini-metro.postmortem.html), already cited in `house_sound_and_ace_prompting.md`

### Inferences: an aura → palette lookup for MSP briefs (all **Inference**, built on the timbre sources above)
| Visual aura | Instruments / texture words for the caption | Tempo / feel |
|---|---|---|
| Cozy table, warm lamp | felt piano, warm soft plucks, brushed drums, upright bass, soft tape texture | 80–92, relaxed |
| Dusty, old, neglected | felt or slightly detuned upright piano, music box, soft vinyl crackle, col legno or dry pizzicato | slow-mid, 88–104 |
| Museum, gallery, solemn | sustained organ or soft choir pad, harpsichord, reverberant hall, slow strings | slow; "mock-grand" when used for a joke |
| Sneaky, mischievous | pizzicato strings, bassoon, clarinet, woodblock, light marimba | 96–112, staccato |
| Ticking, time pressure | filtered synth pulse, clock tick, muted hi-hat sixteenths, low drone | 110–130, or a steady eighth-note pulse |
| Cold night, empty | soft synth pad, sparse high piano, light reverb | slow, sparse |
| Neon, competitive, data | plucked synth arpeggio, tight kick, rim, glassy bells | 116–126 |
| Magical, Advent, winter | celesta, glockenspiel, sleigh bells, warm strings | 90–110 |
| Halloween, eerie-funny | harpsichord, bassoon, pizzicato, theremin-like lead, celesta | 100–116, minor-ish but playful |
- **Leitmotif in ACE-Step reality.** ACE-Step can't place a motif at a given second. MSP leitmotifs, such as "the spider" or "the last piece", should therefore be **SFX-layer stingers built outside ACE**, like the signature: a 2–4 note figure in the bed's detected key, re-voiced per post. Candidates: spider = low bassoon or pizzicato figure creeping down a semitone; last piece = the house click plus a rising 2-note "almost" that resolves only when the piece lands. The caption only has to make room: name the instrument family, so the stinger's timbre isn't foreign to the bed.
- **Pick the tempo from the cues file, not from the genre.** Try candidate BPMs within the direction's range and keep the one where `key`, the punchline and `outro` fall closest to beat 1 of a bar, counting from `key`, since the fitter aligns the drop there. The worked examples below show that this yields bar-aligned punchlines at ordinary tempos.

### Gaps
- No source confirms how ACE-Step renders "music box", "harpsichord", "col legno" or "bassoon". Check by ear in a lab.
- No sourced material on **era cues** beyond single examples (the accordion for France). The harpsichord as a "period" marker is common knowledge but not sourced here.

## 3. Comedy scoring: sneaky, caught, deadpan, mock-epic, cartoon, and beats around a punchline

### Takeaway
Comedy scoring is mainly a **timing** problem. Don't score under the setup, because it announces the joke. Either
hit the physical gag tightly, within a couple of frames, or enter just **after** the punchline. Before the punchline,
a real beat of **silence** is stronger than a fade. There are two schools. "Play it straight" (serious music, let the
comedy be itself) suits deadpan and mock-epic. "Go with the gag" (cartoon) suits slapstick. The sneaky pizzicato and
bassoon sound is a standard production-music genre.

### Cited Findings
- **Opinion (practitioner guide, undated).** "Scoring under the setup announces that something's coming, and announcing it is usually the mistake". "Hold the entrance until after the punchline lands". Hitting on the punch suits visual or physical gags; entering just after suits verbal or character comedy. A punch accent "needs to sit within a couple of frames of that beat". For a reveal, land the accent just after it, unless the gag needs punctuation on the reveal. "A beat of true silence rather than a quiet sustain reads as a much stronger event than a diminuendo". Note translations: "It feels heavy" means the entrance is too early or too dense; "Can it be lighter?" means enter later; "It's stepping on the joke" means the cue plays during the beat that needs room. "Entrance point and rhythm are the primary craft here. Melody and orchestration are secondary." — [Composer Agents Academy: Scoring comedy is a timing problem](https://agents.composerworkflow.com/academy/scoring-comedy-is-a-timing-problem/)
- **Opinion.** A joke often needs a pocket of quiet before or after it. Edgar Wright's editing "frequently uses abrupt silence before a comedic cut". This is the article's characterisation, not a Wright quote. — [ASMR Education: how editors adjust comedic timing](https://asmr.education/faq/film-editing/how-editors-adjust-comedic-timing); trope list: [TV Tropes: Sudden Soundtrack Stop](https://tvtropes.org/pmwiki/pmwiki.php/Main/SuddenSoundtrackStop)
- **Evidence (interview).** Danny Elfman says Tim Burton plays comedy "melodramatically, dramatically or play it straight but let the comedy just be itself. Don't try to help it." — [Ain't It Cool News: ScoreKeeper interviews Danny Elfman](http://legacy.aintitcool.com/node/55508)
- **Evidence (secondary).** "Playing it straight!" is described as Elmer Bernstein's maxim. John Morris (Mel Brooks's composer, *Spaceballs*) did the opposite and went along with the gags. — [Filmmusic Journal: John Morris "Don't play it straight"](https://filmmusicjournal.ch/john-morris-dont-play-it-straight/)
- **Opinion (forum).** Straight comedy scores leave the humour to the picture "with a light touch". Examples given: David Newman's *Galaxy Quest* and *Bowfinger*, George Fenton's *Groundhog Day*. Bassoon and oboe have long been used for humour. — [Film Score Monthly forum](https://www.filmscoremonthly.com/community/postid/56043/)
- **Evidence (genre exists).** Library tracks tagged "sneaky", "tiptoe" and "clumsy" use pizzicato strings, bassoon, clarinet, xylophone, harp and bells. Example: Warner Chappell's "Funny Bassoon", tagged "Chase/Detective/Mystery … Orchestral Spoof". — [Warner Chappell PM](https://www.warnerchappellpm.com/track/elbroar-er1081-12/MjYwODU0NDktNTNjMmNm); [AudioJungle "Sneaky Comedy"](https://audiojungle.net/item/sneaky-comedy/22175698). Classical precedent: in Strauss's *Till Eulenspiegel* the bassoons mock the academics and a string pizzicato is the noose snapping. — [Wikipedia](https://en.wikipedia.org/wiki/Till_Eulenspiegel%27s_Merry_Pranks)
- **Evidence.** Mickey-mousing reads as comic whether intended or not. — [Wikipedia: Mickey Mousing](https://en.wikipedia.org/wiki/Mickey_Mousing)

### Inferences: comic beat recipe for MSP (Inference)
1. **Setup:** the music establishes the "innocent" world (cozy or sneaky) and must not hint at the joke.
2. **Escalation:** repeated beats (excuses, ticks, attempts) get **SFX hits**, not music hits. The music keeps a steady, slightly indifferent pulse (Chion's anempathetic machine). Indifference makes the mounting disaster funnier.
3. **Stop-down:** cut the music to real silence 0.3–0.6 s before the punchline. This is the fitter's job, not ACE's.
4. **Punchline:** the visual lands in silence or with a single SFX or stinger, which can be the leitmotif.
5. **Re-entry:** music returns **after** the reveal, on the next downbeat, often in a "mock" register (grand, solemn or deflated). Then comes the CTA and the falling signature as the button.
- **Mode by joke type:** deadpan or confession (pile of shame) = play it straight and cozy, with an anempathetic steady bed and silence at the punchline. Physical fail (Unlucky 13's piece won't fit) = cartoon hits on SFX, tense ticking music that **drops out** on the fail. Mock-epic = a solemn or grand texture for something trivial (the museum), used briefly after the reveal.

### Gaps
- No named comedy composer quoted directly on silence before punchlines. The sources are craft guides and a forum.
- No source on "mock-epic" scoring as a technique by name. The recipe above is inference.

## 4. Data and explainer video scoring (Kurzgesagt, Vox, Johnny Harris, PolyMatter)

### Takeaway
The public evidence is thin. Kurzgesagt gets a soundtrack composed for each episode, paced to the visual story, with
music highlighting key parts and "deep booms on key words". Vox- and Harris-style videos lean on sound effects that
make on-screen objects feel physically placed: paper rustles, shutters, soft thuds as elements land. I found no
primary source on Vox or PolyMatter scoring.

### Cited Findings
- **Evidence.** Each Kurzgesagt video "gets its own specifically composed soundtrack from Epic Mountain to give it a unique mood and emotional impact". Music and sound are "Phase 5" of production. — [Kurzgesagt: what we do](https://kurzgesagt.org/what-we-do?visit=videos). Epic Mountain does all of the soundtrack, sound design, mixing and mastering, balancing the music, sound design and narration. — [Epic Mountain](https://www.epic-mountain.com/our-work/)
- **Evidence (secondary).** The music matches "the pacing of the visual storytelling, highlighting important parts and setting the mood". The sound design adds "soft background tones, deep booms on key words, and futuristic effects" (sound designer Max Frisch). — [10 Studio](https://10.studio/the-incredible-amount-of-work-behind-kurzgesagts-beautiful-animated-videos/)
- **Evidence.** Epic Mountain releases the per-video tracks as yearly albums, each track named after its video (Vol. 1, 2015 → Vol. 11, Jan 2025). — [Bandcamp: Kurzgesagt Vol. 11](https://epicmountainmusic.bandcamp.com/album/kurzgesagt-vol-11-original-motion-picture-soundtrack); [kottke.org](https://kottke.org/18/01/the-soundtrack-to-kurzgesagt)
- **Opinion (blogs on the style).** Johnny Harris layers "upbeat music under voiceover" with SFX (door creaks, paper, typing), and cold opens with fragmented audio. — [EditorDuel blog](https://blog.editorduel.com/blog/johnny-harris-high-retention-documentary-content). The style uses "paper rustles, camera shutters, soft thuds as elements land … to reinforce the idea that objects are being physically placed". — [FCPX Full Access](https://fcpxfullaccess.com/blogs/blog/vox-johnny-harris-documentary-style-final-cut-pro)
- **Evidence.** Vox's Estelle Caswell says licensing is a big constraint ("would've cost me $20,000 for licensing the music"). — [Film Independent interview](https://www.filmindependent.org/blog/explainer-an-interview-with-vox-pop-video-essayist-estelle-caswell/). Netflix's *Explained* theme is by Jackson Greenberg. — [Wikipedia: Explained](https://en.wikipedia.org/wiki/Explained_(TV_series))

### Inferences (data reveals for MSP)
- **The number is the drop.** Put `[Drop]` on `key` (the number lands). Keep the bed lighter before it, during count-ups, with the build carried by a riser or SFX. A "boom on the key word" maps to one low impact plus the drop.
- **Count-ups are SFX-driven** (ticks or plinks per step, as in Mini Metro's tempo-locked plinks). The music holds a steady pulse under them and doesn't change chords per digit.
- **Several numbers = several small hits, one big one.** Only the main number gets the drop; the others get SFX accents and maybe a fill. This mirrors trailer practice: one climax plus stop-downs.
- **No narration in MSP.** The music carries more pacing load than in Kurzgesagt or Vox, so the bed's phrase lengths should match the text's reading time. A text card held about 4 s ≈ 2 bars at about 120 BPM. This is inference; the reading-time figures are not sourced here.

### Gaps
- No primary interview with Epic Mountain, Vox, Johnny Harris's team or PolyMatter about how music is cut to reveals. Who scores Johnny Harris's or PolyMatter's videos (library vs composer) was not found.

## 5. Brief template and three worked MSP briefs (ACE-Step caption + section tags + BPM + key mood)

### Takeaway
A brief that combines film spotting with an ad brief and ACE constraints has 14 fields. Running the BPM arithmetic
on the real cue files gives tempos that land the main moments on bar lines from `key`:
- **Pile of shame:** 104 BPM. The punchline comes exactly 8 bars after the number and the send line 10 bars after.
- **Unlucky 13:** 121 BPM. Section changes come at +10 and +20 beats.
- **Weekly Story:** 124 BPM (data direction, `outro` 5 bars after `key`) or 99 BPM (cozy direction, `outro` 4 bars after `key`).

### Cited Findings (fields traced to sources)
- Function first, temp → function: [Modwheel](https://modwheel.net/guides/scoring-to-picture-spotting).
- References with "because", must-not, voice-over room, existing sonic logo, lengths: [Studio ZK](https://studiozk.nl/blog/ad-music-briefing-template); [Atomica](https://atomicamusic.com/the-best-music-brief-template-for-ad-agencies).
- Hit points, shift points, out points, silence: [Modwheel](https://modwheel.net/guides/scoring-to-picture-spotting); [Forte](https://store.fortecomposeracademy.com/p/courses/film-scoring-for-beginners/72373-scoring-to-picture/206849-24-micky-mousing-hit-points-and-shift-points).
- Button at the end, short or no intro: [ScreenWeaver](https://www.screenweaver.ai/blog/writing-30-second-commercial-av-format); [Gearspace](https://gearspace.com/threads/edits.988145/).
- ACE-Step constraints: 8–12 caption keywords, concise tags, no conflicts, BPM as an anchor (±2), ask for 20–30 % extra length. — [ACE-Step 1.5 Tutorial](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/Tutorial.md); [deAPI guide](https://deapi.ai/blog/ace-step-1-5-prompting-guide-how-to-write-tags-structure-lyrics-and-generate-better-music) (via `house_sound_and_ace_prompting.md`).

### Inferences: the brief template (fields Claude fills from the storyboard)
1. **Story in one line**, plus the **aura** in 3 words (e.g. "cozy → dusty → mock-solemn").
2. **Joke or reveal type:** data reveal / confession (deadpan) / physical fail (cartoon) / launch / themed.
3. **Scoring stance:** underscore, hit, or anempathetic counterpoint, with one line on why.
4. **Spotting table** from `cues.json`: time · event · music job (`establish`, `carry`, `hit`, `shift`, `stop-down`, `silence`, `drop`, `button`) · music or SFX. Mark the **out point** and the silences.
5. **Emotional arc**, 3–5 words in order (e.g. calm → creeping → hush → reveal → warm).
6. **Direction**, house A, B or C, plus the theme colour if any.
7. **Instruments** (3 named) + texture words from the aura table. Each needs a reason ("pizzicato = sneaky").
8. **Leitmotif or stinger** (SFX layer, made outside ACE): which object it marks, its notes, and when it plays.
9. **Tempo:** the BPM chosen by hit arithmetic, with the bars between `key` → punchline → `outro`; time signature 4/4.
10. **Key mood:** major/minor/modal plus feeling. Detect the key after generation and don't rely on the key parameter.
11. **ACE caption:** 8–12 comma keywords (genre + one modifier, 3 instruments, 2–3 moods, 1–2 production words, `instrumental`).
12. **ACE tags:** one per section, 1–3 word descriptors, in order. Length = video × 1.2–1.3, minimum 10 s.
13. **Fit instructions:** drop → `key`. Stop-downs: where the fitter dips or mutes. The signature replaces the last chord after `outro`. The last frame is held.
14. **Must not:** vocals, celebratory pop, ticking outside countdowns, recognisable tunes, anything conflicting with caption metadata.
Plus **references, each with a "because"** (optional, our own approved beds only), and the **owner's ear check**: what to listen for.

### Worked example A: "I will solve it this weekend" (pile-of-shame shelf Reel, 42.7 s)
Spotting from `shelf.cues.json`, with music jobs (Inference):
| t (s) | event | job |
|---|---|---|
| 0.0–2.6 | splash on a new shelf, hook text | establish cozy, music already running (no intro silence) |
| 3.1–11.55 | time-lapse DAY 1 → 1460: excuses at 3.9 / 6.45 / 9.0 / 11.55, sticker peel 6.4, spider 11.25 | carry: steady, indifferent pulse; excuses = SFX "punch"; spider = leitmotif stinger |
| ~13.6–14.4 | end of time-lapse | stop-down (short silence or riser) |
| 14.43 | `key`: N % never solved | **drop** (gentle, cozy-bright, not big) |
| 15–29.6 | the wall, counter, "N days … snacks not included" | carry; lighter texture under reading |
| 32.3 | picture light flickers | **silence** (fitter mutes from ~31.8) |
| 32.9 | `reveal`: "Speed Puzzling" in the museum | punchline in silence + one stinger; music re-enters **after** it, on the next downbeat |
| 37.6 | `outro`: send line | resolve, falling; signature is the button |
| 41.7 | rewind loop | reverse whoosh SFX, music tail done |
- Stance: **play it straight, anempathetic**. A cozy, slightly dusty bed that doesn't notice the years passing makes the confession funnier. The museum gets a brief mock-solemn colour after the reveal.
- Tempo arithmetic: at **104 BPM** (beat 0.577 s), counting from `key` at 14.43: flash 24.25 = +17 beats; flicker 32.3 = +31; **reveal 32.9 = +32 beats = exactly 8 bars**; **outro 37.6 = +40 beats = 10 bars**. All within 0.05 s. The time-lapse excuses (2.55 s apart) don't lock to 104. They are SFX-carried, so that's fine; alternatively the builder's tick could be set to 2.31 s (one bar) if the owner wants them on the music.
- Arc: cozy → creeping neglect → hush → mock-grand reveal → warm send-off.
- **Caption:** `lo-fi chamber pop, felt piano, pizzicato strings, music box, soft brushed drums, upright bass, cozy, wistful, deadpan, dusty vinyl texture, warm intimate mix, instrumental`
- **Tags (lyrics field):** `[Intro - felt piano]` `[Verse - pizzicato]` `[Build]` `[Drop - warm]` `[Breakdown - sparse]` `[Bridge - solemn organ]` `[Outro - calm, descending]` `[Fade Out]`
- BPM 104 · 4/4 · key mood: **major, wistful** (Lydian-tinged is fine). Avoid minor, so it's not sad. Duration ≈ 52–55 s.
- Leitmotif: **spider** = low pizzicato or bassoon 3-note creep (e.g. scale degrees 1-♭2-1), first at 11.25. It can return in the museum as a single low note under the reveal, as a callback. **Last box / NEW sticker** = a peel SFX, no motif.
- Fit: drop → 14.43. Mute or stop-down from about 31.8 to 32.9. Re-entry downbeat at about 33.5 (the beat after the reveal). Signature on the downbeat after 37.6.
- Must not: vocals, sad minor piano, horror strings (the spider is cute, not scary), ticking.
- Ear check: does the punchline land in real silence? Does the music feel unbothered during the time-lapse?
- Risk: the `[Bridge - solemn organ]` may clash with the caption's instruments (ACE "conflict" rule). Variant: drop "organ" and use `[Bridge - solemn]` only.

### Worked example B: "Unlucky 13" (Reel, 29.8 s)
Spotting from `unlucky.cues.json`:
| t (s) | event | job |
|---|---|---|
| 0.0–3.4 | stopwatch 59:47 ticking fast then slow (0.37 s ticks); the piece rises, bonk 2.7, jiggle, turn 3.3 | tension: ticking pulse plus a held, rising figure; bonk and jiggle = cartoon SFX |
| 3.4 | clock passes 1:00:00 | music **drops out** (the "oh no" before the snap) |
| 4.3 | snap: last piece in, 2 s late, coral flash | snap SFX in silence |
| 5.5 | fail: "2 seconds over the hour" | deflated stinger (SFX layer), then music re-enters on the next bar, lighter |
| 8.83 | `key`: N solo 500s in 1:00:00–1:00:13 | **drop** (data, mid-energy) |
| 13.8 | Lucky vs Unlucky | shift (+10 beats) |
| 18.8 | minute chart, the 59 bar | shift (+20 beats) |
| 24.2 | `outro`: the ask | resolve, calm, falling, signature button |
| 28.8–29.8 | rewind loop | reverse SFX |
- Stance: **cartoon on SFX, tense then relieved music**. Physical fail = hit with SFX within frames, music stops. Data part = underscoring.
- Tempo arithmetic: at **121 BPM** from `key` 8.83: Lucky/Unlucky = +10.0 beats, chart = +20.1, question = +30.9, all within 0.04 s. So `outro` is one beat before bar 9: treat it as a pickup into the resolving bar. The opening ticks are a separate clock layer (SFX), not the bed.
- Arc: nervous → frantic → crushed silence → wry recount → warm question.
- **Caption:** `cinematic tension pop, ticking clock pulse, pizzicato strings, marimba, muted trumpet, soft synth bass, light percussion, suspenseful, playful, wry, clean modern mix, instrumental`
- **Tags:** `[Intro - tense ticking]` `[Build]` `[Silence]` `[Verse - light]` `[Drop]` `[Bridge]` `[Outro - calm, descending]` `[Fade Out]`
- BPM 121 · 4/4 · key mood: **minor-leaning for the intro, resolving to relative major** (if one caption can't do both, choose major with "suspenseful" and let the fitter's dropout make the drama). Duration ≈ 36–39 s.
- Leitmotif: **the last piece** = a 2-note rising "almost" (e.g. 5 → 6, not resolving to 8) on the rise, the bonk and the turn. The resolution to the tonic comes only on the snap, which is late, so the resolution itself is the joke. A Friday-13th colour could add a single harpsichord or celesta note (Halloween palette), optional.
- Fit: the bed's tense intro covers 0–3.4, then a hard mute from 3.4. Drop → 8.83. Signature after 24.2 on the bar line (about 25.3).
- Must not: horror, a sad trombone "wah-wah" cliché (too cheap; opinion, owner to judge), vocals.
- Risk: ACE's `[Silence]` placement can't be timed (no tag-to-seconds rule known); the fitter must do the dropout. Variant without `[Silence]`.

### Worked example C: Weekly Numbers Story (cue sheet of the 16.1 s week-46 draft; an 18 s version holds the end longer)
Spotting from `story-1-video.cues.json`:
| t (s) | event | job |
|---|---|---|
| 0.0–0.75 | finished title card | music already playing, soft |
| 0.75–2.35 | whoosh; 7 day pieces land (1.3–2.12, 0.13 s apart); busiest-day accent 2.35 | SFX plinks; bed builds |
| 3.2–3.65 | whoosh → `key`: poster lands | **drop** |
| 4.25–4.5 | count-ups | SFX ticks; bed steady |
| 6.1–7.3 | box rain (impacts) | SFX; bed stays out of the way |
| 8.8–10.6 | stopwatch (L1-3 "Tick" logo) | bed thins (a shift) so the logo is heard |
| 11.15–12.11 | slot spins and three stops | SFX; small lift |
| 13.35 | `outro`: cue to the full report | resolve, falling signature; then hold to the end (16.1 or 18 s) for the link sticker |
- Stance: **underscore, data reveal**. One drop on the poster. Everything else is SFX over a steady bed.
- Tempo arithmetic: **124 BPM** puts `outro` 20.04 beats (5 bars) after `key`. **99 BPM** puts it 16.0 beats (4 bars) after `key`. 104.7 puts the stopwatch on +9, pop-out on +13 and `outro` on +17 beats: good for mid-section hits, but `outro` lands off the bar. Choose by direction: data A → 124, cozy B → 99.
- Arc: anticipation → arrival → busy week → spotlight → calm thanks.
- **Caption (A data, 124):** `minimal electronic, clean modern, plucked synth arpeggio, felt piano chords, woodblock percussion, soft sub bass, optimistic, bright, precise, crisp production, instrumental`
- **Caption (B cozy, 99):** `lo-fi chillhop, felt piano, warm soft plucks, brushed drums, mellow upright bass, woodblock, cozy, warm, upbeat, soft tape texture, instrumental`
- **Tags:** `[Intro - soft plucks]` `[Build]` `[Drop]` `[Breakdown - light]` `[Outro - calm, descending]` `[Fade Out]`
- 4/4 · key mood: **major, optimistic**. Duration: generate ≈ 22–24 s for the 18 s version (stable-range minimum, and over 10 s).
- Leitmotif: the house click on each day piece, and the MSP signature as the button. Nothing else, since this is a recurring weekly format.
- Fit: drop → 3.65. Duck the bed 3–4 dB under the stopwatch logo (8.8–10.6). Signature on the bar line after 13.35. Hold a soft tail to the end, with no fade-to-silence before the end frame.
- Must not: celebratory pop, ticking under the whole thing, vocals.

### Gaps
- The BPM arithmetic assumes the fitter aligns the bar grid from `key`. ACE BPM drifts ±2, so the fitter must detect the real tempo, and a ≤3 % time-stretch may be needed to keep the later hits on bars. This is **untested**. Recommend logging per-fit how far the punchline and `outro` miss their bar.
- Whether ACE-Step honours mid-track instrument changes from tags (`[Bridge - solemn organ]`) or `[Silence]` at the right place is unknown. The brief should assume the fitter does the timing.
- The `outro`-on-bar preference over mid-section hits is my judgement, not sourced.
- I found no sourced data on whether tailored-to-picture music improves Instagram retention compared with library beds. Our insights logging (`audio_recipe` per post) would have to measure it.
