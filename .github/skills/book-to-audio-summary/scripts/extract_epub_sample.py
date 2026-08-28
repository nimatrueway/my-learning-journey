#!/usr/bin/env python3
"""
Quick epub-to-text sanity extractor for the book-to-audio-summary skill.

Usage:
    python3 extract_epub_sample.py /path/to/book.epub

Unzips the epub, reads content.opf for the manifest/spine order, strips HTML
tags from the first couple of substantial spine items, and prints a plain
text sample plus a quick corruption check (looks for common short words
surrounded by spaces). If the corruption check fails, don't trust the
extracted text for quotes/summaries -- see references/extraction-fallbacks.md.
"""
import re
import sys
import html
import zipfile
import xml.etree.ElementTree as ET

def strip_html(content: str) -> str:
    content = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', content, flags=re.S | re.I)
    content = re.sub(r'<(p|div|br|h[1-6]|li)[^>]*>', '\n', content, flags=re.I)
    text = re.sub(r'<[^>]+>', '', content)
    return html.unescape(text)

def main(epub_path: str) -> None:
    with zipfile.ZipFile(epub_path) as z:
        opf_name = next(n for n in z.namelist() if n.lower().endswith('.opf'))
        opf_data = z.read(opf_name).decode('utf-8', errors='replace')
        opf_dir = opf_name.rsplit('/', 1)[0] + '/' if '/' in opf_name else ''

        ns = {'opf': 'http://www.idpf.org/2007/opf'}
        root = ET.fromstring(opf_data)
        manifest = {
            item.get('id'): item.get('href')
            for item in root.findall('.//opf:manifest/opf:item', ns)
        }
        spine = [
            manifest[ref.get('idref')]
            for ref in root.findall('.//opf:spine/opf:itemref', ns)
            if ref.get('idref') in manifest
        ]

        sample_text = ''
        for href in spine:
            full_path = opf_dir + href
            try:
                raw = z.read(full_path).decode('utf-8', errors='replace')
            except KeyError:
                continue
            text = strip_html(raw)
            if len(text.strip()) > 500:  # skip cover/title pages
                sample_text = text
                break

    print('--- sample (first 1000 chars) ---')
    print(sample_text[:1000])
    print('--- corruption check ---')
    markers = [' the ', ' and ', ' of ', ' to ', ' a ']
    found = [m.strip() for m in markers if m in sample_text.lower()]
    if found:
        print(f'OK: found common words with spaces: {found}')
    else:
        print('WARNING: no common short words found with surrounding spaces.')
        print('This text is likely corrupted/obfuscated (stripped spaces and/or')
        print('a character substitution cipher). Do not rely on it for exact')
        print('quotes. See references/extraction-fallbacks.md.')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(f'Usage: {sys.argv[0]} /path/to/book.epub')
        sys.exit(1)
    main(sys.argv[1])
