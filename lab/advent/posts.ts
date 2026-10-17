// AD1 · every lab post: doors per variant, answer reveals, and (added below) the campaign posts.
import type { FrameKind } from '../../src/render/render.ts';
import { door, reveal, VARIANT_INFO, type VariantId } from './doors.ts';
import type { Content } from './content.ts';
import { campaignPosts } from './campaign.ts';

export interface LabSlide { id: string; body: string; frame?: FrameKind; safe?: { x0: number; y0: number; x1: number; y1: number } }
export interface LabPost { key: string; section: string; label: string; note?: string; caption?: string; testStory?: boolean; slides: LabSlide[] }

export const SECTIONS = ['Doors', 'Answer reveals', 'Announcement', 'Sunday draw', 'Day N of 24', 'Recommended: 300M guess', 'Test Story (Close Friends)'] as const;

export function allPosts(c: Content): LabPost[] {
  const out: LabPost[] = [];
  for (const v of ['V1', 'V2', 'V5', 'V3', 'V4'] as VariantId[]) {
    out.push({ key: `doors-${v}`, section: 'Doors', label: `${v} · ${VARIANT_INFO[v].name}`, note: VARIANT_INFO[v].idea,
      slides: c.quizzes.map(q => ({ id: `${v}-d${q.day}-${q.key}`, body: door(v, q, c), frame: 'story' })) });
  }
  out.push({ key: 'reveals', section: 'Answer reveals', label: 'Answer reveal (next evening, frame 1 of the set)', note: 'Yesterday\'s answer with the numbers, the box named and credited; the share right is a sample number.',
    slides: c.quizzes.map(q => ({ id: `rev-d${q.day}-${q.key}`, body: reveal(q), frame: 'story' })) });
  out.push(...campaignPosts(c));
  return out;
}
