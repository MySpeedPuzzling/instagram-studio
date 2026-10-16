// DL4 building blocks: a family module turns the shared content into posts for one house variant.
import type { Variant } from '../../src/design/house.ts';
import type { Post } from '../dl1/types.ts';
import type { Content } from './content.ts';

export type { Post, Slide } from '../dl1/types.ts';

export interface Family {
  /** File name without .ts, e.g. "data". */
  id: string;
  name: string;
  /** Posts for one variant; every post key must be in POST_ORDER (src/design/house.ts). */
  posts(c: Content, v: Variant): Post[];
}
