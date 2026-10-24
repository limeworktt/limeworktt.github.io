(function () {
    const video = document.querySelector('[data-hero-video]');
    if (!video) return;

    const header = document.querySelector('.desktop_nav_container');
    function sizeHero() {
        if (header) document.documentElement.style.setProperty('--home-nav-height', header.getBoundingClientRect().height + 'px');
    }
    sizeHero();
    if (header && 'ResizeObserver' in window) new ResizeObserver(sizeHero).observe(header);
    else window.addEventListener('resize', sizeHero);

    const fallback = document.querySelector('[data-hero-fallback]');
    function showPoster() {
        video.pause();
        video.controls = false;
        video.hidden = true;
        if (fallback) fallback.hidden = false;
    }

    video.controls = false;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        showPoster();
        return;
    }

    // Use H.264 with the page background in Safari; other browsers retain VP9 alpha.
    const safari = /Apple/.test(navigator.vendor) && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    video.src = safari ? video.dataset.safariSrc : video.dataset.webmSrc;
    let usingCompatibleSource = safari;
    let loadTimeout;
    function startPlayback() {
        clearTimeout(loadTimeout);
        video.hidden = false;
        if (fallback) fallback.hidden = true;
        loadTimeout = setTimeout(showPoster, 10000);
        const request = video.play();
        if (request && typeof request.catch === 'function') {
            request.catch(function () {
                clearTimeout(loadTimeout);
                showPoster();
            });
        }
    }
    video.addEventListener('playing', function () {
        clearTimeout(loadTimeout);
    });
    video.addEventListener('error', function () {
        clearTimeout(loadTimeout);
        if (!usingCompatibleSource) {
            usingCompatibleSource = true;
            video.src = video.dataset.safariSrc;
            startPlayback();
        } else showPoster();
    });
    // A normal page interaction can allow playback when autoplay is restricted.
    document.addEventListener('pointerdown', function () {
        if (video.hidden && !video.error) startPlayback();
    }, { once: true });
    startPlayback();
}());
