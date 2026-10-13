---
name: ig-plan
description: Brainstorm and propose the next @myspeedpuzzling posts from MSP data, with a recommendation per idea. Use when the owner asks for post ideas, the week's plan, what to post next, or a brainstorm for a feature, event or report.
---

# Plan the next posts

The owner wants every post to start from a data-backed brainstorm with a clear recommendation, and the feed must
never get repetitive.

1. **Read the context** (skip what you already know this session):
   - `docs/decisions.md` (owner decisions win), `content/ideas/backlog.md` (local), the last rows of
     `content/state.sqlite` (`node tools/insights.ts --summary`), recent drafts (`content/drafts/*/draft.yaml`
     status and pillar), and `editorial/` notes if they exist.
   - What was published in the last 3 weeks: no two consecutive posts with the same template or chart type; same
     template at most twice in 7 days; same featured player at most every 6 weeks unless it's a record.
2. **Refresh the facts** you'll pitch: `node src/data/db.ts <query> --fresh` (one query at a time; add a new
   `queries/<name>.sql` for new facts, aggregate-only, following the app's visibility rules).
3. **Generate more ideas than needed** (8–12), each with: hook (≤ 125 characters, a number first), proof point
   with numbers and query name, format (carousel / single / Story / Reel), pillar (Weekly Numbers, Did you know,
   Records & reports, Events, Community & product), the **mechanic** (surprise, identity, comparison, utility,
   debate, send-a-friend, collective milestone, humour) and the **metric** it should move (sends, saves, likes or
   non-follower reach per reach). Reject ideas that only "report numbers".
4. **Recommend** 3 posts a week (Monday Weekly Numbers, Thursday Did-you-know, a weekend slot) plus 3–5 Stories,
   with one in three posts spending the novelty budget (new template, mechanic or topic). Prefer timely anchors
   (events from `queries/upcoming-events.sql`, milestones, launches).
   Plans carry the idea, the query names and *approximate* numbers only; the real numbers are queried fresh when
   the post is drafted (at most a day before it goes out), never copied from the plan.
5. **Ask the owner** with AskUserQuestion: the recommended slate first, alternatives as options; then update
   `content/ideas/backlog.md` and draft the chosen ones with the `ig-draft` skill.
