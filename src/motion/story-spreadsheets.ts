// Animated Story "WE WANT YOUR SPREADSHEETS" (owner 2026-11-13: concept B from lab SW1 with A's siren, "animate siren
// behind it … to bring more attention"). Frame 0 is the complete still (the preview), the loop is seamless:
//   0.0–0.75 hold the finished card
//   0.75–8.0 the beacon turns once (two coral beams sweep behind the text, under the sheet and the call to action),
//            the siren's rays and dome blink, the cursor after the R blinks
//   4.4      the call to action pulses once
import { type Variant } from '../design/house.ts';
import { BEAM_START, SIREN_B, spreadsheetStory } from '../posts/story-spreadsheets.ts';
import { composition } from './kit.ts';
import type { Motion } from './render.ts';

const DURATION = 8;

export function spreadsheetsStoryMotion(v: Variant): Motion {
  const key = 'story-spreadsheets';
  const frameHtml = spreadsheetStory(v, 'B');
  const css = `<style>#sw-cta { transform-origin: 50% 50%; }</style>`;
  const script = `
const T0 = 0.75, END = ${DURATION};
// the beacon: one full turn from the preview angle, so the last frame meets the first
tl.fromTo('#sw-beam', { rotation: ${BEAM_START} }, { rotation: ${BEAM_START + 360}, duration: END - T0, ease: 'none', immediateRender: false }, T0);
// siren blink (rays off/on, dome light/coral) and the text cursor, on whole cycles so both end as they started
const blink = 0.5;
for (let t = T0; t + blink <= END - 0.01; t += blink * 2) {
  tl.set('.sw-rays', { opacity: 0.15 }, t); tl.set('.sw-rays', { opacity: 1 }, t + blink);
  tl.set('.sw-dome', { attr: { fill: '#ffb0ab' } }, t); tl.set('.sw-dome', { attr: { fill: '#ec726f' } }, t + blink);
}
for (let t = T0 + 0.25; t + 0.53 <= END - 0.01; t += 1.06) { tl.set('#sw-caret', { opacity: 0 }, t); tl.set('#sw-caret', { opacity: 1 }, t + 0.53); }
flash('#sw-cta', 4.4);
tl.set({}, {}, END);
`;
  return {
    key, duration: DURATION, coverAt: 0.05,
    qaAt: [0.05, 1.0, 2.6, 4.45, 6.2, DURATION - 0.1],
    html: composition({ key, title: 'Spreadsheets wanted Story', duration: DURATION, frameHtml, css, script }),
  };
}
