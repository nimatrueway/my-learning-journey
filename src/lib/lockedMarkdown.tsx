import React from 'react';
import Link from '@docusaurus/Link';
import Meme, {type MemeProps} from '../components/Meme';
import Quiz, {type QuizOption} from '../components/Quiz';
import ScenarioMatrixLab, {type ScenarioMatrixData} from '../components/ScenarioMatrixLab';

export interface ParsedLockedDocument {
  /** Leading `# Title`, if the encrypted payload defines a full-page lesson. */
  title: string | null;
  /** True when the payload contains block-level Markdown/MDX rather than an inline phrase. */
  isBlock: boolean;
  /** Rendered React content. */
  nodes: React.ReactNode;
}

function slugifyHeading(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[`*_[\]()]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Render inline Markdown: `code`, [links](url), **bold**, and *italic*. */
export function renderInlineMarkdown(input: string, keyPrefix = 'in'): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const tokenRe = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([\s\S]+?)\*\*|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRe.exec(input)) !== null) {
    if (match.index > lastIndex) {
      out.push(input.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${idx++}`;
    if (match[1] !== undefined) {
      out.push(<code key={key}>{match[1]}</code>);
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const label = renderInlineMarkdown(match[2], `${key}-lbl`);
      const href = match[3];
      if (/^https?:\/\//i.test(href)) {
        out.push(
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>,
        );
      } else {
        out.push(
          <Link key={key} to={href}>
            {label}
          </Link>,
        );
      }
    } else if (match[4] !== undefined) {
      out.push(<strong key={key}>{renderInlineMarkdown(match[4], `${key}-b`)}</strong>);
    } else if (match[5] !== undefined) {
      out.push(<em key={key}>{renderInlineMarkdown(match[5], `${key}-i`)}</em>);
    }
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < input.length) {
    out.push(input.slice(lastIndex));
  }
  return out;
}

/** Parse string and `{JSON}` attributes from a trusted author-encrypted JSX tag. */
function parseJsxProps(tagSource: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  const body = tagSource
    .replace(/^<[A-Za-z0-9_]+\s*/, '')
    .replace(/\/>\s*$/, '');

  let pos = 0;
  while (pos < body.length) {
    while (pos < body.length && /\s/.test(body[pos])) pos += 1;
    if (pos >= body.length) break;

    const nameMatch = /^[A-Za-z_][A-Za-z0-9_-]*/.exec(body.slice(pos));
    if (!nameMatch) break;
    const name = nameMatch[0];
    pos += name.length;

    while (pos < body.length && /\s/.test(body[pos])) pos += 1;
    if (body[pos] !== '=') {
      props[name] = true;
      continue;
    }
    pos += 1;
    while (pos < body.length && /\s/.test(body[pos])) pos += 1;

    if (body[pos] === '"' || body[pos] === "'") {
      const quote = body[pos];
      pos += 1;
      let val = '';
      while (pos < body.length && body[pos] !== quote) {
        if (body[pos] === '\\' && pos + 1 < body.length) {
          val += body[pos + 1];
          pos += 2;
        } else {
          val += body[pos];
          pos += 1;
        }
      }
      pos += 1; // closing quote
      props[name] = val;
    } else if (body[pos] === '{') {
      let depth = 0;
      let inStr: string | null = null;
      const exprStart = pos + 1;
      while (pos < body.length) {
        const ch = body[pos];
        if (inStr) {
          if (ch === '\\') pos += 1;
          else if (ch === inStr) inStr = null;
        } else if (ch === '"' || ch === "'") {
          inStr = ch;
        } else if (ch === '{') {
          depth += 1;
        } else if (ch === '}') {
          depth -= 1;
          if (depth === 0) {
            const rawJson = body.slice(exprStart, pos).trim();
            props[name] = JSON.parse(rawJson);
            pos += 1;
            break;
          }
        }
        pos += 1;
      }
    }
  }
  return props;
}

/** Find the ending line index of a self-closing `<Component ... />` block. */
function consumeSelfClosingTag(lines: string[], startIndex: number): {raw: string; nextIndex: number} {
  let acc = '';
  let inStr: string | null = null;
  let braceDepth = 0;

  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i];
    for (let c = 0; c < line.length; c += 1) {
      const ch = line[c];
      if (inStr) {
        if (ch === '\\') c += 1;
        else if (ch === inStr) inStr = null;
      } else if (ch === '"' || ch === "'") {
        inStr = ch;
      } else if (ch === '{') {
        braceDepth += 1;
      } else if (ch === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (ch === '/' && line[c + 1] === '>' && braceDepth === 0) {
        acc += line.slice(0, c + 2);
        return {raw: acc, nextIndex: i + 1};
      }
    }
    acc += `${line}\n`;
  }
  return {raw: acc, nextIndex: lines.length};
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

interface ListEntry {
  textLines: string[];
  subBullets: string[];
}

function consumeList(lines: string[], startIndex: number, ordered: boolean): {items: ListEntry[]; nextIndex: number} {
  const itemPattern = ordered ? /^\d+\.\s+(.*)$/ : /^-\s+(.*)$/;
  const items: ListEntry[] = [];
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      // Allow a blank line only if the next line starts another top-level item of the same list
      if (i + 1 < lines.length && itemPattern.test(lines[i + 1])) {
        i += 1;
        continue;
      }
      break;
    }

    const topMatch = itemPattern.exec(line);
    if (topMatch) {
      items.push({textLines: [topMatch[1]], subBullets: []});
      i += 1;
      continue;
    }

    const subBulletMatch = /^\s{2,}-\s+(.*)$/.exec(line);
    if (subBulletMatch && items.length > 0) {
      items[items.length - 1].subBullets.push(subBulletMatch[1]);
      i += 1;
      continue;
    }

    const continuationMatch = /^\s{2,}(\S.*)$/.exec(line);
    if (continuationMatch && items.length > 0) {
      const current = items[items.length - 1];
      if (current.subBullets.length > 0) {
        current.subBullets[current.subBullets.length - 1] += ` ${continuationMatch[1].trim()}`;
      } else {
        current.textLines.push(continuationMatch[1].trim());
      }
      i += 1;
      continue;
    }

    break;
  }

  return {items, nextIndex: i};
}

function renderBlocks(lines: string[], keyPrefix = 'blk'): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      i += 1;
      continue;
    }

    // Collapsible <details> block
    if (trimmed === '<details>') {
      let endIdx = i + 1;
      while (endIdx < lines.length && lines[endIdx].trim() !== '</details>') {
        endIdx += 1;
      }
      const innerLines = lines.slice(i + 1, endIdx);
      let summaryText = 'Details';
      const bodyStart = innerLines.findIndex((l) => l.trim().startsWith('<summary>'));
      let contentLines = innerLines;
      if (bodyStart >= 0) {
        summaryText = innerLines[bodyStart].trim().replace(/^<summary>/, '').replace(/<\/summary>$/, '');
        contentLines = [...innerLines.slice(0, bodyStart), ...innerLines.slice(bodyStart + 1)];
      }
      const key = `${keyPrefix}-${blockKey++}`;
      elements.push(
        <details key={key}>
          <summary>{renderInlineMarkdown(summaryText, `${key}-sum`)}</summary>
          {renderBlocks(contentLines, `${key}-det`)}
        </details>,
      );
      i = endIdx + 1;
      continue;
    }

    // Supported interactive/callout JSX components
    if (/^<(Meme|Quiz|ScenarioMatrixLab)\b/.test(trimmed)) {
      const compName = /^<(Meme|Quiz|ScenarioMatrixLab)\b/.exec(trimmed)?.[1];
      const {raw, nextIndex} = consumeSelfClosingTag(lines, i);
      const props = parseJsxProps(raw);
      const key = `${keyPrefix}-${blockKey++}`;
      if (compName === 'Meme') {
        elements.push(<Meme key={key} {...(props as MemeProps)} />);
      } else if (compName === 'Quiz') {
        elements.push(
          <Quiz
            key={key}
            question={String(props.question ?? '')}
            options={(props.options as QuizOption[]) ?? []}
          />,
        );
      } else if (compName === 'ScenarioMatrixLab' && props.data) {
        elements.push(<ScenarioMatrixLab key={key} data={props.data as ScenarioMatrixData} />);
      }
      i = nextIndex;
      continue;
    }

    // Headings
    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = slugifyHeading(text);
      const key = `${keyPrefix}-${blockKey++}`;
      const children = renderInlineMarkdown(text, `${key}-h`);
      if (level === 1) elements.push(<h1 key={key} id={id}>{children}</h1>);
      else if (level === 2) elements.push(<h2 key={key} id={id}>{children}</h2>);
      else if (level === 3) elements.push(<h3 key={key} id={id}>{children}</h3>);
      else elements.push(<h4 key={key} id={id}>{children}</h4>);
      i += 1;
      continue;
    }

    // GFM Table
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1].trim())) {
      const headers = splitTableRow(lines[i]);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      const key = `${keyPrefix}-${blockKey++}`;
      elements.push(
        <table key={key}>
          <thead>
            <tr>
              {headers.map((h, hIdx) => (
                <th key={`${key}-th-${hIdx}`}>{renderInlineMarkdown(h, `${key}-thc-${hIdx}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={`${key}-tr-${rIdx}`}>
                {row.map((cell, cIdx) => (
                  <td key={`${key}-td-${rIdx}-${cIdx}`}>
                    {renderInlineMarkdown(cell, `${key}-tdc-${rIdx}-${cIdx}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      const key = `${keyPrefix}-${blockKey++}`;
      elements.push(
        <blockquote key={key}>
          <p>{renderInlineMarkdown(quoteLines.join(' '), `${key}-bq`)}</p>
        </blockquote>,
      );
      continue;
    }

    // Unordered or ordered lists
    if (/^-\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const {items, nextIndex} = consumeList(lines, i, ordered);
      const key = `${keyPrefix}-${blockKey++}`;
      const ListTag = ordered ? 'ol' : 'ul';
      elements.push(
        <ListTag key={key}>
          {items.map((item, idx) => (
            <li key={`${key}-li-${idx}`}>
              {renderInlineMarkdown(item.textLines.join(' '), `${key}-lit-${idx}`)}
              {item.subBullets.length > 0 && (
                <ul>
                  {item.subBullets.map((sub, sIdx) => (
                    <li key={`${key}-sub-${idx}-${sIdx}`}>
                      {renderInlineMarkdown(sub, `${key}-subt-${idx}-${sIdx}`)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ListTag>,
      );
      i = nextIndex;
      continue;
    }

    // Paragraph (consume consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s+|-\s+|\d+\.\s+|>\s?|\||<(details|Meme|Quiz|ScenarioMatrixLab)\b)/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    const key = `${keyPrefix}-${blockKey++}`;
    elements.push(<p key={key}>{renderInlineMarkdown(paraLines.join(' '), `${key}-p`)}</p>);
  }

  return elements;
}

export function parseLockedContent(raw: string): ParsedLockedDocument {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const isBlock =
    normalized.includes('\n\n') ||
    /^(#{1,4}\s+|-\s+|\d+\.\s+|<details>|<Meme\b|<Quiz\b|<ScenarioMatrixLab\b)/m.test(normalized);

  if (!isBlock) {
    return {
      title: null,
      isBlock: false,
      nodes: renderInlineMarkdown(normalized, 'inline'),
    };
  }

  const lines = normalized.split('\n');
  let extractedTitle: string | null = null;
  if (lines[0]?.startsWith('# ')) {
    extractedTitle = lines[0].slice(2).trim();
    lines.shift();
  }

  return {
    title: extractedTitle,
    isBlock: true,
    nodes: renderBlocks(lines, 'doc'),
  };
}
