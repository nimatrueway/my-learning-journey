#!/usr/bin/env bash
# Copy this template to .cache/book-summaries/<book-slug>/ and configure it.
set -euo pipefail

BOOK_TITLE="Book Title Here"
PAGE_TITLE="Book Title"
AUTHOR="Author Name Here"
DESCRIPTION="Author Name on the book's central argument, evidence, and limits."
MODULE_DIR="06-subject"
ROUTE_SUBJECT="subject"
BOOK_SLUG="book-slug"
SIDEBAR_POSITION=1
WPM=200

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
CHAPTERS_DIR="$SCRIPT_DIR/chapters"
OUTPUT_DIR="$REPO_ROOT/docs/courses/books/$MODULE_DIR"
OUTPUT_FILE="$OUTPUT_DIR/$BOOK_SLUG.md"

if ! compgen -G "$CHAPTERS_DIR/*.md" > /dev/null; then
  echo "No chapter files found in $CHAPTERS_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

{
  echo "---"
  echo "sidebar_position: $SIDEBAR_POSITION"
  echo "slug: /courses/books/$ROUTE_SUBJECT/$BOOK_SLUG"
  echo "title: $PAGE_TITLE"
  echo "description: $DESCRIPTION"
  echo "---"
  echo
  echo "# $BOOK_TITLE"
  echo
  echo "$AUTHOR"
  echo

  for file in "$CHAPTERS_DIR"/*.md; do
    cat "$file"
    echo
  done
} > "$OUTPUT_FILE"

word_count=$(sed '/^---$/,/^---$/d; /^#/d' "$OUTPUT_FILE" | wc -w)
chapter_count=$(find "$CHAPTERS_DIR" -maxdepth 1 -name '*.md' | wc -l)
minutes=$(((word_count + WPM - 1) / WPM))
minute_label="minutes"
if ((minutes == 1)); then
  minute_label="minute"
fi

echo "Merged $chapter_count chapter files into $OUTPUT_FILE"
echo "Summary prose: $word_count words (approx. $minutes $minute_label at $WPM wpm)"
