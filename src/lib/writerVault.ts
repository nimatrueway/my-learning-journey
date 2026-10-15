/**
 * Writer vault: per-author password-gated redaction for writer-only content.
 *
 * Threat model: the site is a static, public GitHub Pages build. Anything in
 * the committed Markdown is public. So the writer encrypts secret spans in the
 * source file itself (via `pnpm notes:lock`), and this module only ever sees
 * ciphertext. Each author's unlock password is itself encrypted with a key
 * derived from a browser fingerprint before it is stored, so a copied
 * localStorage blob is useless in another browser or on another device.
 *
 * Storage layout: one record per author, key `notes:writer-vault:v3:<author>`,
 * value {iv, ct, expiresAt}
 *   - ct = AES-256-GCM(password, key = PBKDF2(fingerprint material))
 *   - "page" scope lives in sessionStorage (dies with the tab); every other
 *     scope lives in localStorage with an expiry timestamp.
 *   - unlocking as one author never touches another author's record: a page
 *     with spans from several writers only reveals the spans of the writers
 *     you have unlocked as.
 */

const RECORD_PREFIX = 'notes:writer-vault:v3:';
const LEGACY_RECORD_KEY = 'notes:writer-vault:v2';
const FINGERPRINT_SALT = 'notes-writer-vault-fingerprint';
const SESSION_MS = 1000 * 60 * 10; // "session" unlock window: 10 minutes.
const FOREVER_MS = 1000 * 60 * 60 * 24 * 365 * 50; // "forever" ≈ 50 years.

export type Scope = 'session' | 'page' | 'week' | 'month' | 'forever';

export const SCOPES: {value: Scope; label: string}[] = [
  {value: 'session', label: '10 minutes (this session)'},
  {value: 'page', label: 'While the page is open'},
  {value: 'week', label: 'A week'},
  {value: 'month', label: 'A month'},
  {value: 'forever', label: 'Forever (until I log out)'},
];

const SCOPE_MS: Record<Scope, number> = {
  session: SESSION_MS,
  page: Number.POSITIVE_INFINITY,
  week: 1000 * 60 * 60 * 24 * 7,
  month: 1000 * 60 * 60 * 24 * 30,
  forever: FOREVER_MS,
};

export function isScope(value: unknown): value is Scope {
  return typeof value === 'string' && value in SCOPE_MS;
}

interface VaultRecord {
  /** AES-GCM iv, hex. */
  iv: string;
  /** Fingerprint-encrypted password, hex. */
  ct: string;
  /** Epoch ms when the unlock expires. */
  expiresAt: number;
}

function subtle(): SubtleCrypto {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto is unavailable in this environment.');
  }
  return window.crypto.subtle;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await subtle().digest('SHA-256', new TextEncoder().encode(input));
  return toHex(new Uint8Array(digest));
}

/**
 * Best-effort browser fingerprint. Not a security boundary by itself — it
 * binds the stored password to this browser so a stolen storage blob does not
 * decrypt elsewhere. A different browser, device, or privacy setting yields a
 * different key and the vault simply reports locked (re-enter the password).
 */
function fingerprintMaterial(): string {
  const nav = window.navigator as Navigator & {deviceMemory?: number};
  return [
    nav.userAgent,
    nav.language,
    (nav.languages ?? []).join(','),
    String(nav.hardwareConcurrency ?? ''),
    String(nav.deviceMemory ?? ''),
    String(window.screen?.width ?? ''),
    String(window.screen?.height ?? ''),
    String(window.screen?.colorDepth ?? ''),
    String(new Date().getTimezoneOffset()),
  ].join('|');
}

let fingerprintKeyPromise: Promise<CryptoKey> | null = null;

async function fingerprintKey(): Promise<CryptoKey> {
  if (!fingerprintKeyPromise) {
    fingerprintKeyPromise = (async () => {
      const materialHash = await sha256Hex(fingerprintMaterial());
      const keyMaterial = await subtle().importKey(
        'raw',
        new TextEncoder().encode(materialHash),
        'PBKDF2',
        false,
        ['deriveKey'],
      );
      return subtle().deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode(FINGERPRINT_SALT),
          iterations: 120_000,
          hash: 'SHA-256',
        },
        keyMaterial,
        {name: 'AES-GCM', length: 256},
        false,
        ['encrypt', 'decrypt'],
      );
    })();
  }
  return fingerprintKeyPromise;
}

async function encryptPassword(password: string): Promise<{iv: string; ct: string}> {
  const key = await fingerprintKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle().encrypt(
    {name: 'AES-GCM', iv},
    key,
    new TextEncoder().encode(password),
  );
  return {iv: toHex(iv), ct: toHex(new Uint8Array(ciphertext))};
}

async function decryptPassword(iv: string, ct: string): Promise<string | null> {
  try {
    const key = await fingerprintKey();
    const plaintext = await subtle().decrypt(
      {name: 'AES-GCM', iv: hexToBytes(iv)},
      key,
      hexToBytes(ct),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    // Wrong fingerprint (other browser/device) or corrupted record.
    return null;
  }
}

function storages(): Storage[] {
  return [window.sessionStorage, window.localStorage];
}

function readRecord(storage: Storage, author: string): VaultRecord | null {
  try {
    const raw = storage.getItem(RECORD_PREFIX + author);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' && parsed !== null
      && typeof (parsed as VaultRecord).iv === 'string'
      && typeof (parsed as VaultRecord).ct === 'string'
      && typeof (parsed as VaultRecord).expiresAt === 'number'
    ) {
      return parsed as VaultRecord;
    }
    return null;
  } catch {
    return null;
  }
}

function writeRecord(scope: Scope, author: string, record: VaultRecord | null): void {
  const storage = scope === 'page' ? window.sessionStorage : window.localStorage;
  try {
    if (record === null) storage.removeItem(RECORD_PREFIX + author);
    else storage.setItem(RECORD_PREFIX + author, JSON.stringify(record));
  } catch {
    // Storage unavailable: the unlock stays in memory for this render only.
  }
}

function isExpired(record: VaultRecord, now: number): boolean {
  return record.expiresAt <= now;
}

/** Authors with any stored record (valid, expired, or fingerprint-mismatched). */
export function listRecordedAuthors(): string[] {
  const authors = new Set<string>();
  for (const storage of storages()) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(RECORD_PREFIX)) authors.add(key.slice(RECORD_PREFIX.length));
      }
    } catch {
      // Storage unavailable.
    }
  }
  return [...authors];
}

/**
 * Return the author's password if a valid, unexpired, fingerprint-matching
 * unlock exists for them; null otherwise. SSR-safe: reports null before
 * hydration. Other authors' records are never consulted.
 */
export async function getStoredUnlock(author: string): Promise<string | null> {
  for (const storage of storages()) {
    const record = readRecord(storage, author);
    if (!record || isExpired(record, Date.now())) continue;
    const password = await decryptPassword(record.iv, record.ct);
    if (password !== null) return password;
  }
  return null;
}

/** Authors whose stored unlock is currently valid (unexpired + this browser). */
export async function getUnlockedAuthors(): Promise<string[]> {
  const unlocked: string[] = [];
  for (const author of listRecordedAuthors()) {
    if (await getStoredUnlock(author) !== null) unlocked.push(author);
  }
  return unlocked;
}

/** Persist the author's password for the chosen scope, fingerprint-encrypted. */
export async function storeUnlock(author: string, password: string, scope: Scope): Promise<void> {
  const {iv, ct} = await encryptPassword(password);
  const ttl = SCOPE_MS[scope];
  const record: VaultRecord = {
    iv,
    ct,
    expiresAt: ttl === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : Date.now() + ttl,
  };
  // Keep exactly one record per author: drop any copy in the other storage.
  writeRecord(scope === 'page' ? 'forever' : 'page', author, null);
  writeRecord(scope, author, record);
}

/** True when a record exists for the author (expired or fingerprint-mismatched). */
export function hasStaleUnlock(author: string): boolean {
  return storages().some((storage) => readRecord(storage, author) !== null);
}

/**
 * Remove stored unlocks. With an author, only that author's record ("log out
 * one writer"); without one, every writer is logged out.
 */
export function lock(author?: string): void {
  if (author !== undefined) {
    writeRecord('page', author, null);
    writeRecord('forever', author, null);
    return;
  }
  for (const name of listRecordedAuthors()) lock(name);
  try {
    window.sessionStorage.removeItem(LEGACY_RECORD_KEY);
    window.localStorage.removeItem(LEGACY_RECORD_KEY);
  } catch {
    // Storage unavailable.
  }
}

/** Re-lock when a timed unlock lapses while the tab stays open. */
export function watchUnlock(onChange: (expiredAuthors: string[]) => void): () => void {
  const timer = window.setInterval(() => {
    const expired = listRecordedAuthors().filter((author) => {
      const records = storages()
        .map((storage) => readRecord(storage, author))
        .filter((record): record is VaultRecord => record !== null);
      return records.length > 0 && records.every((record) => isExpired(record, Date.now()));
    });
    if (expired.length > 0) {
      for (const author of expired) lock(author);
      onChange(expired);
    }
  }, 30_000);
  return () => window.clearInterval(timer);
}

// ---------------------------------------------------------------------------
// Content decryption (mirrors scripts/lock-notes.mjs, which encrypts).
// ---------------------------------------------------------------------------

const PAYLOAD_SALT_PREFIX = 'notes-writer-vault';

async function deriveContentKey(password: string, saltHex: string): Promise<CryptoKey> {
  // Must match scripts/lock-notes.mjs: PBKDF2 salt = prefix bytes + raw salt bytes.
  const prefix = new TextEncoder().encode(PAYLOAD_SALT_PREFIX);
  const salt = new Uint8Array([...prefix, ...hexToBytes(saltHex)]);
  const material = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey(
    {name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256'},
    material,
    {name: 'AES-GCM', length: 256},
    false,
    ['decrypt'],
  );
}

/**
 * Decrypt one `<Locked/>` payload. Payload format (hex fields, `:`-separated):
 * `v1:<saltHex>:<ivHex>:<ciphertextHex>` — AES-256-GCM with a
 * PBKDF2-SHA256 (210k iterations) key. GCM authentication makes a successful
 * decrypt proof that the password is correct.
 */
export async function decryptPayload(payload: string, password: string): Promise<string> {
  const [version, saltHex, ivHex, ciphertextHex] = payload.split(':');
  if (version !== 'v1' || !saltHex || !ivHex || !ciphertextHex) {
    throw new Error('Malformed vault payload.');
  }
  const key = await deriveContentKey(password, saltHex);
  const plaintext = await subtle().decrypt(
    {name: 'AES-GCM', iv: hexToBytes(ivHex)},
    key,
    hexToBytes(ciphertextHex),
  );
  return new TextDecoder().decode(plaintext);
}
