#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, time
from urllib.parse import quote

SITE_URL = os.environ.get("SITE_URL", "https://reverse-shion.github.io")
ROOT = os.environ.get("SITE_ROOT", ".")
EXTS = (".html",)  # 必要なら ".htm" など追加

def norm(loc: str) -> str:
    loc = loc.replace("\\", "/")
    loc = loc.replace("//", "/").replace(":/", "://")
    return loc

urls = []
for dirpath, _, filenames in os.walk(ROOT):
    # .git や scripts など不要なディレクトリは除外
    if any(seg in dirpath for seg in ("/.git", "/scripts", "/node_modules")):
        continue
    for f in filenames:
        if f.lower().endswith(EXTS):
            abs_f = os.path.join(dirpath, f)
            rel = os.path.relpath(abs_f, ROOT)
            rel = rel.replace("\\", "/")

            # index.html → ディレクトリURLへ正規化
            if rel.endswith("index.html"):
                loc = f"{SITE_URL}/{quote(rel[:-10])}"
            else:
                loc = f"{SITE_URL}/{quote(rel)}"

            loc = norm(loc)
            # ISO8601（sitemaps.org準拠）。Googleは lastmod をクロールスケジュールに利用。 
            # 例: 2025-11-12T12:34:56Z
            ts = time.gmtime(os.path.getmtime(abs_f))
            lastmod = time.strftime("%Y-%m-%dT%H:%M:%SZ", ts)
            urls.append((loc, lastmod))

# 重複排除＋並び
urls = sorted(set(urls), key=lambda x: x[0])

xml = []
xml.append('<?xml version="1.0" encoding="UTF-8"?>')
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for loc, lastmod in urls:
    xml.append(f'  <url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>')
xml.append('</urlset>')

with open("sitemap.xml", "w", encoding="utf-8") as fp:
    fp.write("\n".join(xml))

print(f"Generated sitemap.xml with {len(urls)} URLs")
