// Feature Slideshow Logic

document.addEventListener('DOMContentLoaded', function() {
    const featureSlides = document.querySelectorAll('.feature-slide');
    const featureDots = [];
    const featurePrev = document.getElementById('prevFeature');
    const featureNext = document.getElementById('nextFeature');
    let featureIndex = 0;
    let autoSlideInterval;
    let userInteracted = false;

    // Create dots dynamically if not present
    let dotsContainer = document.createElement('div');
    dotsContainer.style.textAlign = 'center';
    dotsContainer.style.marginTop = '1rem';
    dotsContainer.style.position = 'absolute';
    dotsContainer.style.bottom = '18px';
    dotsContainer.style.left = '0';
    dotsContainer.style.width = '100%';
    dotsContainer.style.zIndex = '4';
    for (let i = 0; i < featureSlides.length; i++) {
        let dot = document.createElement('span');
        dot.className = 'feature-dot' + (i === 0 ? ' active' : '');
        dot.style.margin = '0 6px';
        dot.addEventListener('click', function() {
            featureIndex = i;
            showFeatureSlide(featureIndex);
            resetAutoSlide();
        });
        featureDots.push(dot);
        dotsContainer.appendChild(dot);
    }
    document.querySelector('.feature-slideshow').appendChild(dotsContainer);

    function showFeatureSlide(index) {
        featureSlides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
            featureDots[i].classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        featureIndex = (featureIndex + 1) % featureSlides.length;
        showFeatureSlide(featureIndex);
    }

    function prevSlide() {
        featureIndex = (featureIndex - 1 + featureSlides.length) % featureSlides.length;
        showFeatureSlide(featureIndex);
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 4000);
    }

    function resetAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    if (featurePrev) {
        featurePrev.addEventListener('click', function() {
            prevSlide();
            resetAutoSlide();
        });
    }
    if (featureNext) {
        featureNext.addEventListener('click', function() {
            nextSlide();
            resetAutoSlide();
        });
    }
    showFeatureSlide(featureIndex);
    startAutoSlide();
});
