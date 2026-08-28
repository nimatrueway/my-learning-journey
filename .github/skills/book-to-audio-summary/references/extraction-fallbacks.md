# Extraction fallbacks and corruption symptoms

## Preferred tools (check for these first)
- `ebook-convert` (part of Calibre) — converts epub to txt/markdown with proper
  chapter handling: `ebook-convert book.epub book.txt`
- `pandoc` — `pandoc book.epub -o book.md` (also handles chapter splits well
  with `--extract-media` and TOC-aware output)
- Python `ebooklib` + `beautifulsoup4` if a pip install with network access is
  available and the sandbox allows it.

Installing any of these requires network access — request it explicitly
(`requestAllowNetwork`) rather than silently failing and falling back to manual
extraction when a proper tool would do a better job.

## Manual fallback (no tools, no network)
An epub is just a zip file:
1. Unzip it.
2. Find the `.opf` file (the package manifest) — it lists every content file
   in `<manifest>` and the reading order in `<spine>`.
3. Strip HTML tags from each spine item in order (see
   [extract_epub_sample.py](../scripts/extract_epub_sample.py) for a working
   implementation).
4. Check `toc.ncx` for chapter titles/anchors if present — sometimes it's
   just a single "Start" entry and titles have to be found inside the body
   text instead.

## Symptom: garbled/obfuscated text (real case encountered)
One real Anna's Archive epub of a Crown/Random House book produced text like:

```
&RS\ULJKW�E\3HWHU7KLHO
```

instead of `Copyright (c) by Peter Thiel`. Investigation found:
- Every basic Latin letter was shifted by a constant `+29` in codepoint
  (`chr(ord(c) + 29)` recovers it, e.g. `&` (38) -> `C` (67)). This is
  consistent enough to look like a Caesar cipher.
- BUT punctuation, curly quotes, and — critically — **all spaces between
  words** were simply missing from the source, not shift-encoded. Words ran
  together with no separators at all (`WDNHVWKHZRUOG` decodes letter-by-letter
  to `takestheworld`, no spaces).
- No embedded font file was present in the epub to explain this as a
  font-glyph substitution trick (which is the usual explanation for this kind
  of scrambled text in protected epubs) — the font had been stripped, leaving
  only the scrambled text behind.

**Conclusion: don't try to fully reverse-engineer this.** Recovering the
letter shift is easy, but reconstructing correct word and sentence boundaries
from a run-together, punctuation-free string requires a full statistical word
segmentation model, and even then, verbatim quotes could never be trusted.

**What to do instead:**
1. Run the quick sanity check in
   [extract_epub_sample.py](../scripts/extract_epub_sample.py) *before*
   spending time on full extraction or cipher analysis.
2. If the sample fails the check, only decode the table of contents /
   headings (short, isolated strings are much easier to eyeball-decode and
   confirm against the book's known real chapter list) to verify you have the
   right book and chapter structure.
3. Tell the user the file is corrupted, then write the summary from your own
   trained knowledge of the book if it's a well-known title — clearly staying
   conservative about verbatim quotes (only ones you're fully confident about,
  never inventing wording and attributing it to the author).
