import os
import datetime
from xml.etree.ElementTree import Element, SubElement, ElementTree

SITE_URL = os.getenv("SITE_URL", "https://reverse-shion.github.io")
SITE_ROOT = os.getenv("SITE_ROOT", ".")

OUTPUT_PATH = os.path.join(SITE_ROOT, "sitemap.xml")

# 現在時刻をUTCで取得して <lastmod> に設定
now = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

urlset = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

for root, dirs, files in os.walk(SITE_ROOT):
    for file in files:
        if file.endswith(".html"):
            rel_path = os.path.relpath(os.path.join(root, file), SITE_ROOT)
            url = f"{SITE_URL}/{rel_path}".replace("index.html", "")
            node = SubElement(urlset, "url")
            SubElement(node, "loc").text = url
            SubElement(node, "lastmod").text = now

tree = ElementTree(urlset)
tree.write(OUTPUT_PATH, encoding="utf-8", xml_declaration=True)

print(f"✅ sitemap.xml generated successfully at {now}")
