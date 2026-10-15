---
description: "Use when working on the Notes collection or the writer vault (Locked component, writerVault lib, lock-notes CLI). Confidential spans must be encrypted before anything is committed or pushed, and author passwords never pass through the agent."
applyTo: "docs/notes/**,scripts/lock-notes.mjs,src/lib/writerVault.ts,src/components/Locked.tsx,src/components/writerVault.module.css"
---

# Writer Vault Rules

The Notes collection supports author-encrypted spans. The site is a public
static build: anything committed in plaintext is public forever. These rules
are mandatory.

## Never push plaintext secrets

- Before running `git commit` or `git push` that includes files under
  `docs/`, scan for unlocked spans:
  `grep -rn "LOCKED-START" docs/`
- If the scan finds anything, STOP. Do not commit or push. Tell the author
  which files contain unlocked spans and ask them to lock the spans
  themselves:
  `export <AUTHOR>_PASSWORD='…'` then
  `pnpm notes:lock <author> <file>`.
- After the author confirms locking, re-run the scan. Only commit or push
  when it finds nothing.

## Agent-run locking (author opt-in)

- Preferred: just run `node scripts/lock-notes.mjs lock|unlock|verify ...`
  with no password arguments. On macOS the CLI pops a native password dialog
  with hidden input; the author types there and the password never touches
  chat, files, the command line, or shell history.
- Fallback: when the author explicitly pastes their password into the chat,
  you may pass it via `--password '<pw>'`. Never ask for the password in
  chat — the author offers it. Never write it to a file, never commit it,
  never echo it back in responses or commit messages. Remind the author the
  pasted password lives in chat history; rotating it with
  `pnpm notes:register <author>` is their call, and rotating does NOT
  re-encrypt existing locked spans (they keep the old password until
  unlocked and re-locked).

## Span markers

- Markers use MDX comment syntax, each on its own line:
  `{/* LOCKED-START */}` … `{/* LOCKED-END */}`.
- HTML comments (`<!-- -->`) break the MDX build; never write them. The CLI
  still recognizes legacy HTML markers and rewrites them to the MDX form.
- An unlocked span renders as visible plaintext in local dev — that is
  expected. It must never survive into a commit.
