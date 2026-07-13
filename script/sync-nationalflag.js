/*
  National Flag product feed sync.
  ---------------------------------
  Runs on GitHub Actions (see .github/workflows/sync-products.yml), not on
  anyone's local machine. Credentials come from environment variables,
  which the workflow injects from GitHub encrypted secrets — never hardcode
  them here.

  This script only fetches, authenticates, and applies markup. Category
  mapping, stripping sensitive fields, and writing the public-facing
  data/products.json happen in build_products.py, which runs right after
  this in the same workflow. This script's own output (products-raw.json)
  is gitignored and never committed — it still contains National Flag's
  internal supplier/tier names, which must never reach the public repo.
*/

const fs = require('fs');
const path = require('path');

const API_CONFIG = {
    authUrl: 'https://apinationalflag.kickatinalong.net/api/Customer/Login',
    feedUrl: 'https://apinationalflag.kickatinalong.net/api/product/feed',
    email: process.env.NF_EMAIL,
    password: process.env.NF_PASSWORD,
    markup: parseFloat(process.env.NF_MARKUP || '1.30') // 30% default, override via NF_MARKUP secret/var if needed
};

const OUTPUT_PATH = path.join(__dirname, '.cache', 'products-raw.json');

async function sync() {
    if (!API_CONFIG.email || !API_CONFIG.password) {
        throw new Error('NF_EMAIL and NF_PASSWORD must be set as environment variables (GitHub secrets).');
    }

    console.log('--- Product Sync Execution ---');

    // 1. Authenticate
    console.log('Authenticating...');
    const authRes = await fetch(API_CONFIG.authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: API_CONFIG.email, password: API_CONFIG.password })
    });
    if (!authRes.ok) {
        throw new Error(`Authentication request failed: HTTP ${authRes.status}`);
    }
    const authResponse = await authRes.json();
    if (!authResponse.token) {
        throw new Error(`Authentication failed: ${authResponse.result || 'no token in response'}`);
    }
    const token = authResponse.token;
    console.log('Authenticated successfully.');

    // 2. Fetch product feed
    console.log('Fetching product feed...');
    const feedRes = await fetch(API_CONFIG.feedUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!feedRes.ok) {
        throw new Error(`Feed request failed: HTTP ${feedRes.status}`);
    }
    const feedData = await feedRes.json();
    const products = Array.isArray(feedData) ? feedData : (feedData.data || []);
    console.log(`Received ${products.length} products.`);

    // 3. Transform and apply markup
    console.log('Transforming data...');
    const transformed = products.map(p => {
        let rawPrice = 0;
        if (p.stock && Array.isArray(p.stock) && p.stock.length > 0) {
            const stockItem = p.stock[0];
            if (stockItem.pricings && Array.isArray(stockItem.pricings) && stockItem.pricings.length > 0) {
                rawPrice = parseFloat(stockItem.pricings[0].price) || 0;
            }
        }
        const finalPrice = Math.round(rawPrice * API_CONFIG.markup * 100) / 100;

        let image = 'assets/images/placeholder.jpg';
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
            image = p.images[0].imageUrl || p.images[0].url || p.images[0].link || image;
        }

        let supplier = 'National Flag';
        if (p.stock && Array.isArray(p.stock) && p.stock.length > 0) {
            supplier = p.stock[0].supplier || supplier;
            supplier = supplier.replace(/^\d+\.\s*/, '');
        }

        return {
            id: `nf-${p.code || p.id}`,
            name: p.description || p.name || 'Unnamed Product',
            category: p.category || 'General',
            price: finalPrice,
            image: image,
            supplier: supplier, // internal only — build_products.py strips this before it's ever public
            description: p.fullDescription || p.description || '',
            specs: {
                'Supplier Code': p.code || 'N/A',
                'Stock Status': 'Available'
            }
        };
    });

    // 4. Save raw (gitignored) intermediate file for build_products.py to consume
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(transformed, null, 2));

    console.log(`Sync successful — ${transformed.length} products written to ${OUTPUT_PATH}`);
}

sync().catch(err => {
    console.error('CRITICAL ERROR:', err.message);
    process.exit(1);
});
