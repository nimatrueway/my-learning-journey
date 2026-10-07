---
name: course-authoring
description: "Create, expand, revise, or review Docusaurus courses, modules, MDX lessons, quizzes, widgets, and course navigation. Use example-first teaching, optional technical depth, the existing site theme, and rendered checks without screenshots unless requested. Use book-to-audio-summary for TTS book summaries."
---

# Course Authoring

Build accurate, engaging lessons that belong to the existing learning site.
Correct content and a successful build are necessary, not sufficient.

## Teaching Principles

- Start with a concrete puzzle, explain it in ordinary language, compare another
  example, then invite a prediction or experiment. Introduce terminology only
  when useful; explain necessary terms in place.
- Use verified real examples for factual comparisons. Distinguish source-backed
  evidence from original illustrations; never fabricate sources or quotations.
  Preserve uncertainty, scope, and essential caveats beside the relevant claim.
- Keep specialist terminology, formal analysis, and research detail in closed
  folds. With every fold closed, the explanation, exercise, recap, and quiz must
  still make sense. Optional depth must not hide prerequisites or safety limits.
- Make widgets and quizzes rehearse the examples, not unexplained labels.
  Every control should change something meaningful; feedback should explain why.
- Keep prose, headings, controls, and feedback conversational. Use brief,
  lesson-specific humor that reinforces the mechanism. Follow the site's playful
  cat-and-emoji style unless the user, subject, or reference format calls otherwise.
- Respect the user's scope across lessons, reference pages, navigation, and
  descriptions. Missing evidence stays unknown; selected examples are not a
  representative survey unless the sampling supports that claim.

## Workflow

1. Load [the shared course contract](../../instructions/course-authoring.instructions.md).
   It owns the template, theme, navigation, and required gates. Inspect the target,
   a nearby accepted lesson, reusable components, and relevant styles. Check for
   existing coverage and preserve unrelated worktree changes.
2. State the learner's question, intended tone, and first sample to validate.
   Reuse the existing layout and components; seek approval for a new visual direction.
3. Complete one representative lesson before scaling. Check its examples, compile
   MDX with the site's plugins, and exercise it on desktop and mobile. Verify
   readability, controls, quiz feedback, folds, overflow, and light mode. Do not
   capture screenshots unless requested.
4. Expand in module-sized batches, validating a representative lesson after each.
   Vary puzzles and explanations; repeated scaffolding is not substantive teaching.
5. Derive timings from visible prose, examples, captions, and control text at about
   200 words/minute, rounded up, plus stated practice and interaction allowances.
   Exclude closed-fold subtrees and JSX plumbing; count optional references separately.
   Synchronize lesson, module, syllabus, and catalog totals.
6. Run required typecheck/build gates and inspect warnings and emitted routes.
   Avoid concurrent processes that share build caches; stop only task-owned servers.
   Check Markdown/JSX block boundaries when generated HTML is invalid. Use the
   repository's actual production-preview command, not an assumed script alias.
7. Inspect early, middle, and late lessons on desktop/mobile without screenshots.
   Check navigation consistency, active state, first-lesson visibility, previous/next
   links, interactions, and console errors. Audit required sections, three-point
   recaps, source integrity, distinctive flavor, and timing consistency.
8. Report only verified outcomes, disclose blocked checks, and provide a working
   preview URL. Do not treat structural checks as proof of teaching or visual quality.

## Boundaries

- Keep changes scoped; do not restyle unrelated courses or create a competing theme.
- Book summaries follow the dedicated skill's source fidelity and TTS voice.
- These instructions guide behavior; they are not automatic enforcement hooks.