// AD1 · the campaign around the doors: the announcement (feed carousel + countdown Story + guide), the Sunday draw
// (winner Story + link-sticker guide + recap carousel), the "day N of 24" device sheets, the recommended 300M guess
// (public dry run of the reply route) and the Close Friends test Story. Sample numbers are marked as samples.
import { CW, GROUNDS, HOUSE, SERIES_OF, W, X0, X1, cover, f1, frame, groundVars, slide, type SlideCtx } from '../../src/design/house.ts';
import { escapeHtml as h, fmtInt } from '../../src/design/page.ts';
import { generateJigsaw } from '../../src/pieces/jigsaw.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../../src/render/server.ts';
import { AD_CSS, CORAL, INK_DARK, adventGrid, letterPiece, replyCue, stickerZone } from './parts.ts';
import { FAKE_SEED, dayDate, type Content } from './content.ts';
import type { LabPost } from './posts.ts';

// Campaign posts take the coral poster (milestones, events and timely stories; owner 2026-10-17). Registered at run
// time so src/design/house.ts stays untouched (proposal: add an 'advent' series there).
for (const k of ['advent-announce', 'advent-week', 'milestone-300m']) SERIES_OF[k] = 'milestone';

const css = `<style>${AD_CSS}
.ad-step { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; gap: 28px; align-items: flex-start; }
.ad-step .n { flex: none; width: 76px; font-size: 44px; font-weight: 700; color: var(--g-hot); }
.ad-step .t { flex: 1; } .ad-step .t b { display: block; font-size: 44px; font-weight: 700; line-height: 1.12; color: var(--g-ink); }
.ad-step .t span { display: block; font-size: 34px; line-height: 1.3; color: var(--g-soft); margin-top: 6px; }
.ad-hex { font-weight: 700; letter-spacing: 0.04em; color: var(--g-ink); }
.ad-tk { position: absolute; left: ${X0}px; width: ${CW}px; display: flex; align-items: center; height: 84px; border-bottom: 2px solid var(--g-band); font-size: 34px; color: var(--g-soft); }
.ad-tk .r { width: 70px; font-weight: 700; color: var(--g-accent); } .ad-tk .s { flex: 1; font-weight: 700; color: var(--g-ink); letter-spacing: 0.03em; } .ad-tk .u { width: 330px; text-align: right; }
.ad-tk.hot::before { content: ''; position: absolute; left: -${X0}px; top: 0; bottom: 0; width: 14px; background: var(--g-device); }
.ad-tk.hot .s, .ad-tk.hot .u { color: var(--g-hot-text); }
.ad-sticker { position: absolute; background: #ffffff; border-radius: 34px; box-shadow: 0 16px 40px -12px rgba(0,0,0,.55); color: ${INK_DARK}; }
.ad-note { position: absolute; font-size: 30px; font-weight: 700; color: ${INK_DARK}; background: #ffd9d7; padding: 6px 16px; border-radius: 10px; }
</style>`;

const ctx = (post: string, slideN: number, of: number): SlideCtx => ({ v: HOUSE, post, slide: slideN, of });
const SAMPLE = { tickets: 1284, puzzlers: 431, right: [58, 71, 64, 22, 81, 47] };

// ------------------------------------------------------------------ announcement

function announcement(c: Content): LabPost[] {
  const P = 'advent-announce', N = 5;
  const s1 = cover(ctx(P, 1, N), 'cover', {
    kicker: 'Advent of Puzzle · from 30 Nov', title: '24 doors, 24 puzzle quizzes, 4 Sunday draws.',
    dek: 'A new quiz in our Story every evening at 19:00 CET. Answer right and you\'re in Sunday\'s draw.', hero: { value: '24', unit: 'doors' }, src: 'Starts Monday 30 November',
  });
  const steps = (top: number, rows: Array<[string, string]>, gap = 150) => rows.map(([b, s], i) => `<div class="ad-step" style="top:${top + i * gap}px"><span class="n">${String(i + 1).padStart(2, '0')}</span><div class="t"><b>${h(b)}</b><span>${h(s)}</span></div></div>`).join('');
  const s2 = slide(ctx(P, 2, N), 'data', {
    kicker: 'Advent of Puzzle · how it works', title: 'One door every evening, Monday to Saturday.', src: 'Advent of Puzzle · 30 Nov – 27 Dec 2026',
    body: css + adventGrid({ x: X0, y: 390, w: CW, h: 300, day: 1, mode: 'calendar', weekdays: true, id: 'an2' }) +
      steps(730, [['19:00 CET: a new door opens', 'A quiz from MySpeedPuzzling data in our Story.'], ['Reply to the Story', 'Your answer, in a message. 24 hours to answer.'], ['Sunday: one winner', 'Drawn from the week\'s right answers.']], 116) +
      `<p class="h-body h-abs" style="top:1084px; color:var(--g-ink)">Free · 18+ · worldwide except Italy and Brazil · not affiliated with Instagram</p>`,
  }).html;
  const s3 = slide(ctx(P, 3, N), 'data', {
    kicker: 'Advent of Puzzle · how to answer', title: 'Reply to the Story. That\'s it.', src: 'Full rules: link in bio',
    body: css + `<div style="position:absolute; left:${X0}px; top:330px; width:430px; height:520px; border-radius:28px; background:var(--g-band); border:3px solid var(--g-rule)">
        <p class="h-cap" style="position:absolute; left:34px; top:34px">Day 7</p>
        <p style="position:absolute; left:34px; top:84px; width:362px; font-size:40px; font-weight:700; line-height:1.12">Which one do puzzlers finish fastest?</p>
        <div style="position:absolute; left:34px; top:250px">${['A', 'B', 'C'].map((l, i) => `<div style="position:absolute; left:${i * 120}px">${letterPiece(l, 84)}</div>`).join('')}</div>
        <div style="position:absolute; left:22px; right:22px; bottom:22px; height:84px; border-radius:42px; border:3px solid var(--g-soft); display:flex; align-items:center; padding-left:30px"><span style="font-size:32px; color:var(--g-soft)">Send message</span></div></div>
      <div style="position:absolute; left:${X0 + 500}px; top:560px; width:404px">
        <div style="margin-left:auto; width:150px; height:110px; border-radius:55px; background:${CORAL}; display:grid; place-items:center" data-qa-bg="${CORAL}"><span style="font-size:56px; font-weight:700; color:${INK_DARK}">B</span></div>
        <p class="h-body" style="text-align:right; margin-top:14px">Your reply arrives as a private message.</p></div>
      ${steps(930, [['Your first answer counts', 'One answer per person per door.'], ['Small typos are fine', 'Letters, numbers or names; times within the stated range.']], 132)}`,
  }).html;
  const tk = [['0003 9e1a', '4b7c 51d0'], ['0012 77f4', '9a03 e2bb'], ['0041 c08e', '13f6 7a29'], ['0057 a2d1', 'c4e0 0f8b'], ['0066 1b3f', '72d9 ae14']];
  const s4 = slide(ctx(P, 4, N), 'data', {
    kicker: 'Advent of Puzzle · the draw', title: 'A draw anyone can check.', src: 'Example tickets, not a real draw',
    body: css + steps(330, [['Monday: we post a fingerprint', `of a secret number, e.g. ${FAKE_SEED(2)}.`], ['Sunday: we reveal the number', 'It matches the fingerprint, so it was fixed in advance.'], ['The lowest ticket wins', 'Each ticket is the number + your name, scrambled the same way for everyone.']], 150) +
      `<p class="h-cap h-abs" style="top:810px">Example: the five lowest tickets</p>` +
      tk.map(([a, b], i) => `<div class="ad-tk ${i === 0 ? 'hot' : ''}" style="top:${860 + i * 64}px; height:64px"><span class="r">${i + 1}</span><span class="s">${a} ${b} …</span><span class="u">${i === 0 ? 'winner' : `ticket of puzzler ${String.fromCharCode(66 + i)}`}</span></div>`).join(''),
  }).html;
  const s5 = slide(ctx(P, 5, N), 'data', {
    kicker: 'Advent of Puzzle · prizes and rules', title: 'Four Sundays, four winners.', src: 'Not sponsored or run by Instagram · rules: link in bio',
    body: css + `<div class="h-abs h-strip" style="top:330px"><div><p class="k">Doors</p><p class="v">24</p></div><div><p class="k">Draws</p><p class="v">4</p></div><div><p class="k">Entry</p><p class="v">Free</p></div></div>` +
      steps(520, [['A voucher every Sunday', 'Prize to be announced (owner decision).'], ['Free, 18+, no purchase', 'Worldwide except Italy and Brazil. No follow needed.'], ['One prize per person', 'Winners are drawn from the right answers of that week.']], 140) +
      `<p class="h-abs h-ask" style="top:1000px">Which door are you most curious about?</p>`,
  }).html;
  const caption = [
    'Advent of Puzzle starts Monday: 24 doors, one puzzle quiz every evening at 19:00 CET, and a voucher drawn every Sunday.',
    '',
    'Every door is a quiz from MySpeedPuzzling data: which puzzle is faster, guess the box from a crop, which country loves which puzzle. Reply to the Story with your answer; every right answer is a ticket for that Sunday\'s draw. The draw is one anyone can check: we post the fingerprint of the secret number on Monday and reveal it on Sunday.',
    '',
    'Free, 18+, no purchase, worldwide except Italy and Brazil. Rules in the link in bio. Not sponsored or run by Instagram.',
    '',
    'Which door are you most curious about? 🧩',
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlequiz #adventcalendar',
  ].join('\n');

  // The Story: a countdown sticker to the first door. Room for the sticker at 130 % (845 × 429).
  const story = (guide: boolean) => frame({
    ground: 'navy', kind: 'story', kicker: 'Advent of Puzzle', device: 'piece', src: 'Rules: link in bio',
    body: css + `<h1 class="ad-q" style="top:330px; font-size:66px">Advent of Puzzle starts Monday at 19:00 CET.</h1>
      ${adventGrid({ x: X0, y: 560, w: CW, h: 300, day: 1, mode: 'calendar', id: `as${guide ? 'g' : ''}` })}
      <p class="h-lead h-abs" style="top:890px">24 doors. Reply to each evening's Story; win on Sundays.</p>
      ${guide ? countdownMock(1030) : stickerZone((W - 650) / 2, 1080, 650, 330, 'Countdown sticker', { outer: 1.3 })}`,
  });
  return [
    { key: 'advent-announce', section: 'Announcement', label: 'Announcement carousel (Sun 29 Nov, 19:00)', caption, note: 'H4: coral poster first (campaign = events/timely), navy boards after. Prize line is a placeholder until the owner decides.', slides: [s1, s2, s3, s4, s5].map((body, i) => ({ id: `announce-${i + 1}`, body })) },
    { key: 'advent-announce-story', section: 'Announcement', label: 'Announcement Story + guide (countdown sticker)', note: 'Left: the frame to upload. Right: the guide with a life-size countdown sticker (default ≈ 650 × 330; the dashed outer box is 130 %). Sticker: Countdown, name "Advent of Puzzle", ends Mon 30 Nov 19:00.',
      slides: [{ id: 'announce-story', body: story(false), frame: 'story' }, { id: 'announce-story-guide', body: story(true), frame: 'story' }] },
  ];
}

/** Life-size mock of Instagram's countdown sticker (default ≈ 650 × 330 canvas px) for the guide image. */
function countdownMock(top: number): string {
  const x = (W - 650) / 2;
  return `<div class="ad-sticker" style="left:${x}px; top:${top + 50}px; width:650px; height:330px" data-qa-bg="#ffffff">
      <p style="position:absolute; left:0; right:0; top:40px; text-align:center; font-size:40px; font-weight:700">ADVENT OF PUZZLE</p>
      <p style="position:absolute; left:0; right:0; top:120px; text-align:center; font-size:96px; font-weight:700; color:#4e54c8; letter-spacing:0.04em">2 : 14 : 05</p>
      <p style="position:absolute; left:0; right:0; top:240px; text-align:center; font-size:30px; color:#4b566b">days · hours · min</p></div>
    <p class="ad-note" style="left:${x}px; top:${top}px">Countdown sticker · default size · drag here</p>`;
}

/** Life-size mock of the link sticker (≈ 120 px tall pill). */
function linkMock(top: number, text: string): string {
  const w = 560, x = (W - w) / 2;
  return `<div class="ad-sticker" style="left:${x}px; top:${top + 50}px; width:${w}px; height:120px; border-radius:60px; display:flex; align-items:center; justify-content:center; gap:18px" data-qa-bg="#ffffff">
      <svg width="50" height="50" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" stroke="#4e54c8" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
      <span style="font-size:40px; font-weight:700; color:#4e54c8">${h(text)}</span></div>
    <p class="ad-note" style="left:${x}px; top:${top}px">Link sticker · text "${h(text)}"</p>`;
}

// ------------------------------------------------------------------ the Sunday draw

function sunday(c: Content): LabPost[] {
  const story = (guide: boolean) => frame({
    ground: 'navy', kind: 'story', kicker: 'Advent of Puzzle · week 2 draw', device: 'piece', src: 'Sample numbers · rules: link in bio',
    body: css + `<p class="h-cap h-abs" style="top:330px">Drawn Sunday 13 Dec, 19:30 CET</p>
      <h1 class="ad-q" style="top:384px; font-size:84px; line-height:1.04">@winner_handle</h1>
      <p class="h-lead h-abs" style="top:486px">reply to this Story or message us within 7 days to claim your voucher.</p>
      <div class="h-abs h-strip" style="top:636px"><div><p class="k">Right answers</p><p class="v">${fmtInt(SAMPLE.tickets)}</p></div><div><p class="k">Tickets</p><p class="v">${fmtInt(SAMPLE.tickets)}</p></div><div><p class="k">Puzzlers</p><p class="v">${SAMPLE.puzzlers}</p></div></div>
      <div class="ad-tk" style="top:800px"><span class="s" style="flex:none; width:400px; color:var(--g-soft); font-weight:500">Fingerprint (Mon)</span><span class="ad-hex">${FAKE_SEED(2)}</span></div>
      <div class="ad-tk" style="top:884px"><span class="s" style="flex:none; width:400px; color:var(--g-soft); font-weight:500">Seed revealed</span><span class="ad-hex">9c27 41ee 0a5d …</span></div>
      <div class="ad-tk hot" style="top:968px"><span class="s" style="flex:none; width:400px; font-weight:500">Winning ticket</span><span class="ad-hex" style="color:var(--g-hot-text)">0003 9e1a 4b7c …</span></div>
      <p class="h-body h-abs" style="top:1080px; text-align:center; color:var(--g-ink)">Check your own ticket: link in bio</p>
      ${guide ? linkMock(1130, 'ADVENT WEEK 2') : stickerZone((W - 650) / 2, 1170, 650, 140, 'Link sticker → the week 2 post')}
      <p class="ad-fine" style="top:1360px">We announce winners only here. We never ask for payment, card details, logins or links, and never message from another account.</p>`,
  });
  const P = 'advent-week', N = 4;
  const s1 = cover(ctx(P, 1, N), 'cover', {
    kicker: 'Advent of Puzzle · week 2', title: '@winner_handle wins week 2.', dek: 'Drawn from every right answer of days 7–12, one ticket each (sample numbers).',
    hero: { value: fmtInt(SAMPLE.tickets), unit: 'tickets', max: 220 }, src: 'Sample numbers · rules: link in bio',
  });
  const qs = c.quizzes;
  const rowsHtml = qs.map((q, i) => {
    const ans = q.kind === 'number' ? `${q.hidden.value} min` : q.kind === 'piece' ? 'C' : q.options.find(o => o.letter === q.correct)!.label;
    const thumb = q.kind === 'piece' ? q.box : q.reveal && 'box' in q.reveal ? q.reveal.box : undefined;
    return `<div class="ad-row" style="top:${330 + 60 + i * 132}px; height:132px">
      <span style="width:150px; flex:none"><b style="display:block; font-size:38px; font-weight:700">Day ${q.day}</b><span class="h-lab">${h(dayDate(q.day).split(' ')[0])}</span></span>
      ${thumb ? `<span class="th" style="width:${f1(96 * thumb.ratio)}px; height:96px"><img src="${thumb.img}" alt=""></span>` : `<span style="width:131px; flex:none"></span>`}
      <div class="nm"><p style="font-size:38px">${h(ans)}</p><p>${h(q.type)}</p></div>
      <span class="vl" style="font-size:40px">${SAMPLE.right[i]}%</span></div>`;
  }).join('');
  const s2 = slide(ctx(P, 2, N), 'data', {
    kicker: 'Advent week 2 · the answers', title: 'The six answers of week 2.', src: 'Share right = sample numbers; boxes: Ravensburger, Peliko',
    body: css + `<div class="h-bh h-abs" style="top:330px"><span style="width:174px">Door</span><span style="flex:1">Answer</span><span>Right</span></div>${rowsHtml}`,
  }).html;
  const tk = [['0003 9e1a 4b7c', '@winner_handle'], ['0012 77f4 9a03', ''], ['0041 c08e 13f6', ''], ['0057 a2d1 c4e0', ''], ['0066 1b3f 72d9', '']];
  const s3 = slide(ctx(P, 3, N), 'data', {
    kicker: 'Advent week 2 · the draw', title: 'How we drew it, and how to check.', src: 'Example tickets · full list: link in bio',
    body: css + `<div class="ad-tk" style="top:350px"><span class="s" style="flex:none; width:420px; color:var(--g-soft); font-weight:500">Fingerprint, posted Mon</span><span class="ad-hex">${FAKE_SEED(2)}</span></div>
      <div class="ad-tk" style="top:434px"><span class="s" style="flex:none; width:420px; color:var(--g-soft); font-weight:500">Seed, revealed Sun</span><span class="ad-hex">9c27 41ee 0a5d …</span></div>
      <p class="h-body h-abs" style="top:550px">Ticket = scramble of seed + username (SHA-256). Lowest wins. Only the winner is named: work out your own ticket from the seed and find it in the full list.</p>
      <p class="h-cap h-abs" style="top:700px">The five lowest tickets</p>
      ${tk.map(([s, u], i) => `<div class="ad-tk ${i === 0 ? 'hot' : ''}" style="top:${750 + i * 80}px; height:80px"><span class="r">${i + 1}</span><span class="s">${s}</span><span class="u">${h(u)}</span></div>`).join('')}`,
  }).html;
  const s4 = slide(ctx(P, 4, N), 'data', {
    kicker: 'Advent of Puzzle · next week', title: 'Door 13 opens Monday at 19:00 CET.', src: 'Advent of Puzzle · 30 Nov – 27 Dec 2026',
    body: css + adventGrid({ x: X0, y: 420, w: CW, h: 400, day: 13, mode: 'calendar', weekdays: true, id: 'wk4' }) +
      `<p class="h-lead h-abs" style="top:860px">12 doors open, 12 to go. Two more Sunday draws.</p><p class="h-abs h-ask" style="top:960px">Which door was your favourite so far?</p>`,
  }).html;
  const caption = [
    'Week 2 of Advent of Puzzle has a winner: congratulations, @winner_handle! 🎉 Reply to our Story or message us within 7 days to claim your voucher.',
    '',
    'Swipe for the six answers, how many of you got each one right, and the draw itself: the fingerprint we posted on Monday, the seed we revealed tonight, and the five lowest tickets. Your own ticket is the scramble of the seed and your username, so you can work it out and find it in the full list yourself.',
    '',
    'We announce winners only here and never ask for payment, card details or logins. Door 13 opens Monday at 19:00 CET. Which door was your favourite so far?',
    '',
    '#speedpuzzling #jigsawpuzzle #puzzlequiz #ravensburger',
  ].join('\n');
  return [
    { key: 'advent-sunday-story', section: 'Sunday draw', label: 'Winner Story + guide (link sticker)', note: 'Sunday ~20:00 after the draw. Username, tickets and hashes are placeholders. Guide: life-size link sticker to the recap post.', slides: [{ id: 'winner-story', body: story(false), frame: 'story' }, { id: 'winner-story-guide', body: story(true), frame: 'story' }] },
    { key: 'advent-week', section: 'Sunday draw', label: 'Sunday recap carousel: answers, winner, the draw', caption, note: 'Replaces the Saturday community slot during Advent. Percentages and tickets are sample numbers.', slides: [s1, s2, s3, s4].map((body, i) => ({ id: `week-${i + 1}`, body })) },
  ];
}

// ------------------------------------------------------------------ day N of 24 device sheets

function deviceSheets(c: Content): LabPost {
  const days = [1, 6, 7, 13, 19, 24];
  const cellW = 280, cellH = 360, gx = (CW - 3 * cellW) / 2;
  const at = (i: number) => ({ x: X0 + (i % 3) * (cellW + gx), y: 330 + Math.floor(i / 3) * (cellH + 60) });
  const sheet = (n: number, title: string, mini: (d: number, x: number, y: number) => string) => slide({ v: HOUSE, post: 'device', slide: n, of: 4 }, 'data', {
    kicker: 'Day N of 24 · device options', title, titleSize: 's', src: 'Days 1, 6, 7, 13, 19 and 24',
    body: css + days.map((d, i) => { const p = at(i); return mini(d, p.x, p.y + 60) + `<p class="h-cap" style="position:absolute; left:${p.x}px; top:${p.y + 6}px">Day ${d}</p>`; }).join(''),
  }).html;
  const a = sheet(1, 'A · calendar jigsaw (V2)', (d, x, y) => adventGrid({ x, y: y + 40, w: cellW, h: 190, day: d, mode: 'calendar', numbers: false, id: `sa${d}` }));
  const b = sheet(2, 'B · picture reveal (V3)', (d, x, y) => adventGrid({ x, y, w: cellW, h: Math.round(cellW / c.mystery.ratio), day: d, mode: 'reveal', img: c.mystery.img, numbers: false, id: `sb${d}` }) +
    (d === 24 ? `<p class="h-lab" style="position:absolute; left:${x}px; top:${y + 220}px; width:${cellW}px">Day 24 asks: which puzzle?</p>` : ''));
  const coral = GROUNDS.coral;
  const cc = sheet(3, 'C · door number on the poster (V1)', (d, x, y) => `<div style="position:absolute; left:${x}px; top:${y}px; width:${cellW}px; height:230px; border-radius:14px; background:${coral.bg}; ${groundVars(coral)}" data-qa-bg="${coral.bg}">
      <p class="h-big" style="position:absolute; left:24px; top:30px; font-size:140px">${d}</p><p class="h-body" style="position:absolute; right:24px; bottom:22px; color:var(--g-ink)">of 24</p></div>`);
  const dd = sheet(4, 'D · header index only (V4)', (d, x, y) => `<div style="position:absolute; left:${x}px; top:${y + 60}px; width:${cellW}px; border-top:2px solid var(--g-rule); border-bottom:2px solid var(--g-rule); padding:26px 0; display:flex; align-items:center; gap:14px">
      <svg width="34" height="34" viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10" rx="2" fill="var(--g-device)"/></svg><span class="h-idx" style="margin-left:auto; font-size:44px">${d}<i> / 24</i></span></div>`);
  return { key: 'device', section: 'Day N of 24', label: 'Device options across the campaign', note: 'Each sheet shows the same device on days 1, 6, 7, 13, 19 and 24 (tonight = coral). A and B are made of generator pieces; B completes a mystery box picture by day 24.', slides: [a, b, cc, dd].map((body, i) => ({ id: `device-${'abcd'[i]}`, body })) };
}

// ------------------------------------------------------------------ recommended: the 300M guess

function m300(): LabPost[] {
  const pace = JSON.parse(readFileSync(join(ROOT, 'content/cache/bs-milestone-pace.json'), 'utf8'));
  const r = pace.rows[0], asOf = pace.queried_at.slice(0, 10);
  const pieces = Number(r.pieces), perDay = Number(r.pieces_per_day);
  // 30 generator pieces = 300 million; each piece is 10 million.
  const strip = (top: number, filled: number) => {
    const w = CW, hh = 300, jig = generateJigsaw({ cols: 10, rows: 3, width: w, height: hh, seed: 52, tabSize: 0.2, jitter: 0.03 });
    const paths = jig.pieces.sort((a, b) => a.row - b.row || a.col - b.col).map((p, i) => {
      const n = i + 1, fill = n <= Math.floor(filled) ? 'var(--c-base)' : n === Math.ceil(filled) ? 'var(--g-device)' : 'var(--g-band)';
      return `<path d="${p.d}" fill="${fill}" stroke="${n <= filled + 1 ? 'var(--g-bg)' : 'var(--g-rule)'}" stroke-width="3"/>`;
    }).join('');
    return `<svg width="${w}" height="${hh}" style="position:absolute; left:${X0}px; top:${top}px" aria-hidden="true">${paths}</svg>`;
  };
  const guess = frame({
    ground: 'navy', kind: 'story', kicker: 'Guess the day · 300 million pieces', device: 'piece', src: `Pieces logged on MySpeedPuzzling · ${asOf}`,
    body: css + `<h1 class="ad-q" style="top:330px; font-size:60px">On which day will MySpeedPuzzling pass 300,000,000 pieces?</h1>
      <p class="h-cap h-abs" style="top:560px">Pieces logged by ${h(new Date(asOf).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))}</p>
      <p class="h-big h-abs" style="top:610px; font-size:128px">${fmtInt(pieces)}</p>
      ${strip(790, pieces / 1e7)}
      <p class="h-body h-abs" style="top:1110px">One piece = 10 million pieces. ${Math.floor(pieces / 1e7)} done, the coral one is filling up.</p>
      <div class="h-abs h-strip" style="top:1200px"><div><p class="k">Pieces a day</p><p class="v">+${fmtInt(perDay)}</p></div><div><p class="k">To go</p><p class="v">${(Math.round((3e8 - pieces) / 1e5) / 10).toFixed(1)}M</p></div></div>
      ${replyCue('a date', 1400, 'Text only. Your first guess counts.')}<p class="ad-fine" style="top:1562px">Closest guess gets a shout-out · rules: link in bio</p>`,
  });
  const answer = frame({
    ground: 'navy', kind: 'story', kicker: 'Guess the day · the answer', device: 'piece', src: 'Sample date and numbers',
    body: css + `<p class="h-cap h-abs" style="top:340px">We passed it on</p><p class="h-big h-abs" style="top:396px; font-size:150px">25 Nov</p>
      ${strip(620, 30)}
      <p class="h-cap h-abs" style="top:980px">Closest guess</p>
      <h1 class="ad-q" style="top:1030px; font-size:76px">@handle_placeholder</h1>
      <p class="h-lead h-abs" style="top:1130px">guessed 26 Nov: one day off. Thank you for 412 guesses (sample).</p>
      ${stickerZone((W - 650) / 2, 1300, 650, 150, 'Link sticker → the 300M post')}`,
  });
  const poster = cover(ctx('milestone-300m', 1, 3), 'fact', {
    kicker: 'Milestone · 300 million pieces', title: '300,000,000 pieces logged on MySpeedPuzzling. Laid edge to edge, about London to New York.',
    hero: { value: '300,000,000' }, src: 'Sample date · data: myspeedpuzzling.com',
  });
  return [{ key: 'm300', section: 'Recommended: 300M guess', label: 'Guess the day: 300 million pieces (public dry run of the reply route)', note: `Early Nov, one week open: the guess Story (reply with a date, no sticker), the answer/shout-out Story on the crossing day, the milestone post's first slide. Pace from bs-milestone-pace (${asOf}): ${fmtInt(perDay)} pieces a day.`,
    slides: [{ id: 'm300-guess', body: guess, frame: 'story' }, { id: 'm300-answer', body: answer, frame: 'story' }, { id: 'm300-poster', body: poster }] }];
}

// ------------------------------------------------------------------ the Close Friends test Story

function testStory(): LabPost {
  const T = (n: number, title: string, body: string) => frame({ ground: 'navy', kind: 'story', kicker: `API test ${n} of 3 · Close Friends only`, device: 'piece', src: 'Test for MySpeedPuzzling, ignore', body: css + `<h1 class="ad-q" style="top:330px; font-size:66px">${h(title)}</h1>${body}` });
  const pollMock = (top: number) => `<div class="ad-sticker" style="left:${(W - 630) / 2}px; top:${top}px; width:630px; height:465px" data-qa-bg="#ffffff">
      <p style="position:absolute; left:0; right:0; top:44px; text-align:center; font-size:40px; font-weight:700">Edges first?</p>
      ${['Yes, always', 'No, colours first'].map((t, i) => `<div style="position:absolute; left:40px; right:40px; top:${150 + i * 135}px; height:112px; border-radius:56px; background:#eef1f6; display:grid; place-items:center"><span style="font-size:38px; font-weight:600">${t}</span></div>`).join('')}</div>`;
  const quizMock = (top: number) => `<div class="ad-sticker" style="left:${(W - 630) / 2}px; top:${top}px; width:630px; height:600px" data-qa-bg="#ffffff">
      <p style="position:absolute; left:30px; right:30px; top:40px; text-align:center; font-size:38px; font-weight:700; line-height:1.15">Most-solved size on MySpeedPuzzling?</p>
      ${['300', '500', '1000'].map((t, i) => `<div style="position:absolute; left:40px; right:40px; top:${190 + i * 135}px; height:112px; border-radius:56px; background:#eef1f6; display:flex; align-items:center; padding-left:36px; gap:24px"><span style="font-size:34px; font-weight:700; color:#4e54c8">${'ABC'[i]}</span><span style="font-size:38px; font-weight:600">${t} pieces</span></div>`).join('')}</div>`;
  const note = (top: number, t: string) => `<p class="ad-note" style="left:${X0}px; top:${top}px">${h(t)}</p>`;
  const t1 = (g: boolean) => T(1, 'Poll sticker test', `<p class="h-lead h-abs" style="top:430px">Vote in the poll. Then tap to the next frame.</p>
      ${g ? note(560, 'POLL sticker · 2 options · default size · centre here') + pollMock(620) : stickerZone((W - 630) / 2, 620, 630, 465, 'Poll sticker, 2 options', { outer: 1.3 })}`);
  const t2 = (g: boolean) => T(2, 'Quiz sticker test', `<p class="h-lead h-abs" style="top:430px">Answer the quiz. Then tap to the next frame.</p>
      ${g ? note(560, 'QUIZ sticker · 3 options · correct = B · centre here') + quizMock(620) : stickerZone((W - 630) / 2, 620, 630, 600, 'Quiz sticker, 3 options', { outer: 1.2 })}`);
  const t3 = (g: boolean) => T(3, 'Reply with a word: PUZZLE', `<p class="h-lead h-abs" style="top:430px">Use the reply field under this Story. Then send a second reply with only an emoji.</p>
      <div style="position:absolute; left:${X0 + 200}px; top:760px; width:500px; height:150px; border-radius:75px; background:${CORAL}; display:grid; place-items:center" data-qa-bg="${CORAL}"><span style="font-size:72px; font-weight:700; color:${INK_DARK}; letter-spacing:0.06em">PUZZLE</span></div>
      ${g ? note(1000, 'No sticker on this frame · turn off Story comments (⋯)') : ''}
      ${replyCue('PUZZLE', 1400, '')}`);
  return { key: 'story-test', section: 'Test Story (Close Friends)', label: 'API test Story: poll, quiz, reply (frames + guides)', testStory: true,
    note: 'content/labs/STORY-TEST/: upload story-test-T1/T2/T3.jpg to Close Friends; the -guide images show the exact sticker, text and place. Steps: content/labs/STORY-TEST/instructions.md.',
    slides: [
      { id: 'story-test-T1', body: t1(false), frame: 'story' }, { id: 'story-test-T1-guide', body: t1(true), frame: 'story' },
      { id: 'story-test-T2', body: t2(false), frame: 'story' }, { id: 'story-test-T2-guide', body: t2(true), frame: 'story' },
      { id: 'story-test-T3', body: t3(false), frame: 'story' }, { id: 'story-test-T3-guide', body: t3(true), frame: 'story' },
    ] };
}

export function campaignPosts(c: Content): LabPost[] {
  return [...announcement(c), ...sunday(c), deviceSheets(c), ...m300(), testStory()];
}
export { X1 };
