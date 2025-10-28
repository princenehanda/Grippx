/*
|--------------------------------------------------------------------------
| MAIN INITIALIZATION AND SITE-WIDE FUNCTIONS
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", function () {
    // --- Header Scroll Class Toggle (Hero/Header Function) ---
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- Mobile Menu Toggle (Hamburger Function) ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
        // Close menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                }
            });
        });
    }

    // --- Newsletter Form Handler ---
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;
            const button = this.querySelector('button[type="submit"]');
            const originalButtonText = button.textContent;
            
            if (!isValidEmail(email)) {
                showNewsletterMessage('Please enter a valid email address.', 'error');
                return;
            }
            
            button.textContent = 'Subscribing...';
            button.disabled = true;
            
            // Simulate API call delay
            setTimeout(() => {
                button.textContent = originalButtonText;
                button.disabled = false;
                showNewsletterMessage('Thank you for subscribing! We\'ll be in touch soon.', 'success');
                document.getElementById('newsletterEmail').value = '';
            }, 1500);
        });
    }

    // --- Blog Post Animations on Scroll ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    const blogObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    const blogPosts = document.querySelectorAll('.blog-post');
    blogPosts.forEach((post, index) => {
        post.style.opacity = '0';
        post.style.transform = 'translateY(30px)';
        post.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        blogObserver.observe(post);
    });

    // --- Blog Helper Functions Initializers ---
    calculateReadingTimes();
    initializeSocialShare();
    initializeSearch();

    // Blog post interaction tracking (for analytics)
    const postLinks = document.querySelectorAll('.blog-post h2 a, .blog-post h3 a');
    postLinks.forEach(link => {
        link.addEventListener('click', function() {
            trackBlogInteraction('post_click', this.textContent);
        });
    });

    // Category Filter Function
    const categoryLinks = document.querySelectorAll('.categories-widget a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('href').substring(1);
            filterPostsByCategory(category);
        });
    });

    // Initialize scroll to top
    addScrollToTop();

    // --- CATALOGUE/SWIPEBOOK/FLIPBOOK Logic ---
    setTimeout(() => {
        initializeCatalogue();
    }, 500);
});


/*
|--------------------------------------------------------------------------
| CATALOGUE CORE FUNCTIONS (FLIP & SWIPE)
|--------------------------------------------------------------------------
*/

/**
 * Determines the appropriate catalogue view (Flipbook or Swipebook) and initializes it.
 */
function initializeCatalogue() {
    const container = document.querySelector('.catalogue-container');
    const swipebook = document.querySelector('.swipebook');

    if (!container || !swipebook) return;

    // --- DYNAMIC PATH CORRECTION FOR MULTIPLE CATALOGUES ---
    const urlPath = window.location.pathname;

    // 1. Get the filename (e.g., "catalogue-headwear.html")
    const filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);

    // 2. Extract the catalogue name (e.g., "apparel", "headwear", "tech")
    // Removes "catalogue-" prefix and ".html" suffix
    const catalogueName = filename.replace('catalogue-', '').replace('.html', '');

    // 3. Convert to the Asset Folder Name (e.g., "Apparel", "Headwear").
    // Assumes asset folders are PascalCase (e.g., "workwear" -> "Workwear").
    const ASSET_FOLDER_NAME = catalogueName.split('-')
                                           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                           .join('');

    // Use site-root-relative path pattern, but with the dynamic folder name
    // This will now correctly generate paths like: /assets/Headwear/catalogue-page-00.png
    const pathPrefix = `../assets/${ASSET_FOLDER_NAME}/catalogue-page-`; 
    const altTextPrefix = `${ASSET_FOLDER_NAME} Catalogue Page`;
    // --- END DYNAMIC PATH CORRECTION ---


    // --- Dynamically generate pages if they don't exist ---
    const pagesContainer = swipebook.querySelector('.swipebook-pages');
    const numPages = 160; 

    if (pagesContainer && pagesContainer.children.length === 0) {
        // Loop runs 160 times (i = 0 to 159)
        for (let i = 0; i < numPages; i++) { 
            
            // CORRECTED INDEXING: Use index 'i' directly, padded to 2 digits.
            const paddedNumber = i.toString().padStart(2, '0');
            
            const img = document.createElement('img');
            img.src = `${pathPrefix}${paddedNumber}.webp`;
            img.alt = `${altTextPrefix} ${i + 1}`; // Display page numbers starting at 1
            img.loading = 'lazy'; 
            pagesContainer.appendChild(img);
        }
        // Update total pages counter
        const totalPagesSpan = document.getElementById('totalPages');
        if (totalPagesSpan) totalPagesSpan.textContent = numPages;
    }
    const images = Array.from(pagesContainer.querySelectorAll('img'));
    // --- End Dynamic Page Generation ---

    if (images.length === 0) return;

    // Better device detection for the true flip effect
    const DESKTOP_BREAKPOINT = 992; 
    const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const jQueryAvailable = typeof $ !== 'undefined' && typeof $.fn.turn === 'function';

    console.log('Catalogue Init:', { isDesktop, hasTouch, jQueryAvailable });

    // Use Turn.js Flipbook for desktop-like experience where Turn.js is available
    if (isDesktop && jQueryAvailable) {
        initializeFlipbook(container, swipebook, images);
    } else {
        // Use custom swipe logic for mobile and when Turn.js is unavailable
        initializeSwipebook(swipebook, images);
    }
}

/**
 * Initializes the Turn.js Flipbook (Desktop only).
 */
function initializeFlipbook(container, swipebook, images) {
    console.log('Initializing flipbook (Turn.js).');
    
    // 1. Create flipbook structure
    const flipbook = document.createElement('div');
    flipbook.className = 'flipbook';
    flipbook.id = 'flipbook-pages';
    
    // 2. Add pages to flipbook - Turn.js needs divs as pages
    images.forEach((img, index) => {
        const page = document.createElement('div');
        page.className = 'flipbook-page';
        const clonedImg = img.cloneNode(true);
        page.appendChild(clonedImg);
        flipbook.appendChild(page);
    });

    // 3. Replace the original swipebook structure with the new flipbook
    const swipebookWrapper = swipebook.parentElement;
    if (swipebookWrapper) {
        swipebookWrapper.replaceChild(flipbook, swipebook);

        // Hide non-functional indicators/nav buttons meant for swipe
        const counter = document.querySelector('.page-counter');
        const indicators = document.querySelector('.swipebook-indicators');
        const navBtns = document.querySelectorAll('.swipe-nav');
        if(counter) counter.style.display = 'none';
        if(indicators) indicators.style.display = 'none';
        navBtns.forEach(btn => btn.style.display = 'none');
    }

    // 4. Initialize Turn.js
    setTimeout(() => {
        try {
            $(flipbook).turn({
                autoCenter: true,
                elevation: 50,
                gradients: true,
                acceleration: true,
                pages: images.length,
                display: 'double', // Crucial for flipbook effect
                when: {
                    turning: function(e, page, view) {
                        const currentPageSpan = document.getElementById('currentPage');
                        if (currentPageSpan) currentPageSpan.textContent = page;
                    },
                    start: function(e, page, corner) {
                        // Prevent swipe/touch events from interfering with flip
                        e.preventDefault(); 
                    }
                }
            });
            // Re-show counter after Turn.js is initialized
            if(counter) counter.style.display = 'block';

        } catch (e) {
            console.error('Turn.js failed to initialize. Falling back to simple swipebook.', e);
            // Fallback in case Turn.js fails to load
            if (swipebookWrapper) swipebookWrapper.replaceChild(swipebook, flipbook);
            initializeSwipebook(swipebook, images);
        }
    }, 100);
}

/**
 * Initializes the custom Swipebook (Mobile/Fallback).
 */
function initializeSwipebook(swipebook, images) {
    console.log('Initializing custom swipebook.');
    const pagesContainer = swipebook.querySelector('.swipebook-pages');
    const prevBtn = swipebook.querySelector('.swipe-nav.prev');
    const nextBtn = swipebook.querySelector('.swipe-nav.next');
    const indicatorsContainer = swipebook.querySelector('.swipebook-indicators');
    const currentPageSpan = document.getElementById('currentPage');

    let currentPage = 0;
    let isDragging = false;
    let startX = 0;
    let baseOffset = 0;

    // 1. Create indicator dots
    if (indicatorsContainer && indicatorsContainer.children.length === 0) {
        images.forEach((_, index) => {
            const dot = document.createElement('div'); // Using div from CSS
            dot.className = 'indicator';
            dot.onclick = () => goToPage(index);
            indicatorsContainer.appendChild(dot);
        });
    }

    // 2. Core Update Functions
    function updatePosition(pageIndex) {
        const pageContainerWidth = swipebook.offsetWidth; // Use wrapper width
        baseOffset = -pageIndex * pageContainerWidth;
        pagesContainer.style.transform = `translateX(${baseOffset}px)`;
        currentPage = pageIndex;
        updateIndicators();
        updateNavButtons();
        if (currentPageSpan) currentPageSpan.textContent = currentPage + 1;
    }

    function updateIndicators() {
        const dots = indicatorsContainer.querySelectorAll('.indicator');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }

    function updateNavButtons() {
        prevBtn.style.display = currentPage > 0 ? 'flex' : 'none';
        nextBtn.style.display = currentPage < images.length - 1 ? 'flex' : 'none';
    }

    function goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= images.length) return;
        pagesContainer.style.transition = 'transform 0.3s ease-out';
        updatePosition(pageIndex);
    }

    // 3. Event Listeners
    if (prevBtn) prevBtn.onclick = () => goToPage(currentPage - 1);
    if (nextBtn) nextBtn.onclick = () => goToPage(currentPage + 1);

    // Touch events (Mobile Swipe)
    const swipeArea = pagesContainer.parentElement; // Use the swipebook wrapper
    if (swipeArea) {
        swipeArea.addEventListener('touchstart', (e) => {
            // Only enable swipe on mobile/touch devices
            if (window.innerWidth >= 992) return; 

            isDragging = true;
            startX = e.touches[0].clientX;
            pagesContainer.style.transition = 'none';
        }, { passive: true });

        swipeArea.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            pagesContainer.style.transform = `translateX(${baseOffset - diffX}px)`;
        }, { passive: false });

        swipeArea.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            pagesContainer.style.transition = 'transform 0.3s ease-out';
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            const threshold = 50;

            if (diffX > threshold && currentPage < images.length - 1) {
                goToPage(currentPage + 1);
            } else if (diffX < -threshold && currentPage > 0) {
                goToPage(currentPage - 1);
            } else {
                updatePosition(currentPage); // Snap back
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only allow keyboard navigation if the catalogue is the focus area (simple check)
        if (swipebook.contains(document.activeElement) || document.activeElement === document.body) {
            if (e.key === 'ArrowLeft' && currentPage > 0) {
                goToPage(currentPage - 1);
            } else if (e.key === 'ArrowRight' && currentPage < images.length - 1) {
                goToPage(currentPage + 1);
            }
        }
    });

    // Resize event to handle re-calculation on device orientation change
    window.addEventListener('resize', () => {
        updatePosition(currentPage);
    });

    // Initial load
    updatePosition(0);
}


/*
|--------------------------------------------------------------------------
| BLOG & GENERAL HELPER FUNCTIONS
|--------------------------------------------------------------------------
*/

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNewsletterMessage(message, type) {
    const messageEl = document.getElementById('newsletterMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `newsletter-message ${type}`;
        messageEl.style.display = 'block';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

function filterPostsByCategory(category) {
    const posts = document.querySelectorAll('.blog-post');
    posts.forEach(post => {
        const postCategory = post.querySelector('.post-category');
        if (category === 'all' || (postCategory && postCategory.textContent.toLowerCase().replace(/\s+/g, '-') === category)) {
            post.style.display = 'block';
        } else {
            post.style.display = 'none';
        }
    });
    document.querySelectorAll('.categories-widget a').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.categories-widget a[href="#${category}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function calculateReadingTimes() {
    const posts = document.querySelectorAll('.blog-post');
    posts.forEach(post => {
        const excerpt = post.querySelector('.post-excerpt');
        const readTimeEl = post.querySelector('.post-read-time');
        if (excerpt && readTimeEl) {
            const wordCount = excerpt.textContent.split(/\s+/).length;
            const readTime = Math.max(1, Math.round(wordCount * 5 / 200));
            if (!readTimeEl.textContent.includes('min read')) {
                readTimeEl.innerHTML = `<i class="far fa-clock"></i> ${readTime} min read`;
            }
        }
    });
}

function initializeSocialShare() {
    // Placeholder function for social share logic
    const posts = document.querySelectorAll('.blog-post');
    posts.forEach(post => {
        const postTitle = post.querySelector('h2 a, h3 a');
        const postUrl = window.location.href;
    });
}

function initializeSearch() {
    let searchTimeout;
    const sidebar = document.querySelector('.blog-sidebar');
    if (sidebar && !document.querySelector('.search-widget')) {
        const searchWidget = document.createElement('div');
        searchWidget.className = 'sidebar-widget search-widget';
        searchWidget.innerHTML = `
            <h4>Search Posts</h4>
            <input type="text" id="blogSearch" placeholder="Search articles..." class="search-input">
            <div id="searchResults" class="search-results"></div>
        `;
        sidebar.insertBefore(searchWidget, sidebar.firstChild);
        const searchInput = document.getElementById('blogSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(this.value);
                }, 300);
            });
        }
    }
}

function performSearch(query) {
    const posts = document.querySelectorAll('.blog-post');
    const searchResults = document.getElementById('searchResults');
    if (query.length < 2) {
        posts.forEach(post => post.style.display = 'block');
        if (searchResults) searchResults.innerHTML = '';
        return;
    }
    let visiblePosts = 0;
    posts.forEach(post => {
        const title = post.querySelector('h2, h3').textContent.toLowerCase();
        const excerpt = post.querySelector('.post-excerpt') ? post.querySelector('.post-excerpt').textContent.toLowerCase() : '';
        const categoryEl = post.querySelector('.post-category');
        const category = categoryEl ? categoryEl.textContent.toLowerCase() : '';
        if (title.includes(query.toLowerCase()) ||
            excerpt.includes(query.toLowerCase()) ||
            category.includes(query.toLowerCase())) {
            post.style.display = 'block';
            visiblePosts++;
        } else {
            post.style.display = 'none';
        }
    });
    if (searchResults) {
        searchResults.innerHTML = visiblePosts > 0 ?
            `<p class="search-count">Found ${visiblePosts} article${visiblePosts !== 1 ? 's' : ''}</p>` :
            '<p class="search-count">No articles found</p>';
    }
}

function trackBlogInteraction(action, postTitle) {
    // Simple console log for tracking
    console.log(`Blog interaction: ${action} - ${postTitle}`);
}

function addScrollToTop() {
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '&#x25B2;';
    scrollBtn.id = 'scrollToTopBtn';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #10b981;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    document.body.appendChild(scrollBtn);
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'block';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
