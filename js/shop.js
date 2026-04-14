document.addEventListener('DOMContentLoaded', function() {
    let products = [];
    let cart = JSON.parse(localStorage.getItem('grippx_cart')) || [];
    
    const productGrid = document.querySelector('.product-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const modalOverlay = document.querySelector('.modal-overlay');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCountEl = document.querySelector('.cart-count');
    const cartTotalEl = document.getElementById('cart-total-amount');

    // Paystack Reference: https://paystack.com/docs/payments/accept-payments/#checkout
    // Paystack Reference: https://paystack.com/docs/payments/accept-payments/#checkout
    const PAYSTACK_PUBLIC_KEY = 'pk_live_b5943e71520c82b1e376a897c081d6e0280b519c';

    // 1. Fetch Products
    fetch('data/products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            renderProducts(products);
            updateCartUI();
        })
        .catch(err => console.error('Error loading products:', err));

    // 2. Render Products
    function renderProducts(items) {
        if (!productGrid) return;
        productGrid.innerHTML = '';
        
        items.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <div class="product-title">${product.name}</div>
                    <div class="product-price">R ${product.price}</div>
                </div>
            `;
            card.onclick = () => openModal(product);
            productGrid.appendChild(card);
        });
    }

    // 3. Filter Logic
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            
            if (category === 'all') {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                renderProducts(filtered);
            }
        };
    });

    // 4. Modal Logic
    function openModal(product) {
        const modalContent = document.querySelector('.modal-content-inner');
        
        // Generate specs HTML
        let specsHtml = '';
        for (const [label, value] of Object.entries(product.specs)) {
            specsHtml += `
                <div class="spec-item">
                    <span class="spec-label">${label}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        }

        modalContent.innerHTML = `
            <div class="modal-left">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="modal-right">
                <div class="product-category">${product.category}</div>
                <h2>${product.name}</h2>
                <div class="modal-price">R ${product.price}</div>
                <p class="modal-desc">${product.description}</p>
                
                <div class="modal-specs">
                    <h4>Specifications</h4>
                    ${specsHtml}
                </div>

                <div class="modal-actions">
                    <button class="btn-add-cart" id="modal-add-to-cart">Add to Cart</button>
                </div>
            </div>
        `;

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        document.getElementById('modal-add-to-cart').onclick = () => {
            addToCart(product);
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };
    }

    // Close Modal
    window.closeModal = function() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) closeModal();
    };

    // 5. Cart Logic
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
                    <div class="cart-item-price">R ${item.price}</div>
                    <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer; font-size:0.8rem; padding:0;">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        cartTotalEl.textContent = total;
    }

    window.removeFromCart = function(index) {
        cart.splice(index, 1);
        localStorage.setItem('grippx_cart', JSON.stringify(cart));
        updateCartUI();
    };

    // 6. Paystack Checkout
    window.checkout = function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const phone = document.getElementById('customer-phone').value;
        const address = document.getElementById('customer-address').value;

        if (!name || !email || !phone || !address) {
            alert('Please fill in all delivery details.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: email,
            amount: totalAmount * 100, // Amount in kobo/cents
            currency: 'ZAR',
            metadata: {
                custom_fields: [
                    {
                        display_name: "Customer Name",
                        variable_name: "customer_name",
                        value: name
                    },
                    {
                        display_name: "Phone Number",
                        variable_name: "phone_number",
                        value: phone
                    },
                    {
                        display_name: "Delivery Address",
                        variable_name: "delivery_address",
                        value: address
                    },
                    {
                        display_name: "Order Items",
                        variable_name: "order_items",
                        value: cart.map(item => item.name).join(', ')
                    }
                ]
            },
            callback: function(response) {
                alert('Payment successful! Reference: ' + response.reference);
                cart = [];
                localStorage.removeItem('grippx_cart');
                
                // Clear form
                document.getElementById('customer-name').value = '';
                document.getElementById('customer-email').value = '';
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-address').value = '';
                
                updateCartUI();
                toggleCart(false);
            },
            onClose: function() {
                console.log('Window closed.');
            }
        });

        handler.openIframe();
    };

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
});
