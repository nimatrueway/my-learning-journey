import React from 'react';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {CategoryNavigationItem} from '../../../navigation';

type Props = {onClick?: React.MouseEventHandler<HTMLAnchorElement>};

function CategoryEntry({item, onClick}: Props & {item: CategoryNavigationItem}) {
  return (
    <li>
      {item.items.length > 0 ? (
        <details>
          <summary>{item.label}</summary>
          <ul className="contentsNestedLinks">
            {item.href && <li><Link to={item.href} onClick={onClick}>{item.label}</Link></li>}
            {item.items.map(child => <CategoryEntry key={child.href ?? child.label} item={child} onClick={onClick} />)}
          </ul>
        </details>
      ) : item.href ? <Link to={item.href} onClick={onClick}>{item.label}</Link> : item.label}
    </li>
  );
}

export default function CategoryTree({onClick}: Props) {
  const items = usePluginData('category-navigation') as CategoryNavigationItem[];
  return (
    <li className="contentsNestedGroup">
      <ul className="contentsCategoryTree">
        {items.map(item => <CategoryEntry key={item.href ?? item.label} item={item} onClick={onClick} />)}
      </ul>
    </li>
  );
}