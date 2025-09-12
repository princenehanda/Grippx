document.addEventListener("DOMContentLoaded", function () {
  // --- Existing Mobile Menu Toggle ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          navLinks.classList.remove('active');
          hamburger.classList.remove('active');
        }
      });
    });
  }

  // --- Existing Newsletter Form Handler ---
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMessage = document.getElementById('newsletterMessage');
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
      setTimeout(() => {
        button.textContent = originalButtonText;
        button.disabled = false;
        showNewsletterMessage('Thank you for subscribing! We\'ll be in touch soon.', 'success');
        document.getElementById('newsletterEmail').value = '';
      }, 1500);
    });
  }

  // --- Existing Blog Post Animations on Scroll ---
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

  // --- Existing Reading Time Calculator ---
  calculateReadingTimes();

  // --- Existing Social Share Functionality ---
  initializeSocialShare();

  // --- Existing Search Functionality ---
  initializeSearch();

  // --- Existing Blog post interaction tracking (for analytics) ---
  const postLinks = document.querySelectorAll('.blog-post h2 a, .blog-post h3 a');
  postLinks.forEach(link => {
    link.addEventListener('click', function() {
      trackBlogInteraction('post_click', this.textContent);
    });
  });

  // --- Existing Category Filter Function ---
  const categoryLinks = document.querySelectorAll('.categories-widget a');
  categoryLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const category = this.getAttribute('href').substring(1);
      filterPostsByCategory(category);
    });
  });

  // --- Existing Initialize scroll to top ---
  addScrollToTop();

  // --- Catalogue Logic ---
  // Wait for jQuery and Turn.js to load before initializing catalogue
  setTimeout(() => {
    initializeCatalogue();
  }, 500);
});

function initializeCatalogue() {
  const container = document.querySelector('.catalogue-container');
  const swipebook = document.querySelector('.swipebook');

  if (!container || !swipebook) return;

  const images = Array.from(swipebook.querySelectorAll('img'));
  if (images.length === 0) return;

  // Better device detection
  const isDesktop = window.innerWidth > 1024;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const fastConnection = !navigator.connection || navigator.connection.downlink > 2;
  const jQueryAvailable = typeof $ !== 'undefined' && $.fn.turn;

  console.log('Device detection:', { isDesktop, hasTouch, fastConnection, jQueryAvailable });

  // Use flipbook for desktop without touch, good connection, and jQuery available
  if (isDesktop && !hasTouch && fastConnection && jQueryAvailable) {
    initializeFlipbook(container, swipebook, images);
  } else {
    initializeSwipebook(swipebook, images);
  }
}

function initializeFlipbook(container, swipebook, images) {
  console.log('Initializing flipbook with', images.length, 'pages');
  // Create flipbook structure
  const flipbook = document.createElement('div');
  flipbook.className = 'flipbook';
  flipbook.id = 'flipbook-pages';
  // Add pages to flipbook - Turn.js needs divs as pages
  images.forEach((img, index) => {
    const page = document.createElement('div');
    const clonedImg = img.cloneNode(true);
    page.appendChild(clonedImg);
    flipbook.appendChild(page);
  });

  // Replace swipebook with flipbook
  container.replaceChild(flipbook, swipebook);

  // Initialize Turn.js after DOM is updated
  setTimeout(() => {
    try {
      $(flipbook).turn({
        autoCenter: true,
        elevation: 50,
        gradients: true,
        acceleration: true,
        pages: images.length,
        when: {
          turning: function(e, page, view) {
            console.log('Turning to page', page);
          }
        }
      });
    } catch (e) {
      console.error('Turn.js failed to initialize. Falling back to swipebook.', e);
      // Fallback in case Turn.js fails to load
      container.replaceChild(swipebook, flipbook);
      initializeSwipebook(swipebook, images);
    }
  }, 100);
}

function initializeSwipebook(swipebook, images) {
  console.log('Initializing swipebook with', images.length, 'pages');
  const pagesContainer = swipebook.querySelector('.swipebook-pages');
  const prevBtn = swipebook.querySelector('.swipe-nav.prev');
  const nextBtn = swipebook.querySelector('.swipe-nav.next');
  const indicatorsContainer = swipebook.querySelector('.swipebook-indicators');

  let currentPage = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let baseOffset = 0;

  // Create indicator dots
  if (indicatorsContainer) {
    images.forEach((_, index) => {
      const dot = document.createElement('span');
      dot.className = 'indicator-dot';
      dot.onclick = () => goToPage(index);
      indicatorsContainer.appendChild(dot);
    });
  }

  function updatePosition(pageIndex) {
    const pageContainerWidth = pagesContainer.offsetWidth;
    baseOffset = -pageIndex * pageContainerWidth;
    pagesContainer.style.transform = `translateX(${baseOffset}px)`;
    currentPage = pageIndex;
    updateIndicators();
    updateNavButtons();
  }

  function updateIndicators() {
    const dots = indicatorsContainer.querySelectorAll('.indicator-dot');
    dots.forEach((dot, index) => {
      if (index === currentPage) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function updateNavButtons() {
    prevBtn.style.opacity = currentPage > 0 ? '1' : '0.3';
    nextBtn.style.opacity = currentPage < images.length - 1 ? '1' : '0.3';
    prevBtn.style.pointerEvents = currentPage > 0 ? 'auto' : 'none';
    nextBtn.style.pointerEvents = currentPage < images.length - 1 ? 'auto' : 'none';
  }

  function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= images.length) return;
    updatePosition(pageIndex);
  }

  // Event listeners
  prevBtn.onclick = () => goToPage(currentPage - 1);
  nextBtn.onclick = () => goToPage(currentPage + 1);

  // Touch events
  pagesContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    pagesContainer.style.transition = 'none';
  }, { passive: true });

  pagesContainer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diffX = startX - currentX;
    pagesContainer.style.transform = `translateX(${baseOffset - diffX}px)`;
  }, { passive: false });

  pagesContainer.addEventListener('touchend', (e) => {
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
      updatePosition(currentPage);
    }
  });

  // Mouse events for desktop swipe
  let mouseDown = false;
  pagesContainer.addEventListener('mousedown', (e) => {
    mouseDown = true;
    isDragging = true;
    startX = e.clientX;
    pagesContainer.style.transition = 'none';
  });

  pagesContainer.addEventListener('mousemove', (e) => {
    if (!isDragging || !mouseDown) return;
    e.preventDefault();
    const currentX = e.clientX;
    const diffX = startX - currentX;
    pagesContainer.style.transform = `translateX(${baseOffset - diffX}px)`;
  });

  pagesContainer.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    mouseDown = false;
    isDragging = false;
    pagesContainer.style.transition = 'transform 0.3s ease-out';
    const endX = e.clientX;
    const diffX = startX - endX;
    const threshold = 50;

    if (diffX > threshold && currentPage < images.length - 1) {
      goToPage(currentPage + 1);
    } else if (diffX < -threshold && currentPage > 0) {
      goToPage(currentPage - 1);
    } else {
      updatePosition(currentPage);
    }
  });

  pagesContainer.addEventListener('mouseleave', () => {
    if (mouseDown) {
      mouseDown = false;
      isDragging = false;
      updatePosition(currentPage);
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentPage > 0) {
      goToPage(currentPage - 1);
    } else if (e.key === 'ArrowRight' && currentPage < images.length - 1) {
      goToPage(currentPage + 1);
    }
  });

  // Initialize
  updatePosition(0);
}


// --- Existing Helper Functions ---

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
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      'event_category': 'Blog',
      'event_label': postTitle
    });
  }
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
