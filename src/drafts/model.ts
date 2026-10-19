// Drafts: one folder per post under content/drafts/<id>/ (gitignored: drafts mix in member data).
//
//   draft.yaml        state, caption, slides, alt text, schedule, tags for analysis
//   feedback.jsonl    append-only owner feedback and decisions
//   slides/           the exact JPEGs that will be uploaded (+ .ig.jpg previews)
//   facts.json        the data snapshot every number in the post comes from
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from '../render/server.ts';

export const DRAFTS = join(ROOT, 'content/drafts');

export type Status =
  | 'idea' | 'drafted' | 'in_review' | 'changes_requested' | 'approved' | 'scheduled' | 'publishing' | 'published'
  | 'rejected' | 'failed' | 'needs_reschedule';

export const REJECT_REASONS = ['off-brand', 'factually wrong', 'weak hook', 'privacy', 'duplicate', 'boring', 'other'] as const;

/** A photo tag on a slide: an Instagram username at a position (0–1 from the image's left and top edges). */
export interface UserTag { username: string; x: number; y: number }
export interface DraftSlide { file: string; preview?: string; alt: string; user_tags?: UserTag[] }

export interface Draft {
  id: string;
  status: Status;
  title: string;
  pillar?: string;
  format: 'carousel' | 'single' | 'reel' | 'story';
  /** Hypothesis-friendly tags for the learning loop: series, season, episode, mechanic, template, test arm… */
  tags?: Record<string, string | number>;
  caption: string;
  caption_author: 'claude' | 'human';
  /** Phrases a puzzler would search for; the caption lint checks they're in the text (and one in the hook). */
  search_phrases?: string[];
  /** Names quoted in the caption (puzzles, brands, players), exempt from the banned-word lint. */
  proper_nouns?: string[];
  slides: DraftSlide[];
  collaborators?: string[];
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  version: number;
  /** Set by the publisher. */
  media_id?: string;
  permalink?: string;
}

export interface Feedback {
  at: string;
  author: 'human' | 'claude';
  kind: 'comment' | 'request_changes' | 'approve' | 'reject' | 'caption_edit' | 'resolved';
  target?: string; // caption | alt | slide:N | general
  text?: string;
  reason?: string;
  version?: number;
}

const dir = (id: string) => join(DRAFTS, id);

export function listDrafts(): Draft[] {
  if (!existsSync(DRAFTS)) return [];
  return readdirSync(DRAFTS)
    .filter(id => existsSync(join(dir(id), 'draft.yaml')))
    .map(loadDraft)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function loadDraft(id: string): Draft {
  if (!/^[\w-]+$/.test(id)) throw new Error(`bad draft id ${id}`);
  return parse(readFileSync(join(dir(id), 'draft.yaml'), 'utf8')) as Draft;
}

export function saveDraft(d: Draft) {
  mkdirSync(dir(d.id), { recursive: true });
  d.updated_at = new Date().toISOString();
  writeFileSync(join(dir(d.id), 'draft.yaml'), stringify(d, { lineWidth: 0 }));
}

export function addFeedback(id: string, f: Omit<Feedback, 'at'>) {
  appendFileSync(join(dir(id), 'feedback.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...f }) + '\n');
}

export function feedback(id: string): Feedback[] {
  const f = join(dir(id), 'feedback.jsonl');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
}

/** Allowed transitions; anything else is refused so state can't jump past review. */
const NEXT: Record<Status, Status[]> = {
  idea: ['drafted', 'rejected'],
  drafted: ['in_review', 'rejected'],
  in_review: ['changes_requested', 'approved', 'rejected'],
  changes_requested: ['in_review', 'rejected'],
  approved: ['scheduled', 'publishing', 'in_review', 'rejected'],
  scheduled: ['publishing', 'needs_reschedule', 'in_review'],
  publishing: ['published', 'failed'],
  published: [],
  rejected: ['in_review'],
  failed: ['approved', 'in_review'],
  needs_reschedule: ['scheduled', 'in_review', 'rejected'],
};

export function transition(d: Draft, to: Status) {
  if (!NEXT[d.status].includes(to)) throw new Error(`draft ${d.id}: ${d.status} → ${to} is not allowed`);
  d.status = to;
}
