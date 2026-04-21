document.addEventListener('DOMContentLoaded', function() {
    let allProducts = [];
    let currentCollection = null;
    let displayedCount = 24;
    const PRODUCTS_PER_PAGE = 24;
    
    let cart = JSON.parse(localStorage.getItem('grippx_cart')) || [];
    
    // UI Elements
    const collectionsGrid = document.getElementById('collections-grid');
    const productGrid = document.getElementById('product-grid');
    const shopHeader = document.querySelector('.shop-header');
    const breadcrumb = document.getElementById('shop-breadcrumb');
    const collectionNameEl = document.getElementById('current-collection-name');
    const backBtn = document.getElementById('back-to-collections');
    const filtersContainer = document.getElementById('category-filters-container');
    
    const modalOverlay = document.querySelector('.modal-overlay');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCountEl = document.querySelector('.cart-count');
    const cartTotalEl = document.getElementById('cart-total-amount');

    const PAYSTACK_PUBLIC_KEY = 'pk_live_b5943e71520c82b1e376a897c081d6e0280b519c';

    // 1. Fetch Products
    fetch('data/products.json')
        .then(response => response.json())
        .then(data => {
            allProducts = data;
            renderCollections();
            updateCartUI();
        })
        .catch(err => {
            console.error('Error loading products:', err);
            if (collectionsGrid) collectionsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Error loading products. Please try again later.</p>';
        });

    // 2. Render Collections (Brand View)
    function renderCollections() {
        if (!collectionsGrid) return;
        
        collectionsGrid.style.display = 'grid';
        productGrid.style.display = 'none';
        breadcrumb.style.display = 'none';
        filtersContainer.style.display = 'none';
        shopHeader.querySelector('h1').textContent = 'Our Brand Collections';
        
        // Group by supplier
        const groups = {};
        allProducts.forEach(p => {
            if (!groups[p.supplier]) {
                groups[p.supplier] = {
                    name: p.supplier,
                    count: 0,
                    image: p.image
                };
            }
            groups[p.supplier].count++;
        });

        collectionsGrid.innerHTML = '';
        Object.values(groups).forEach(group => {
            const card = document.createElement('div');
            card.className = 'collection-card glass-card';
            card.innerHTML = `
                <div class="collection-image">
                    <img src="${group.image}" alt="${group.name}" loading="lazy">
                    <div class="collection-overlay">
                        <span>View ${group.count} Products</span>
                    </div>
                </div>
                <div class="collection-info">
                    <h3>${group.name}</h3>
                    <p>${group.count} Items Available</p>
                </div>
            `;
            card.onclick = () => showCollection(group.name);
            collectionsGrid.appendChild(card);
        });
    }

    // 3. Show Specific Collection
    function showCollection(supplier) {
        currentCollection = supplier;
        displayedCount = PRODUCTS_PER_PAGE;
        
        collectionsGrid.style.display = 'none';
        productGrid.style.display = 'grid';
        breadcrumb.style.display = 'flex';
        filtersContainer.style.display = 'flex';
        
        shopHeader.querySelector('h1').textContent = supplier;
        collectionNameEl.textContent = 'All Products';
        
        generateCategoryFilters(supplier);
        renderProducts(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 4. Render Products
    function renderProducts(reset = true) {
        if (!productGrid) return;
        
        if (reset) {
            productGrid.innerHTML = '';
            displayedCount = PRODUCTS_PER_PAGE;
        }
        
        const filtered = currentCollection === 'all_global' 
            ? allProducts 
            : allProducts.filter(p => p.supplier === currentCollection);

        const itemsToRender = filtered.slice(productGrid.children.length, displayedCount);
        
        itemsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card glass-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">R ${product.price.toLocaleString()}</div>
                </div>
            `;
            card.onclick = () => openModal(product);
            productGrid.appendChild(card);
        });

        updateLoadMoreButton(filtered.length);
    }

    function updateLoadMoreButton(totalItems) {
        let loadMoreBtn = document.getElementById('load-more-btn');
        if (productGrid.children.length < totalItems) {
            if (!loadMoreBtn) {
                loadMoreBtn = document.createElement('button');
                loadMoreBtn.id = 'load-more-btn';
                loadMoreBtn.className = 'btn-load-more';
                loadMoreBtn.textContent = 'Load More';
                loadMoreBtn.onclick = () => {
                    displayedCount += PRODUCTS_PER_PAGE;
                    renderProducts(false);
                };
                productGrid.after(loadMoreBtn);
            }
        } else if (loadMoreBtn) {
            loadMoreBtn.remove();
        }
    }

    // 5. Dynamic Filters within a Collection
    function generateCategoryFilters(supplier) {
        if (!filtersContainer) return;
        
        const products = allProducts.filter(p => p.supplier === supplier);
        const categories = ['all', ...new Set(products.map(p => p.category))];
        
        filtersContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = cat === 'all' ? 'filter-btn active' : 'filter-btn';
            btn.textContent = (cat === 'all') ? 'All' : cat;
            btn.onclick = () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // For simplicity in this logic, we filter and re-render.
                // In a production-grade app, we'd handle multi-layer filtering.
                if (cat === 'all') {
                    renderProducts(true);
                } else {
                    productGrid.innerHTML = '';
                    const filteredItems = products.filter(p => p.category === cat);
                    filteredItems.forEach(product => {
                        const card = createProductCard(product);
                        productGrid.appendChild(card);
                    });
                    if (document.getElementById('load-more-btn')) document.getElementById('load-more-btn').remove();
                }
            };
            filtersContainer.appendChild(btn);
        });
    }

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card glass-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <div class="product-title">${product.name}</div>
                <div class="product-price">R ${product.price.toLocaleString()}</div>
            </div>
        `;
        card.onclick = () => openModal(product);
        return card;
    }

    // 6. Navigation
    if (backBtn) {
        backBtn.onclick = () => {
            currentCollection = null;
            renderCollections();
            if (document.getElementById('load-more-btn')) document.getElementById('load-more-btn').remove();
        };
    }

    // 7. Modal & Cart (Preserved from original logic)
    function openModal(product) {
        const modalContent = document.querySelector('.modal-content-inner');
        let specsHtml = '';
        for (const [label, value] of Object.entries(product.specs || {})) {
            specsHtml += `<div class="spec-item"><span class="spec-label">${label}</span><span class="spec-value">${value}</span></div>`;
        }

        modalContent.innerHTML = `
            <div class="modal-left"><img src="${product.image}" alt="${product.name}"></div>
            <div class="modal-right">
                <div class="product-category">${product.category}</div>
                <h2>${product.name}</h2>
                <div class="modal-price">R ${product.price.toLocaleString()}</div>
                <p class="modal-desc">${product.description || 'No description available.'}</p>
                <div class="modal-specs"><h4>Specifications</h4>${specsHtml}</div>
                <div class="modal-actions"><button class="btn-add-cart" id="modal-add-to-cart">Add to Cart</button></div>
            </div>
        `;
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('modal-add-to-cart').onclick = () => {
            addToCart(product);
            closeModal();
        };
    }

    window.closeModal = function() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };

    function addToCart(product) {
        cart.push(product);
        localStorage.setItem('grippx_cart', JSON.stringify(cart));
        updateCartUI();
        toggleCart(true);
    }

    window.toggleCart = function(show) {
        if (show) cartSidebar.classList.add('open');
        else cartSidebar.classList.remove('open');
    };

    function updateCartUI() {
        cartCountEl.textContent = cart.length;
        cartItemsContainer.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price;
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">R ${item.price.toLocaleString()}</div>
                    <button onclick="removeFromCart(${index})" class="remove-btn">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        cartTotalEl.textContent = total.toLocaleString();
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('grippx_cart', JSON.stringify(cart));
        updateCartUI();
    };

    // Paystack Checkout
    window.checkout = function() {
        if (cart.length === 0) return alert('Your cart is empty!');
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;
        const address = document.getElementById('customer-address').value;

        if (!name || !email || !phone || !address) return alert('Please fill in all details.');
        
        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            amount: Math.round(totalAmount * 100),
            currency: 'ZAR',
            callback: function(response) {
                alert('Payment successful! Reference: ' + response.reference);
                cart = [];
                localStorage.removeItem('grippx_cart');
                updateCartUI();
                toggleCart(false);
            }
        });
        handler.openIframe();
    };
});
