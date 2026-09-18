import type {Props} from '@theme/DocSidebarItems';

type SidebarItem = Props['items'][number];

function matches(item: SidebarItem, activePath: string): boolean {
  return 'href' in item && item.href?.replace(/\/$/, '') === activePath.replace(/\/$/, '');
}

function containsActive(item: SidebarItem, activePath: string): boolean {
  return matches(item, activePath)
    || (item.type === 'category' && item.items.some(child => containsActive(child, activePath)));
}

function findScope(items: Props['items'], activePath: string): SidebarItem | undefined {
  for (const item of items) {
    if (!containsActive(item, activePath)) continue;
    if (matches(item, activePath) || item.type !== 'category') return item;
    return findScope(item.items.filter(child => child.type === 'category'), activePath) ?? item;
  }
  return undefined;
}

export function scopeSidebar(items: Props['items'], activePath: string): Props['items'] {
  const scope = findScope(items, activePath);
  if (!scope || scope === items[0]) return items;
  const returnLink = items[0];
  return returnLink && returnLink !== scope && returnLink.type === 'link'
    ? [returnLink, scope] : [scope];
}