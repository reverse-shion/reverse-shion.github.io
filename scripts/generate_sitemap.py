import os
import datetime

site_url = os.getenv("SITE_URL", "https://reverse-shion.github.io")
site_root = os.getenv("SITE_ROOT", ".")

# sitemap.xml の書き込み先
output_file = os.path.join(site_root, "sitemap.xml")

urls = []
for root, dirs, files in os.walk(site_root):
    for file in files:
        if file.endswith(".html"):
            path = os.path.relpath(os.path.join(root, file), site_root)
            loc = f"{site_url}/{path.replace(os.sep, '/')}"
            lastmod = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            urls.append((loc, lastmod))

# XML構造で出力
with open(output_file, "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
    f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for loc, lastmod in urls:
        f.write("  <url>\n")
        f.write(f"    <loc>{loc}</loc>\n")
        f.write(f"    <lastmod>{lastmod}</lastmod>\n")
        f.write("  </url>\n")
    f.write("</urlset>\n")

print(f"✅ Generated sitemap with {len(urls)} URLs at {output_file}")
