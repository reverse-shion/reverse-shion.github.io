# scripts/generate_sitemap.py
import os, datetime

SITE_URL = os.getenv("SITE_URL", "https://reverse-shion.github.io").rstrip("/")
SITE_ROOT = os.getenv("SITE_ROOT", ".")
OUTPUT_FILE = "sitemap.xml"

def find_html_files(root):
    html_files = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if f.endswith(".html"):
                path = os.path.join(dirpath, f)
                if "/." in path or "404.html" in path:
                    continue
                html_files.append(os.path.relpath(path, root))
    return sorted(html_files)

def main():
    html_files = find_html_files(SITE_ROOT)
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n')
        f.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for file in html_files:
            url = f"{SITE_URL}/{file.replace(os.sep, '/')}"
            f.write(f"  <url><loc>{url}</loc><lastmod>{now}</lastmod></url>\n")
        f.write("</urlset>\n")

    print(f"✅ sitemap.xml generated ({len(html_files)} pages)")

if __name__ == "__main__":
    main()
