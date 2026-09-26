import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useDocsVersion} from '@docusaurus/plugin-content-docs/client';
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

function currentGroup(
  chain: PropSidebarItemCategory[] | null,
  target: string,
): Pick<RecentModule, 'key' | 'module'> | null {
  const course = chain?.[0];
  if (!course) return null;
  const group = normalize(course.href ?? '').endsWith('/courses/books')
    ? chain?.[1] ?? course
    : course;
  return {key: normalize(group.href ?? target), module: group.label};
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
      const group = items ? currentGroup(categoryChain(items, normalize(item.href)), item.href) : null;
      const recent = group ? {...item, ...group} : item;
      if (!newestByGroup.has(recent.key)) newestByGroup.set(recent.key, recent);
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
  const group = currentGroup(chain, target);
  const page = currentPageLabel(items, target);
  if (!course || !group || !page || target === normalize(course.href ?? '')) return;

  const recent: RecentModule = {
    ...group,
    course: course.label,
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
  const {docsSidebars} = useDocsVersion();
  const [modules, setModules] = useState<RecentModule[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const items = Object.values(docsSidebars).flat();
    const update = () => setModules(readRecentModules(items));
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
  }, [docsSidebars]);

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