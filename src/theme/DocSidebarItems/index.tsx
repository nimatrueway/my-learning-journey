import React from 'react';
import DocSidebarItems from '@theme-original/DocSidebarItems';
import type {Props} from '@theme/DocSidebarItems';
import {scopeSidebar} from './scope';

export default function ScopedDocSidebarItems(props: Props) {
  const items = props.level === 1 ? scopeSidebar(props.items, props.activePath) : props.items;
  return <DocSidebarItems {...props} items={items} />;
}