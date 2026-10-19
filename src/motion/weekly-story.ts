// The Weekly Numbers Story as a 16 s animation (HyperFrames). It ends on exactly the still Story's layout
// (src/posts/weekly.ts weeklyStories), so the owner's link sticker sits in the same empty zone (y ≈ 1620–1720).
// Frame 0 is a finished title card, because Instagram uses the first frame as the Story's preview (owner 2026-10-19:
// ep. 1's preview was an almost empty navy frame). Beats below are after the intro (+INTRO s):
//   intro    title card: the indigo poster (Weekly report, Week 42, dates) over a fan of the week's most-solved
//            boxes; it holds, then slides up out of the frame, seam first, and the week starts assembling
//   0.0–1.8  the week assembles: 7 generator pieces (Mon–Sun) fly in and snap into a strip, tinted by the day's
//            solves, the busiest day coral; day initials and counts under them
//   1.8–2.1  a short pause: the week registers
//   2.1–3.1  the pieces rise into the indigo poster that drops with the real seam; "Week 42" pops in
//   3.1–4.6  solves, puzzlers and personal bests count up (house number format)
//   4.6–7.6  box rain: the week's five most-solved boxes fall in from above the frame (no fade) into a pile, #1 lifts
//            into its slot, the rest fall away
//   7.6–9.9  stopwatch: the MSP logo plays L1-3 "Tick" (owner pick) while the fastest solo 500 runs 0:00 → its time
//   9.9–12.2 shoutout draw: three slot windows roll blank bars and land on the drawn puzzlers (no other names shown)
//   12.2–15  the cue to the full report; hold
// Nothing animates below y ≈ 1620: the owner's link sticker sits there for the whole video.
// Every number comes from the episode's spec (the published snapshot when rendered with --cached).
import { formatHex, interpolate } from 'culori';
import { CW, GROUNDS, STICKER_STORY_ROWS, W, X0, clock, f1, frame, groundVars, hero, heroFit, posterTopPath, type Variant } from '../design/house.ts';
import { escapeHtml as h, fmtDuration, fmtInt } from '../design/page.ts';
import { flagUrl } from '../design/svg.ts';
import { generateJigsaw } from '../pieces/jigsaw.ts';
import { isoWeek, type WeeklySpec } from '../posts/weekly.ts';
import { composition } from './kit.ts';
import { LOGO_CSS, logoTick } from './logo.ts';
import type { Motion } from './render.ts';

/** Title card length (s): it holds, then slides away while the week starts assembling. */
const INTRO = 1.1;
const SEAM = 860, DURATION = 15 + INTRO;
/** Beat starts (s). */
/** Pause after the last day piece lands (owner 2026-10-19: let the week register before the poster drops). */
const HOLD = 0.3;
// The rain starts as the count-up lands (owner: 0.3 s earlier than after the pause), so later beats keep their times.
const T = { rain: 4.6 + INTRO, lift: 6.75 + INTRO, watch: 7.6 + INTRO, shout: 9.95 + INTRO, cue: 12.25 + INTRO } as const;
const cut = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);
const sec = (s: number) => fmtDuration(s / 60);

export function weeklyStoryMotion(v: Variant, s: WeeklySpec): Motion {
  const key = `weekly-story-${s.weekStart}`;
  const top = GROUNDS.indigo, navy = GROUNDS.navy;
  const week = `Week ${isoWeek(s.weekStart)}`, size = heroFit(week, 250);
  const solo = s.fast.find(r => r.kind === 'solo' && r.pieces === 500);
  const p = s.top[0];

  // 1 · the week: a 7×1 strip from the generator, centred where the poster will land.
  const SW = CW, SH = 150, SX = X0, SY = 640;
  const jig = generateJigsaw({ cols: 7, rows: 1, width: SW, height: SH, x: SX, y: SY, seed: 42, tabSize: 0.24, jitter: 0.03 });
  const max = Math.max(...s.days.map(d => d.results)), min = Math.min(...s.days.map(d => d.results));
  const tint = interpolate([navy.chart.base, navy.chart.cool], 'oklch');
  const pieces = [...jig.pieces].sort((a, b) => a.col - b.col).map((pc, i) => {
    const d = s.days[i], busiest = d.results === max;
    const fill = busiest ? navy.chart.hot : formatHex(tint((d.results - min) / Math.max(1, max - min)));
    const dx = (i - 3) * 160 + (i % 2 ? 90 : -90), dy = (i % 2 ? -1 : 1) * (700 + i * 40);
    return { id: `d${i}`, d: pc.d, fill, dx, dy, rot: (i % 2 ? 1 : -1) * (40 + i * 12), cx: pc.bbox.x + pc.bbox.width / 2, label: d.weekday.slice(0, 1), n: d.results, busiest };
  });
  // Ghost slots (the empty strip in the band colour) so frame 0 already shows the week waiting to be filled.
  const daysSvg = `<svg id="ghost" width="${W}" height="1920" style="position:absolute; left:0; top:0" aria-hidden="true">
    ${pieces.map(pc => `<path d="${pc.d}" fill="${navy.band}" stroke="${navy.bg}" stroke-width="4" stroke-linejoin="round"/>`).join('')}</svg>
    <svg id="days" width="${W}" height="1920" style="position:absolute; left:0; top:0" aria-hidden="true">
    ${pieces.map(pc => `<path id="${pc.id}" d="${pc.d}" fill="${pc.fill}" stroke="${navy.bg}" stroke-width="4" stroke-linejoin="round"/>`).join('')}</svg>
    <div id="daylabs">${pieces.map(pc => `<p class="mo-day${pc.busiest ? ' hot' : ''}" style="left:${f1(pc.cx - 70)}px; top:${SY + SH + 30}px"><b>${pc.label}</b><span>${fmtInt(pc.n)}</span></p>`).join('')}</div>`;

  // 2 · poster top (under the frame body) with the week.
  const heroBase = 470 + size * 0.75;
  // 0 · the title card (frame 0 = the preview): the same poster with its text, already in place.
  const coverUnder = `<svg id="cposter" class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${top.bg}"/></svg>
    <div id="ctext" style="${groundVars(top)}" data-qa-bg="${top.bg}">
      <p class="h-abs h-cap" style="top:420px">Weekly report</p>
      ${hero(week, { size, baseline: heroBase })}
      <p class="h-abs h-dek" style="top:${f1(heroBase + 40)}px; color:var(--g-ink)">${h(s.range)}</p>
    </div>`;
  const under = coverUnder + `<svg id="poster" class="h-poster-top" width="${W}" height="1920" viewBox="0 0 ${W} 1920" aria-hidden="true"><path d="${posterTopPath(SEAM)}" fill="${top.bg}"/></svg>
    <div id="ptext" style="${groundVars(top)}" data-qa-bg="${top.bg}">
      <p class="h-abs h-cap" id="pcap" style="top:420px">Weekly report</p>
      <div id="phero">${hero(week, { size, baseline: heroBase })}</div>
      <p class="h-abs h-dek" id="pdek" style="top:${f1(heroBase + 40)}px; color:var(--g-ink)">${h(s.range)}</p>
    </div>`;

  // 3–7 · the navy part, laid out like the still.
  const thumb = { x: X0, y: SEAM + 300, w: 200, h: 150 };
  const watch = logoTick({ at: T.watch, cx: W / 2, cy: 1505, width: 240 });
  const cards = s.top.slice(0, 5).map((b, i) => ({ id: `c${i}`, img: b.img, x: 390 + (i - 2) * 70, y: 1330 + (i % 2) * 40, rot: (i - 2) * 9 }));
  const shout = s.shout.slice(0, 3);
  const fan = s.top.slice(0, 5).map((b, i) => ({ img: b.img, x: W / 2 - 130 + (i - 2) * 125, y: SEAM + 320 + Math.abs(i - 2) * 22, rot: (i - 2) * 7, z: 5 - Math.abs(i - 2) }));
  const body = `
    ${daysSvg}
    <div id="cfan">
      <p class="h-abs h-cap" style="top:${SEAM + 200}px">Most solved this week</p>
      ${fan.map(c => `<span class="mo-card" style="left:${f1(c.x)}px; top:${f1(c.y)}px; width:260px; height:190px; z-index:${c.z}; transform:rotate(${c.rot}deg)"><img src="${c.img}" alt=""></span>`).join('')}
      <p class="h-abs h-lead" style="top:${SEAM + 640}px; color:var(--g-soft)">Solves, fastest times and a shoutout draw</p>
    </div>
    <div class="h-abs h-strip" id="stats" style="top:${SEAM + 120}px">
      <div><p class="k">Solves</p><p class="v" id="n1">${fmtInt(s.results)}</p></div>
      <div><p class="k">Puzzlers</p><p class="v" id="n2">${fmtInt(s.puzzlers)}</p></div>
      <div><p class="k">PBs</p><p class="v" id="n3">${fmtInt(s.personalBests)}</p></div>
    </div>
    <span class="mo-card" id="most-thumb" style="left:${thumb.x}px; top:${thumb.y}px; width:${thumb.w}px; height:${thumb.h}px"><img src="${p.img}" alt=""></span>
    <div class="h-abs" id="most-txt" style="left:${X0 + thumb.w + 24}px; width:${CW - thumb.w - 24}px; top:${thumb.y + 12}px">
      <p class="h-cap">Most solved</p>
      <p class="mo-name">${h(cut(p.puzzle, 28))}</p>
      <p class="mo-note">${h(cut(p.brand, 20))} · ${fmtInt(p.solvers)} puzzlers</p>
    </div>
    ${cards.map(c => `<span class="mo-card mo-pile" id="${c.id}" style="left:${c.x}px; top:${c.y}px; width:300px; height:220px; transform:rotate(${c.rot}deg)"><img src="${c.img}" alt=""></span>`).join('')}
    ${solo ? `<div class="h-abs" id="fast" style="top:${SEAM + 500}px; display:flex; align-items:baseline; justify-content:space-between">
      <p class="h-cap">Fastest solo 500</p><p class="h-big hot" id="fast-t" style="font-size:72px; transform-origin:100% 50%">${clock(sec(solo.seconds))}</p></div>
    <div id="ring">${watch.html}</div>` : ''}
    <div id="shout">
      <p class="h-abs h-cap" style="top:1455px">Shoutout draw</p>
      ${shout.map((x, i) => `<div class="mo-slot" style="top:${1494 + i * 44}px"><div class="mo-col">${'<p class="mo-bar"><i></i></p>'.repeat(5)}<p class="mo-who">${x.person.country ? `<img class="mo-flag" src="${flagUrl(x.person.country)}" alt="">` : ''}${h(cut(x.person.name, 26))}</p></div></div>`).join('')}
    </div>
    <p class="h-abs h-lead" id="cue" style="top:${SEAM + 640}px; color:var(--g-soft)">Fastest pairs, most solves and a shoutout draw in the full report ↓</p>`;

  const css = LOGO_CSS + `
/* hidden until their beat (CSS, so frame 0 is right; the timeline reveals them with autoAlpha) */
#ghost { opacity: 0; }
#poster, #ptext, #stats, #most-thumb, #most-txt, #fast, #ring, #shout, #cue, .mo-pile { visibility: hidden; opacity: 0; }
.mo-day { position: absolute; width: 140px; text-align: center; font-size: 30px; line-height: 1.25; color: var(--g-soft); }
.mo-day b { display: block; font-size: 38px; color: var(--g-ink); }
.mo-day.hot b, .mo-day.hot span { color: var(--g-hot); font-weight: 700; }
.mo-card { position: absolute; display: block; background: #ffffff; padding: 8px; border-radius: 6px; box-shadow: 0 18px 36px -14px rgba(10, 14, 24, 0.7); }
.mo-card img { display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 2px; }
.mo-name { font-size: 42px; font-weight: 700; line-height: 1.15; color: var(--g-ink); margin-top: 6px; }
.mo-note { font-size: 30px; line-height: 1.3; color: var(--g-soft); }
.mo-slot { position: absolute; left: ${X0}px; width: ${CW}px; height: 44px; overflow: hidden; }
.mo-col p { height: 44px; display: flex; align-items: center; }
.mo-bar i { display: block; width: 320px; height: 18px; border-radius: 9px; background: var(--g-band); }
.mo-who { font-size: 34px; font-weight: 700; color: var(--g-ink); }
.mo-flag { width: 32px; height: 32px; margin-right: 14px; }
`;

  const frameHtml = frame({ ground: 'navy', kind: 'story', kicker: `The Weekly Numbers · Ep. ${s.episode}`, device: v.device, src: s.src, rows: STICKER_STORY_ROWS, masthead: true, under, headGround: 'indigo', body });

  const script = `
const D = DATA, O = D.O;

// intro: the title card holds (it is the preview), then slides up out of the frame, seam first
tl.to(['#cposter', '#ctext', '#cfan'], { y: -1920, duration: 0.55, ease: 'power3.in' }, 0.75);
tl.set(['#cposter', '#ctext', '#cfan'], { autoAlpha: 0 }, 1.31);
tl.to('#ghost', { opacity: 1, duration: 0.3 }, O - 0.1);

// 0.0–1.8 the week assembles
flyIn(D.pieces.map(p => ({ sel: '#' + p.id, dx: p.dx, dy: p.dy, rot: p.rot, ease: p.busiest ? 'back.out(1.6)' : 'expo.out' })), O, { dur: 0.6, stagger: 0.13 });
riseIn('.mo-day', O + 0.5, { stagger: 0.12, dur: 0.35 });
tl.fromTo('#' + D.busiest, { scale: 1 }, { scale: 1.12, duration: 0.12, transformOrigin: '50% 50%', immediateRender: false }, O + 1.25);
tl.to('#' + D.busiest, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, O + 1.37);

// 2.1–3.1 the pieces rise into the poster (after the 0.3 s pause)
tl.to('#days path', { y: -520, opacity: 0, duration: 0.5, ease: 'power3.in', stagger: 0.03 }, O + ${1.8 + HOLD});
tl.to('.mo-day', { opacity: 0, duration: 0.25 }, O + ${1.8 + HOLD});
tl.to('#ghost', { opacity: 0, duration: 0.3 }, O + ${1.8 + HOLD});
tl.set('#poster', { autoAlpha: 1 }, O + ${1.95 + HOLD});
tl.fromTo('#poster', { y: -${SEAM + 140} }, { y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false }, O + ${1.95 + HOLD});
tl.set('#ptext', { autoAlpha: 1 }, O + ${2.35 + HOLD});
riseIn('#pcap', O + ${2.35 + HOLD}, { dur: 0.3 });
popIn('#phero', O + ${2.45 + HOLD}, { from: '0% 80%', scale: 0.7 });
riseIn('#pdek', O + ${2.65 + HOLD}, { dur: 0.3 });

// 3.1–4.6 count-up
tl.set('#stats', { autoAlpha: 1 }, O + ${2.8 + HOLD});
riseIn('#stats > div', O + ${2.8 + HOLD}, { stagger: 0.12, dur: 0.35 });
countUp('#n1', D.results, O + ${2.85 + HOLD}, 1.5);
countUp('#n2', D.puzzlers, O + ${2.97 + HOLD}, 1.4);
countUp('#n3', D.pbs, O + ${3.09 + HOLD}, 1.3);

// 4.6–7.0 box rain → #1 into its slot
// cards start fully above the frame (their bottom edge at y < 0) and are opaque the whole way: they rain in
tl.set('.mo-pile', { autoAlpha: 1 }, D.T.rain);
flyIn(D.cards.map((c, i) => ({ sel: '#' + c.id, dx: (i - 2) * 90, dy: -(c.y + 420 + i * 60), rot: c.rot * 3, ease: 'bounce.out', dur: 1.05 })).reverse(), D.T.rain, { fade: false, stagger: 0.16 });
moveTo('#c0', D.c0, D.thumb, D.T.lift, 0.6);
dropOut(D.cards.slice(1).map(c => '#' + c.id), D.T.lift + 0.05, { stagger: 0.05, dur: 0.5 });
tl.set('#most-thumb', { autoAlpha: 1 }, D.T.lift + 0.6);
tl.set('#c0', { autoAlpha: 0 }, D.T.lift + 0.61);
tl.set('#most-txt', { autoAlpha: 1 }, D.T.lift + 0.5);
riseIn('#most-txt > *', D.T.lift + 0.5, { stagger: 0.08, dur: 0.35 });

// 7.0–8.8 stopwatch
if (D.solo) {
  tl.set(['#fast', '#ring'], { autoAlpha: 1 }, D.T.watch);
  riseIn('#fast .h-cap', D.T.watch, { dur: 0.3 });
  countUp('#fast-t', D.solo, D.T.watch + 0.1, 1.75, fmtT);
  flash('#fast-t', D.T.watch + 1.9);
  // the settled logo leaves as one piece (the wrapper), after the time has landed
  tl.to('#ring', { scale: 0, duration: 0.3, ease: 'back.in(2)', transformOrigin: '50% 50%' }, D.T.watch + 2.2);
  tl.set('#ring', { autoAlpha: 0 }, D.T.watch + 2.5);
}

// 8.8–10.6 shoutout draw
tl.set('#shout', { autoAlpha: 1 }, D.T.shout);
riseIn('#shout .h-cap', D.T.shout, { dur: 0.3 });
slotLand('.mo-col', D.T.shout + 0.1, { dur: 1.0, stagger: 0.3 });
tl.to('#shout', { autoAlpha: 0, duration: 0.3 }, D.T.cue - 0.25);

// 10.6–12 the cue
tl.set('#cue', { autoAlpha: 1 }, D.T.cue);
riseIn('#cue', D.T.cue, { dur: 0.45 });
${watch.script}
tl.set({}, {}, ${DURATION});
`;
  const data = {
    pieces: pieces.map(({ id, dx, dy, rot, busiest }) => ({ id, dx, dy, rot, busiest })), busiest: pieces.find(pc => pc.busiest)!.id,
    results: s.results, puzzlers: s.puzzlers, pbs: s.personalBests, solo: solo?.seconds ?? 0,
    cards: cards.map(c => ({ id: c.id, rot: c.rot, y: c.y })), thumb, T, O: INTRO, c0: { x: cards[0].x, y: cards[0].y, w: 300, h: 220 },
  };
  return {
    key, duration: DURATION, coverAt: DURATION - 0.1,
    qaAt: [0.05, 0.6, ...[1.5, 2.0, 3.0, 4.8, 5.4, 6.3, 7.5, 8.7, 9.9, 11.5, 13.1].map(t => t + INTRO), DURATION - 0.1],
    html: composition({ key, title: `Weekly Numbers ep. ${s.episode} Story`, duration: DURATION, frameHtml, css, data, script }),
  };
}

