// Hamburger menu logic for mobile navigation

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav-links');
    const closeBtn = document.getElementById('close-mobile-nav');
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileNav.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
                mobileNav.classList.remove('open');
            }
        });
        mobileNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                mobileNav.classList.remove('open');
            }
        });
        // Close button
        mobileNav.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'close-mobile-nav') {
                mobileNav.classList.remove('open');
            }
        });
    }
});
