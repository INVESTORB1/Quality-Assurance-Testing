// Hamburger menu logic for mobile navigation

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav-links');
    const closeBtn = document.getElementById('close-mobile-nav');
    const overlay = document.getElementById('mobile-nav-overlay');
    function openMobileNav() {
        mobileNav.classList.add('open');
        if (overlay) overlay.style.display = 'block';
    }
    function closeMobileNav() {
        mobileNav.classList.remove('open');
        if (overlay) overlay.style.display = 'none';
    }
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            if (mobileNav.classList.contains('open')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
                closeMobileNav();
            }
        });
        mobileNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                closeMobileNav();
            }
        });
        // Close button
        mobileNav.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'close-mobile-nav') {
                closeMobileNav();
            }
        });
        // Overlay click closes menu
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeMobileNav();
            });
        }
    }
});
