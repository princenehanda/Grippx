const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const API_CONFIG = {
    authUrl: 'https://apinationalflag.kickatinalong.net/api/Customer/Login',
    feedUrl: 'https://apinationalflag.kickatinalong.net/api/product/feed',
    email: 'prince@grippx.co',
    password: 'Gr1ppX!',
    markup: 1.30 // 30% markup
};

async function sync() {
    try {
        console.log('--- Product Sync Execution ---');

        // 1. Authenticate using curl.exe
        console.log('Authenticating...');
        const authPayload = JSON.stringify({ email: API_CONFIG.email, password: API_CONFIG.password });
        const authCmd = `curl.exe -s -X POST "${API_CONFIG.authUrl}" -H "Content-Type: application/json" -d "${authPayload.replace(/"/g, '\\"')}"`;
        const authResponseJSON = execSync(authCmd).toString();
        const authResponse = JSON.parse(authResponseJSON);

        if (!authResponse.token) {
            throw new Error(`Authentication failed: ${authResponse.result || 'Unknown error'}`);
        }

        const token = authResponse.token;
        console.log('Authenticated successfully.');

        // 2. Fetch Product Feed using curl.exe to a temporary file
        const tempFeedFile = path.join(__dirname, 'temp_feed.json');
        console.log('Fetching product feed to temporary file...');
        
        const feedCmd = `curl.exe -s -L -H "Authorization: Bearer ${token}" "${API_CONFIG.feedUrl}" -o "${tempFeedFile}"`;
        execSync(feedCmd);

        console.log('Reading feed data from file...');
        const feedRaw = fs.readFileSync(tempFeedFile, 'utf8');
        const feedData = JSON.parse(feedRaw);
        
        const products = Array.isArray(feedData) ? feedData : (feedData.data || []);
        console.log(`Received ${products.length} products.`);

        // 3. Transform and Apply Markup
        console.log('Transforming data...');
        const transformed = products.map(p => {
            // Price Extraction logic: deep dive into stock -> pricings -> price
            let rawPrice = 0;
            if (p.stock && Array.isArray(p.stock) && p.stock.length > 0) {
                const stockItem = p.stock[0];
                if (stockItem.pricings && Array.isArray(stockItem.pricings) && stockItem.pricings.length > 0) {
                    rawPrice = parseFloat(stockItem.pricings[0].price) || 0;
                }
            }

            const finalPrice = Math.round(rawPrice * API_CONFIG.markup * 100) / 100;
            
            // Image URL logic: look for imageUrl in images array
            let image = 'assets/images/placeholder.jpg';
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                image = p.images[0].imageUrl || p.images[0].url || p.images[0].link || image;
            }

            // Supplier logic: extract from stock or default, and clean numbers
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
                supplier: supplier,
                description: p.fullDescription || p.description || '',
                specs: {
                    "Supplier Code": p.code || 'N/A',
                    "Stock Status": "Available"
                }
            };
        });

        // 4. Save to products.json
        const outputDir = path.join(__dirname, '../data');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        
        const outputPath = path.join(outputDir, 'products.json');
        fs.writeFileSync(outputPath, JSON.stringify(transformed, null, 2));

        // Cleanup
        if (fs.existsSync(tempFeedFile)) fs.unlinkSync(tempFeedFile);

        console.log(`Sync Successful! ${transformed.length} products saved to ${outputPath}`);

    } catch (err) {
        console.error('CRITICAL ERROR:', err.message);
        process.exit(1);
    }
}

sync();
