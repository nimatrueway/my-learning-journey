---
description: "Use when creating, expanding, or revising courses, modules, lessons, MDX widgets, quizzes, syllabi, course navigation, or catalog entries. Requires this learning site's visual theme, playful cat-and-emoji teaching style, and rendered style checks."
applyTo: "docs/courses/**,docs/index.mdx,src/components/**,src/css/custom.css,src/theme/**,docusaurus.config.ts,sidebars.ts,navigation.ts"
---

# Course Authoring Conventions

For new teaching courses or substantial expansions, load
[the course-authoring skill](../skills/course-authoring/SKILL.md). This file is
the shared style contract; the skill supplies the workflow. Book summaries use
their dedicated skill and the reference-page exceptions below.

## Product Direction

- Build Docusaurus courses with Markdown or MDX and React interactions.
- Optimize for a technically capable learner with short attention bandwidth.
- Before adding a proposed topic, search existing course titles and lesson
  content for exact duplicates and meaningful overlap. Tell the user which
  material already covers it and what gap remains. Extend or cross-link that
  material rather than silently creating another version of the same lesson.
- Teach intuition first, then examples, then optional depth.
- Make teaching lessons self-sufficient. Videos, papers, books, and podcasts may
  be optional primary sources, but the learner should not need to consume them
  to understand the argument, evidence, examples, caveats, or practical move.
- Prefer 10–15 minute lessons with clear headers and one idea per chunk.
- Build or revise a small polished sample before expanding a full course when
  the style or domain is new.
- Keep courses independently expandable under `docs/courses/<course-slug>/`.
  Use `_category_.json` for labels, position, and the course landing document.
- Add new courses to the catalog in `docs/index.mdx` and the footer when useful.
- Technical accuracy and a working build are necessary but not sufficient:
  a dry, visually inconsistent course fails the acceptance criteria. Preserve
  the site's playful teaching identity from the first draft, not as a final pass.

## Lesson Template

Each teaching lesson should normally follow this sequence:

1. **Hook:** Name a concrete, familiar problem in a few punchy lines.
2. **Reading time:** Show a badge under the title, e.g.
   `⏱️ **~10 min** · folds are optional extra`. Derive minutes from word count
   (~200 wpm plus widget/quiz time); do not guess. Repeat the time next to the
   lesson's entry in the course intro or syllabus list. Label references
   honestly (e.g. `~5 min · read once, revisit often`).
3. **Attention reset:** For ordinary technical teaching lessons, include a short,
  original, lesson-specific cat-themed `<Meme/>` after the hook/time badge or at
  a natural conceptual transition. The joke must reinforce a misconception or
  tradeoff; it must not replace the explanation. Follow the Flavor Kit exceptions
  for sensitive subjects and reference pages. When a verified epigraph also improves
  the lesson, use one from an entrepreneur, builder, or domain expert. Omit the
  epigraph when wording or speaker identity cannot be verified. Never invent,
  silently clean up, or misattribute a quote merely to fill the slot.
4. **Interactive rehearsal:** Include at least one purposeful React widget that
   lets the learner change a decision, parameter, sequence, or mental model.
5. **Tiny example:** Show the smallest concrete example that makes the idea
   useful. In technical courses, prefer runnable code on the learner's stack.
6. **Try it yourself:** Give a bounded exercise that can be started immediately.
7. **Optional depth:** Put nonessential math, research mechanisms, caveats, or
   derivations in a collapsed `<details>` block. Give the summary a domain-fit
   label such as `🤓 The actual math (optional)` or
   `🧠 The science (optional)`. Explain symbols and claims in plain language.
8. **Three-point recap:** End with exactly three high-signal takeaways.
9. **Quiz:** Use `<Quiz/>` for immediate feedback. Wrong answers may be roasted;
   correct answers should feel energetic, but clarity always wins.

Reference pages, indexes, and syllabi may omit the full lesson sequence. A
reference page should still provide orientation, caveats, and a useful way to
navigate or evaluate its information.

## Source-Derived Courses

- Treat captions, transcripts, descriptions, and metadata as research inputs,
  not publishable lesson prose. Write concise original synthesis and avoid
  reproducing substantial transcript passages or long source descriptions.
- Explain the source's important reasoning, not just its conclusions. Include
  enough intermediate logic that a learner can evaluate and apply the claim.
- Include at least one memorable anecdote, company case, or real-world story
  when the source provides one. Explain what happened, the constraint involved,
  and why the outcome supports the lesson; a company-name list is not a case.
- Clearly distinguish source-grounded stories from original illustrative
  examples. Add a short provenance note near the canonical source link.
- Preserve uncertainty. Label a speaker's heuristic as a heuristic, distinguish
  a story from general evidence, and include counterconditions or caveats.
- Keep long source media collapsed and optional by default. Put the lesson's
  complete explanation before relying on a video embed or external link.
- Keep downloaded transcripts and metadata in an ignored local research cache.
  Do not publish raw third-party transcripts unless rights and product needs
  explicitly support doing so.

## Book Summary Courses

- Treat a supplied, user-authored book summary as publishable reference prose
  only when its provenance and publication rights are clear. Otherwise, use it
  as research input under the source-derived rules above.
- Book summaries are reference pages and may omit widgets, exercises, recaps,
  and quizzes. Preserve the book's reasoning, examples, tensions, and caveats;
  do not reduce a substantial summary to a list of slogans merely to resemble a
  teaching lesson.
- Add a course intro that names the books and authors, groups related works,
  provides word-count-derived reading times, and explains that summaries do not
  replace the original books. Attribute claims and judgments to the named
  authors unless the summary explicitly marks an editorial qualification.
- Organize related books in module directories. Give every summary explicit
  `sidebar_position`, `slug`, `title`, and `description` frontmatter. Use a
  course-level doc link for the intro and generated-index links for modules so
  every book remains visible in the sidebar.
- Before importing a batch, copy one representative summary and run a production
  build. Choose a structurally demanding sample with dense headings,
  punctuation, links, or currency so the probe can expose parser problems.
- Normalize imported Markdown without rewriting its prose. Ensure headings begin
  on their own lines; audit for joined boundaries such as `.## Heading`; and
  escape currency dollar signs as `\$` when remark-math would otherwise parse
  prose between dollar amounts as inline math. Do not escape real math
  delimiters.
- After final normalization, recalculate reading times at approximately 200
  words per minute and derive book, module, and course totals from the same word
  counts.

## Scaling a Course

- Approve one polished representative lesson before generating a large batch.
  The sample establishes depth, source handling, section rhythm, and tone. For
  an established course, use its accepted lesson as the baseline. For a new
  visual or tonal direction, show the rendered sample and obtain user approval
  before scaling; do not ask again merely to preserve an already accepted style.
- Before expanding the sample, check the Flavor Kit and Visual Theme requirements
  in desktop and mobile rendering. A compile-only sample is not style approval.
- Expand in module-sized batches and inspect representative lessons after each
  batch. Structural checks alone cannot detect generic or forgettable teaching.
- Do not satisfy word-count targets with repeated scaffolding. Every paragraph,
  exercise, recap, and quiz must teach the current lesson rather than a generic
  startup, study, or decision-making template.
- Audit repeated phrases across lessons. Reused component labels are expected;
  repeated explanatory paragraphs, invented stock epigraphs, identical quizzes,
  or identical exercise frames are a quality failure.
- Audit source integrity programmatically when metadata is available: every
  source ID should map to exactly one lesson embed and one canonical source link,
  with no missing, duplicate, or extra lessons.
- Calculate reading times after final prose is settled, then update individual
  syllabus entries, module totals, and the course total from the same data.
  Include visible meme captions in word counts, not JSX syntax; reserve time for
  widget use, exercises, and quizzes separately.

## Docusaurus Navigation

- `navigation.ts` is the shared builder for navbar, sidebar, and footer. Labels,
  icons, and ordering come from collection `_category_.json` metadata; do not
  maintain separate link lists in `docusaurus.config.ts` or `sidebars.ts`.
- Collection landing pages use `/courses/<directory-name>` routes and doc links.
  New collection directories must have `_category_.json` metadata. Direct child
  categories of Books must declare an explicit generated-index `slug`, used by
  both menus. Preserve existing public slugs when labels or nesting change.
- Verify top-menu and sidebar group labels, icons, ordering, and destinations
  together. The sidebar may expand into deeper lessons, but shared levels must
  agree. A navigation change is incomplete if only one menu was checked.
- Add ordinary teaching courses inside the existing **Contents > Courses**
  nested navbar group, not as siblings of Courses, Books, or Calculator. Preserve
  the Books group for books. Keep catalog, navbar, footer, and course identity
  consistent; inspect the current configuration instead of copying stale markup.
- Use a course-level `_category_.json` doc link when the course intro should act
  as the course landing page.
- Do not link a module category directly to its first teaching document when
  that lesson must also appear as a child in the left sidebar. Docusaurus treats
  a linked document as the category landing page and omits it from child items.
- Prefer `{"type": "generated-index"}` for module category links so the module
  gets a landing page and every lesson, including the first, remains visible.
- Verify sidebar behavior in the rendered desktop UI. A valid build does not
  prove that category expansion, current-page state, or first-lesson visibility
  matches the intended navigation.

## Flavor Kit

- Tone: PG-13, punchy, curious, and mildly cheeky; never cruel or distracting.
- The user's default for new technical courses is **cats, emojis, and playful
  teaching**, as established in Deep Learning and Lucene. Do not silently replace
  that with neutral reference prose because the subject is advanced or operational.
- Give the recurring cat a subject-specific role and a distinct mistake per lesson.
  Use original, concise jokes about that lesson's actual mechanism. No repeated
  caption with nouns swapped, generic motivational filler, or unrelated mascot gag.
- Use `<Meme/>` for epigraph and meme slots. Keep flavor in component props so
  it can be changed without rewriting neutral teaching content.
- Use text, CSS, ASCII, or emoji rather than hotlinked meme images.
- Use readable emoji signposts: `⏱️` for time, `🧪` for practice, `🤓` for optional
  depth, and `🐾` for recaps. Keep the accompanying words, accessible control
  labels, and literal technical titles understandable without interpreting emoji.
- Carry the tone into the landing hook, catalog identity, selected widget titles,
  and quiz feedback. Explain why an answer is right or wrong before or alongside
  a short joke. Roast the misconception, never the learner.
- Keep runnable code, corpus IDs, expected outputs, formulas, model provenance,
  and safety/security caveats precise. Do not rewrite fixtures just to insert cats.
- Preserve a course's explicitly approved alternative motif. Health, grief,
  trauma, and other sensitive material require judgment rather than forced jokes.
  Book summaries and TTS/reference pages are exempt from mascot callouts and emoji
  requirements; follow their source fidelity and voice rules. An explicit user
  request for a serious tone also overrides the playful default for that work.

## Interaction Design

- A widget must teach through a learner action; avoid decorative animation.
- Keep controls stable and responsive on mobile and desktop.
- Reuse `src/components/widgets.module.css` and established visual language.
- Keep flavor strings in props or isolated constants where practical.
- Include accessible labels, buttons, and readable status feedback.

## Visual Theme

- Read the relevant rules in `src/css/custom.css`, `src/components/widgets.module.css`,
  and one accepted neighboring lesson before inventing styles. Reuse existing
  components and CSS variables; do not add a per-course stylesheet or hardcoded
  palette unless an actual missing capability requires it and scope permits it.
- Preserve the Rust by Example / mdBook-inspired visual language defined in
  `src/css/custom.css`: navy canvas, lavender-gray text, blue active links,
  Open Sans prose, Source Code Pro code, compact headings, and minimal borders.
- Keep desktop lesson navigation as a dense 300px left sidebar and the reading
  column near 750px, with the clickable right-side table of contents styled to
  match (muted links, blue active state).
- Prefer flat or 2–3px-radius panels and controls. Avoid decorative shadows,
  oversized marketing typography, pill-heavy UI, and floating card sections.
- The catalog may use course cards, but they should feel like compact book
  entries within the documentation theme, not a separate landing-page design.
- Keep dark navy as the default while maintaining a functional light mode.
- No independent marketing hero, giant display headings, gradients, decorative
  blobs, nested cards, or new font stack. Existing compact Meme and widget frames
  are intentional exceptions to an otherwise flat documentation layout.
- Keep emoji/meme captions readable at 390px and desktop widths. Wrap text within
  callouts; code blocks may scroll internally, but the page must not overflow.
  Do not shrink body copy to hide layout problems or let dynamic controls shift
  the surrounding lesson. Check light mode contrast as well as the default theme.

## Evidence and Health Content

- Preserve a clear distinction between evidence, inference, heuristic, and
  personal advice. Do not overstate neuroscience or causal certainty.
- Do not add generic "educational only" or "not medical advice" disclaimers,
  or boilerplate sections telling the reader to see a professional. Keep
  lessons focused on the topic and useful practice. Explain evidence limits
  and directly relevant risks within the substantive discussion instead.
- For health or supplement content, explain relevant interactions and
  contraindications where they affect the topic.
- Never present a supplement ranking as a required stack. Prefer baseline-first,
  one-variable-at-a-time evaluation and attention to medication interactions.
- Keep optional evidence in folds when it is not required for the main lesson.

## Verification

After course changes:

1. Run `pnpm typecheck`.
2. Run `pnpm build` and resolve MDX, route, and broken-link errors.
3. For a multi-lesson source-derived course, audit source IDs and links, minimum
  substantive depth, required sections, exact three-point recaps, unique quizzes
  and exercises, and known repeated boilerplate before building.
4. For imported book summaries, audit heading boundaries and unescaped currency
  dollar signs before building; confirm that Markdown normalization did not
  alter visible prose or real math.
5. Confirm the course landing page, module indexes, and representative lesson
  paths under `build/`. Remember that Docusaurus may emit flat `.html` routes or
  directories depending on the route shape; inspect the generated tree rather
  than assuming one filename convention.
6. Check representative early, middle, and late lessons in the browser. Verify
  source folds are collapsed, exercises and quizzes work, canonical links are
  correct, and desktop/mobile layouts have no horizontal overflow. Inspect actual
  screenshots at about 1280px and 390px: captions, emoji, code, widget labels,
  typography, spacing, and contrast must fit the established theme. Include a
  light-mode spot check. Load the browser skill before using its commands.
7. Verify the desktop sidebar separately: module links, first lesson visibility,
  active state, and previous/next navigation should all resolve as intended.
8. Prefer a production-build server for final visual checks. If the Rspack dev
  cache panics or reports a stale theme alias during hot reload, restart cleanly
  or serve the validated static build instead of treating the stale cache as a
  content failure.
9. Ask for learner feedback on lesson length, humor dial, interaction density,
  source depth, and optional-depth level before expanding another large batch.
10. Before declaring completion, audit that each ordinary technical lesson has
  meaningful playful flavor, unique callouts, explanatory quiz feedback, and
  exactly three recap points. Report any intentional tone exceptions and any
  unverified browser checks. Do not report build success as visual verification.
11. Show the user a local rendered preview before publishing changes. Wait for
  explicit user approval before pushing or merging to `main`; that branch
  triggers the GitHub Pages deployment.
