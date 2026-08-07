import React, {useEffect, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import type {PropSidebarItem, PropSidebarItemCategory} from '@docusaurus/plugin-content-docs';

const normalize = (path: string) => path.replace(/\/+$/, '');

type FlatItem = {href: string; label: string};

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
