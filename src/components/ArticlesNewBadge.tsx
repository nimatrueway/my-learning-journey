import React, {useEffect, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useLocation} from '@docusaurus/router';

const STORAGE_KEY = 'collection-visited:james-clear';
const UPDATE_EVENT = 'article-collection-visited';

export function useJamesClearVisit(): void {
  const {pathname} = useLocation();
  const collectionPath = useBaseUrl('/courses/books/the-power-of-imperfect/');

  useEffect(() => {
    if (!pathname.startsWith(collectionPath)) return;
    try {
      localStorage.setItem(STORAGE_KEY, '1');
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch (error) {
      console.warn('Unable to remember the James Clear collection visit.', error);
    }
  }, [pathname, collectionPath]);
}

export default function ArticlesNewBadge(): React.ReactElement | null {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const update = () => {
      try {
        setIsNew(localStorage.getItem(STORAGE_KEY) !== '1');
      } catch (error) {
        console.warn('Unable to load the Articles badge state.', error);
      }
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('pageshow', update);
    window.addEventListener(UPDATE_EVENT, update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('pageshow', update);
      window.removeEventListener(UPDATE_EVENT, update);
    };
  }, []);

  return isNew ? <span className="articlesNewBadge">New</span> : null;
}
