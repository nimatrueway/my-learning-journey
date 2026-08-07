---
description: "Use when creating, expanding, or revising courses, modules, lessons, MDX widgets, quizzes, syllabi, or course catalog entries in this learning site."
applyTo: "docs/courses/**,src/components/**"
---

# Course Authoring Conventions

## Product Direction

- Build Docusaurus courses with Markdown or MDX and React interactions.
- Optimize for a technically capable learner with short attention bandwidth.
- Teach intuition first, then examples, then optional depth.
- Prefer 10–15 minute lessons with clear headers and one idea per chunk.
- Build or revise a small polished sample before expanding a full course when
  the style or domain is new.
- Keep courses independently expandable under `docs/courses/<course-slug>/`.
  Use `_category_.json` for labels, position, and the course landing document.
- Add new courses to the catalog in `docs/index.mdx` and the footer when useful.

## Lesson Template

Each teaching lesson should normally follow this sequence:

1. **Hook:** Name a concrete, familiar problem in a few punchy lines.
2. **Reading time:** Show a badge under the title, e.g.
   `⏱️ **~10 min** · folds are optional extra`. Derive minutes from word count
   (~200 wpm plus widget/quiz time); do not guess. Repeat the time next to the
   lesson's entry in the course intro or syllabus list. Label references
   honestly (e.g. `~5 min · read once, revisit often`).
3. **Epigraph:** Use one accurately attributed entrepreneur, builder, or domain
   expert quote tied to the lesson idea. Do not invent or misattribute quotes.
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

## Flavor Kit

- Tone: PG-13, punchy, curious, and mildly cheeky; never cruel or distracting.
- Use running metaphors, meme-style attention resets, and concise one-liners.
- Use `<Meme/>` for epigraph and meme slots. Keep flavor in component props so
  it can be changed without rewriting neutral teaching content.
- Use text, CSS, ASCII, or emoji rather than hotlinked meme images.
- Adapt running examples to the domain. Deep Learning uses cats and model
  mishaps; Performance Foundations uses autopilot, tiny bets, activation ramps,
  ambitious projects, and supplements trying to impersonate fundamentals.
- Do not force cats into every course. Preserve the rhythm, not one skin.

## Interaction Design

- A widget must teach through a learner action; avoid decorative animation.
- Keep controls stable and responsive on mobile and desktop.
- Reuse `src/components/widgets.module.css` and established visual language.
- Keep flavor strings in props or isolated constants where practical.
- Include accessible labels, buttons, and readable status feedback.

## Visual Theme

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

## Evidence and Health Content

- Preserve a clear distinction between evidence, inference, heuristic, and
  personal advice. Do not overstate neuroscience or causal certainty.
- For health or supplement content, state that information is educational and
  not individualized medical advice. Surface interaction and contraindication
  cautions where relevant.
- Never present a supplement ranking as a required stack. Prefer baseline-first,
  one-variable-at-a-time evaluation and professional medication review.
- Keep optional evidence in folds when it is not required for the main lesson.

## Verification

After course changes:

1. Run `pnpm typecheck`.
2. Run `pnpm build` and resolve MDX, route, and broken-link errors.
3. Confirm representative generated paths under `build/`.
4. For new or changed widgets, use the dev server to check controls, folds,
   responsive layout, and feedback behavior in a browser.
5. Ask for learner feedback on lesson length, humor dial, interaction density,
   and optional-depth level before generating a large new course.