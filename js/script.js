document.addEventListener("DOMContentLoaded", function () {
  // Mobile Menu Toggle
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

  // Newsletter Form Handler
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
  
  // Blog Post Animations on Scroll
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
  
  // Reading Time Calculator
  calculateReadingTimes();
  
  // Social Share Functionality
  initializeSocialShare();
  
  // Search Functionality
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
});

// Helper Functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showNewsletterMessage(message, type) {
  const messageEl = document.getElementById('newsletterMessage');
  messageEl.textContent = message;
  messageEl.className = `newsletter-message ${type}`;
  messageEl.style.display = 'block';
  
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
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
