import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import type {PropSidebarItem, PropSidebarItemCategory} from '@docusaurus/plugin-content-docs';

const STORAGE_KEY = 'recent-modules';
const UPDATE_EVENT = 'recent-modules-updated';
const MAX_RECENT_MODULES = 10;

type RecentModule = {
  key: string;
  course: string;
  module: string;
  page: string;
  href: string;
  accessedAt: number;
};

const normalize = (path: string): string => path.replace(/\/+$/, '') || '/';

function currentGroupKey(
  course: PropSidebarItemCategory,
  target: string,
): string {
  return normalize(course.href ?? target);
}

function categoryChain(items: PropSidebarItem[], target: string): PropSidebarItemCategory[] | null {
  for (const item of items) {
    if (item.type === 'category') {
      if (item.href && normalize(item.href) === target) return [item];
      const sub = categoryChain(item.items, target);
      if (sub) return [item, ...sub];
    } else if (item.type === 'link' && normalize(item.href) === target) {
      return [];
    }
  }
  return null;
}

function currentPageLabel(items: PropSidebarItem[], target: string): string | null {
  for (const item of items) {
    if (item.type === 'category') {
      if (item.href && normalize(item.href) === target) return item.label;
      const nested = currentPageLabel(item.items, target);
      if (nested) return nested;
    } else if (item.type === 'link' && normalize(item.href) === target) {
      return item.label;
    }
  }
  return null;
}

function detectedGroupKey(items: PropSidebarItem[], path: string): string | null {
  const target = normalize(path);
  const chain = categoryChain(items, target);
  const course = chain?.[0];
  if (!course) return null;
  return currentGroupKey(course, target);
}

function readRecentModules(items?: PropSidebarItem[]): RecentModule[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const validModules = parsed
      .filter(
        (item): item is RecentModule =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.key === 'string' &&
          typeof item.course === 'string' &&
          typeof item.module === 'string' &&
          typeof item.page === 'string' &&
          typeof item.href === 'string' &&
          typeof item.accessedAt === 'number',
      )
      .sort((a, b) => b.accessedAt - a.accessedAt);

    const newestByGroup = new Map<string, RecentModule>();
    for (const item of validModules) {
      const key = items ? detectedGroupKey(items, item.href) ?? item.key : item.key;
      if (!newestByGroup.has(key)) newestByGroup.set(key, {...item, key});
    }
    return Array.from(newestByGroup.values()).slice(0, MAX_RECENT_MODULES);
  } catch {
    return [];
  }
}

function relativeAccessTime(accessedAt: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - accessedAt) / 1000));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function recordRecentModule(items: PropSidebarItem[], pathname: string): void {
  const target = normalize(pathname);
  const chain = categoryChain(items, target);
  const course = chain?.[0];
  const page = currentPageLabel(items, target);
  if (!course || !page || target === normalize(course.href ?? '')) return;

  const moduleCategory = chain && chain.length > 1 ? chain[1] : null;
  const recent: RecentModule = {
    key: currentGroupKey(course, target),
    course: course.label,
    module: course.label,
    page,
    href: target,
    accessedAt: Date.now(),
  };

  try {
    const modules = [recent, ...readRecentModules(items).filter((item) => item.key !== recent.key)].slice(
      0,
      MAX_RECENT_MODULES,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // Storage may be unavailable in private or locked-down browsing contexts.
  }
}

export default function RecentModules(): React.ReactElement {
  const [modules, setModules] = useState<RecentModule[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setModules(readRecentModules());
    update();
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener(UPDATE_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(UPDATE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  if (modules.length === 0) {
    return <p className="recentModulesEmpty">Modules you open will appear here.</p>;
  }

  return (
    <ol className="recentModulesList">
      {modules.map((item, index) => (
        <li key={item.key}>
          <Link className="recentModuleLink" to={item.href}>
            <span className="recentModulePosition">{String(index + 1).padStart(2, '0')}</span>
            <span className="recentModuleText">
              <strong>{item.module}</strong>
              {item.page !== item.module && <span>{item.page}</span>}
            </span>
            <span className="recentModuleMeta">
              <time dateTime={new Date(item.accessedAt).toISOString()} title={new Date(item.accessedAt).toLocaleString()}>
                {relativeAccessTime(item.accessedAt, now || item.accessedAt)}
              </time>
              <span className="recentModuleAction">Continue →</span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}