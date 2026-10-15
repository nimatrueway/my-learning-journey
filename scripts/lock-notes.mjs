#!/usr/bin/env node
/**
 * Writer vault CLI: locks/unlocks author-only spans in Markdown, in place,
 * and manages the author password registry used for agent verification.
 *
 * Commands:
 *   node scripts/lock-notes.mjs lock <author> <file> [more files...]
 *       Replace each <!-- LOCKED-START -->...<!-- LOCKED-END --> span with an
 *       inline <Locked author="..." length="..." payload="v1:..." /> component.
 *
 *   node scripts/lock-notes.mjs unlock <file> [more files...]
 *       Decrypt every <Locked .../> back to the marker form for editing.
 *       (Author is read from the component; password is asked interactively.)
 *
 *   node scripts/lock-notes.mjs register <author>
 *       Interactively set the author's password and write a scrypt verifier
 *       into docs/notes/authors.json (committed). Used by agents to verify
 *       that a request to add confidential content comes from the author.
 *
 *   node scripts/lock-notes.mjs verify <author>
 *       Ask for the password and check it against the registry. Exit 0 on
 *       success, 1 on failure. Non-interactive: pass --password <pw> instead.
 *
 * Span markers (each on its own line). MDX comment syntax is required:
 * Docusaurus compiles every docs page with MDX, which rejects HTML comments.
 * Markers are the MDX-comment forms of LOCKED-START / LOCKED-END, i.e.
 * each wrapped in curly-brace slash-star ... star-slash curly-brace
 * (spelled out because the literal marker would close this comment).
 * Legacy HTML-comment markers are still recognized, but new spans are
 * always written back in the MDX form.
 *
 * Payload crypto: AES-256-GCM, key = PBKDF2-SHA256(password, prefix+salt,
 * 210_000 iterations). Mirrors src/lib/writerVault.ts decryptPayload().
 * Registry verifier: scrypt(N=2**15, r=8, p=1) with a 16-byte random salt.
 */

import {createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';

const START = '{/* LOCKED-START */}';
const END = '{/* LOCKED-END */}';
const LEGACY_START = '<!-- LOCKED-START -->';
const LEGACY_END = '<!-- LOCKED-END -->';
const PAYLOAD_SALT_PREFIX = 'notes-writer-vault';
const ITERATIONS = 210_000;
const REGISTRY_FILE = 'docs/notes/authors.json';
const SCRYPT = {N: 2 ** 15, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024};

const spanPattern = new RegExp(
  `^(?:${escapeRegExp(START)}|${escapeRegExp(LEGACY_START)})\\n([\\s\\S]*?)\\n(?:${escapeRegExp(END)}|${escapeRegExp(LEGACY_END)})\\n?`,
  'gm',
);
// Matches both the current format (author+length+label+payload) and the legacy
// format (label+payload, pre-author). Legacy spans unlock with a warning.
const lockedPattern = /^<Locked\s+author="([^"]*)"\s+length="(\d+)"\s+label="([^"]*)"\s+payload="([^"]+)"\s*\/>\n?/gm;
const legacyLockedPattern = /^<Locked\s+label="([^"]*)"\s+payload="([^"]+)"\s*\/>\n?/gm;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve the author's password. Priority order:
 *   1. --password flag (if given) — the path when the author explicitly
 *      pastes their password into an agent chat
 *   2. <AUTHOR>_PASSWORD environment variable, e.g. NIMA_PASSWORD for "nima"
 *      (author uppercased, non-alphanumerics become underscores)
 *   3. WRITER_PASSWORD environment variable (generic fallback)
 *   4. A native macOS password dialog (hidden input) — the agent-friendly
 *      default: an agent runs the command with no password, the author types
 *      it into the dialog, and it never touches chat, files, or shell history.
 * When all fail, print the exact export command and exit 1.
 */
function envVarName(author) {
  return `${author.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_PASSWORD`;
}

/** Ask via a native macOS dialog; the answer never appears on a command line. */
function promptPasswordDialog(author, command) {
  if (process.platform !== 'darwin') return null;
  const dialog = [
    `display dialog "Password for writer \\"${author}\\" (${command}):"`,
    'default answer "" with hidden answer',
    `with title "notes:${command}"`,
    'buttons {"Cancel", "Unlock"} default button "Unlock"',
  ].join(' ');
  const result = spawnSync('osascript', ['-e', dialog, '-e', 'text returned of result'], {encoding: 'utf8'});
  if (result.status !== 0) return null; // cancelled, or GUI unavailable
  return result.stdout.trimEnd() || null;
}

function resolvePassword(author, passwordFlag, command) {
  if (passwordFlag) return passwordFlag;
  const fromEnv = process.env[envVarName(author)] ?? process.env.WRITER_PASSWORD;
  if (fromEnv) return fromEnv;
  const prompted = promptPasswordDialog(author, command);
  if (prompted) return prompted;
  console.error(`No password found for "${author}". Set it in your terminal first, then re-run:`);
  console.error(`  export ${envVarName(author)}='<your-password>'`);
  console.error('(or pass --password <pw>, or set the generic WRITER_PASSWORD).');
  process.exit(1);
}

function deriveKey(password, salt) {
  return pbkdf2Sync(password, Buffer.concat([Buffer.from(PAYLOAD_SALT_PREFIX), salt]), ITERATIONS, 32, 'sha256');
}

function encryptSpan(plaintext, password, author, label) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = `v1:${salt.toString('hex')}:${iv.toString('hex')}:${Buffer.concat([ciphertext, tag]).toString('hex')}`;
  const length = plaintext.replace(/\s+/g, ' ').trim().length;
  return `<Locked author="${author}" length="${length}" label="${label}" payload="${payload}" />`;
}

function decryptPayload(payload, password) {
  const [version, saltHex, ivHex, dataHex] = payload.split(':');
  if (version !== 'v1') throw new Error(`Unsupported payload version: ${version}`);
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const ciphertext = data.subarray(0, data.length - 16);
  const tag = data.subarray(data.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', deriveKey(password, salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// --- author registry (scrypt verifiers, committed for agent verification) ---

function readRegistry() {
  if (!existsSync(REGISTRY_FILE)) return {};
  try {
    const parsed = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  writeFileSync(REGISTRY_FILE, `${JSON.stringify(registry, null, 2)}\n`);
}

function verifierFor(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, {N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: SCRYPT.maxmem});
  return {salt: salt.toString('hex'), hash: hash.toString('hex'), scrypt: {N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p}};
}

function checkVerifier(password, entry) {
  if (!entry || typeof entry.salt !== 'string' || typeof entry.hash !== 'string') return false;
  const params = entry.scrypt ?? SCRYPT;
  const expected = Buffer.from(entry.hash, 'hex');
  const actual = scryptSync(password, Buffer.from(entry.salt, 'hex'), expected.length, {N: params.N, r: params.r, p: params.p, maxmem: 64 * 1024 * 1024});
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// --- commands ---

function lockFile(file, password, author, label) {
  const original = readFileSync(file, 'utf8');
  let count = 0;
  const updated = original.replace(spanPattern, (_match, body) => {
    count += 1;
    return `${encryptSpan(body, password, author, label)}\n`;
  });
  if (count === 0) {
    console.log(`${file}: no ${START} spans found; nothing changed.`);
    return true;
  }
  writeFileSync(file, updated);
  console.log(`${file}: locked ${count} span${count === 1 ? '' : 's'} as "${author}".`);
  return true;
}

function unlockFile(file, password) {
  const original = readFileSync(file, 'utf8');
  let count = 0;
  let failed = 0;
  const updated = original.replace(lockedPattern, (match, author, _length, label, payload) => {
    try {
      const plaintext = decryptPayload(payload, password);
      count += 1;
      return `${START}\n${plaintext}\n${END}\n`;
    } catch {
      failed += 1;
      console.error(`${file}: could not decrypt a "${label}" span by "${author}" (wrong password or corrupted payload).`);
      return match;
    }
  }).replace(legacyLockedPattern, (match, label, payload) => {
    try {
      const plaintext = decryptPayload(payload, password);
      count += 1;
      return `${START}\n${plaintext}\n${END}\n`;
    } catch {
      failed += 1;
      console.error(`${file}: could not decrypt a legacy "${label}" span (wrong password or corrupted payload).`);
      return match;
    }
  });
  if (count > 0) writeFileSync(file, updated);
  console.log(`${file}: unlocked ${count} span${count === 1 ? '' : 's'}${failed ? `, ${failed} FAILED` : ''}.`);
  return failed === 0;
}

async function registerAuthor(author, passwordFlag) {
  const registry = readRegistry();
  const password = resolvePassword(author, passwordFlag, 'register');
  registry[author] = verifierFor(password);
  writeRegistry(registry);
  console.log(`Registered "${author}" in ${REGISTRY_FILE} (scrypt verifier only — safe to commit).`);
}

async function verifyAuthor(author, passwordFlag) {
  const registry = readRegistry();
  const entry = registry[author];
  if (!entry) {
    // A falsy entry (null, {}, missing) means the author is declared but has
    // no password yet: setting one now is allowed and updates the registry.
    console.error(`Author "${author}" has no password set in ${REGISTRY_FILE}.`);
    console.error(`Set one with: NIMA_PASSWORD='<pw>' node scripts/lock-notes.mjs register ${author}`);
    console.error('(or any <AUTHOR>_PASSWORD env var, --password flag, or interactively via register).');
    return false;
  }
  const password = resolvePassword(author, passwordFlag, 'verify');
  const ok = checkVerifier(password, entry);
  console.log(ok ? `Verified: the password matches author "${author}".` : `FAILED: wrong password for "${author}".`);
  return ok;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const passwordFlagIndex = rest.indexOf('--password');
  const passwordFlag = passwordFlagIndex >= 0 ? rest.splice(passwordFlagIndex, 2)[1] : undefined;

  if (command === 'register' && rest.length === 1) {
    await registerAuthor(rest[0], passwordFlag);
    return;
  }
  if (command === 'verify' && rest.length === 1) {
    process.exit(await verifyAuthor(rest[0], passwordFlag) ? 0 : 1);
  }
  if ((command === 'lock' || command === 'unlock') && rest.length >= 1) {
    const files = command === 'lock' ? rest.slice(1) : rest;
    if (files.length === 0) {
      console.error('No files given.');
      process.exit(1);
    }
    if (command === 'lock') {
      const author = rest[0];
      const registry = readRegistry();
      if (!registry[author]) {
        // Falsy entry (null/{}/missing): the author is declared but has no
        // password yet. Registering now is the intended flow — the password
        // comes from the env var, flag, or prompt, and the registry is updated.
        console.error(`Author "${author}" has no password set in ${REGISTRY_FILE}.`);
        console.error(`Set one first: NIMA_PASSWORD='<pw>' node scripts/lock-notes.mjs register ${author}`);
        process.exit(1);
      }
      // The lock password must match the registered verifier: one password
      // per author for both locking content and agent verification.
      const check = resolvePassword(author, passwordFlag, 'lock');
      if (!checkVerifier(check, registry[author])) {
        console.error(`FAILED: that password does not match the registered verifier for "${author}". Nothing changed.`);
        process.exit(1);
      }
      let ok = true;
      for (const file of files) ok = lockFile(file, check, author, 'writer-only') && ok;
      process.exit(ok ? 0 : 1);
    }
    // unlock: optional leading author name (files may also follow). With an
    // author, <AUTHOR>_PASSWORD is checked first; without one, only the
    // generic WRITER_PASSWORD (or --password) applies.
    const unlockAuthor = command === 'unlock' && rest.length >= 2 ? rest[0] : null;
    const unlockFiles = unlockAuthor ? rest.slice(1) : rest;
    const password = resolvePassword(unlockAuthor ?? 'writer', passwordFlag, 'unlock');
    let ok = true;
    for (const file of unlockFiles) ok = unlockFile(file, password) && ok;
    process.exit(ok ? 0 : 1);
  }
  console.error([
    'Usage:',
    '  node scripts/lock-notes.mjs lock <author> <file> [more files...] [--password <pw>]',
    '  node scripts/lock-notes.mjs unlock [author] <file> [more files...] [--password <pw>]',
    '  node scripts/lock-notes.mjs register <author> [--password <pw>]',
    '  node scripts/lock-notes.mjs verify <author> [--password <pw>]',
    '',
    'Password sources (in priority order): --password flag,',
    '<AUTHOR>_PASSWORD env var (e.g. NIMA_PASSWORD for author "nima"),',
    'the generic WRITER_PASSWORD env var, or — on macOS — a native',
    'password dialog, so an agent can run this and you just type',
    'into the popup. The password never appears in the command line.',
  ].join('\n'));
  process.exit(1);
}

await main();
