"""
Builds the public-facing data/products.json and bakes static Product schema
into catalogue.html.

Input:  scripts/.cache/products-raw.json (written by sync-nationalflag.js;
        gitignored, contains internal supplier/tier names — never public)
Output: data/products.json (public, sanitised)
        catalogue.html (same file, with its <script id="gx-product-schema">
        block regenerated in place)

Run this from the repo root:  python3 scripts/build_products.py
"""
import json
import re
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_INPUT = os.path.join(REPO_ROOT, 'scripts', '.cache', 'products-raw.json')
PRODUCTS_OUTPUT = os.path.join(REPO_ROOT, 'data', 'products.json')
CATALOGUE_HTML = os.path.join(REPO_ROOT, 'catalogue.html')

with open(RAW_INPUT, encoding='utf-8') as f:
    raw = json.load(f)

# Priority-ordered keyword rules. First match (case-insensitive substring) wins.
RULES = [
    ("Sublimation", ["dye sub", "sublimat", " dtf", "hi-viz dtf"]),
    ("Workwear", ["glove", "hi-viz", "hi-vis", "vest", "protection & gear", "cut resistant"]),
    ("Headwear", ["cap", "hat", "headwear", "beanie"]),
    ("Umbrellas & Outdoor", ["umbrella", "gazebo", "garden & outdoor", "beach & leisure",
                             "fishing", "directors chair", "wind spinner", "windsock", "beach branding"]),
    ("Display Systems", ["banner", "flag", "teardrop", "telescopic", "pop-up", "arch",
                         "a-frame", "tower", "kiosk", "x-frame", "lightbox", "partition display",
                         "snap frame", "vehicle display", "pull up", "tablecloth", "base - indoor",
                         "cluster base", "fence wrap", "vendor table", "combo"]),
    ("Tech & Gadgets", ["tech range", "power bank", "power adapter", "earphone", "speaker",
                        "headphone", "keyboard", "mouse", "wearable", "smart tag", "adapter",
                        "sleeve"]),
    ("Notebooks & Boxes", ["notebook", "diar", "stationery", "custom box", "giftwrap",
                           "swatch book", "art department", "doodleme", "office & organisation",
                           "season's greetings"]),
    ("Branded Apparel", ["teamwear", "t-shirt", "hoodie", "sweater", "jacket", "puffer",
                         "softshell", "windcheater", "tracksuit", "scarve", "golfer",
                         "matric jacket", "wrestling suit"]),
]

def map_category(raw_cat):
    c = raw_cat.lower()
    for site_cat, keywords in RULES:
        for kw in keywords:
            if kw in c:
                return site_cat
    return "Other"

def strip_html(text):
    text = re.sub('<[^<]+?>', ' ', text or '')
    text = re.sub(r'&#\d+;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:220]

out = []
for p in raw:
    out.append({
        "id": p["id"],
        "name": p["name"],
        "category": map_category(p.get("category", "")),
        "price": p.get("price", 0),
        "image": p.get("image", ""),
        "description": strip_html(p.get("description", ""))
    })

os.makedirs(os.path.dirname(PRODUCTS_OUTPUT), exist_ok=True)
with open(PRODUCTS_OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=0)

# ---------------------------------------------------------------------------
# Bake a static Product schema (JSON-LD) directly into catalogue.html's HTML
# source, so crawlers that don't execute JavaScript still see real product
# data.
# ---------------------------------------------------------------------------
schema_items = []
for i, p in enumerate(out, start=1):
    schema_items.append({
        "@type": "ListItem",
        "position": i,
        "item": {
            "@type": "Product",
            "name": p["name"],
            "category": p["category"],
            "image": p["image"],
            "description": p["description"],
            "offers": {
                "@type": "Offer",
                "price": p["price"],
                "priceCurrency": "ZAR",
                "availability": "https://schema.org/InStock",
                "url": "https://grippx.co/catalogue.html"
            }
        }
    })

product_schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": schema_items
}
schema_json = json.dumps(product_schema, ensure_ascii=False, separators=(",", ":"))

with open(CATALOGUE_HTML, encoding="utf-8") as f:
    html = f.read()

pattern = re.compile(
    r'(<script type="application/ld\+json" id="gx-product-schema">\s*).*?(\s*</script>)',
    re.DOTALL
)
if not pattern.search(html):
    raise SystemExit(
        "Could not find the gx-product-schema placeholder in catalogue.html — "
        "has that page been replaced with a version that doesn't have it?"
    )

html = pattern.sub(lambda m: m.group(1) + schema_json + m.group(2), html)

with open(CATALOGUE_HTML, 'w', encoding="utf-8") as f:
    f.write(html)

from collections import Counter
dist = Counter(x["category"] for x in out)
print(f"Total normalized products: {len(out)}")
for k, v in dist.most_common():
    print(f"  {k}: {v}")
print(f"\nBaked Product schema for {len(schema_items)} items into catalogue.html")
print(f"Schema block size: {len(schema_json) / 1024:.1f} KB")
