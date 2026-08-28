---
name: book-to-audio-summary
description: 'Turn an epub, PDF, or text book into a detailed chapter-by-chapter, TTS-friendly summary published in this repository’s Docusaurus Books course. Use when asked to summarize a book or add a book summary to docs/courses/books.'
---

# Book to Audio Summary

Create a self-contained book reference page that matches the existing summaries in
`docs/courses/books/`. The published result is one Markdown document per book,
not a directory of chapter pages.

## Repository contract

- Publish books at `docs/courses/books/NN-subject/<book-slug>.md`.
- Group books by author or a coherent subject. Reuse an existing module when it
   fits; otherwise create the next numbered module and its `_category_.json`.
- A module category uses a generated index so every book remains visible:

   ```json
   {
      "label": "6. Subject",
      "position": 6,
      "collapsed": false,
      "link": {
         "type": "generated-index",
         "description": "A concise description of the books in this module."
      }
   }
   ```

- Every published summary starts with explicit frontmatter, followed by the full
   book title, a plain author line, and one `##` section per chapter or major
   book section:

   ```md
   ---
   sidebar_position: 1
   slug: /courses/books/subject/book-slug
   title: Book Title
   description: Author Name on the book's central argument, evidence, and limits.
   ---

   # Book Title: Subtitle

   Author Name

   ## First Chapter
   ```

- Use the next `sidebar_position` within an existing module. Route segments omit
   numeric directory prefixes, matching routes such as
   `/courses/books/reid-hoffman/blitzscaling`.
- Keep extraction artifacts and chapter drafts under
   `.cache/book-summaries/<book-slug>/`; `.cache/` is already ignored. Only the
   final book page and navigation/catalog changes belong in published docs.

## Procedure

1. **Verify the source and destination first.** Confirm the exact book path,
    inspect `docs/courses/books/intro.md`, and inspect the likely module's
    `_category_.json` and summaries. Do not assume a path, module, route, or
    sidebar position.

2. **Inventory the book before drafting.** List every preface, introduction,
   part, chapter, appendix, and conclusion. Build an explicit source map that
   pairs each planned `##` section with its exact extracted source file or spine
   item. Record the central argument, important stories, evidence, tensions,
   and caveats for every section in a short evidence ledger before drafting.
   Never infer chapter boundaries from filename order alone, and never move a
   fact from an adjacent source into the current section. Do not impose a total
   duration, word budget, or uniform chapter length. Let each section take the
   space its substance requires; completeness and narrative context outrank
   brevity.

3. **Extract into the ignored research cache.**
    - Prefer `ebook-convert` (Calibre) or `pandoc` for epub conversion.
    - If neither exists and installation is unavailable, unzip the epub, read its
       `.opf` manifest and spine, and strip HTML from spine items in reading order.
    - For PDFs, prefer a layout-aware extractor already available locally and
       verify page order. For text files, inspect heading boundaries and encoding.
    - Always sanity-check output for ordinary spaced words such as ` the `,
       ` and `, and ` of `. If those are absent, consult
       [extraction-fallbacks.md](./references/extraction-fallbacks.md) and do not
       trust the text for exact quotations.
    - Preserve source material only in `.cache/book-summaries/<book-slug>/`.
       Do not publish raw third-party book text.

4. **Draft and review one representative section first.** Choose a structurally
   demanding chapter with multiple stories, evidence, figures, or caveats. Draft
   it from its exact source and evidence ledger, then compare it back to the
   source before scaling. The sample passes only if it preserves the chapter's
   argument, causal sequence, memorable cases, counterevidence, and limits. A
   polished but shallow synopsis is a failed sample.

5. **Draft remaining chapter sections independently.** Write temporary files as
    `.cache/book-summaries/<book-slug>/chapters/NN-title.md`, each beginning with
   one `##` heading. Use flowing prose suitable for TTS. Preserve the author's
   reasoning and the sequence that makes it intelligible. Include the important
   origin story, turning points, setbacks, decisions, and concrete examples in
   each chapter rather than collapsing them into a lesson list. Preserve
   tensions, caveats, uncertainty, and meaningful contradictions between the
   subject's recollection and the surrounding evidence. Attribute claims and
   judgments to the author. Use short verbatim quotations sparingly and only
   when the wording is verified; otherwise paraphrase.

6. **Audit completeness before assembly.** Compare every draft against its own
   evidence ledger and exact source item. Check that named cases are explained,
   not merely listed; pivotal decisions include the options and constraints;
   empirical claims retain their population and limitations; and contradictory
   evidence is not silently resolved. Verify that the draft count, order, and
   headings match the source map exactly. Parallel research notes are leads,
   not authority: recheck every integrated detail against the primary extracted
   chapter, especially when several chapters were analyzed in one batch.

7. **Assemble one Docusaurus document.** Copy and configure
    [merge_chapters.sh](./scripts/merge_chapters.sh) in the book's cache folder,
    then run it to write the final page into `docs/courses/books/NN-subject/`.
    Review the assembled result for narrative continuity. Do not publish the
    temporary chapter files or merge script.

8. **Normalize Markdown without rewriting prose.** Ensure every heading starts
    on its own line and search for joined boundaries such as `.## Heading`.
    Escape currency dollar signs as `\$` so remark-math does not interpret prose
    between prices as inline math; do not escape genuine math delimiters. Avoid
    emoji, horizontal rules inside the body, label-heavy lists, and bold labels
    such as `**Quote:**`. Book summaries are reference pages and do not need
    widgets, exercises, recaps, or quizzes.

9. **Update repository navigation and totals.**
    - Add or update the module `_category_.json` when needed.
    - Add the book under its module in `docs/courses/books/intro.md`.
    - After the prose is complete, calculate its descriptive reading time at
       approximately 200 wpm, then recalculate its module total and the Books
       course total from the same word counts. Reading time reports length; it
       must never be used as a cap or trimming target.
    - Update the book and subject counts plus description in `docs/index.mdx`.
       The navbar/footer already link to the Books course and normally need no edit.

10. **Validate the published result.** Audit heading boundaries and unescaped
    currency first, then run `pnpm typecheck` and `pnpm build`. Confirm the new
    route exists under `build/`, the book appears in the generated module index
   and sidebar, and previous/next navigation resolves. Programmatically compare
   the final `##` heading count and order with the source map, and spot-check an
   early, middle, and late section against their exact extracted sources.

## Reusable assets

- [merge_chapters.sh](./scripts/merge_chapters.sh): assembles cached chapter
   drafts into a repo-ready book document with frontmatter.
- [extract_epub_sample.py](./scripts/extract_epub_sample.py): extracts an epub
   sample and checks quickly for corruption.
- [extraction-fallbacks.md](./references/extraction-fallbacks.md): extraction
   options and known obfuscation symptoms.
