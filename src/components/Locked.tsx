import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {
  SCOPES,
  decryptPayload,
  getStoredUnlock,
  getUnlockedAuthors,
  listRecordedAuthors,
  lock,
  storeUnlock,
  watchUnlock,
  type Scope,
} from '../lib/writerVault';
import styles from './writerVault.module.css';

export interface LockedProps {
  /** Encrypted payload produced by `pnpm notes:lock`: v1:<salt>:<iv>:<ciphertext>. */
  payload: string;
  /** Author id whose password unlocks this span (stored in the payload's repo registry). */
  author?: string;
  /** Approximate plaintext length, used to size the redaction blob. */
  length?: number;
  /** Short label shown in the modal, e.g. "writer-only context". */
  label?: string;
}

/**
 * Inline redacted span for writer-only content. Renders a blurry, striped blob
 * sized to the hidden text's shape; clicking opens the author-password modal.
 * The payload is ciphertext (AES-256-GCM, encrypted in the repo by
 * `pnpm notes:lock`); the plaintext never ships in the build.
 */
export default function Locked({payload, author = 'writer', length = 120, label = 'writer-only'}: LockedProps): React.ReactElement {
  const vault = useWriterVault();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mask = useMemo(() => blobMask(length), [length]);

  if (vault.checking) {
    return <span className={styles.blobChecking} role="status">🔒…</span>;
  }

  if (vault.unlockedAuthors.has(author)) {
    return <UnlockedInline payload={payload} author={author} onLogout={() => vault.logout(author)} />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const ok = await vault.unlockWith(author, vault.passwordInput, vault.scope, payload);
    if (ok) {
      setModalOpen(false);
    } else {
      setError('Wrong password, or this unlock belongs to a different browser.');
    }
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={styles.blob}
        title={`Encrypted ${label} by ${author} — click to unlock`}
        aria-label={`Encrypted ${label} by ${author}. Opens password prompt.`}
        onClick={() => setModalOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setModalOpen(true);
          }
        }}
      >
        <span className={styles.blobText} aria-hidden="true">{mask}</span>
      </span>
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <form className={styles.modalForm} onSubmit={submit}>
            <h3 className={styles.modalTitle}>🔒 Encrypted by {author}</h3>
            <p className={styles.modalBody}>
              This {label} span was written by <strong>{author}</strong> and is
              encrypted. What is your password, {author}?
            </p>
            <input
              className={styles.passwordInput}
              type="password"
              value={vault.passwordInput}
              onChange={(event) => vault.setPasswordInput(event.target.value)}
              placeholder={`Password for ${author}`}
              aria-label={`Password for ${author}`}
              autoComplete="off"
              autoFocus
            />
            <p className={styles.scopeRow}>
              Keep unlocked for{' '}
              <select
                className={styles.scopeSelect}
                value={vault.scope}
                onChange={(event) => vault.setScope(event.target.value as Scope)}
                aria-label="How long to keep the unlock"
              >
                {SCOPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </p>
            <div className={styles.modalActions}>
              <button className={styles.button} type="submit">Unlock</button>
              <button className={styles.buttonGhost} type="button" onClick={() => setModalOpen(false)}>Cancel</button>
              {vault.recordedAuthors.has(author) && (
                <button className={styles.buttonGhost} type="button" onClick={() => vault.logout(author)}>Log out</button>
              )}
            </div>
            {error && <p className={styles.error} role="alert">{error}</p>}
          </form>
        </Modal>
      )}
    </>
  );
}

interface UnlockedInlineProps {
  payload: string;
  author: string;
  onLogout: () => void;
}

/** Unlocked view: decrypts the payload with this author's stored password. */
function UnlockedInline({payload, author, onLogout}: UnlockedInlineProps): React.ReactElement {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStoredUnlock(author).then((password) => {
      if (password === null) {
        // Record vanished or no longer matches this browser.
        if (!cancelled) onLogout();
        return;
      }
      return decryptPayload(payload, password).then((decrypted) => {
        if (!cancelled) setText(decrypted);
      });
    }).catch(() => {
      // The stored unlock no longer decrypts this payload (expired mid-flight,
      // corrupted record, or the author changed password). Drop this author's
      // record and show the blob again; other authors stay unlocked.
      if (!cancelled) onLogout();
    });
    return () => {
      cancelled = true;
    };
  }, [payload, author, onLogout]);

  if (text === null) {
    return <span className={styles.blobChecking} role="status">🔓…</span>;
  }
  return (
    <span className={styles.unlockedInline}>
      <span className={styles.unlockedText}>{text}</span>
      <button
        className={styles.logoutLink}
        type="button"
        onClick={onLogout}
        title="Remove the stored password from this browser"
      >
        🔒 log out
      </button>
    </span>
  );
}

/**
 * Mask characters matching the plaintext length. Rendered inline inside the
 * spoiler pill, so the blob wraps and flows exactly like the real text would.
 * Spaces between mask characters allow natural word-wrap.
 */
function blobMask(length: number): string {
  const safeLength = Number.isFinite(length) && length > 0 ? Math.round(length) : 120;
  const words = Math.ceil(safeLength / 5);
  return Array.from({length: words}, () => '█'.repeat(4)).join(' ');
}

function Modal({children, onClose}: {children: React.ReactNode; onClose: () => void}): React.ReactElement {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // Portal to <body>: Locked renders inline (often inside a <p>), and a
  // div/form there is invalid HTML that React rejects during hydration.
  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Author password"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Shared vault state: one password prompt serves every <Locked/> on the page,
// but unlocks are per author — only the unlocked writers' spans are revealed.
// ---------------------------------------------------------------------------

interface WriterVaultContextValue {
  checking: boolean;
  /** Authors with a valid stored unlock; only their spans decrypt. */
  unlockedAuthors: ReadonlySet<string>;
  /** Authors with any stored record, including stale/mismatched ones. */
  recordedAuthors: ReadonlySet<string>;
  passwordInput: string;
  setPasswordInput: (value: string) => void;
  scope: Scope;
  setScope: (scope: Scope) => void;
  unlockWith: (author: string, password: string, scope: Scope, verifyPayload: string) => Promise<boolean>;
  logout: (author: string) => void;
}

const WriterVaultContext = createContext<WriterVaultContextValue | null>(null);

function useWriterVault(): WriterVaultContextValue {
  const context = useContext(WriterVaultContext);
  if (!context) throw new Error('Locked must be used inside <WriterVaultProvider>.');
  return context;
}

export function WriterVaultProvider({children}: {children: React.ReactNode}): React.ReactElement {
  const [checking, setChecking] = useState(true);
  const [unlockedAuthors, setUnlockedAuthors] = useState<ReadonlySet<string>>(new Set());
  const [recordedAuthors, setRecordedAuthors] = useState<ReadonlySet<string>>(new Set());
  const [passwordInput, setPasswordInput] = useState('');
  const [scope, setScope] = useState<Scope>('session');

  useEffect(() => {
    let cancelled = false;
    getUnlockedAuthors().then((unlocked) => {
      if (cancelled) return;
      setRecordedAuthors(new Set(listRecordedAuthors()));
      setUnlockedAuthors(new Set(unlocked));
      setChecking(false);
    });
    const stop = watchUnlock((expired) => {
      if (cancelled) return;
      setUnlockedAuthors((prev) => without(prev, expired));
      setRecordedAuthors((prev) => without(prev, expired));
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const unlockWith = useCallback(async (author: string, password: string, chosen: Scope, verifyPayload: string) => {
    if (!password) return false;
    try {
      // Verify against real ciphertext before storing anything: GCM
      // authentication fails on a wrong password, so this is the check.
      await decryptPayload(verifyPayload, password);
    } catch {
      return false;
    }
    await storeUnlock(author, password, chosen);
    setUnlockedAuthors((prev) => new Set(prev).add(author));
    setRecordedAuthors((prev) => new Set(prev).add(author));
    setPasswordInput('');
    return true;
  }, []);

  const logout = useCallback((author: string) => {
    lock(author);
    setUnlockedAuthors((prev) => without(prev, [author]));
    setRecordedAuthors((prev) => without(prev, [author]));
  }, []);

  const value = useMemo(
    () => ({checking, unlockedAuthors, recordedAuthors, passwordInput, setPasswordInput, scope, setScope, unlockWith, logout}),
    [checking, unlockedAuthors, recordedAuthors, passwordInput, scope, unlockWith, logout],
  );

  return (
    <WriterVaultContext.Provider value={value}>
      {children}
    </WriterVaultContext.Provider>
  );
}

function without(set: ReadonlySet<string>, keys: string[]): Set<string> {
  const next = new Set(set);
  for (const key of keys) next.delete(key);
  return next;
}
