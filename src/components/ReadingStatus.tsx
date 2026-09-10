import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem, PropSidebarItemCategory} from '@docusaurus/plugin-content-docs';
import {recordRecentModule} from './RecentModules';

const normalize = (path: string) => path.replace(/\/+$/, '');

type FlatItem = {href: string; label: string};
type CategoryProgress = {href: string; completed: number; percent: number; total: number};

const completionKey = (href: string): string => `reading-complete:${normalize(href)}`;
const progressKey = (href: string): string => `reading-progress:${normalize(href)}`;

function pageProgress(href: string): number {
  const stored = localStorage.getItem(progressKey(href));
  if (stored !== null) return Math.max(0, Math.min(100, Number(stored) || 0));
  return localStorage.getItem(completionKey(href)) === '1' ? 100 : 0;
}

function leafPaths(items: PropSidebarItem[]): string[] {
  return items.flatMap((item) => {
    if (item.type === 'category') return leafPaths(item.items);
    return item.type === 'link' ? [item.href] : [];
  });
}

function categoryProgress(items: PropSidebarItem[]): CategoryProgress[] {
  return items.flatMap((item) => {
    if (item.type !== 'category') return [];
    const paths = leafPaths(item.items);
    let completed = 0;
    let percent = 0;
    try {
      const pagePercentages = paths.map(pageProgress);
      completed = pagePercentages.filter((value) => value === 100).length;
      percent = paths.length === 0 ? 0 : Math.round(pagePercentages.reduce((sum, value) => sum + value, 0) / paths.length);
    } catch {
      // storage unavailable; report zero persistent progress
    }
    const current = item.href ? [{href: item.href, completed, percent, total: paths.length}] : [];
    return [...current, ...categoryProgress(item.items)];
  });
}

function updateSidebarProgress(items: PropSidebarItem[]) {
  document.querySelectorAll('.menu__progress').forEach((indicator) => indicator.remove());

  for (const progress of categoryProgress(items)) {
    const link = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.theme-doc-sidebar-menu a.menu__link--sublist[href]'),
    ).find((candidate) => normalize(new URL(candidate.href).pathname) === normalize(progress.href));
    if (!link || progress.total === 0 || progress.percent === 0) continue;

    const {percent} = progress;
    const indicator = document.createElement('span');
    indicator.className = 'menu__progress';
    indicator.title = 'Reading progress';
    indicator.setAttribute('role', 'progressbar');
    indicator.setAttribute('aria-label', `${percent}% complete`);
    indicator.setAttribute('aria-valuemin', '0');
    indicator.setAttribute('aria-valuemax', '100');
    indicator.setAttribute('aria-valuenow', String(percent));
    const track = document.createElement('span');
    track.className = 'menu__progress-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'menu__progress-fill';
    fill.style.width = `${percent}%`;
    track.appendChild(fill);
    indicator.appendChild(track);
    link.appendChild(indicator);
  }
}

function flatten(items: PropSidebarItem[]): FlatItem[] {
  const out: FlatItem[] = [];
  for (const item of items) {
    if (item.type === 'category') {
      if (item.href) out.push({href: normalize(item.href), label: item.label});
      out.push(...flatten(item.items));
    } else if (item.type === 'link') {
      out.push({href: normalize(item.href), label: item.label});
    }
  }
  return out;
}

/** Chain of categories containing the target path, outermost first. */
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

const meter = (index: number, total: number): string => {
  const filled = Math.round((index / total) * 8);
  return '▓'.repeat(filled) + '░'.repeat(8 - filled);
};

function useScrollPosition(pathname: string): {section: string | null; pagePct: number} {
  const [section, setSection] = useState<string | null>(null);
  const [pagePct, setPagePct] = useState(0);

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('.theme-doc-markdown h2, .theme-doc-markdown h3'),
    );
    let ticking = false;
    const measure = () => {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setPagePct(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100);
      let current: HTMLElement | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= 120) current = heading;
        else break;
      }
      setSection(current ? current.textContent?.replace(/[\u200b#]/g, '').trim() || null : null);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(measure);
      }
    };
    measure();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  return {section, pagePct};
}

export default function ReadingStatus(): React.ReactElement | null {
  const sidebar = useDocsSidebar();
  const {pathname} = useLocation();
  const {section, pagePct} = useScrollPosition(pathname);

  useEffect(() => {
    if (!sidebar) return;
    recordRecentModule(sidebar.items, pathname);
    const update = () => updateSidebarProgress(sidebar.items);
    const frame = requestAnimationFrame(update);
    window.addEventListener('reading-progress-updated', update);
    window.addEventListener('storage', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('reading-progress-updated', update);
      window.removeEventListener('storage', update);
    };
  }, [pathname, sidebar]);

  if (!sidebar) return null;

  const target = normalize(pathname);
  const chain = categoryChain(sidebar.items, target);
  const course = chain?.[0];
  if (!course) return null;

  const courseFlat = flatten([course]);
  const courseIdx = courseFlat.findIndex((item) => item.href === target);
  if (courseIdx === -1) return null;

  const module = chain.length > 1 ? chain[1] : null;
  const moduleFlat = module ? flatten([module]) : null;
  const moduleIdx = moduleFlat ? moduleFlat.findIndex((item) => item.href === target) : -1;
  const coursePct = Math.round(((courseIdx + 1) / courseFlat.length) * 100);

  return (
    <div id="reading-status">
      <span className="rsCourse">{course.label}</span>
      {module && (
        <>
          <span className="rsSep">▸</span>
          <span>{module.label}</span>
        </>
      )}
      <span className="rsSep">▸</span>
      <span className="rsChapter">{courseFlat[courseIdx].label}</span>
      {section && (
        <>
          <span className="rsSep">▸</span>
          <span className="rsSection">{section}</span>
        </>
      )}
      <span className="rsMeter">page {meter(pagePct, 100)} {pagePct}%</span>
      {moduleFlat && moduleIdx !== -1 && (
        <span className="rsMeter">
          module {meter(moduleIdx + 1, moduleFlat.length)} {moduleIdx + 1}/{moduleFlat.length}
        </span>
      )}
      <span className="rsMeter">
        course {meter(courseIdx + 1, courseFlat.length)} {courseIdx + 1}/{courseFlat.length} ({coursePct}%)
      </span>
    </div>
  );
}
