const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const API_BASE_URL = 'https://apinationalflag.kickatinalong.net';
// Placeholder credentials - MUST be replaced with actual user credentials
const EMAIL = 'support@kickatinalong.net'; 
const PASSWORD = '123';
const CUSTOMER_ID = 1;

async function syncProducts() {
    try {
        console.log('--- National Flag API Sync Started ---');

        // 1. Authenticate
        console.log('Authenticating...');
        const loginResponse = await axios.post(`${API_BASE_URL}/api/Customer/Login`, {
            email: EMAIL,
            password: PASSWORD,
            customerId: CUSTOMER_ID
        });

        if (loginResponse.data.result !== 'success' || !loginResponse.data.token) {
            console.error('Authentication failed:', loginResponse.data.result || 'No token returned');
            return;
        }

        const token = loginResponse.data.token;
        console.log('Authenticated successfully.');

        // 2. Fetch Product Feed
        console.log('Fetching product feed...');
        const feedResponse = await axios.get(`${API_BASE_URL}/api/product/feed`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const externalProducts = feedResponse.data;
        console.log(`Fetched ${externalProducts.length} products.`);

        // 3. Transform Data
        // Map API fields (id, name, description, price) to Grippx format
        const transformedProducts = externalProducts.map(p => ({
            id: `nf-${p.id}`,
            category: p.category || 'General', // Fallback if API lacks category
            name: p.name,
            price: p.price,
            image: p.image || 'assets/images/placeholder.jpg', // Fallback if API lacks image
            specs: p.specs || {},
            description: p.description || 'No description available.'
        }));

        // 4. Save to products.json
        const outputPath = path.join(__dirname, '../data/products.json');
        fs.writeFileSync(outputPath, JSON.stringify(transformedProducts, null, 2));

        console.log(`--- Sync Complete. Saved to ${outputPath} ---`);

    } catch (error) {
        console.error('Sync Error:', error.message);
        if (error.response) {
            console.error('API Response Data:', error.response.data);
        }
    }
}

// syncProducts(); // Uncomment to run
