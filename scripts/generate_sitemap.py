import os
import sys
import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree

SITE_URL  = os.getenv("SITE_URL",  "https://reverse-shion.github.io").rstrip("/")
SITE_ROOT = os.getenv("SITE_ROOT", ".")
OUTPUT_PATH = os.path.join(SITE_ROOT, "sitemap.xml")

# 除外ディレクトリ（必要に応じて調整）
EXCLUDE_DIRS = {".git", ".github", "node_modules", "scripts", "assets", ".vscode"}

def should_skip_dir(path: str) -> bool:
    # 先頭の ./ を落としてから先頭ディレクトリを判定
    p = path[2:] if path.startswith("./") else path
    top = p.split("/", 1)[0]
    return top in EXCLUDE_DIRS

# .html を収集
html_files = []
for root, dirs, files in os.walk(SITE_ROOT):
    # 除外ディレクトリは潜らない
    dirs[:] = [d for d in dirs if not should_skip_dir(os.path.join(root, d))]
    for f in files:
        if f.lower().endswith(".html"):
            full = os.path.join(root, f)
            # SITE_ROOT からの相対パスに変換
            rel = os.path.relpath(full, SITE_ROOT).replace("\\", "/")
            html_files.append(rel)

# 1枚も見つからない場合は明示的に失敗（原因に気づける）
if not html_files:
    sys.stderr.write("ERROR: No .html files found from SITE_ROOT='{}'\n".format(SITE_ROOT))
    sys.exit(1)

# URL 生成
def to_url(rel_path: str) -> str:
    # index.html は末尾スラッシュURLに正規化
    if rel_path.endswith("index.html"):
        rel_path = rel_path[: -len("index.html")]
    return f"{SITE_URL}/{rel_path}".rstrip("/")

now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

# ルートの index.html があるならトップURLも入る
urls = sorted({to_url(p) for p in html_files})
for u in urls:
    url = SubElement(urlset, "url")
    SubElement(url, "loc").text = u
    SubElement(url, "lastmod").text = now

tree = ElementTree(urlset)
tree.write(OUTPUT_PATH, encoding="utf-8", xml_declaration=True)
print(f"✅ Generated {len(urls)} URLs at {now}")
