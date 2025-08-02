document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.getElementById('mainNavbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    let lastScrollTop = 0;
    let autoHideTimeout; // Variable to hold our timeout ID

    const HIDE_DELAY_MS = 8000; // 2 seconds

    // Function to hide the navbar
    function hideNavbar() {
        if (!navLinks.classList.contains('active')) { // Don't hide if mobile menu is open
            navbar.classList.remove('visible');
        }
    }

    // Function to show the navbar and reset the auto-hide timer
    function showNavbarAndResetTimer() {
        navbar.classList.add('visible');
        clearTimeout(autoHideTimeout); // Clear any existing timeout
        autoHideTimeout = setTimeout(hideNavbar, HIDE_DELAY_MS); // Set a new timeout
    }

    // 1. Ensure the navbar is visible immediately on page load and start timer
    showNavbarAndResetTimer();

    // Event listener for general page activity to keep navbar visible
    // This will cover mouse movement anywhere on the page, and initial scroll.
    document.addEventListener('mousemove', showNavbarAndResetTimer);
    document.addEventListener('scroll', showNavbarAndResetTimer); // This handles all scrolls

    // Desktop Navbar Visibility (hide on scroll down, show on scroll up - more refined)
    // The previous scroll logic needs to be integrated with the timer logic.
    // The `showNavbarAndResetTimer` on scroll handles showing it and resetting the timer.
    // We just need a specific condition to remove 'visible' on scroll *down* IF it's not already handled by the timer.
    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        // Condition to immediately hide on explicit scroll down, overriding the timer for a moment
        // This makes it feel more responsive on scroll down, rather than waiting 8s.
        if (currentScroll > lastScrollTop && currentScroll > navbar.offsetHeight) {
            navbar.classList.remove('visible');
            clearTimeout(autoHideTimeout); // Clear timeout immediately when hiding on scroll down
        }

        // Update last scroll position for the next scroll event
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });


    // Mobile Menu Toggle
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active'); // Toggle hamburger icon animation

            // Prevent auto-hide when mobile menu is open
            if (navLinks.classList.contains('active')) {
                clearTimeout(autoHideTimeout); // Stop the auto-hide timer
            } else {
                showNavbarAndResetTimer(); // Restart the timer when menu closes
            }
        });

        // Close mobile menu when a link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                showNavbarAndResetTimer(); // Restart the timer when menu closes
            });
        });
    }

    // Prevent auto-hide when mouse is over the navbar itself
    // This ensures that if the user is interacting with the navbar, it doesn't disappear.
    navbar.addEventListener('mouseenter', function() {
        clearTimeout(autoHideTimeout);
        navbar.classList.add('visible'); // Ensure it's visible if mouse enters
    });
    navbar.addEventListener('mouseleave', function() {
        // Restart the timer only if the mobile menu is not active
        if (!navLinks.classList.contains('active')) {
            showNavbarAndResetTimer();
        }
    });

});
