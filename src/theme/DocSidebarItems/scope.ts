import type {Props} from '@theme/DocSidebarItems';

type SidebarItem = Props['items'][number];

function matches(item: SidebarItem, activePath: string): boolean {
  return 'href' in item && item.href?.replace(/\/$/, '') === activePath.replace(/\/$/, '');
}

function containsActive(item: SidebarItem, activePath: string): boolean {
  return matches(item, activePath)
    || (item.type === 'category' && item.items.some(child => containsActive(child, activePath)));
}

function findScope(items: Props['items'], activePath: string, scopePaths: readonly string[]): SidebarItem | undefined {
  for (const item of items) {
    if (!containsActive(item, activePath)) continue;
    if (matches(item, activePath) || scopePaths.some(scopePath => matches(item, scopePath))) return item;
    if (item.type === 'category') return findScope(item.items, activePath, scopePaths);
  }
  return undefined;
}

export function scopeSidebar(items: Props['items'], activePath: string, scopePaths: readonly string[]): Props['items'] {
  const scope = findScope(items, activePath, scopePaths);
  if (!scope || scope === items[0]) return items;
  const returnLink = items[0];
  return returnLink && returnLink !== scope && returnLink.type === 'link'
    ? [returnLink, scope] : [scope];
}