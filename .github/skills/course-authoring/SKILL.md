---
name: course-authoring
description: "Create, expand, restyle, or review a Docusaurus teaching course in this learning site. Use for new courses, modules, MDX lessons, quizzes, interactive widgets, syllabi, and course catalog/navigation changes. Requires the established mdBook theme, playful cats and emojis, a checked representative lesson, and desktop/mobile style verification. Use book-to-audio-summary instead for TTS book summaries."
---

# Course Authoring

Build a course that belongs to this learning site in both substance and tone.
A technically correct but dry course is not a finished course here.

## Load the Contract

1. Read [the shared course instructions](../../instructions/course-authoring.instructions.md).
   They own the lesson template, style rules, exceptions, and required gates;
   do not create a competing copy of those rules in a new file.
2. Read the current destination or closest accepted lesson, the relevant portions
   of `src/css/custom.css`, and `src/components/widgets.module.css`. Inspect
   `src/components/Meme.tsx` and the widget being reused before changing props.
3. For an established playful technical-course example, inspect
   `docs/courses/lucene-search/04-text-retrieval/02-ngrams-autocomplete.mdx`.
   Use its level of technical specificity and tone, not its prose or joke verbatim.
4. Check the worktree and preserve existing changes. Read the current catalog and
   navigation before integrating a course; do not assume those files are unchanged.

## Establish the Course Identity

Before the first lesson edit, state a short style brief in the progress update:

- Subject and learner: what question the learner should be able to answer.
- Theme: existing documentation layout, typography, colors, and widget styles.
- Flavor: a cat with a subject-specific role, short original jokes, emoji signposts,
  and explanatory quiz feedback. Use an established alternate motif or a serious
  tone only under the shared contract's exceptions or the user's direction.
- First sample and check: the lesson that best exercises prose, code or math,
  a purposeful widget, optional depth, and quiz rendering.

Do not spend the style brief designing a new brand, mascot component, or stylesheet.
Reuse `Meme`, `Quiz`, and appropriate existing interaction patterns. Keep humor
outside runnable fixtures and preserve the provenance of real claims and examples.

## Build One Sample Before Scaling

1. Draft one complete lesson using the shared template. Put a lesson-specific
   attention reset where it aids learning, not between every paragraph. Emojis
   complement descriptive labels; they never replace them.
2. Keep the technical explanation self-contained. A joke is not a definition,
   evidence, or an excuse to omit a derivation, test, or security limitation.
3. Validate the smallest runnable example and compile the MDX. When compiling
   MDX directly, include `remark-math` and `rehype-katex`, matching the site.
4. Render the sample using the existing theme. Inspect desktop and mobile
   screenshots and exercise the widget and quiz. Check a light-mode view too.
5. Compare it to an accepted neighboring lesson using this acceptance checklist:

   - [ ] The opening makes a concrete problem interesting without marketing copy.
   - [ ] Cat humor teaches this lesson's mechanism, not a generic slogan.
   - [ ] Time, exercise, recap, and optional-depth labels retain readable words.
   - [ ] Widget actions change something meaningful; dimensions remain stable.
   - [ ] Quiz feedback explains the misconception, with humor aimed at the mistake.
   - [ ] Fonts, colors, frames, spacing, and navigation match the existing site.
   - [ ] Captions, code, controls, and headings fit desktop/mobile; light mode works.
   - [ ] Exactly three recap points and honest, derived timing are present.

Fix a failed item before producing more lessons. If proposing a new visual or
tonal direction, show the sample and obtain user approval; an already accepted
course style does not require repeated approval for each module.

## Expand in Module Batches

- Use different domain-specific mistakes, exercises, and jokes in each lesson.
  Repeated component labels are fine; repeated explanatory paragraphs or captions
  are not. A course-wide mascot does not require identical lesson composition.
- After each module, validate its examples and MDX, then inspect a representative
  rendered lesson for substance and style. Do not postpone all style work until
  the entire syllabus is written.
- Keep the prose and code accurate. Never invent attributed quotes to fill a slot.
  Protect safety, health, and authorization caveats from flippant treatment.
- Calculate time from final visible prose, code, and meme captions at roughly
  200 words/minute plus explicit practice time. Exclude JSX plumbing from counts.
  Synchronize lessons, module totals, syllabus, and catalog metadata together.

## Integrate and Verify

1. Follow the shared navigation rules: ordinary courses go in **Contents > Courses**,
   course categories link to the intro, and module categories use generated indexes
   so first lessons remain visible. Preserve the separate Books navigation.
   `navigation.ts` builds navbar, sidebar, and footer from category metadata;
   update that metadata instead of adding hardcoded menu links. Verify matching
   labels, icons, order, and destinations in both menus. Collection landing routes
   follow `/courses/<directory-name>`; preserve explicit book-category slugs.
2. Keep the landing page and catalog playful too; do not promise one tone in the
   catalog and deliver dry reference prose in the lessons.
3. Run `pnpm typecheck` and `pnpm build`. Check emitted routes and downloads.
4. Using the browser skill, inspect early, middle, and late lessons at desktop
   and mobile widths, and spot-check light mode. Verify callout wrapping, emoji,
   code scrolling, quiz feedback, widget behavior, collapsed folds, sidebar active
   state, first-child visibility, and previous/next links. Inspect console errors.
5. Audit unique flavor, required lesson sections, exactly three recap points, and
   reading-time consistency. Separate structural checks from visual judgments.
6. Report what was actually verified and disclose blocked checks. Leave the user
   a working preview URL. Ask for pacing/flavor feedback before a later large
   expansion rather than silently dialing the course back to a formal manual.

## Boundaries

- These instructions and checks guide agent behavior; they are not an automatic
  tool-blocking hook. Do not claim mechanical style enforcement from their presence.
- Book summaries use the dedicated `book-to-audio-summary` skill. Preserve its
  TTS-friendly, source-grounded prose without inserting cats, emojis, or quizzes.
- Do not restyle unrelated courses or global UI to make a new course fit. Reuse
  the theme; ask before changing the site's visual direction.