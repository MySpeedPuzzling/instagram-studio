import type { FrameKind } from '../../src/render/render.ts';
import type { Content } from './content.ts';

export interface Slide {
  /** Slide id within the post, e.g. "wall-1". */
  id: string;
  /** Body markup (wrapped by page() with fonts, tokens and the direction's css). */
  body: string;
  frame?: FrameKind;
  safe?: { x0: number; y0: number; x1: number; y1: number };
}

export interface Post {
  /** wall | record | countries | share | xp | story */
  key: string;
  slides: Slide[];
}

export interface Direction {
  id: string;            // "D1"
  name: string;          // "Scorecard Editorial"
  idea: string;          // one line: what makes it recognisable
  css: string;           // theme + component styles shared by all its slides
  posts: (c: Content) => Post[];
}
