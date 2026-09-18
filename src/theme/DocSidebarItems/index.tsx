import React from 'react';
import DocSidebarItems from '@theme-original/DocSidebarItems';
import type {Props} from '@theme/DocSidebarItems';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {CategoryNavigationItem} from '../../../navigation';
import {scopeSidebar} from './scope';

export default function ScopedDocSidebarItems(props: Props) {
  const roots = usePluginData('category-navigation') as CategoryNavigationItem[];
  const scopePaths = roots.flatMap(root => root.items.flatMap(item => item.href ? [item.href] : []));
  let items = props.items;
  if (props.level === 1) {
    const first = props.items[0];
    const isContentsPage = first?.type === 'link'
      && first.href.replace(/\/$/, '') === props.activePath.replace(/\/$/, '');
    items = isContentsPage ? [first, ...roots.map((root): Props['items'][number] => ({
      type: 'category',
      label: root.label,
      href: root.href,
      collapsed: true,
      collapsible: true,
      items: root.items.flatMap(item => item.href ? [{
        type: 'link' as const,
        label: item.label,
        href: item.href,
      }] : []),
    }))] : scopeSidebar(props.items, props.activePath, scopePaths);
  }
  return <DocSidebarItems {...props} items={items} />;
}